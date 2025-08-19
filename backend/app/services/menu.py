from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from fastapi import HTTPException, status
from app.models.menu import Category, Dish, Modifier
from app.schemas.menu import DishCreateRequest, DishUpdateRequest

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
        """Получение блюда по ID с модификаторами."""
        result = await self.db.execute(
            select(Dish)
            .options(
                selectinload(Dish.category),
                selectinload(Dish.modifiers)
            )
            .where(Dish.id == dish_id)
        )
        dish = result.scalar_one_or_none()
        
        if dish is None:
            return None
            
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
            "modifiers": dish.modifiers
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
            await self.db.commit()
            await self.db.refresh(new_dish)
            return new_dish
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка при создании блюда. Проверьте данные."
            )

    async def update_dish(self, dish_id: int, dish_data: DishUpdateRequest) -> Optional[Dish]:
        """Обновление блюда."""
        # Получаем блюдо
        result = await self.db.execute(
            select(Dish).where(Dish.id == dish_id)
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
        for field, value in update_data.items():
            setattr(dish, field, value)

        try:
            await self.db.commit()
            await self.db.refresh(dish)
            return dish
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка при обновлении блюда. Проверьте данные."
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
