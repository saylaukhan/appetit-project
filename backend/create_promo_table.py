#!/usr/bin/env python3
"""
Скрипт для создания таблицы промокодов и тестовых данных.
Запускать из директории backend: python create_promo_table.py
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db_session, engine
from app.models import Base, PromoCode, PromoCodeUsage, DiscountType
from sqlalchemy.ext.asyncio import AsyncSession

async def create_tables():
    """Создание таблиц в базе данных"""
    print("Создание таблиц...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Таблицы созданы успешно")

async def create_test_promo_codes():
    """Создание тестовых промокодов"""
    print("Создание тестовых промокодов...")
    
    async for db in get_db_session():
        try:
            # Проверяем, есть ли уже промокоды
            from sqlalchemy import select
            existing_codes = await db.execute(select(PromoCode))
            if existing_codes.scalars().first():
                print("ℹ️  Промокоды уже существуют")
                return
            
            # Создаем тестовые промокоды
            test_promos = [
                PromoCode(
                    code="WELCOME10",
                    name="Скидка для новых клиентов",
                    description="10% скидка на первый заказ",
                    discount_type=DiscountType.PERCENTAGE,
                    discount_value=10,
                    min_order_amount=2000,
                    max_discount_amount=500,
                    usage_limit=500,
                    usage_limit_per_user=1,
                    valid_from=datetime.now(),
                    valid_until=datetime.now() + timedelta(days=30),
                    is_active=True
                ),
                PromoCode(
                    code="PIZZA20",
                    name="Скидка на пиццу",
                    description="20% скидка на любую пиццу",
                    discount_type=DiscountType.PERCENTAGE,
                    discount_value=20,
                    min_order_amount=2500,
                    max_discount_amount=1000,
                    usage_limit=100,
                    usage_limit_per_user=2,
                    valid_from=datetime.now(),
                    valid_until=datetime.now() + timedelta(days=7),
                    is_active=True
                ),
                PromoCode(
                    code="DELIVERY500",
                    name="Бесплатная доставка",
                    description="Фиксированная скидка 500₸ на доставку",
                    discount_type=DiscountType.FIXED,
                    discount_value=500,
                    min_order_amount=1500,
                    usage_limit=200,
                    usage_limit_per_user=3,
                    valid_from=datetime.now(),
                    valid_until=datetime.now() + timedelta(days=14),
                    is_active=True
                ),
                PromoCode(
                    code="TESTPROMO",
                    name="Тестовый промокод",
                    description="Тестовый промокод для разработки",
                    discount_type=DiscountType.PERCENTAGE,
                    discount_value=15,
                    min_order_amount=1000,
                    max_discount_amount=300,
                    usage_limit=10,
                    usage_limit_per_user=1,
                    valid_from=datetime.now(),
                    valid_until=datetime.now() + timedelta(days=365),
                    is_active=True
                )
            ]
            
            for promo in test_promos:
                db.add(promo)
            
            await db.commit()
            print(f"✅ Создано {len(test_promos)} тестовых промокодов:")
            for promo in test_promos:
                print(f"   - {promo.code}: {promo.name}")
            
        except Exception as e:
            print(f"❌ Ошибка при создании промокодов: {e}")
            await db.rollback()
        finally:
            await db.close()

async def main():
    """Основная функция"""
    print("🚀 Настройка системы промокодов...")
    
    try:
        await create_tables()
        await create_test_promo_codes()
        print("\n✅ Система промокодов настроена успешно!")
        print("\nДоступные промокоды для тестирования:")
        print("- WELCOME10: 10% скидка (мин. заказ 2000₸)")
        print("- PIZZA20: 20% скидка (мин. заказ 2500₸)")
        print("- DELIVERY500: 500₸ скидка (мин. заказ 1500₸)")
        print("- TESTPROMO: 15% скидка (мин. заказ 1000₸)")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
