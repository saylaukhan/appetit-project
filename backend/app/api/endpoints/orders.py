from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.schemas.order import OrderCreateRequest, OrderResponse

router = APIRouter()

@router.post("/", response_model=OrderResponse)
async def create_order(
    request: OrderCreateRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Создание нового заказа."""
    # TODO: Реализовать создание заказа
    return {"message": "Order creation endpoint - coming soon"}

@router.get("/")
async def get_orders(
    db: AsyncSession = Depends(get_db_session)
):
    """Получение списка заказов пользователя."""
    return {"message": "Get orders endpoint - coming soon"}

@router.get("/{order_id}")
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Получение детальной информации о заказе."""
    return {"message": f"Get order {order_id} endpoint - coming soon"}
