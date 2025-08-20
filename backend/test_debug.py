import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db_session
from sqlalchemy import select
from app.models.promo_code import PromoCode, DiscountType
from datetime import datetime

async def debug_promo_direct():
    try:
        print("Starting debug test...")
        async for db in get_db_session():
            # Получаем WELCOME10
            query = select(PromoCode).where(PromoCode.code == "WELCOME10")
            result = await db.execute(query)
            promo = result.scalar_one_or_none()

            if not promo:
                print("WELCOME10 not found in database!")
                return

            print(f"Found promo: {promo.code}")
            print(f"discount_type: {promo.discount_type} (type: {type(promo.discount_type)})")
            print(f"discount_value: {promo.discount_value}")
            print(f"min_order_amount: {promo.min_order_amount}")
            print(f"is_active: {promo.is_active}")

            # Тестируем валидацию
            order_total = 2500.0
            print(f"\nTesting validation with order_total: {order_total}")

            # Проверка минимальной суммы
            if promo.min_order_amount and order_total < promo.min_order_amount:
                print(f"FAIL: Order total {order_total} < min order amount {promo.min_order_amount}")
            else:
                print(f"PASS: Min order amount check")

            # Расчет скидки
            try:
                if promo.discount_type == DiscountType.PERCENTAGE:
                    discount_amount = order_total * (float(promo.discount_value) / 100)
                    print(f"Percentage discount: {discount_amount}")
                else:
                    discount_amount = min(float(promo.discount_value), order_total)
                    print(f"Fixed discount: {discount_amount}")

                # Сериализация
                discount_type_value = promo.discount_type.value if hasattr(promo.discount_type, 'value') else str(promo.discount_type)
                print(f"Serialized discount_type: {discount_type_value}")

                response_data = {
                    "code": promo.code,
                    "name": promo.name,
                    "discount_type": discount_type_value,
                    "discount_value": promo.discount_value,
                    "discount_amount": round(discount_amount, 2),
                    "min_order_amount": promo.min_order_amount,
                }
                print(f"Response data created successfully: {response_data}")

            except Exception as e:
                print(f"Error in discount calculation: {e}")
                import traceback
                traceback.print_exc()
            break

    except Exception as e:
        print(f"Database error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_promo_direct())
