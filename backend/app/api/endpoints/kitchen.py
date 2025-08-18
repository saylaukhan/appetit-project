from fastapi import APIRouter

router = APIRouter()

@router.get("/orders")
async def get_kitchen_orders():
    """Получение заказов для кухни."""
    return {"message": "Kitchen orders endpoint - coming soon"}

@router.patch("/orders/{order_id}/status")
async def update_cooking_status(order_id: int):
    """Обновление статуса приготовления заказа."""
    return {"message": f"Update cooking status for order {order_id} - coming soon"}
