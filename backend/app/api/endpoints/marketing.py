from fastapi import APIRouter

router = APIRouter()

@router.get("/banners")
async def get_banners():
    """Получение списка баннеров."""
    return {"message": "Get banners endpoint - coming soon"}

@router.post("/banners")
async def create_banner():
    """Создание нового баннера."""
    return {"message": "Create banner endpoint - coming soon"}

@router.get("/promo-codes")
async def get_promo_codes():
    """Получение списка промокодов."""
    return {"message": "Get promo codes endpoint - coming soon"}

@router.post("/promo-codes")
async def create_promo_code():
    """Создание нового промокода."""
    return {"message": "Create promo code endpoint - coming soon"}
