from fastapi import APIRouter

router = APIRouter()

@router.get("/orders")
async def get_courier_orders():
    """Получение заказов назначенных курьеру."""
    return {"message": "Courier orders endpoint - coming soon"}

@router.patch("/orders/{order_id}/status")
async def update_delivery_status(order_id: int):
    """Обновление статуса доставки заказа."""
    return {"message": f"Update delivery status for order {order_id} - coming soon"}
