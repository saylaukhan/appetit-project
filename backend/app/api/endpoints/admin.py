from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import json

from app.core.database import get_db_session
from app.utils.auth_dependencies import get_current_admin
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderResponse, OrderItemResponse, OrderStatusUpdateRequest, OrderAssignCourierRequest

router = APIRouter()

def parse_delivery_address(delivery_address_str):
    """Парсит адрес доставки из строки или JSON."""
    if not delivery_address_str:
        return None, None, None, None, None
    
    try:
        address_data = json.loads(delivery_address_str)
        return (
            address_data.get('address'),
            address_data.get('entrance'),
            address_data.get('floor'),
            address_data.get('apartment'),
            address_data.get('comment')
        )
    except (json.JSONDecodeError, TypeError):
        # Если не JSON, то это старый формат - просто строка
        return delivery_address_str, None, None, None, None

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

@router.get("/orders", response_model=List[OrderResponse])
async def get_all_orders(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение всех заказов для администратора."""
    # Получаем все заказы, отсортированные по дате создания
    query = select(Order).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # Формируем ответ с полной информацией о заказах
    orders_response = []
    for order in orders:
        # Получаем товары для каждого заказа
        items_query = select(OrderItem).where(OrderItem.order_id == order.id)
        items_result = await db.execute(items_query)
        items = items_result.scalars().all()
        
        items_response = [
            OrderItemResponse(
                id=item.id,
                dish_name=item.dish_name,
                quantity=item.quantity,
                price=item.price,
                total_price=item.total_price,
                modifiers=[mod['name'] for mod in (item.modifiers or [])]
            )
            for item in items
        ]
        
        # Парсим адрес доставки
        delivery_address, delivery_entrance, delivery_floor, delivery_apartment, delivery_comment = parse_delivery_address(order.delivery_address)
        
        orders_response.append(OrderResponse(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            delivery_type=order.delivery_type,
            payment_method=order.payment_method,
            total_amount=order.total_amount,
            delivery_address=delivery_address,
            delivery_entrance=delivery_entrance,
            delivery_floor=delivery_floor,
            delivery_apartment=delivery_apartment,
            delivery_comment=delivery_comment,
            customer_name=order.customer_name,
            customer_phone=order.customer_phone,
            items=items_response,
            created_at=order.created_at.isoformat()
        ))
    
    return orders_response

@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    request: OrderStatusUpdateRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление статуса заказа администратором."""
    # Получаем заказ
    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Обновляем статус
    old_status = order.status
    order.status = request.status
    order.updated_at = datetime.now()
    
    # Обновляем временные метки в зависимости от статуса
    if request.status == OrderStatus.CONFIRMED and old_status == OrderStatus.PENDING:
        order.confirmed_at = datetime.now()
    elif request.status == OrderStatus.READY and old_status == OrderStatus.PREPARING:
        order.ready_at = datetime.now()
    elif request.status == OrderStatus.DELIVERED:
        order.delivered_at = datetime.now()
    
    await db.commit()
    
    return {
        "message": f"Статус заказа {order.order_number} изменен с {old_status} на {request.status}",
        "order_id": order_id,
        "new_status": request.status
    }

@router.get("/couriers", response_model=List[dict])
async def get_available_couriers(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение списка доступных курьеров."""
    query = select(User).where(
        User.role == UserRole.COURIER,
        User.is_active == True
    )
    result = await db.execute(query)
    couriers = result.scalars().all()
    
    return [
        {
            "id": courier.id,
            "name": courier.name,
            "phone": courier.phone
        }
        for courier in couriers
    ]

@router.patch("/orders/{order_id}/assign-courier")
async def assign_courier_to_order(
    order_id: int,
    request: OrderAssignCourierRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Назначение курьера на заказ."""
    # Получаем заказ
    order_query = select(Order).where(Order.id == order_id)
    order_result = await db.execute(order_query)
    order = order_result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Проверяем, что заказ готов к доставке
    if order.status != OrderStatus.READY:
        raise HTTPException(
            status_code=400, 
            detail="Курьера можно назначить только на готовый заказ"
        )
    
    # Проверяем, что курьер существует и активен
    courier_query = select(User).where(
        User.id == request.courier_id,
        User.role == UserRole.COURIER,
        User.is_active == True
    )
    courier_result = await db.execute(courier_query)
    courier = courier_result.scalar_one_or_none()
    
    if not courier:
        raise HTTPException(status_code=404, detail="Курьер не найден или неактивен")
    
    # Назначаем курьера и меняем статус на "доставляется"
    order.assigned_courier_id = request.courier_id
    order.status = OrderStatus.DELIVERING
    order.updated_at = datetime.now()
    
    await db.commit()
    
    return {
        "message": f"Курьер {courier.name} назначен на заказ {order.order_number}",
        "order_id": order_id,
        "courier_name": courier.name,
        "new_status": OrderStatus.DELIVERING
    }

@router.post("/menu/dishes")
async def create_dish(current_user: User = Depends(get_current_admin)):
    """Создание нового блюда."""
    return {"message": "Create dish endpoint - coming soon"}
