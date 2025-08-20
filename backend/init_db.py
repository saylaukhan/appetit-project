#!/usr/bin/env python3
"""
Скрипт для инициализации базы данных с тестовыми данными.
"""

import asyncio
import sys
import os

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import create_db_and_tables, get_db_session
from app.models.menu import Category, Dish, Addon, VariantGroup, Variant
from sqlalchemy.ext.asyncio import AsyncSession


async def init_database():
    """Инициализация базы данных с базовыми данными."""
    print("🔧 Инициализация базы данных...")
    
    # Создаем таблицы
    await create_db_and_tables()
    print("✅ Таблицы созданы")
    
    # Получаем сессию базы данных
    async for db in get_db_session():
        try:
            # Создаем категории
            categories = [
                Category(id=1, name="Комбо", description="Комплексные предложения", is_active=True, sort_order=1),
                Category(id=2, name="Блюда", description="Основные блюда", is_active=True, sort_order=2),
                Category(id=3, name="Закуски", description="Легкие закуски", is_active=True, sort_order=3),
                Category(id=4, name="Соусы", description="Дополнительные соусы", is_active=True, sort_order=4),
                Category(id=5, name="Напитки", description="Прохладительные напитки", is_active=True, sort_order=5),
            ]
            
            for category in categories:
                db.add(category)
            
            # Создаем добавки
            addons = [
                Addon(name="Соус Сырный", price=240, category="Соусы", is_active=True),
                Addon(name="Соус Острый", price=240, category="Соусы", is_active=True),
                Addon(name="Соус Чесночный", price=240, category="Соусы", is_active=True),
                Addon(name="Соус Барбекю", price=240, category="Соусы", is_active=True),
                Addon(name="Дополнительный сыр", price=300, category="Добавки", is_active=True),
                Addon(name="Дополнительн��е мясо", price=500, category="Добавки", is_active=True),
                Addon(name="Овощи", price=200, category="Добавки", is_active=True),
                Addon(name="Картофель фри", price=350, category="Добавки", is_active=True),
            ]
            
            for addon in addons:
                db.add(addon)
            
            # Создаем группы вариантов
            variant_groups = [
                VariantGroup(name="Размер", is_required=True, is_multiple=False, sort_order=1),
                VariantGroup(name="Тип теста", is_required=False, is_multiple=False, sort_order=2),
                VariantGroup(name="Острота", is_required=False, is_multiple=False, sort_order=3),
            ]
            
            for group in variant_groups:
                db.add(group)
            
            await db.flush()  # Получаем ID для связей
            
            # Создаем варианты
            variants = [
                # Размеры
                Variant(name="Маленькая", price=0, group_id=1, is_default=False, sort_order=1),
                Variant(name="Средняя", price=300, group_id=1, is_default=True, sort_order=2),
                Variant(name="Большая", price=600, group_id=1, is_default=False, sort_order=3),
                
                # Тип теста
                Variant(name="Тонкий лаваш", price=0, group_id=2, is_default=True, sort_order=1),
                Variant(name="Толстый лаваш", price=100, group_id=2, is_default=False, sort_order=2),
                Variant(name="Пита", price=150, group_id=2, is_default=False, sort_order=3),
                
                # Острота
                Variant(name="Не острая", price=0, group_id=3, is_default=True, sort_order=1),
                Variant(name="Слабо острая", price=0, group_id=3, is_default=False, sort_order=2),
                Variant(name="Острая", price=0, group_id=3, is_default=False, sort_order=3),
                Variant(name="Очень острая", price=0, group_id=3, is_default=False, sort_order=4),
            ]
            
            for variant in variants:
                db.add(variant)
            
            # Создаем блюда
            dishes = [
                Dish(
                    name="Комбо для ОДНОГО",
                    description="Фирменная шаурма, картошка фри и айран.",
                    price=2490,
                    category_id=1,
                    is_available=True,
                    is_popular=False,
                    sort_order=1
                ),
                Dish(
                    name="Фирменная Средняя шаурма",
                    description="Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, белый соус.",
                    price=1990,
                    category_id=2,
                    is_available=True,
                    is_popular=False,
                    sort_order=1
                ),
                Dish(
                    name="Классическая Средняя шаурма",
                    description="Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, красный соус, белый соус.",
                    price=1690,
                    category_id=2,
                    is_available=True,
                    is_popular=True,
                    sort_order=2
                ),
                Dish(
                    name="Шекер",
                    description="Сладкие палочки из теста, обжаренные во фритюре: хрустящие снаружи и нежные внутри",
                    price=400,
                    category_id=3,
                    is_available=True,
                    is_popular=False,
                    sort_order=1
                ),
                Dish(
                    name="Соус Сырный 30г",
                    description="Нежный сырный соус",
                    price=240,
                    category_id=4,
                    is_available=True,
                    is_popular=False,
                    sort_order=1
                ),
                Dish(
                    name="Пепси 0,5л",
                    description="Прохладительный напиток",
                    price=640,
                    category_id=5,
                    is_available=True,
                    is_popular=False,
                    sort_order=1
                ),
            ]
            
            for dish in dishes:
                db.add(dish)
            
            await db.flush()  # Получаем ID блюд
            
            # Связываем блюда с добавками
            # Получаем созданные объекты
            dish_combo = next(d for d in dishes if d.name == "Комбо для ОДНОГО")
            dish_firm = next(d for d in dishes if d.name == "Фирменная Средняя шаурма")
            dish_classic = next(d for d in dishes if d.name == "Классическая Средняя шаурма")
            
            # Связываем с добавками
            dish_combo.addons = addons[:4]  # Все соусы
            dish_firm.addons = addons  # Все добавки
            dish_classic.addons = addons[:7]  # Все кроме картофеля фри
            
            # Связываем с вариантами (только шаурму)
            dish_firm.variants = variants[:6]  # Размер и тип теста
            dish_classic.variants = variants  # Все варианты
            
            await db.commit()
            print("✅ Базовые данные созданы")
            
            # Выводим стати��тику
            print(f"📊 Создано:")
            print(f"  - Категорий: {len(categories)}")
            print(f"  - Добавок: {len(addons)}")
            print(f"  - Групп вари��нтов: {len(variant_groups)}")
            print(f"  - Вариантов: {len(variants)}")
            print(f"  - Блюд: {len(dishes)}")
            
        except Exception as e:
            print(f"❌ Ошибка при инициализации: {e}")
            await db.rollback()
            raise
        
        break  # Выходим из цикла после первой итерации


async def main():
    """Главная функция."""
    print("🚀 Инициализация базы данных APPETIT...")
    
    try:
        await init_database()
        print("\n✅ База данных успешно инициализирована!")
        print("🎉 Теперь можно запускать сервер: python main.py")
        
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)