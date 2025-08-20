"""
Упрощенный скрипт настройки промокодов
"""
import asyncio
from datetime import datetime, timedelta
from app.core.database import get_db_session
from app.models.promo_code import PromoCode, DiscountType
from sqlalchemy import select

async def setup_promo_codes():
    """Настройка промокодов"""
    print("🚀 Настройка промокодов...")
    
    async for db in get_db_session():
        try:
            # Проверяем существующие промокоды
            result = await db.execute(select(PromoCode))
            existing = result.scalars().all()
            
            if existing:
                print(f"ℹ️  Найдено {len(existing)} промокодов:")
                for promo in existing:
                    status = "✅ активен" if promo.is_active else "❌ неактивен"
                    print(f"   - {promo.code}: {promo.name} ({status})")
                return
            
            # Создаем тестовые промокоды
            promos = [
                PromoCode(
                    code="WELCOME10",
                    name="Скидка для новых клиентов", 
                    description="10% скидка на первый заказ",
                    discount_type=DiscountType.PERCENTAGE,
                    discount_value=10,
                    min_order_amount=2000,
                    max_discount_amount=500,
                    usage_limit=100,
                    usage_limit_per_user=1,
                    valid_until=datetime.now() + timedelta(days=30),
                    is_active=True
                ),
                PromoCode(
                    code="TESTPROMO",
                    name="Тестовый промокод",
                    description="15% скидка для тестирования", 
                    discount_type=DiscountType.PERCENTAGE,
                    discount_value=15,
                    min_order_amount=1000,
                    max_discount_amount=300,
                    usage_limit=50,
                    usage_limit_per_user=3,
                    valid_until=datetime.now() + timedelta(days=365),
                    is_active=True
                ),
                PromoCode(
                    code="DELIVERY500",
                    name="Скидка на доставку",
                    description="500₸ скидка",
                    discount_type=DiscountType.FIXED,
                    discount_value=500,
                    min_order_amount=1500, 
                    usage_limit=200,
                    usage_limit_per_user=2,
                    valid_until=datetime.now() + timedelta(days=14),
                    is_active=True
                )
            ]
            
            for promo in promos:
                db.add(promo)
            
            await db.commit()
            print(f"✅ Создано {len(promos)} промокодов")
            
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            await db.rollback()
        finally:
            await db.close()
            
if __name__ == "__main__":
    asyncio.run(setup_promo_codes())
