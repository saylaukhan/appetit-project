from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from datetime import datetime
import random
import string
from typing import List

from app.core.database import get_db_session
from app.schemas.order import OrderCreateRequest, OrderResponse, OrderItemResponse
from app.utils.auth_dependencies import get_current_user_optional
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus, DeliveryType, PaymentStatus
from app.models.menu import Dish, Variant
from app.models.promo_code import PromoCode, DiscountType

router = APIRouter()

def generate_order_number():
    """Генерация уникального номера заказа."""
    current_year = datetime.now().year
    random_part = ''.join(random.choices(string.digits, k=6))
    return f"ORD-{current_year}-{random_part}"

async def calculate_order_totals(items_data: List[dict], promo_code: str = None, db: AsyncSession = None):
    """Расчет общей стоимости заказа с учетом промокода."""
    subtotal = Decimal('0')
    
    # Суммируем стоимость всех товаров
    for item_data in items_data:
        subtotal += item_data['total_price']
    
    discount_amount = Decimal('0')
    promo_discount = Decimal('0')
    
    # Применяем промокод если есть
    if promo_code and db:
        query = select(PromoCode).where(
            PromoCode.code == promo_code.upper(),
            PromoCode.is_active == True
        )
        result = await db.execute(query)
        promo = result.scalar_one_or_none()
        
        if promo:
            # Проверяем минимальную сумму заказа
            if not promo.min_order_amount or subtotal >= promo.min_order_amount:
                if promo.discount_type == DiscountType.PERCENTAGE:
                    discount_amount = subtotal * (promo.discount_value / 100)
                    if promo.max_discount_amount:
                        discount_amount = min(discount_amount, promo.max_discount_amount)
                else:  # FIXED
                    discount_amount = min(promo.discount_value, subtotal)
                
                promo_discount = promo.discount_value
    
    total_amount = subtotal - discount_amount
    
    return {
        'subtotal': subtotal,
        'discount_amount': discount_amount,
        'promo_discount': promo_discount,
        'total_amount': max(total_amount, Decimal('0'))
    }

@router.post("/", response_model=OrderResponse)
async def create_order(
    request: OrderCreateRequest,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db_session)
):
    """Создание нового заказа."""
    
    # Валидация данных для гостевого заказа
    if not current_user and (not request.name or not request.phone):
        raise HTTPException(
            status_code=400, 
            detail="Для гостевого заказа необходимо указать имя и телефон"
        )
    
    # Валидация адреса для доставки
    if request.delivery_type == DeliveryType.DELIVERY and not request.delivery_address:
        raise HTTPException(
            status_code=400,
            detail="Для доставки необходимо указать адрес"
        )
    
    # Подготавливаем данные товаров
    items_data = []
    
    for item_request in request.items:
        # Получаем информацию о блюде
        dish_query = select(Dish).where(Dish.id == item_request.dish_id, Dish.is_available == True)
        dish_result = await db.execute(dish_query)
        dish = dish_result.scalar_one_or_none()
        
        if not dish:
            raise HTTPException(
                status_code=404,
                detail=f"Блюдо с ID {item_request.dish_id} не найдено или недоступно"
            )
        
        # Рассчитываем цену с модификаторами
        item_price = dish.price
        modifiers_info = []
        
        if item_request.modifiers:
            variants_query = select(Variant).where(Variant.id.in_(item_request.modifiers))
            variants_result = await db.execute(variants_query)
            variants = variants_result.scalars().all()
            
            for variant in variants:
                item_price += variant.price
                modifiers_info.append({
                    "id": variant.id,
                    "name": variant.name,
                    "price": variant.price
                })
        
        total_price = item_price * item_request.quantity
        
        items_data.append({
            'dish': dish,
            'quantity': item_request.quantity,
            'price': item_price,
            'total_price': total_price,
            'modifiers': modifiers_info
        })
    
    # Расчет общей стоимости
    totals = await calculate_order_totals(items_data, request.promo_code, db)
    
    # Создаем заказ
    order_data = {
        'order_number': generate_order_number(),
        'user_id': current_user.id if current_user else None,
        'customer_name': current_user.name if current_user else request.name,
        'customer_phone': current_user.phone if current_user else request.phone,
        'customer_email': current_user.email if current_user else None,
        'delivery_type': request.delivery_type,
        'delivery_address': request.delivery_address,
        'status': OrderStatus.PENDING,
        'payment_status': PaymentStatus.PENDING,
        'subtotal': totals['subtotal'],
        'discount_amount': totals['discount_amount'],
        'total_amount': totals['total_amount'],
        'promo_code': request.promo_code.upper() if request.promo_code else None,
        'promo_discount': totals['promo_discount'],
        'customer_comment': request.comment,
        'created_at': datetime.now()
    }
    
    order = Order(**order_data)
    db.add(order)
    await db.flush()
    
    # Создаем позиции заказа
    order_items = []
    for item_data in items_data:
        order_item = OrderItem(
            order_id=order.id,
            dish_id=item_data['dish'].id,
            dish_name=item_data['dish'].name,
            dish_price=item_data['dish'].price,
            quantity=item_data['quantity'],
            price=item_data['price'],
            total_price=item_data['total_price'],
            modifiers=item_data['modifiers']
        )
        order_items.append(order_item)
        db.add(order_item)
    
    # Счетчик использований промокода обновляется при применении промокода, не здесь
    
    await db.commit()
    await db.refresh(order)
    
    # Формируем ответ
    items_response = [
        OrderItemResponse(
            id=item.id,
            dish_name=item.dish_name,
            quantity=item.quantity,
            price=item.price,
            total_price=item.total_price,
            modifiers=[mod['name'] for mod in (item.modifiers or [])]
        )
        for item in order_items
    ]
    
    return OrderResponse(
        id=order.id,
        status=order.status,
        delivery_type=order.delivery_type,
        total_amount=order.total_amount,
        delivery_address=order.delivery_address,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        items=items_response,
        created_at=order.created_at.isoformat()
    )

@router.get("/")
async def get_orders(
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение списка заказов текущего пользователя."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Необходима авторизация")
    
    query = select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return [
        {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "delivery_type": order.delivery_type,
            "total_amount": order.total_amount,
            "created_at": order.created_at.isoformat()
        }
        for order in orders
    ]

@router.get("/{order_id}")
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение детальной информации о заказе."""
    query = select(Order).where(Order.id == order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Проверяем права доступа
    if current_user and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа к этому заказу")
    
    # Получаем позиции заказа
    items_query = select(OrderItem).where(OrderItem.order_id == order_id)
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
    
    return OrderResponse(
        id=order.id,
        status=order.status,
        delivery_type=order.delivery_type,
        total_amount=order.total_amount,
        delivery_address=order.delivery_address,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        items=items_response,
        created_at=order.created_at.isoformat()
    )
