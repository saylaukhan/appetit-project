from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import List
from datetime import datetime

from app.core.database import get_db_session
from app.utils.auth_dependencies import get_current_kitchen
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderResponse, OrderItemResponse, OrderStatusUpdateRequest

router = APIRouter()

@router.get("/orders", response_model=List[OrderResponse])
async def get_kitchen_orders(
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение заказов для кухни (подтвержденные, готовящиеся и готовые на самовывоз)."""
    # Получаем заказы, которые нужно готовить, а также готовые заказы на самовывоз
    query = select(Order).where(
        or_(
            Order.status.in_([OrderStatus.CONFIRMED, OrderStatus.PREPARING]),
            and_(Order.status == OrderStatus.READY, Order.delivery_type == 'pickup')
        )
    ).order_by(Order.confirmed_at.asc())  # Сортируем по времени подтверждения
    
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
        
        orders_response.append(OrderResponse(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            delivery_type=order.delivery_type,
            payment_method=order.payment_method,
            total_amount=order.total_amount,
            delivery_address=order.delivery_address,
            customer_name=order.customer_name,
            customer_phone=order.customer_phone,
            items=items_response,
            created_at=order.created_at.isoformat()
        ))
    
    return orders_response

@router.patch("/orders/{order_id}/start-cooking")
async def start_cooking(
    order_id: int,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db_session)
):
    """Начать приготовление заказа."""
    # Получаем заказ
    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Проверяем, что заказ можно начать готовить
    if order.status != OrderStatus.CONFIRMED:
        raise HTTPException(
            status_code=400, 
            detail="Можно начать готовить только подтвержденный заказ"
        )
    
    # Меняем статус на "готовится"
    order.status = OrderStatus.PREPARING
    order.updated_at = datetime.now()
    
    await db.commit()
    
    return {
        "message": f"Начато приготовление заказа {order.order_number}",
        "order_id": order_id,
        "new_status": OrderStatus.PREPARING
    }

@router.patch("/orders/{order_id}/mark-ready")
async def mark_order_ready(
    order_id: int,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db_session)
):
    """Отметить заказ как готовый."""
    # Получаем заказ
    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Проверяем, что заказ готовится
    if order.status != OrderStatus.PREPARING:
        raise HTTPException(
            status_code=400, 
            detail="Можно отметить готовым только готовящийся заказ"
        )
    
    # Меняем статус на "готов"
    order.status = OrderStatus.READY
    order.ready_at = datetime.now()
    order.updated_at = datetime.now()
    
    await db.commit()
    
    return {
        "message": f"Заказ {order.order_number} готов к выдаче",
        "order_id": order_id,
        "new_status": OrderStatus.READY
    }

@router.patch("/orders/{order_id}/pickup-complete")
async def complete_pickup_order(
    order_id: int,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db_session)
):
    """Отметить заказ на самовывоз как выданный."""
    # Получаем заказ
    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Проверяем, что это заказ на самовывоз и он готов
    if order.delivery_type != 'pickup':
        raise HTTPException(
            status_code=400, 
            detail="Этот endpoint только для заказов на самовывоз"
        )
    
    if order.status != OrderStatus.READY:
        raise HTTPException(
            status_code=400, 
            detail="Можно выдать только готовый заказ"
        )
    
    # Меняем статус на "выполнен"
    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.now()
    order.updated_at = datetime.now()
    
    await db.commit()
    
    return {
        "message": f"Заказ {order.order_number} выдан клиенту",
        "order_id": order_id,
        "new_status": OrderStatus.COMPLETED
    }

@router.patch("/orders/{order_id}/status")
async def update_cooking_status(
    order_id: int, 
    request: OrderStatusUpdateRequest,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление статуса приготовления заказа."""
    # Получаем заказ
    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Кухня может менять статус только между CONFIRMED, PREPARING и READY
    allowed_statuses = [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY]
    if request.status not in allowed_statuses:
        raise HTTPException(
            status_code=400, 
            detail="Кухня может устанавливать только статусы: подтвержден, готовится, готов"
        )
    
    # Проверяем логику переходов
    if order.status == OrderStatus.CONFIRMED and request.status not in [OrderStatus.PREPARING]:
        raise HTTPException(
            status_code=400, 
            detail="Из статуса 'подтвержден' можно перейти только в 'готовится'"
        )
    elif order.status == OrderStatus.PREPARING and request.status not in [OrderStatus.READY, OrderStatus.CONFIRMED]:
        raise HTTPException(
            status_code=400, 
            detail="Из статуса 'готовится' можно перейти только в 'готов' или вернуться в 'подтвержден'"
        )
    
    # Обновляем статус
    old_status = order.status
    order.status = request.status
    order.updated_at = datetime.now()
    
    # Обновляем временные метки
    if request.status == OrderStatus.READY:
        order.ready_at = datetime.now()
    
    await db.commit()
    
    return {
        "message": f"Статус заказа {order.order_number} изменен с {old_status} на {request.status}",
        "order_id": order_id,
        "new_status": request.status
    }
