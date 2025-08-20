from fastapi import APIRouter, Depends
from app.utils.auth_dependencies import get_current_kitchen
from app.models.user import User

router = APIRouter()

@router.get("/orders")
async def get_kitchen_orders(current_user: User = Depends(get_current_kitchen)):
    """Получение заказов для кухни."""
    return {"message": "Kitchen orders endpoint - coming soon"}

@router.patch("/orders/{order_id}/status")
async def update_cooking_status(order_id: int, current_user: User = Depends(get_current_kitchen)):
    """Обновление статуса приготовления заказа."""
    return {"message": f"Update cooking status for order {order_id} - coming soon"}
