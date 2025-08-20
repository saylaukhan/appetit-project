#!/usr/bin/env python3
"""
Быстрая настройка базы данных и создание тестовых промокодов
"""
import asyncio
import sys
from datetime import datetime, timedelta

try:
    from app.core.database import get_db_session, engine
    from app.models import Base, PromoCode, DiscountType
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select, text
except ImportError as e:
    print(f"❌ Ошибка импорта: {e}")
    print("Убедитесь, что вы находитесь в директории backend")
    sys.exit(1)

async def setup_everything():
    """Полная настройка системы промокодов"""
    print("🚀 Настройка системы промокодов...")
    
    try:
        # 1. Создаем все таблицы
        print("📊 Создание таблиц...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Таблицы созданы")
        
        # 2. Проверяем соединение
        async for db in get_db_session():
            try:
                # Тест базы данных
                await db.execute(text("SELECT 1"))
                print("✅ База данных работает")
                
                # 3. Проверяем существующие промокоды
                result = await db.execute(select(PromoCode))
                existing_codes = result.scalars().all()
                
                if existing_codes:
                    print(f"ℹ️  Найдено {len(existing_codes)} промокодов:")
                    for code in existing_codes:
                        status = "✅" if code.is_active else "❌"
                        print(f"   {status} {code.code}: {code.name}")
                else:
                    print("📝 Создаем тестовые промокоды...")
                    
                    # 4. Создаем тестовые промокоды
                    test_codes = [
                        PromoCode(
                            code="WELCOME10",
                            name="Приветственная скидка",
                            description="10% скидка для новых клиентов",
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
                    
                    for code in test_codes:
                        db.add(code)
                    
                    await db.commit()
                    print(f"✅ Создано {len(test_codes)} промокодов")
                    
                # 5. Выводим итоговую информацию
                result = await db.execute(select(PromoCode).where(PromoCode.is_active == True))
                active_codes = result.scalars().all()
                
                print(f"\n🎉 Настройка завершена!")
                print(f"📦 Активных промокодов: {len(active_codes)}")
                print("\n🔖 Доступные промокоды для тестирования:")
                for code in active_codes:
                    discount_text = f"{code.discount_value}%" if code.discount_type == DiscountType.PERCENTAGE else f"{code.discount_value}₸"
                    print(f"   • {code.code}: {discount_text} (мин. {code.min_order_amount}₸)")
                
                print(f"\n🌐 API будет доступно: http://localhost:8000/api/v1/promo-codes/")
                print(f"📚 Документация: http://localhost:8000/docs")
                
            except Exception as e:
                print(f"❌ Ошибка при работе с базой данных: {e}")
                await db.rollback()
            finally:
                await db.close()
                
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        return False
        
    return True

if __name__ == "__main__":
    success = asyncio.run(setup_everything())
    if not success:
        sys.exit(1)
    print("\n🎯 Готово! Теперь можно тестировать промокоды.")
