from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models.menu import Category, Dish, Modifier

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
        limit: int = 20
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
        
        # Только доступные блюда
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
