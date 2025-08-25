from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db_session
from app.utils.auth_dependencies import get_current_admin
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderResponse, OrderItemResponse, OrderStatusUpdateRequest, OrderAssignCourierRequest

router = APIRouter()

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
async def get_analytics(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Аналитика и отчеты."""
    
    # Статистика по дням за последние 7 дней
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    # Заказы за последние 7 дней
    recent_orders_query = select(
        func.date(Order.created_at).label('date'),
        func.count(Order.id).label('orders_count'),
        func.sum(Order.total_amount).label('revenue')
    ).where(
        Order.created_at >= seven_days_ago
    ).group_by(
        func.date(Order.created_at)
    ).order_by(func.date(Order.created_at))
    
    recent_orders_result = await db.execute(recent_orders_query)
    daily_stats = recent_orders_result.fetchall()
    
    # Статистика по статусам заказов
    status_stats_query = select(
        Order.status,
        func.count(Order.id).label('count')
    ).group_by(Order.status)
    
    status_stats_result = await db.execute(status_stats_query)
    status_stats = status_stats_result.fetchall()
    
    # Топ клиенты
    top_customers_query = select(
        Order.customer_name,
        Order.customer_phone,
        func.count(Order.id).label('orders_count'),
        func.sum(Order.total_amount).label('total_spent')
    ).where(
        Order.status == OrderStatus.DELIVERED
    ).group_by(
        Order.customer_name, Order.customer_phone
    ).order_by(
        func.sum(Order.total_amount).desc()
    ).limit(5)
    
    top_customers_result = await db.execute(top_customers_query)
    top_customers = top_customers_result.fetchall()
    
    return {
        "daily_statistics": [
            {
                "date": stat.date.isoformat() if stat.date else None,
                "orders_count": stat.orders_count or 0,
                "revenue": float(stat.revenue or 0)
            }
            for stat in daily_stats
        ],
        "status_statistics": [
            {
                "status": stat.status.value if stat.status else "Unknown",
                "count": stat.count or 0
            }
            for stat in status_stats
        ],
        "top_customers": [
            {
                "name": customer.customer_name,
                "phone": customer.customer_phone,
                "orders_count": customer.orders_count or 0,
                "total_spent": float(customer.total_spent or 0)
            }
            for customer in top_customers
        ]
    }

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
