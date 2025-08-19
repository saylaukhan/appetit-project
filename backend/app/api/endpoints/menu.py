from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.database import get_db_session
from app.schemas.menu import CategoryResponse, DishResponse, DishDetailResponse, DishCreateRequest, DishUpdateRequest, AddonResponse, AddonCreateRequest, AddonUpdateRequest
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
    show_all: bool = Query(False, description="Показать все блюда, включая недоступные (для админки)"),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение списка блюд с фильтрацией и поиском."""
    menu_service = MenuService(db)
    return await menu_service.get_dishes(
        category_id=category_id,
        search=search,
        page=page,
        limit=limit,
        show_all=show_all
    )

@router.get("/dishes/{dish_id}", response_model=DishDetailResponse)
async def get_dish(
    dish_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Получение детальной информации о блюде."""
    menu_service = MenuService(db)
    dish_data = await menu_service.get_dish_by_id(dish_id)
    if dish_data is None:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    return dish_data

@router.post("/dishes", response_model=DishResponse, status_code=status.HTTP_201_CREATED)
async def create_dish(
    dish_data: DishCreateRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Создание нового блюда."""
    menu_service = MenuService(db)
    new_dish = await menu_service.create_dish(dish_data)
    return new_dish

@router.put("/dishes/{dish_id}", response_model=DishResponse)
async def update_dish(
    dish_id: int,
    dish_data: DishUpdateRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление блюда."""
    menu_service = MenuService(db)
    updated_dish = await menu_service.update_dish(dish_id, dish_data)
    if updated_dish is None:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    return updated_dish

@router.delete("/dishes/{dish_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dish(
    dish_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Удаление блюда."""
    menu_service = MenuService(db)
    deleted = await menu_service.delete_dish(dish_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")

@router.patch("/dishes/{dish_id}/toggle-availability", response_model=DishResponse)
async def toggle_dish_availability(
    dish_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Переключение доступности блюда."""
    menu_service = MenuService(db)
    dish = await menu_service.toggle_dish_availability(dish_id)
    if dish is None:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    return dish

# CRUD операции для добавок
@router.get("/addons", response_model=List[AddonResponse])
async def get_addons(
    category: Optional[str] = Query(None, description="Фильтр по категории добавок"),
    show_all: bool = Query(False, description="Показать все добавки, включая неактивные"),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение списка добавок."""
    menu_service = MenuService(db)
    return await menu_service.get_addons(category=category, show_all=show_all)

@router.get("/addons/{addon_id}", response_model=AddonResponse)
async def get_addon(
    addon_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Получение добавки по ID."""
    menu_service = MenuService(db)
    addon = await menu_service.get_addon_by_id(addon_id)
    if addon is None:
        raise HTTPException(status_code=404, detail="Добавка не найдена")
    return addon

@router.post("/addons", response_model=AddonResponse, status_code=status.HTTP_201_CREATED)
async def create_addon(
    addon_data: AddonCreateRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Создание новой добавки."""
    menu_service = MenuService(db)
    return await menu_service.create_addon(addon_data)

@router.put("/addons/{addon_id}", response_model=AddonResponse)
async def update_addon(
    addon_id: int,
    addon_data: AddonUpdateRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление добавки."""
    menu_service = MenuService(db)
    updated_addon = await menu_service.update_addon(addon_id, addon_data)
    if updated_addon is None:
        raise HTTPException(status_code=404, detail="Добавка не найдена")
    return updated_addon

@router.delete("/addons/{addon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_addon(
    addon_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Удаление добавки."""
    menu_service = MenuService(db)
    deleted = await menu_service.delete_addon(addon_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Добавка не найдена")

@router.patch("/addons/{addon_id}/toggle-active", response_model=AddonResponse)
async def toggle_addon_active(
    addon_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Переключение активности добавки."""
    menu_service = MenuService(db)
    addon = await menu_service.toggle_addon_active(addon_id)
    if addon is None:
        raise HTTPException(status_code=404, detail="Добавка не найдена")
    return addon
