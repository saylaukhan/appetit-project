from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract, desc
from typing import List, Optional
from datetime import datetime, timedelta
import json
import csv
import io
import os
import uuid
import shutil
from pathlib import Path

from app.core.database import get_db_session
from app.utils.auth_dependencies import get_current_admin
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.menu import Dish
from app.models.banner import Banner
from app.models.story import Story
from app.schemas.order import OrderResponse, OrderItemResponse, OrderStatusUpdateRequest, OrderAssignCourierRequest
from app.schemas.banner import (
    BannerCreate, 
    BannerUpdate, 
    BannerResponse, 
    BannerListResponse, 
    BannerStatsResponse
)
from app.schemas.story import (
    StoryCreate,
    StoryUpdate,
    StoryResponse,
    StoryListResponse,
    StoryStatsResponse
)

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
async def admin_dashboard(
    db: AsyncSession = Depends(get_db_session)
):
    """Панель управления администратора."""
    
    try:
        # Получаем общее количество заказов
        total_orders_query = select(func.count(Order.id))
        total_orders_result = await db.execute(total_orders_query)
        total_orders = total_orders_result.scalar() or 0
        
        # Получаем общую выручку
        total_revenue_query = select(func.sum(Order.total_amount)).where(
            Order.status == OrderStatus.DELIVERED
        )
        total_revenue_result = await db.execute(total_revenue_query)
        total_revenue = total_revenue_result.scalar() or 0
        
        # Получаем количество активных пользователей
        active_users_query = select(func.count(User.id)).where(
            and_(User.is_active == True, User.role == UserRole.CLIENT)
        )
        active_users_result = await db.execute(active_users_query)
        active_users = active_users_result.scalar() or 0
        
        # Получаем средний чек (только для доставленных заказов)
        avg_check_query = select(func.avg(Order.total_amount)).where(
            Order.status == OrderStatus.DELIVERED
        )
        avg_check_result = await db.execute(avg_check_query)
        avg_check = avg_check_result.scalar() or 0
        
        # Получаем последние заказы для отображения в таблице
        recent_orders_query = select(Order).order_by(Order.created_at.desc()).limit(5)
        recent_orders_result = await db.execute(recent_orders_query)
        recent_orders = recent_orders_result.scalars().all()
        
        # Форматируем последние заказы
        recent_orders_data = []
        for order in recent_orders:
            # Определяем статус на русском
            status_mapping = {
                OrderStatus.PENDING: "Ожидает подтверждения",
                OrderStatus.CONFIRMED: "Подтвержден", 
                OrderStatus.PREPARING: "Готовится",
                OrderStatus.READY: "Готов",
                OrderStatus.DELIVERING: "Доставляется",
                OrderStatus.DELIVERED: "Доставлен",
                OrderStatus.CANCELLED: "Отменен"
            }
            
            recent_orders_data.append({
                "id": order.id,
                "order_number": order.order_number,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount or 0),
                "status": status_mapping.get(order.status, order.status.value if order.status else "Неизвестно"),
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "time_ago": _calculate_time_ago(order.created_at)
            })
        
        return {
            "admin": {
                "id": 1,
                "name": "Администратор",
                "role": "admin"
            },
            "statistics": {
                "total_orders": total_orders,
                "total_revenue": float(total_revenue),
                "active_users": active_users,
                "average_check": float(avg_check)
            },
            "recent_orders": recent_orders_data,
            "quick_actions": [
                {"name": "Заказы", "url": "/admin/orders", "icon": "orders"},
                {"name": "Меню", "url": "/admin/menu", "icon": "menu"},
                {"name": "Пользователи", "url": "/admin/users", "icon": "users"},
                {"name": "Маркетинг", "url": "/admin/marketing", "icon": "marketing"},
                {"name": "Аналитика", "url": "/admin/analytics", "icon": "analytics"}
            ]
        }
    
    except Exception as e:
        # В случае ошибки возвращаем базовые данные
        return {
            "admin": {
                "id": 1,
                "name": "Администратор",
                "role": "admin"
            },
            "statistics": {
                "total_orders": 0,
                "total_revenue": 0.0,
                "active_users": 0,
                "average_check": 0.0
            },
            "recent_orders": [],
            "quick_actions": [
                {"name": "Заказы", "url": "/admin/orders", "icon": "orders"},
                {"name": "Меню", "url": "/admin/menu", "icon": "menu"},
                {"name": "Пользователи", "url": "/admin/users", "icon": "users"},
                {"name": "Маркетинг", "url": "/admin/marketing", "icon": "marketing"},
                {"name": "Аналитика", "url": "/admin/analytics", "icon": "analytics"}
            ],
            "error": str(e)
        }

def _calculate_time_ago(created_at: datetime) -> str:
    """Вычисляет время, прошедшее с момента создания заказа."""
    if created_at is None:
        return "Неизвестно"
    
    try:
        now = datetime.now()
        # Убираем timezone info если есть
        if created_at.tzinfo:
            created_at = created_at.replace(tzinfo=None)
        
        diff = now - created_at
        
        if diff.days > 0:
            return f"{diff.days} дн назад"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} час назад" if hours == 1 else f"{hours} часов назад"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} мин назад"
        else:
            return "Только что"
    except Exception as e:
        return "Неизвестно"

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

@router.get("/users")
async def get_all_users(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение всех пользователей."""
    query = select(User).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    
    users_data = []
    for user in users:
        role_mapping = {
            UserRole.CUSTOMER: "Клиент",
            UserRole.ADMIN: "Администратор",
            UserRole.COURIER: "Курьер",
            UserRole.KITCHEN: "Кухня"
        }
        
        users_data.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": role_mapping.get(user.role, user.role.value),
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return {
        "users": users_data,
        "total_count": len(users_data)
    }

@router.get("/menu")
async def get_menu_management(current_user: User = Depends(get_current_admin)):
    """Управление меню."""
    return {
        "message": "Управление меню - в разработке",
        "sections": [
            "Категории блюд",
            "Блюда",
            "Модификаторы",
            "Цены"
        ]
    }

@router.get("/analytics")
async def get_detailed_analytics(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Детальная аналитика и отчеты."""
    
    # Временные периоды
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)
    prev_month_start = now - timedelta(days=60)
    prev_week_start = now - timedelta(days=14)
    
    # 1. ОСНОВНЫЕ МЕТРИКИ С ПРОЦЕНТОМ РОСТА
    
    # Общая выручка (только доставленные заказы)
    total_revenue_query = select(func.sum(Order.total_amount)).where(
        and_(Order.status == OrderStatus.DELIVERED, Order.created_at >= month_start)
    )
    total_revenue_result = await db.execute(total_revenue_query)
    total_revenue = float(total_revenue_result.scalar() or 0)
    
    # Выручка за предыдущий месяц для расчета роста
    prev_revenue_query = select(func.sum(Order.total_amount)).where(
        and_(Order.status == OrderStatus.DELIVERED, 
             Order.created_at >= prev_month_start,
             Order.created_at < month_start)
    )
    prev_revenue_result = await db.execute(prev_revenue_query)
    prev_revenue = float(prev_revenue_result.scalar() or 1)
    revenue_growth = round(((total_revenue - prev_revenue) / prev_revenue) * 100, 1) if prev_revenue > 0 else 0
    
    # Всего заказов за месяц
    total_orders_query = select(func.count(Order.id)).where(Order.created_at >= month_start)
    total_orders_result = await db.execute(total_orders_query)
    total_orders = total_orders_result.scalar() or 0
    
    # Заказы за предыдущий месяц
    prev_orders_query = select(func.count(Order.id)).where(
        and_(Order.created_at >= prev_month_start, Order.created_at < month_start)
    )
    prev_orders_result = await db.execute(prev_orders_query)
    prev_orders = prev_orders_result.scalar() or 1
    orders_growth = round(((total_orders - prev_orders) / prev_orders) * 100, 1) if prev_orders > 0 else 0
    
    # Средний чек
    avg_check_query = select(func.avg(Order.total_amount)).where(
        and_(Order.status == OrderStatus.DELIVERED, Order.created_at >= month_start)
    )
    avg_check_result = await db.execute(avg_check_query)
    avg_check = float(avg_check_result.scalar() or 0)
    
    # Средний чек за предыдущий месяц
    prev_avg_check_query = select(func.avg(Order.total_amount)).where(
        and_(Order.status == OrderStatus.DELIVERED,
             Order.created_at >= prev_month_start,
             Order.created_at < month_start)
    )
    prev_avg_check_result = await db.execute(prev_avg_check_query)
    prev_avg_check = float(prev_avg_check_result.scalar() or 1)
    avg_check_growth = round(((avg_check - prev_avg_check) / prev_avg_check) * 100, 1) if prev_avg_check > 0 else 0
    
    # Активные клиенты
    active_users_query = select(func.count(User.id)).where(
        and_(User.is_active == True, User.role == UserRole.CLIENT)
    )
    active_users_result = await db.execute(active_users_query)
    active_users = active_users_result.scalar() or 0
    
    # Активные клиенты месяц назад (примерная логика)
    prev_active_users = max(1, int(active_users * 0.9))  # Упрощенная логика для демо
    active_users_growth = round(((active_users - prev_active_users) / prev_active_users) * 100, 1)
    
    # 2. ВЫРУЧКА ПО ПЕРИОДАМ
    
    # Сегодня
    today_revenue_query = select(func.sum(Order.total_amount)).where(
        and_(Order.status == OrderStatus.DELIVERED, Order.created_at >= today_start)
    )
    today_revenue_result = await db.execute(today_revenue_query)
    today_revenue = float(today_revenue_result.scalar() or 0)
    
    # За неделю
    week_revenue_query = select(func.sum(Order.total_amount)).where(
        and_(Order.status == OrderStatus.DELIVERED, Order.created_at >= week_start)
    )
    week_revenue_result = await db.execute(week_revenue_query)
    week_revenue = float(week_revenue_result.scalar() or 0)
    
    # За месяц (уже есть в total_revenue)
    
    # 3. ПОПУЛЯРНЫЕ БЛЮДА
    popular_dishes_query = select(
        OrderItem.dish_name,
        func.count(OrderItem.id).label('orders_count'),
        func.sum(OrderItem.total_price).label('revenue')
    ).join(Order).where(
        and_(Order.status == OrderStatus.DELIVERED, Order.created_at >= month_start)
    ).group_by(OrderItem.dish_name).order_by(desc(func.sum(OrderItem.total_price))).limit(5)
    
    popular_dishes_result = await db.execute(popular_dishes_query)
    popular_dishes = popular_dishes_result.fetchall()
    
    # 4. ЗАКАЗЫ ПО ЧАСАМ (за последние 7 дней)
    hourly_orders_query = select(
        extract('hour', Order.created_at).label('hour'),
        func.count(Order.id).label('orders_count')
    ).where(
        Order.created_at >= week_start
    ).group_by(extract('hour', Order.created_at)).order_by('hour')
    
    hourly_orders_result = await db.execute(hourly_orders_query)
    hourly_orders = hourly_orders_result.fetchall()
    
    # 5. ТИПЫ КЛИЕНТОВ
    # Новые клиенты (зарегистрированы в последний месяц)
    new_clients_query = select(func.count(User.id)).where(
        and_(User.role == UserRole.CLIENT, User.created_at >= month_start)
    )
    new_clients_result = await db.execute(new_clients_query)
    new_clients = new_clients_result.scalar() or 0
    
    # Постоянные клиенты (старше месяца)
    regular_clients_query = select(func.count(User.id)).where(
        and_(User.role == UserRole.CLIENT, User.created_at < month_start)
    )
    regular_clients_result = await db.execute(regular_clients_query)
    regular_clients = regular_clients_result.scalar() or 0
    
    # 6. СПОСОБЫ ОПЛАТЫ
    payment_methods_query = select(
        Order.payment_method,
        func.count(Order.id).label('count')
    ).where(
        and_(Order.status == OrderStatus.DELIVERED, Order.created_at >= month_start)
    ).group_by(Order.payment_method)
    
    payment_methods_result = await db.execute(payment_methods_query)
    payment_methods = payment_methods_result.fetchall()
    
    # Формируем ответ
    return {
        "main_metrics": {
            "total_revenue": {
                "value": total_revenue,
                "growth": revenue_growth
            },
            "total_orders": {
                "value": total_orders,
                "growth": orders_growth
            },
            "average_check": {
                "value": avg_check,
                "growth": avg_check_growth
            },
            "active_clients": {
                "value": active_users,
                "growth": active_users_growth
            }
        },
        "revenue_periods": {
            "today": today_revenue,
            "week": week_revenue,
            "month": total_revenue
        },
        "popular_dishes": [
            {
                "dish_name": dish.dish_name,
                "orders_count": dish.orders_count,
                "revenue": float(dish.revenue),
                "growth": "+5.2%"  # Статическое значение для демо
            }
            for dish in popular_dishes
        ],
        "hourly_orders": [
            {
                "hour": int(hour.hour) if hour.hour is not None else 0,
                "orders_count": hour.orders_count
            }
            for hour in hourly_orders
        ],
        "client_types": {
            "new_clients": {
                "count": new_clients,
                "percentage": round((new_clients / max(1, new_clients + regular_clients)) * 100, 1)
            },
            "regular_clients": {
                "count": regular_clients,
                "percentage": round((regular_clients / max(1, new_clients + regular_clients)) * 100, 1)
            }
        },
        "payment_methods": [
            {
                "method": "Карта онлайн" if method.payment_method == PaymentMethod.CARD else "Наличные",
                "count": method.count,
                "percentage": 0  # Будет вычислено на фронте
            }
            for method in payment_methods
        ]
    }

@router.get("/analytics/export")
async def export_analytics_data(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Экспорт данных аналитики в CSV формат."""
    
    # Получаем данные за последний месяц
    month_start = datetime.now() - timedelta(days=30)
    
    # Запрос данных для экспорта
    export_query = select(
        Order.order_number,
        Order.created_at,
        Order.customer_name,
        Order.total_amount,
        Order.status,
        Order.payment_method,
        Order.delivery_type
    ).where(
        Order.created_at >= month_start
    ).order_by(Order.created_at.desc())
    
    export_result = await db.execute(export_query)
    orders = export_result.fetchall()
    
    # Создаем CSV в памяти
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Заголовки
    writer.writerow([
        'Номер заказа',
        'Дата создания', 
        'Имя клиента',
        'Сумма (₸)',
        'Статус',
        'Способ оплаты',
        'Тип доставки'
    ])
    
    # Данные
    for order in orders:
        status_mapping = {
            'pending': 'Ожидает подтверждения',
            'confirmed': 'Подтвержден',
            'preparing': 'Готовится',
            'ready': 'Готов',
            'delivering': 'Доставляется',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        }
        
        payment_mapping = {
            'card': 'Карта онлайн',
            'cash': 'Наличные'
        }
        
        delivery_mapping = {
            'delivery': 'Доставка',
            'pickup': 'Самовывоз'
        }
        
        writer.writerow([
            order.order_number,
            order.created_at.strftime('%Y-%m-%d %H:%M:%S') if order.created_at else '',
            order.customer_name,
            f"{float(order.total_amount):.2f}",
            status_mapping.get(order.status.value if order.status else '', order.status),
            payment_mapping.get(order.payment_method.value if order.payment_method else '', order.payment_method),
            delivery_mapping.get(order.delivery_type.value if order.delivery_type else '', order.delivery_type)
        ])
    
    # Возвращаем CSV файл
    csv_content = output.getvalue()
    output.close()
    
    # Генерируем имя файла с текущей датой
    filename = f"analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        content=csv_content.encode('utf-8-sig'),  # BOM для правильного отображения в Excel
        media_type='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Content-Type': 'text/csv; charset=utf-8'
        }
    )

@router.get("/notifications")
async def get_notifications(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение уведомлений для администратора."""
    try:
        # Получаем количество заказов, ожидающих подтверждения
        pending_orders_query = select(func.count(Order.id)).where(
            Order.status == OrderStatus.PENDING
        )
        pending_orders_result = await db.execute(pending_orders_query)
        pending_orders_count = pending_orders_result.scalar() or 0
        
        # Получаем количество новых пользователей за последние 24 часа
        yesterday = datetime.now() - timedelta(days=1)
        new_users_query = select(func.count(User.id)).where(
            and_(User.created_at >= yesterday, User.role == UserRole.CLIENT)
        )
        new_users_result = await db.execute(new_users_query)
        new_users_count = new_users_result.scalar() or 0
        
        return {
            "pending_orders": pending_orders_count,
            "new_users": new_users_count,
            "notifications": [
                {
                    "type": "orders",
                    "count": pending_orders_count,
                    "message": f"{pending_orders_count} заказов ожидают подтверждения" if pending_orders_count > 0 else "Нет заказов, ожидающих подтверждения"
                },
                {
                    "type": "users", 
                    "count": new_users_count,
                    "message": f"{new_users_count} новых пользователей за 24 часа"
                }
            ]
        }
    except Exception as e:
        return {
            "pending_orders": 0,
            "new_users": 0,
            "notifications": [],
            "error": str(e)
        }

@router.post("/menu/dishes")
async def create_dish(current_user: User = Depends(get_current_admin)):
    """Создание нового блюда."""
    return {"message": "Create dish endpoint - coming soon"}

# === МАРКЕТИНГ И БАННЕРЫ ===

@router.get("/marketing")
async def get_marketing_dashboard(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Панель управления маркетингом."""
    try:
        # Получаем статистику по баннерам
        total_banners_query = select(func.count(Banner.id))
        total_banners_result = await db.execute(total_banners_query)
        total_banners = total_banners_result.scalar() or 0
        
        active_banners_query = select(func.count(Banner.id)).where(Banner.is_active == True)
        active_banners_result = await db.execute(active_banners_query)
        active_banners = active_banners_result.scalar() or 0
        
        total_views_query = select(func.sum(Banner.view_count))
        total_views_result = await db.execute(total_views_query)
        total_views = total_views_result.scalar() or 0
        
        total_clicks_query = select(func.sum(Banner.click_count))
        total_clicks_result = await db.execute(total_clicks_query)
        total_clicks = total_clicks_result.scalar() or 0
        
        # Получаем топ баннеры по просмотрам
        top_banners_query = select(Banner).where(
            Banner.is_active == True
        ).order_by(Banner.view_count.desc()).limit(5)
        top_banners_result = await db.execute(top_banners_query)
        top_banners = top_banners_result.scalars().all()
        
        return {
            "statistics": {
                "total_banners": total_banners,
                "active_banners": active_banners,
                "total_views": total_views,
                "total_clicks": total_clicks,
                "average_ctr": round((total_clicks / max(1, total_views)) * 100, 2)
            },
            "top_banners": [
                {
                    "id": banner.id,
                    "title": banner.title,
                    "position": banner.position,
                    "views": banner.view_count,
                    "clicks": banner.click_count,
                    "ctr": round((banner.click_count / max(1, banner.view_count)) * 100, 2)
                }
                for banner in top_banners
            ],
            "quick_actions": [
                {"name": "Создать баннер", "action": "create_banner", "icon": "plus"},
                {"name": "Управление баннерами", "action": "manage_banners", "icon": "settings"},
                {"name": "Аналитика баннеров", "action": "banner_analytics", "icon": "chart"}
            ]
        }
    except Exception as e:
        return {
            "statistics": {
                "total_banners": 0,
                "active_banners": 0,
                "total_views": 0,
                "total_clicks": 0,
                "average_ctr": 0
            },
            "top_banners": [],
            "quick_actions": [],
            "error": str(e)
        }

@router.get("/marketing/banners", response_model=BannerListResponse)
async def get_all_banners(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
    position: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Получение всех баннеров."""
    query = select(Banner).order_by(Banner.sort_order.asc(), Banner.created_at.desc())
    
    # Фильтрация по позиции
    if position:
        query = query.where(Banner.position == position)
    
    # Фильтрация по статусу
    if is_active is not None:
        query = query.where(Banner.is_active == is_active)
    
    result = await db.execute(query)
    banners = result.scalars().all()
    
    return BannerListResponse(
        banners=[BannerResponse.from_orm(banner) for banner in banners],
        total_count=len(banners)
    )

@router.post("/marketing/banners", response_model=BannerResponse)
async def create_banner(
    banner_data: BannerCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Создание нового баннера."""
    
    banner = Banner(
        title=banner_data.title,
        description=banner_data.description,
        image=banner_data.image,
        link=banner_data.link,
        position=banner_data.position,
        sort_order=banner_data.sort_order,
        is_active=banner_data.is_active,
        show_from=banner_data.show_from,
        show_until=banner_data.show_until
    )
    
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    
    return BannerResponse.from_orm(banner)

@router.put("/marketing/banners/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: int,
    banner_data: BannerUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление баннера."""
    
    # Получаем баннер
    query = select(Banner).where(Banner.id == banner_id)
    result = await db.execute(query)
    banner = result.scalar_one_or_none()
    
    if not banner:
        raise HTTPException(status_code=404, detail="Баннер не найден")
    
    # Обновляем поля
    update_data = banner_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(banner, field, value)
    
    await db.commit()
    await db.refresh(banner)
    
    return BannerResponse.from_orm(banner)

@router.delete("/marketing/banners/{banner_id}")
async def delete_banner(
    banner_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Удаление баннера."""
    
    # Получаем баннер
    query = select(Banner).where(Banner.id == banner_id)
    result = await db.execute(query)
    banner = result.scalar_one_or_none()
    
    if not banner:
        raise HTTPException(status_code=404, detail="Баннер не найден")
    
    await db.delete(banner)
    await db.commit()
    
    return {"message": f"Баннер '{banner.title}' успешно удален"}

@router.get("/marketing/banners/{banner_id}/stats", response_model=BannerStatsResponse)
async def get_banner_stats(
    banner_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение статистики баннера."""
    
    query = select(Banner).where(Banner.id == banner_id)
    result = await db.execute(query)
    banner = result.scalar_one_or_none()
    
    if not banner:
        raise HTTPException(status_code=404, detail="Баннер не найден")
    
    return BannerStatsResponse(
        id=banner.id,
        title=banner.title,
        position=banner.position,
        is_active=banner.is_active,
        view_count=banner.view_count,
        click_count=banner.click_count,
        ctr=round((banner.click_count / max(1, banner.view_count)) * 100, 2),
        created_at=banner.created_at,
        show_from=banner.show_from,
        show_until=banner.show_until
    )

@router.post("/marketing/banners/{banner_id}/track-view")
async def track_banner_view(
    banner_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Отслеживание просмотра баннера."""
    
    query = select(Banner).where(Banner.id == banner_id)
    result = await db.execute(query)
    banner = result.scalar_one_or_none()
    
    if not banner:
        raise HTTPException(status_code=404, detail="Баннер не найден")
    
    banner.view_count += 1
    await db.commit()
    
    return {"message": "Просмотр засчитан", "banner_id": banner_id, "view_count": banner.view_count}

@router.post("/marketing/banners/{banner_id}/track-click")
async def track_banner_click(
    banner_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Отслеживание клика по баннеру."""
    
    query = select(Banner).where(Banner.id == banner_id)
    result = await db.execute(query)
    banner = result.scalar_one_or_none()
    
    if not banner:
        raise HTTPException(status_code=404, detail="Баннер не найден")
    
    banner.click_count += 1
    await db.commit()
    
    return {"message": "Клик засчитан", "banner_id": banner_id, "click_count": banner.click_count}

# ================================
# STORIES ENDPOINTS
# ================================

@router.get("/stories", response_model=StoryListResponse)
async def get_all_stories(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение всех историй для администратора."""
    query = select(Story).order_by(Story.sort_order.asc(), Story.created_at.desc())
    result = await db.execute(query)
    stories = result.scalars().all()
    
    return StoryListResponse(
        stories=[StoryResponse.model_validate(story) for story in stories],
        total_count=len(stories)
    )

@router.post("/stories", response_model=StoryResponse)
async def create_story(
    story_data: StoryCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Создание новой истории."""
    story = Story(
        title=story_data.title,
        description=story_data.description,
        cover_image=story_data.cover_image,
        content_image=story_data.content_image,
        sort_order=story_data.sort_order,
        is_active=story_data.is_active,
        show_from=story_data.show_from,
        show_until=story_data.show_until
    )
    
    db.add(story)
    await db.commit()
    await db.refresh(story)
    
    return StoryResponse.model_validate(story)

@router.put("/stories/{story_id}", response_model=StoryResponse)
async def update_story(
    story_id: int,
    story_data: StoryUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление истории."""
    query = select(Story).where(Story.id == story_id)
    result = await db.execute(query)
    story = result.scalar_one_or_none()
    
    if not story:
        raise HTTPException(status_code=404, detail="История не найдена")
    
    # Обновляем только предоставленные поля
    update_data = story_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(story, field, value)
    
    story.updated_at = datetime.now()
    await db.commit()
    await db.refresh(story)
    
    return StoryResponse.model_validate(story)

@router.delete("/stories/{story_id}")
async def delete_story(
    story_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Удаление истории."""
    query = select(Story).where(Story.id == story_id)
    result = await db.execute(query)
    story = result.scalar_one_or_none()
    
    if not story:
        raise HTTPException(status_code=404, detail="История не найдена")
    
    await db.delete(story)
    await db.commit()
    
    return {"message": f"История '{story.title}' успешно удалена", "story_id": story_id}

@router.patch("/stories/{story_id}/toggle-status")
async def toggle_story_status(
    story_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Переключение статуса истории."""
    query = select(Story).where(Story.id == story_id)
    result = await db.execute(query)
    story = result.scalar_one_or_none()
    
    if not story:
        raise HTTPException(status_code=404, detail="История не найдена")
    
    story.is_active = not story.is_active
    story.updated_at = datetime.now()
    await db.commit()
    
    status_text = "активирована" if story.is_active else "деактивирована"
    return {
        "message": f"История '{story.title}' {status_text}",
        "story_id": story_id,
        "is_active": story.is_active
    }

@router.get("/stories/stats", response_model=List[StoryStatsResponse])
async def get_stories_stats(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение статистики по историям."""
    query = select(Story).order_by(Story.view_count.desc())
    result = await db.execute(query)
    stories = result.scalars().all()
    
    stats = []
    for story in stories:
        ctr = (story.click_count / story.view_count * 100) if story.view_count > 0 else 0
        stats.append(StoryStatsResponse(
            id=story.id,
            title=story.title,
            is_active=story.is_active,
            view_count=story.view_count,
            click_count=story.click_count,
            ctr=round(ctr, 2),
            created_at=story.created_at,
            show_from=story.show_from,
            show_until=story.show_until
        ))
    
    return stats

@router.post("/stories/{story_id}/track-view")
async def track_story_view(
    story_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Отслеживание просмотра истории."""
    
    query = select(Story).where(Story.id == story_id)
    result = await db.execute(query)
    story = result.scalar_one_or_none()
    
    if not story:
        raise HTTPException(status_code=404, detail="История не найдена")
    
    story.view_count += 1
    await db.commit()
    
    return {"message": "Просмотр засчитан", "story_id": story_id, "view_count": story.view_count}

@router.post("/stories/{story_id}/track-click")
async def track_story_click(
    story_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Отслеживание клика по истории."""
    
    query = select(Story).where(Story.id == story_id)
    result = await db.execute(query)
    story = result.scalar_one_or_none()
    
    if not story:
        raise HTTPException(status_code=404, detail="История не найдена")
    
    story.click_count += 1
    await db.commit()
    
    return {"message": "Клик засчитан", "story_id": story_id, "click_count": story.click_count}

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin)
):
    """Загрузка изображения для историй."""
    
    # Проверяем тип файла
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400, 
            detail="Файл должен быть изображением"
        )
    
    # Проверяем размер файла (макс 10MB)
    if hasattr(file, 'size') and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400, 
            detail="Размер файла не должен превышать 10MB"
        )
    
    # Создаем папку uploads если она не существует
    uploads_dir = Path("static/uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    # Генерируем уникальное имя файла
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = uploads_dir / unique_filename
    
    try:
        # Сохраняем файл
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Возвращаем относительный путь к файлу
        relative_path = f"static/uploads/{unique_filename}"
        
        return {
            "message": "Изображение успешно загружено",
            "file_path": relative_path,
            "filename": unique_filename
        }
    
    except Exception as e:
        # В случае ошибки удаляем файл если он был создан
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500, 
            detail=f"Ошибка при загрузке файла: {str(e)}"
        )
    finally:
        file.file.close()


# Stories Management Endpoints

@router.get("/stories")
async def get_all_stories(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение всех историй для администратора."""
    try:
        query = select(Story).order_by(Story.sort_order, Story.created_at.desc())
        result = await db.execute(query)
        stories = result.scalars().all()
        
        stories_data = [
            {
                "id": story.id,
                "title": story.title,
                "description": story.description,
                "cover_image": story.cover_image,
                "content_image": story.content_image,
                "sort_order": story.sort_order,
                "is_active": story.is_active,
                "view_count": story.view_count or 0,
                "click_count": story.click_count or 0,
                "created_at": story.created_at.isoformat() if story.created_at else None
            }
            for story in stories
        ]
        
        return {
            "success": True,
            "stories": stories_data,
            "total": len(stories_data)
        }
        
    except Exception as e:
        print(f"Ошибка получения историй: {e}")
        return {
            "success": False,
            "stories": [],
            "total": 0,
            "error": str(e)
        }

@router.post("/stories")
async def create_story(
    story_data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Создание новой истории."""
    try:
        # Получаем максимальный sort_order
        max_order_query = select(func.max(Story.sort_order))
        max_order_result = await db.execute(max_order_query)
        max_order = max_order_result.scalar() or 0
        
        new_story = Story(
            title=story_data.get("title", ""),
            description=story_data.get("description"),
            cover_image=story_data.get("cover_image", ""),
            content_image=story_data.get("content_image", ""),
            sort_order=max_order + 1,
            is_active=story_data.get("is_active", True),
            view_count=0,
            click_count=0,
            created_at=datetime.now()
        )
        
        db.add(new_story)
        await db.commit()
        await db.refresh(new_story)
        
        return {
            "success": True,
            "message": "История успешно создана",
            "story": {
                "id": new_story.id,
                "title": new_story.title,
                "description": new_story.description,
                "cover_image": new_story.cover_image,
                "content_image": new_story.content_image,
                "is_active": new_story.is_active
            }
        }
        
    except Exception as e:
        await db.rollback()
        print(f"Ошибка создания истории: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка создания истории: {str(e)}"
        )

@router.put("/stories/{story_id}")
async def update_story(
    story_id: int,
    story_data: dict,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление истории."""
    try:
        query = select(Story).where(Story.id == story_id)
        result = await db.execute(query)
        story = result.scalar_one_or_none()
        
        if not story:
            raise HTTPException(
                status_code=404,
                detail="История не найдена"
            )
        
        # Обновляем поля
        story.title = story_data.get("title", story.title)
        story.description = story_data.get("description", story.description)
        story.cover_image = story_data.get("cover_image", story.cover_image)
        story.content_image = story_data.get("content_image", story.content_image)
        story.is_active = story_data.get("is_active", story.is_active)
        story.updated_at = datetime.now()
        
        await db.commit()
        
        return {
            "success": True,
            "message": "История успешно обновлена",
            "story": {
                "id": story.id,
                "title": story.title,
                "description": story.description,
                "cover_image": story.cover_image,
                "content_image": story.content_image,
                "is_active": story.is_active
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Ошибка обновления истории: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка обновления истории: {str(e)}"
        )

@router.delete("/stories/{story_id}")
async def delete_story(
    story_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Удаление истории."""
    try:
        query = select(Story).where(Story.id == story_id)
        result = await db.execute(query)
        story = result.scalar_one_or_none()
        
        if not story:
            raise HTTPException(
                status_code=404,
                detail="История не найдена"
            )
        
        await db.delete(story)
        await db.commit()
        
        return {
            "success": True,
            "message": "История успешно удалена"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Ошибка удаления истории: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка удаления истории: {str(e)}"
        )
