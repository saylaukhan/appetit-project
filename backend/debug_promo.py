import asyncio
from app.core.database import get_db_session
from sqlalchemy import select
from app.models.promo_code import PromoCode, DiscountType

async def debug_promo():
    try:
        async for db in get_db_session():
            # Получаем WELCOME10
            query = select(PromoCode).where(PromoCode.code == "WELCOME10")
            result = await db.execute(query)
            promo = result.scalar_one_or_none()

            if not promo:
                print("Promo WELCOME10 not found")
                return

            print(f"Found promo: {promo.code}")
            print(f"discount_type: {promo.discount_type} (type: {type(promo.discount_type)})")
            print(f"discount_value: {promo.discount_value} (type: {type(promo.discount_value)})")
            print(f"min_order_amount: {promo.min_order_amount} (type: {type(promo.min_order_amount)})")

            # Пробуем сериализовать
            try:
                discount_type_value = promo.discount_type.value if hasattr(promo.discount_type, 'value') else str(promo.discount_type)
                print(f"Serialized discount_type: {discount_type_value}")

                test_data = {
                    "code": promo.code,
                    "name": promo.name,
                    "description": promo.description,
                    "discount_type": discount_type_value,
                    "discount_value": promo.discount_value,
                    "min_order_amount": promo.min_order_amount,
                }
                print(f"Test data: {test_data}")

                # Имитируем расчет скидки
                order_total = 2500.0
                if promo.discount_type == DiscountType.PERCENTAGE:
                    discount_amount = order_total * (promo.discount_value / 100)
                    if promo.max_discount_amount:
                        discount_amount = min(discount_amount, promo.max_discount_amount)
                else:
                    discount_amount = min(promo.discount_value, order_total)

                print(f"Discount calculation successful: {discount_amount}")

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
    asyncio.run(debug_promo())
