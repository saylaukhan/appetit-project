from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import json

from app.core.database import get_db_session
from app.utils.auth_dependencies import get_current_courier
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderResponse, OrderItemResponse, OrderStatusUpdateRequest

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

@router.get("/orders", response_model=List[OrderResponse])
async def get_courier_orders(
    current_user: User = Depends(get_current_courier),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение заказов назначенных курьеру."""
    # Получаем заказы, назначенные текущему курьеру
    query = select(Order).where(
        Order.assigned_courier_id == current_user.id,
        Order.status.in_([OrderStatus.DELIVERING, OrderStatus.DELIVERED])
    ).order_by(Order.updated_at.desc())
    
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

@router.get("/available-orders", response_model=List[OrderResponse])
async def get_available_orders(
    current_user: User = Depends(get_current_courier),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение доступных для доставки заказов (готовые заказы без назначенного курьера)."""
    # Получаем готовые заказы без назначенного курьера
    query = select(Order).where(
        Order.status == OrderStatus.READY,
        Order.assigned_courier_id.is_(None),
        Order.delivery_type == "delivery"  # Только заказы на доставку
    ).order_by(Order.ready_at.asc())
    
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

@router.patch("/orders/{order_id}/take")
async def take_order(
    order_id: int,
    current_user: User = Depends(get_current_courier),
    db: AsyncSession = Depends(get_db_session)
):
    """Взять заказ в доставку."""
    # Получаем заказ
    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Проверяем, что заказ готов и не назначен
    if order.status != OrderStatus.READY:
        raise HTTPException(
            status_code=400, 
            detail="Можно взять только готовый заказ"
        )
    
    if order.assigned_courier_id is not None:
        raise HTTPException(
            status_code=400, 
            detail="Заказ уже назначен другому курьеру"
        )
    
    if order.delivery_type != "delivery":
        raise HTTPException(
            status_code=400, 
            detail="Можно взять только заказы на доставку"
        )
    
    # Назначаем курьера и меняем статус
    order.assigned_courier_id = current_user.id
    order.status = OrderStatus.DELIVERING
    order.updated_at = datetime.now()
    
    await db.commit()
    
    return {
        "message": f"Заказ {order.order_number} взят в доставку",
        "order_id": order_id,
        "new_status": OrderStatus.DELIVERING
    }

@router.patch("/orders/{order_id}/delivered")
async def mark_delivered(
    order_id: int,
    current_user: User = Depends(get_current_courier),
    db: AsyncSession = Depends(get_db_session)
):
    """Отметить заказ как доставленный."""
    # Получаем заказ
    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Проверяем, что заказ назначен текущему курьеру
    if order.assigned_courier_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Этот заказ назначен другому курьеру"
        )
    
    # Проверяем, что заказ в доставке
    if order.status != OrderStatus.DELIVERING:
        raise HTTPException(
            status_code=400, 
            detail="Можно отметить доставленным только заказ в доставке"
        )
    
    # Меняем статус на "доставлен"
    order.status = OrderStatus.DELIVERED
    order.delivered_at = datetime.now()
    order.updated_at = datetime.now()
    
    await db.commit()
    
    return {
        "message": f"Заказ {order.order_number} доставлен",
        "order_id": order_id,
        "new_status": OrderStatus.DELIVERED
    }

@router.patch("/orders/{order_id}/status")
async def update_delivery_status(
    order_id: int, 
    request: OrderStatusUpdateRequest,
    current_user: User = Depends(get_current_courier),
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление статуса доставки заказа."""
    # Получаем заказ
    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Проверяем, что заказ назначен текущему курьеру
    if order.assigned_courier_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Этот заказ назначен другому курьеру"
        )
    
    # Курьер может менять статус только между DELIVERING и DELIVERED
    allowed_statuses = [OrderStatus.DELIVERING, OrderStatus.DELIVERED]
    if request.status not in allowed_statuses:
        raise HTTPException(
            status_code=400, 
            detail="Курьер может устанавливать только статусы: доставляется, доставлен"
        )
    
    # Обновляем статус
    old_status = order.status
    order.status = request.status
    order.updated_at = datetime.now()
    
    # Обновляем временные метки
    if request.status == OrderStatus.DELIVERED:
        order.delivered_at = datetime.now()
    
    await db.commit()
    
    return {
        "message": f"Статус заказа {order.order_number} изменен с {old_status} на {request.status}",
        "order_id": order_id,
        "new_status": request.status
    }
