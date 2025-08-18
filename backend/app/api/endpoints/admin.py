from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
async def admin_dashboard():
    """Дашборд администратора."""
    return {"message": "Admin dashboard - coming soon"}

@router.get("/orders")
async def admin_orders():
    """Управление заказами."""
    return {"message": "Admin orders management - coming soon"}

@router.post("/menu/dishes")
async def create_dish():
    """Создание нового блюда."""
    return {"message": "Create dish endpoint - coming soon"}
