from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db_session
from app.models.promo_code import PromoCode, DiscountType
from app.models.promo_code_usage import PromoCodeUsage
from app.models.user import User
from app.utils.auth_dependencies import get_current_user_optional

router = APIRouter()

# Схемы для создания и обновления промокодов
class PromoCodeCreateRequest(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    discount_type: DiscountType
    discount_value: float
    min_order_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    usage_limit: Optional[int] = None
    usage_limit_per_user: int = 1
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True

class PromoCodeResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    discount_type: DiscountType
    discount_value: float
    min_order_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    usage_limit: Optional[int] = None
    usage_limit_per_user: Optional[int] = None
    total_used: int
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Включаем автоматическое преобразование из SQLAlchemy моделей

@router.get("/{code}")
async def validate_promo_code(
    code: str,
    order_total: float = 0,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db_session)
):
    """Валидация промокода и возврат информации о скидке."""
    try:
        print(f"Validating promo code: {code}, order_total: {order_total}")

        # Поиск промокода
        query = select(PromoCode).where(
            PromoCode.code == code.upper(),
            PromoCode.is_active == True
        )
        result = await db.execute(query)
        promo_code = result.scalar_one_or_none()

        print(f"Found promo code: {promo_code}")

        if not promo_code:
            raise HTTPException(status_code=404, detail="Промокод не найден")

        print(f"Promo code details - discount_type: {promo_code.discount_type}, discount_value: {promo_code.discount_value}")

        # Проверка временных ограничений
        now = datetime.now()

        if promo_code.valid_from and now < promo_code.valid_from:
            raise HTTPException(status_code=400, detail="Промокод еще не активен")

        if promo_code.valid_until and now > promo_code.valid_until:
            raise HTTPException(status_code=400, detail="Промокод истек")

        # Проверка лимита использований
        if promo_code.usage_limit and promo_code.total_used >= promo_code.usage_limit:
            raise HTTPException(status_code=400, detail="Промокод больше не действует")

        # Проверка минимальной суммы заказа
        if promo_code.min_order_amount and order_total < promo_code.min_order_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Минимальная сумма заказа для промокода: {promo_code.min_order_amount} ₸"
            )

        print(f"Min order amount check passed: {promo_code.min_order_amount} <= {order_total}")

        # Проверка лимита на пользователя
        if current_user and promo_code.usage_limit_per_user:
            print(f"Checking user usage limit for user: {current_user.id if current_user else None}")
            user_usage_query = select(func.count(PromoCodeUsage.id)).where(
                PromoCodeUsage.promo_code_id == promo_code.id,
                PromoCodeUsage.user_id == current_user.id,
                PromoCodeUsage.is_active == True
            )
            user_usage_result = await db.execute(user_usage_query)
            user_usage_count = user_usage_result.scalar()

            if user_usage_count >= promo_code.usage_limit_per_user:
                raise HTTPException(
                    status_code=400,
                    detail=f"Вы уже использовали этот промокод максимальное количество раз ({promo_code.usage_limit_per_user})"
                )

        print(f"User usage check passed")

        # Расчет скидки
        if promo_code.discount_type == DiscountType.PERCENTAGE:
            discount_amount = order_total * (float(promo_code.discount_value) / 100)
            # Применяем максимальную сумму скидки если установлена
            if promo_code.max_discount_amount:
                discount_amount = min(discount_amount, float(promo_code.max_discount_amount))
        else:  # FIXED
            discount_amount = min(float(promo_code.discount_value), order_total)

        print(f"Discount calculation: {discount_amount}")

        # Исправляем сериализацию discount_type
        discount_type_value = promo_code.discount_type.value if hasattr(promo_code.discount_type, 'value') else str(promo_code.discount_type)

        response_data = {
            "code": promo_code.code,
            "name": promo_code.name,
            "description": promo_code.description,
            "discount_type": discount_type_value,
            "discount_value": promo_code.discount_value,
            "discount_amount": round(discount_amount, 2),
            "discount": round((discount_amount / order_total) * 100, 1) if order_total > 0 else 0,
            "min_order_amount": promo_code.min_order_amount,
            "max_discount_amount": promo_code.max_discount_amount,
            "usage_limit": promo_code.usage_limit,
            "total_used": promo_code.total_used,
            "valid_from": promo_code.valid_from,
            "valid_until": promo_code.valid_until
        }

        print(f"Returning response data: {response_data}")
        return response_data
    except Exception as e:
        print(f"Error in validate_promo_code: {e}")
        import traceback
        traceback.print_exc()
        raise


class ApplyPromoRequest(BaseModel):
    order_total: float
    
    class Config:
        json_encoders = {
            float: lambda x: round(x, 2)
        }

@router.post("/apply/{code}")
async def apply_promo_code(
    code: str,
    request: ApplyPromoRequest,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db_session)
):
    """Применение промокода - увеличивает счетчик использований."""
    try:
        # Сначала валидируем промокод
        promo_data = await validate_promo_code(code, request.order_total, current_user, db)

        # Получаем промокод для записи использования
        query = select(PromoCode).where(
            PromoCode.code == code.upper(),
            PromoCode.is_active == True
        )
        result = await db.execute(query)
        promo_code = result.scalar_one_or_none()

        if promo_code:
            # Создаем запись об использовании
            usage = PromoCodeUsage(
                promo_code_id=promo_code.id,
                user_id=current_user.id if current_user else None,
                user_phone=getattr(current_user, 'phone', None) if current_user else None,
                user_email=getattr(current_user, 'email', None) if current_user else None,
            )
            db.add(usage)

            # Обновляем общий счетчик использований
            promo_code.total_used += 1
            await db.commit()

            # Обновляем данные в ответе
            promo_data["total_used"] = promo_code.total_used

        print(f"Apply promo code successful for {code}")
        return promo_data
    except Exception as e:
        print(f"Error in apply_promo_code: {e}")
        import traceback
        traceback.print_exc()
        raise


@router.get("/", response_model=list[PromoCodeResponse])
async def get_promo_codes(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db_session)
):
    """Получение списка промокодов."""
    try:
        query = select(PromoCode).offset(skip).limit(limit).order_by(PromoCode.created_at.desc())
        result = await db.execute(query)
        promo_codes = result.scalars().all()

        print(f"Found {len(promo_codes)} promo codes")
        for promo in promo_codes:
            print(f"Promo: {promo.code}, type: {type(promo)}")

        # Попробуем сериализовать каждый промокод отдельно
        for i, promo in enumerate(promo_codes):
            try:
                promo_dict = {
                    "id": promo.id,
                    "code": promo.code,
                    "name": promo.name,
                    "description": promo.description,
                    "discount_type": promo.discount_type,
                    "discount_value": float(promo.discount_value),
                    "min_order_amount": float(promo.min_order_amount) if promo.min_order_amount else None,
                    "max_discount_amount": float(promo.max_discount_amount) if promo.max_discount_amount else None,
                    "usage_limit": promo.usage_limit,
                    "usage_limit_per_user": promo.usage_limit_per_user,
                    "total_used": promo.total_used,
                    "valid_from": promo.valid_from,
                    "valid_until": promo.valid_until,
                    "is_active": promo.is_active,
                    "created_at": promo.created_at
                }
                print(f"Promo {i} serialized successfully")
            except Exception as e:
                print(f"Error serializing promo {i}: {e}")
                raise

        return promo_codes
    except Exception as e:
        print(f"Error in get_promo_codes: {e}")
        import traceback
        traceback.print_exc()
        raise


@router.post("/", response_model=PromoCodeResponse)
async def create_promo_code(
    request: PromoCodeCreateRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Создание нового промокода."""
    # Проверяем уникальность кода
    existing_query = select(PromoCode).where(PromoCode.code == request.code.upper())
    existing_result = await db.execute(existing_query)
    existing_promo = existing_result.scalar_one_or_none()
    
    if existing_promo:
        raise HTTPException(status_code=400, detail="Промокод с таким кодом уже существует")
    
    # Создаем новый промокод
    promo_code = PromoCode(
        code=request.code.upper(),
        name=request.name,
        description=request.description,
        discount_type=request.discount_type,
        discount_value=request.discount_value,
        min_order_amount=request.min_order_amount,
        max_discount_amount=request.max_discount_amount,
        usage_limit=request.usage_limit,
        usage_limit_per_user=request.usage_limit_per_user,
        valid_from=request.valid_from,
        valid_until=request.valid_until,
        is_active=request.is_active
    )
    
    db.add(promo_code)
    await db.commit()
    await db.refresh(promo_code)
    
    return promo_code


@router.put("/{promo_id}", response_model=PromoCodeResponse)
async def update_promo_code(
    promo_id: int,
    request: PromoCodeCreateRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление промокода."""
    query = select(PromoCode).where(PromoCode.id == promo_id)
    result = await db.execute(query)
    promo_code = result.scalar_one_or_none()
    
    if not promo_code:
        raise HTTPException(status_code=404, detail="Промокод не найден")
    
    # Обновляем поля
    promo_code.code = request.code.upper()
    promo_code.name = request.name
    promo_code.description = request.description
    promo_code.discount_type = request.discount_type
    promo_code.discount_value = request.discount_value
    promo_code.min_order_amount = request.min_order_amount
    promo_code.max_discount_amount = request.max_discount_amount
    promo_code.usage_limit = request.usage_limit
    promo_code.usage_limit_per_user = request.usage_limit_per_user
    promo_code.valid_from = request.valid_from
    promo_code.valid_until = request.valid_until
    promo_code.is_active = request.is_active
    
    await db.commit()
    await db.refresh(promo_code)
    
    return promo_code


@router.delete("/{promo_id}")
async def delete_promo_code(
    promo_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Удаление промокода."""
    query = select(PromoCode).where(PromoCode.id == promo_id)
    result = await db.execute(query)
    promo_code = result.scalar_one_or_none()
    
    if not promo_code:
        raise HTTPException(status_code=404, detail="Промокод не найден")
    
    await db.delete(promo_code)
    await db.commit()
    
    return {"message": "Промокод удален"}


@router.patch("/{promo_id}/toggle")
async def toggle_promo_code(
    promo_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Включение/выключение промокода."""
    query = select(PromoCode).where(PromoCode.id == promo_id)
    result = await db.execute(query)
    promo_code = result.scalar_one_or_none()
    
    if not promo_code:
        raise HTTPException(status_code=404, detail="Промокод не найден")
    
    promo_code.is_active = not promo_code.is_active
    await db.commit()
    await db.refresh(promo_code)
    
    return promo_code
