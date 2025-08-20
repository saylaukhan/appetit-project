from fastapi import APIRouter, Depends
from app.utils.auth_dependencies import get_current_courier
from app.models.user import User

router = APIRouter()

@router.get("/orders")
async def get_courier_orders(current_user: User = Depends(get_current_courier)):
    """Получение заказов назначенных курьеру."""
    return {"message": "Courier orders endpoint - coming soon"}

@router.patch("/orders/{order_id}/status")
async def update_delivery_status(order_id: int, current_user: User = Depends(get_current_courier)):
    """Обновление статуса доставки заказа."""
    return {"message": f"Update delivery status for order {order_id} - coming soon"}
