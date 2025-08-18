from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.database import get_db_session
from app.schemas.menu import CategoryResponse, DishResponse, DishDetailResponse
from app.services.menu import MenuService

router = APIRouter()

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    db: AsyncSession = Depends(get_db_session)
):
    """Получение списка всех категорий блюд."""
    menu_service = MenuService(db)
    return await menu_service.get_categories()

@router.get("/dishes", response_model=List[DishResponse])
async def get_dishes(
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение списка блюд с фильтрацией и поиском."""
    menu_service = MenuService(db)
    return await menu_service.get_dishes(
        category_id=category_id,
        search=search,
        page=page,
        limit=limit
    )

@router.get("/dishes/{dish_id}", response_model=DishDetailResponse)
async def get_dish(
    dish_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Получение детальной информации о блюде."""
    menu_service = MenuService(db)
    return await menu_service.get_dish_by_id(dish_id)
