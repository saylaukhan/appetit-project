from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc, or_, func
import json
from app.core.database import get_db_session
from app.utils.auth_dependencies import get_current_admin, get_current_user
from app.models.user import User, UserRole
from app.schemas.user import UserProfileUpdate, UserProfileResponse, NewsletterSubscription, AddressUpdate, UserListResponse, UserRoleUpdate, UserListItem, UserStatusUpdate

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

@router.get("/", response_model=UserListResponse)
async def get_users(
    page: int = 1,
    per_page: int = 20,
    search: str = None,
    role: str = None,
    is_active: bool = None,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение списка пользователей с пагинацией, поиском и фильтрацией (только для администратора)."""
    try:
        # Базовый запрос
        query = select(User).order_by(desc(User.created_at))
        
        # Поиск по имени, телефону или email
        if search:
            search_term = f"%{search}%"
            # Создаем условия поиска
            search_conditions = [
                User.name.ilike(search_term),
                User.phone.ilike(search_term)
            ]
            
            # Добавляем поиск по email только если поле не пустое
            search_conditions.append(
                User.email.ilike(search_term) & User.email.isnot(None)
            )
            
            # Объединяем условия через OR
            query = query.where(or_(*search_conditions))
        
        # Фильтр по роли
        if role:
            try:
                role_enum = UserRole(role)
                query = query.where(User.role == role_enum)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Неверная роль: {role}")
        
        # Фильтр по статусу активности
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        
        # Подсчет общего количества
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Пагинация
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        # Получаем статистику по заказам для каждого пользователя
        from app.models.order import Order
        users_data = []
        
        for user in users:
            # Подсчитываем заказы пользователя
            orders_query = select(func.count(), func.max(Order.created_at)).where(Order.user_id == user.id)
            orders_result = await db.execute(orders_query)
            orders_count, last_order_date = orders_result.first()
            
            users_data.append(UserListItem(
                id=user.id,
                phone=user.phone,
                name=user.name,
                email=user.email,
                role=user.role.value,
                is_active=user.is_active,
                created_at=user.created_at,
                last_order_date=last_order_date,
                orders_count=orders_count or 0,
                address=user.address
            ))
        
        total_pages = (total + per_page - 1) // per_page
        
        return UserListResponse(
            users=users_data,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения пользователей: {str(e)}")


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user(
    user_id: int, 
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение информации о пользователе (только для администратора)."""
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    return user


@router.put("/{user_id}/role")
async def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Изменение роли пользователя (только для администратора)."""
    try:
        # Нельзя изменить роль самого себя
        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Нельзя изменить собственную роль")
        
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Обновляем роль
        user.role = UserRole(role_data.role.value)
        await db.commit()
        await db.refresh(user)
        
        return {
            "message": f"Роль пользователя {user.name} изменена на {role_data.role.value}",
            "user_id": user_id,
            "new_role": role_data.role.value
        }
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Некорректная роль: {str(e)}")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка изменения роли: {str(e)}")


@router.put("/{user_id}/status")
async def update_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Изменение статуса активности пользователя (только для администратора)."""
    try:
        # Нельзя деактивировать самого себя
        if user_id == current_user.id and not status_data.is_active:
            raise HTTPException(status_code=400, detail="Нельзя деактивировать собственный аккаунт")
        
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Обновляем статус
        user.is_active = status_data.is_active
        await db.commit()
        await db.refresh(user)
        
        action = "активирован" if status_data.is_active else "деактивирован"
        
        return {
            "message": f"Пользователь {user.name} {action}",
            "user_id": user_id,
            "is_active": status_data.is_active
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка изменения статуса: {str(e)}")

@router.get("/me/profile", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение профиля текущего пользователя."""
    return current_user

@router.put("/me/profile", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление профиля текущего пользователя."""
    try:
        # Обновляем только переданные поля
        for field, value in profile_data.dict(exclude_unset=True).items():
            setattr(current_user, field, value)
        
        await db.commit()
        await db.refresh(current_user)
        
        return current_user
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Ошибка обновления профиля: {str(e)}")

@router.put("/me/address", response_model=UserProfileResponse)
async def update_address(
    address_data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление адреса пользователя."""
    try:
        # Обновляем только переданные поля адреса
        for field, value in address_data.dict(exclude_unset=True).items():
            setattr(current_user, field, value)
        
        await db.commit()
        await db.refresh(current_user)
        
        return current_user
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Ошибка обновления адреса: {str(e)}")

@router.get("/me/address")
async def get_address(
    current_user: User = Depends(get_current_user)
):
    """Получение адреса пользователя."""
    return {
        "has_address": bool(current_user.address or current_user.address_street),
        "address": current_user.address,
        "address_city": current_user.address_city,
        "address_street": current_user.address_street,
        "address_entrance": current_user.address_entrance,
        "address_floor": current_user.address_floor,
        "address_apartment": current_user.address_apartment,
        "address_comment": current_user.address_comment,
        "address_latitude": current_user.address_latitude,
        "address_longitude": current_user.address_longitude
    }

@router.delete("/me/address")
async def delete_address(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Удаление адреса пользователя."""
    try:
        # Очищаем все поля адреса
        current_user.address = None
        current_user.address_city = None
        current_user.address_street = None
        current_user.address_entrance = None
        current_user.address_floor = None
        current_user.address_apartment = None
        current_user.address_comment = None
        current_user.address_latitude = None
        current_user.address_longitude = None
        
        await db.commit()
        await db.refresh(current_user)
        
        return {"message": "Адрес успешно удален"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Ошибка удаления адреса: {str(e)}")

@router.get("/me/orders")
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение заказов текущего пользователя."""
    from sqlalchemy import select
    from app.models.order import Order, OrderItem
    from app.schemas.order import OrderResponse, OrderItemResponse
    
    # Получаем заказы пользователя
    query = select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
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

@router.post("/me/newsletter")
async def subscribe_newsletter(
    subscription: NewsletterSubscription,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Подписка на рассылку."""
    try:
        current_user.email = subscription.email
        
        await db.commit()
        
        return {"message": "Email успешно обновлен", "email": subscription.email}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Ошибка обновления email: {str(e)}")
