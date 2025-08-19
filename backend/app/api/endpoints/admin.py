from fastapi import APIRouter, Depends
from app.utils.auth_dependencies import get_current_admin
from app.models.user import User

router = APIRouter()

@router.get("/dashboard")
async def admin_dashboard(current_user: User = Depends(get_current_admin)):
    """Дашборд администратора."""
    return {
        "message": "Admin dashboard", 
        "admin": {
            "id": current_user.id,
            "name": current_user.name,
            "role": current_user.role
        }
    }

@router.get("/orders")
async def admin_orders(current_user: User = Depends(get_current_admin)):
    """Управление заказами."""
    return {"message": "Admin orders management - coming soon"}

@router.post("/menu/dishes")
async def create_dish(current_user: User = Depends(get_current_admin)):
    """Создание нового блюда."""
    return {"message": "Create dish endpoint - coming soon"}
