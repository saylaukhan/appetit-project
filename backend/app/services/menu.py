from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import insert
from typing import List, Optional
from fastapi import HTTPException, status
from app.models.menu import Category, Dish, VariantGroup, Variant, Addon, dish_addon_table, dish_variant_table
from app.schemas.menu import DishCreateRequest, DishUpdateRequest, AddonCreateRequest, AddonUpdateRequest

class MenuService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_categories(self) -> List[Category]:
        """Получение всех активных категорий."""
        result = await self.db.execute(
            select(Category)
            .where(Category.is_active == True)
            .order_by(Category.sort_order, Category.name)
        )
        return result.scalars().all()

    async def get_dishes(
        self, 
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
        show_all: bool = False
    ) -> List[Dish]:
        """Получение блюд с фильтрацией."""
        query = select(Dish).options(selectinload(Dish.category))
        
        # Фильтр по категории
        if category_id:
            query = query.where(Dish.category_id == category_id)
        
        # Поиск по названию и описанию
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (Dish.name.ilike(search_term)) | 
                (Dish.description.ilike(search_term))
            )
        
        # Только доступные блюда (если не указан show_all для админки)
        if not show_all:
            query = query.where(Dish.is_available == True)
        
        # Сортировка и пагинация
        query = (
            query
            .order_by(Dish.sort_order, Dish.name)
            .offset((page - 1) * limit)
            .limit(limit)
        )
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_dish_by_id(self, dish_id: int) -> Optional[dict]:
        """Получение блюда по ID с группами вариантов и добавками."""
        result = await self.db.execute(
            select(Dish)
            .options(
                selectinload(Dish.category),
                selectinload(Dish.variants).selectinload(Variant.group),
                selectinload(Dish.addons)
            )
            .where(Dish.id == dish_id)
        )
        dish = result.scalar_one_or_none()
        
        if dish is None:
            return None
            
        # Группируем варианты по группам
        variant_groups = {}
        for variant in dish.variants:
            group_id = variant.group_id
            if group_id not in variant_groups:
                variant_groups[group_id] = {
                    "id": variant.group.id,
                    "name": variant.group.name,
                    "is_required": variant.group.is_required,
                    "is_multiple": variant.group.is_multiple,
                    "sort_order": variant.group.sort_order,
                    "variants": []
                }
            variant_groups[group_id]["variants"].append({
                "id": variant.id,
                "name": variant.name,
                "price": variant.price,
                "is_default": variant.is_default,
                "sort_order": variant.sort_order
            })
        
        # Сортируем группы и варианты внутри групп
        sorted_groups = sorted(variant_groups.values(), key=lambda x: x["sort_order"])
        for group in sorted_groups:
            group["variants"].sort(key=lambda x: x["sort_order"])
            
        # Преобразуем в словарь с дополнительными полями
        dish_dict = {
            "id": dish.id,
            "name": dish.name,
            "description": dish.description,
            "price": dish.price,
            "image": dish.image,
            "category_id": dish.category_id,
            "category_name": dish.category.name if dish.category else "",
            "is_available": dish.is_available,
            "is_popular": dish.is_popular,
            "weight": dish.weight,
            "variant_groups": sorted_groups,
            "addons": dish.addons
        }
        
        return dish_dict

    async def create_dish(self, dish_data: DishCreateRequest) -> Dish:
        """Создание нового блюда."""
        # Проверяем существование категории
        category_result = await self.db.execute(
            select(Category).where(Category.id == dish_data.category_id)
        )
        category = category_result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Категория не найдена"
            )

        # Создаем новое блюдо
        new_dish = Dish(
            name=dish_data.name,
            description=dish_data.description,
            price=dish_data.price,
            image=dish_data.image,
            weight=dish_data.weight,
            category_id=dish_data.category_id,
            is_available=dish_data.is_available,
            is_popular=dish_data.is_popular,
            sort_order=dish_data.sort_order
        )

        try:
            self.db.add(new_dish)
            await self.db.flush()  # Получаем ID блюда без коммита
            
            # Сохраняем блюдо сначала
            await self.db.commit()
            await self.db.refresh(new_dish)
            
            # Связываем с добавками если указаны
            if dish_data.addon_ids:
                addons_result = await self.db.execute(
                    select(Addon).where(Addon.id.in_(dish_data.addon_ids))
                )
                addons = addons_result.scalars().all()
                # Проверяем, что все добавки найдены
                found_addon_ids = [addon.id for addon in addons]
                missing_addon_ids = set(dish_data.addon_ids) - set(found_addon_ids)
                if missing_addon_ids:
                    # Удаляем созданное блюдо если добавки не найдены
                    await self.db.delete(new_dish)
                    await self.db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Добавки с ID {list(missing_addon_ids)} не найдены"
                    )
                # Создаем связи напрямую через INSERT
                for addon_id in found_addon_ids:
                    await self.db.execute(
                        insert(dish_addon_table).values(
                            dish_id=new_dish.id,
                            addon_id=addon_id
                        )
                    )
            
            # Связываем с вариантами если указаны
            if dish_data.variant_ids:
                variants_result = await self.db.execute(
                    select(Variant).where(Variant.id.in_(dish_data.variant_ids))
                )
                variants = variants_result.scalars().all()
                # Проверяем, что все варианты найдены
                found_variant_ids = [variant.id for variant in variants]
                missing_variant_ids = set(dish_data.variant_ids) - set(found_variant_ids)
                if missing_variant_ids:
                    # Удаляем созданное блюдо если варианты не найдены
                    await self.db.delete(new_dish)
                    await self.db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Варианты с ID {list(missing_variant_ids)} не найдены"
                    )
                # Создаем связи напрямую через INSERT
                for variant_id in found_variant_ids:
                    await self.db.execute(
                        insert(dish_variant_table).values(
                            dish_id=new_dish.id,
                            variant_id=variant_id
                        )
                    )
            
            # Финальный коммит для связей
            if dish_data.addon_ids or dish_data.variant_ids:
                await self.db.commit()
            return new_dish
        except HTTPException:
            # Переподнимаем HTTPException без изменений
            raise
        except IntegrityError as e:
            await self.db.rollback()
            print(f"IntegrityError при создании блюда: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка при создании блюда. Проверьте данные."
            )
        except Exception as e:
            await self.db.rollback()
            print(f"Неожиданная ошибка при создании блюда: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Внутренняя ошибка сервера: {str(e)}"
            )

    async def update_dish(self, dish_id: int, dish_data: DishUpdateRequest) -> Optional[Dish]:
        """Обновление блюда."""
        # Получаем блюдо с его связями
        result = await self.db.execute(
            select(Dish)
            .options(
                selectinload(Dish.addons),
                selectinload(Dish.variants)
            )
            .where(Dish.id == dish_id)
        )
        dish = result.scalar_one_or_none()
        if not dish:
            return None

        # Если указана новая категория, проверяем её существование
        if dish_data.category_id:
            category_result = await self.db.execute(
                select(Category).where(Category.id == dish_data.category_id)
            )
            category = category_result.scalar_one_or_none()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Категория не найдена"
                )

        # Обновляем только переданные поля
        update_data = dish_data.dict(exclude_unset=True)
        addon_ids = update_data.pop('addon_ids', None)
        variant_ids = update_data.pop('variant_ids', None)
        
        for field, value in update_data.items():
            setattr(dish, field, value)

        # Обновляем с��язи с добавками если указаны
        if addon_ids is not None:
            if addon_ids:
                addons_result = await self.db.execute(
                    select(Addon).where(Addon.id.in_(addon_ids))
                )
                addons = addons_result.scalars().all()
                # Проверяем, что все добавки найдены
                found_addon_ids = [addon.id for addon in addons]
                missing_addon_ids = set(addon_ids) - set(found_addon_ids)
                if missing_addon_ids:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Добавки с ID {list(missing_addon_ids)} не найдены"
                    )
                dish.addons = list(addons)
            else:
                dish.addons = []
        
        # Обновляем связи с вариантами если указаны
        if variant_ids is not None:
            if variant_ids:
                variants_result = await self.db.execute(
                    select(Variant).where(Variant.id.in_(variant_ids))
                )
                variants = variants_result.scalars().all()
                # Проверяем, что все варианты найдены
                found_variant_ids = [variant.id for variant in variants]
                missing_variant_ids = set(variant_ids) - set(found_variant_ids)
                if missing_variant_ids:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Варианты с ID {list(missing_variant_ids)} не найдены"
                    )
                dish.variants = list(variants)
            else:
                dish.variants = []

        try:
            await self.db.commit()
            await self.db.refresh(dish)
            return dish
        except IntegrityError as e:
            await self.db.rollback()
            print(f"IntegrityError при обновлении блюда: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка при обновлении блюда. Проверьте данные."
            )
        except Exception as e:
            await self.db.rollback()
            print(f"Неожиданная ошибка при обновлении блюда: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Внутренняя ошибка сервера: {str(e)}"
            )

    async def delete_dish(self, dish_id: int) -> bool:
        """Удаление блюда."""
        result = await self.db.execute(
            select(Dish).where(Dish.id == dish_id)
        )
        dish = result.scalar_one_or_none()
        if not dish:
            return False

        try:
            # Используем правильный метод для удаления в async SQLAlchemy
            from sqlalchemy import delete
            await self.db.execute(delete(Dish).where(Dish.id == dish_id))
            await self.db.commit()
            return True
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Невозможно удалить блюдо. Возможно, оно используется в заказах."
            )

    async def toggle_dish_availability(self, dish_id: int) -> Optional[Dish]:
        """Переключение доступности блюда."""
        result = await self.db.execute(
            select(Dish).where(Dish.id == dish_id)
        )
        dish = result.scalar_one_or_none()
        if not dish:
            return None

        dish.is_available = not dish.is_available
        
        try:
            await self.db.commit()
            await self.db.refresh(dish)
            return dish
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка при обновлении статуса блюда."
            )

    # CRUD операции для добавок
    async def get_addons(
        self, 
        category: Optional[str] = None,
        show_all: bool = False
    ) -> List[Addon]:
        """Получение добавок с фильтрацией."""
        query = select(Addon)
        
        # Фильтр по категории
        if category:
            query = query.where(Addon.category == category)
        
        # Только активные добавки (если не указан show_all для админки)
        if not show_all:
            query = query.where(Addon.is_active == True)
        
        # Сортировка
        query = query.order_by(Addon.category, Addon.name)
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_addon_by_id(self, addon_id: int) -> Optional[Addon]:
        """Получение добавки по ID."""
        result = await self.db.execute(
            select(Addon).where(Addon.id == addon_id)
        )
        return result.scalar_one_or_none()

    async def create_addon(self, addon_data: AddonCreateRequest) -> Addon:
        """Создание новой добавки."""
        new_addon = Addon(
            name=addon_data.name,
            price=addon_data.price,
            category=addon_data.category,
            is_active=True
        )

        try:
            self.db.add(new_addon)
            await self.db.commit()
            await self.db.refresh(new_addon)
            return new_addon
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка при создании добавки. Проверьте данные."
            )

    async def update_addon(self, addon_id: int, addon_data: AddonUpdateRequest) -> Optional[Addon]:
        """Обновление добавки."""
        result = await self.db.execute(
            select(Addon).where(Addon.id == addon_id)
        )
        addon = result.scalar_one_or_none()
        if not addon:
            return None

        # Обновляем только переданные поля
        update_data = addon_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(addon, field, value)

        try:
            await self.db.commit()
            await self.db.refresh(addon)
            return addon
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка при обновлении добавки. Проверьте данные."
            )

    async def delete_addon(self, addon_id: int) -> bool:
        """Удаление добавки."""
        result = await self.db.execute(
            select(Addon).where(Addon.id == addon_id)
        )
        addon = result.scalar_one_or_none()
        if not addon:
            return False

        try:
            from sqlalchemy import delete
            await self.db.execute(delete(Addon).where(Addon.id == addon_id))
            await self.db.commit()
            return True
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Невозможно удалить добавку. Возможно, она используется в блюдах."
            )

    async def toggle_addon_active(self, addon_id: int) -> Optional[Addon]:
        """Переключение активности добавки."""
        result = await self.db.execute(
            select(Addon).where(Addon.id == addon_id)
        )
        addon = result.scalar_one_or_none()
        if not addon:
            return None

        addon.is_active = not addon.is_active
        
        try:
            await self.db.commit()
            await self.db.refresh(addon)
            return addon
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка при обновлении статуса добавки."
            )
