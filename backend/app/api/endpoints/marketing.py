from fastapi import APIRouter, Depends
from app.utils.auth_dependencies import get_current_admin
from app.models.user import User

router = APIRouter()

@router.get("/banners")
async def get_banners(current_user: User = Depends(get_current_admin)):
    """Получение списка баннеров."""
    return {"message": "Get banners endpoint - coming soon"}

@router.post("/banners")
async def create_banner(current_user: User = Depends(get_current_admin)):
    """Создание нового баннера."""
    return {"message": "Create banner endpoint - coming soon"}

@router.get("/promo-codes")
async def get_promo_codes(current_user: User = Depends(get_current_admin)):
    """Получение списка промокодов."""
    return {"message": "Get promo codes endpoint - coming soon"}

@router.post("/promo-codes")
async def create_promo_code(current_user: User = Depends(get_current_admin)):
    """Создание нового промокода."""
    return {"message": "Create promo code endpoint - coming soon"}
