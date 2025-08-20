#!/usr/bin/env python3
"""
Скрипт для создания/обновления таблиц базы данных
"""

import asyncio
import sys
import os

# Добавляем путь к приложению
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import create_db_and_tables
from app.models.user import User
from app.models.menu import Category, Dish, DishModifier
from app.models.order import Order, OrderItem
from app.models.banner import Banner
from app.models.promo_code import PromoCode

async def create_tables():
    """Создание всех таблиц в базе данных"""
    try:
        print("🗄️  Создание таблиц базы данных...")
        await create_db_and_tables()
        print("✅ Таблицы успешно созданы!")
        
        # Вывод информации о созданных моделях
        print("\n📋 Созданные модели:")
        print("  - User (пользователи)")
        print("  - Category (категории меню)")
        print("  - Dish (блюда)")
        print("  - DishModifier (модификаторы блюд)")
        print("  - Order (заказы)")
        print("  - OrderItem (позиции заказов)")
        print("  - Banner (баннеры)")
        print("  - PromoCode (промокоды)")
        
        print("\n📋 Основные поля User:")
        print("  - name (имя пользователя)")
        print("  - email (email адрес)")
        print("  - birth_date (дата рождения)")
        print("  - address (адрес)")
        
    except Exception as e:
        print(f"❌ Ошибка при создании таблиц: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(create_tables())
