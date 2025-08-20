import asyncio
from app.core.database import get_db_session
from sqlalchemy import select
from app.models.promo_code import PromoCode
from app.api.endpoints.promo_codes import PromoCodeResponse

async def test_serialization():
    try:
        async for db in get_db_session():
            # Получаем промокоды
            query = select(PromoCode).limit(1)
            result = await db.execute(query)
            promo = result.scalar_one_or_none()

            if not promo:
                print("No promo codes found")
                return

            print(f"Testing promo: {promo.code}")

            # Пробуем сериализовать
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
                print("Dict serialization successful")
                print(f"Dict: {promo_dict}")

                # Пробуем создать Pydantic модель
                response_model = PromoCodeResponse(**promo_dict)
                print("Pydantic model creation successful")
                print(f"Model: {response_model}")

            except Exception as e:
                print(f"Serialization error: {e}")
                import traceback
                traceback.print_exc()
            break

    except Exception as e:
        print(f"Database error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_serialization())
