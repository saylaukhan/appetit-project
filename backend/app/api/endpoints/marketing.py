from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db_session
from app.models.banner import Banner
from app.schemas.banner import BannerResponse

router = APIRouter()

@router.get("/banners", response_model=List[BannerResponse])
async def get_active_banners(
    position: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """Получение активных баннеров для клиентской части."""
    
    # Базовый запрос для активных баннеров
    query = select(Banner).where(
        Banner.is_active == True
    )
    
    # Фильтрация по временным ограничениям
    now = datetime.now()
    query = query.where(
        and_(
            Banner.show_from.is_(None) | (Banner.show_from <= now),
            Banner.show_until.is_(None) | (Banner.show_until >= now)
        )
    )
    
    # Фильтрация по позиции, если указана
    if position:
        query = query.where(Banner.position == position)
    
    # Сортировка по порядку отображения, затем по дате создания
    query = query.order_by(Banner.sort_order.asc(), Banner.created_at.desc())
    
    result = await db.execute(query)
    banners = result.scalars().all()
    
    return [BannerResponse.model_validate(banner) for banner in banners]

@router.get("/banners/{position}", response_model=List[BannerResponse])
async def get_banners_by_position(
    position: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Получение баннеров для определенной позиции."""
    
    now = datetime.now()
    query = select(Banner).where(
        and_(
            Banner.is_active == True,
            Banner.position == position,
            Banner.show_from.is_(None) | (Banner.show_from <= now),
            Banner.show_until.is_(None) | (Banner.show_until >= now)
        )
    ).order_by(Banner.sort_order.asc(), Banner.created_at.desc())
    
    result = await db.execute(query)
    banners = result.scalars().all()
    
    return [BannerResponse.model_validate(banner) for banner in banners]

@router.post("/banners/{banner_id}/view")
async def track_banner_view(
    banner_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Отслеживание просмотра баннера (публичный endpoint)."""
    
    query = select(Banner).where(Banner.id == banner_id)
    result = await db.execute(query)
    banner = result.scalar_one_or_none()
    
    if not banner:
        raise HTTPException(status_code=404, detail="Баннер не найден")
    
    banner.view_count += 1
    await db.commit()
    
    return {"success": True}

@router.post("/banners/{banner_id}/click")
async def track_banner_click(
    banner_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Отслеживание клика по баннеру (публичный endpoint)."""
    
    query = select(Banner).where(Banner.id == banner_id)
    result = await db.execute(query)
    banner = result.scalar_one_or_none()
    
    if not banner:
        raise HTTPException(status_code=404, detail="Баннер не найден")
    
    banner.click_count += 1
    await db.commit()
    
    return {"success": True, "redirect_url": banner.link}

@router.get("/banners/featured/main", response_model=List[BannerResponse])
async def get_main_featured_banners(
    db: AsyncSession = Depends(get_db_session)
):
    """Получение главных рекомендуемых баннеров для главной страницы."""
    
    now = datetime.now()
    query = select(Banner).where(
        and_(
            Banner.is_active == True,
            Banner.position.in_(["main", "hero", "featured"]),
            Banner.show_from.is_(None) | (Banner.show_from <= now),
            Banner.show_until.is_(None) | (Banner.show_until >= now)
        )
    ).order_by(Banner.sort_order.asc()).limit(5)
    
    result = await db.execute(query)
    banners = result.scalars().all()
    
    return [BannerResponse.model_validate(banner) for banner in banners]

@router.get("/positions")
async def get_available_positions(
    db: AsyncSession = Depends(get_db_session)
):
    """Получение доступных позиций баннеров."""
    
    query = select(Banner.position, func.count(Banner.id).label('count')).where(
        Banner.is_active == True
    ).group_by(Banner.position)
    
    result = await db.execute(query)
    positions = result.fetchall()
    
    return {
        "positions": [
            {
                "name": pos.position,
                "count": pos.count,
                "display_name": _get_position_display_name(pos.position)
            }
            for pos in positions
        ]
    }

def _get_position_display_name(position: str) -> str:
    """Получение отображаемого имени позиции."""
    position_names = {
        "main": "Главная страница",
        "hero": "Героический баннер",
        "featured": "Рекомендуемые",
        "category": "Страница категории",
        "cart": "Корзина",
        "checkout": "Оформление заказа",
        "popup": "Всплывающее окно",
        "notification": "Уведомление"
    }
    return position_names.get(position, position.title())