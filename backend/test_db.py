#!/usr/bin/env python3
"""
Скрипт для тестирования базы данных и добавления тестовых данных.
"""

import asyncio
import sys
import os

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import create_db_and_tables, get_db_session
from app.models.menu import Category, Dish, Addon
from app.services.menu import MenuService
from app.schemas.menu import DishCreateRequest, AddonCreateRequest
from sqlalchemy.ext.asyncio import AsyncSession


async def create_test_data():
    """Создание тестовых данных."""
    print("🔧 Создание тестовых данных...")
    
    # Создаем таблицы
    await create_db_and_tables()
    print("✅ Таблицы созданы")
    
    # Получаем сессию базы данных
    async for db in get_db_session():
        menu_service = MenuService(db)
        
        try:
            # Создаем тестовые категории
            categories_data = [
                {"id": 1, "name": "Комбо", "is_active": True, "sort_order": 1},
                {"id": 2, "name": "Блюда", "is_active": True, "sort_order": 2},
                {"id": 3, "name": "Закуски", "is_active": True, "sort_order": 3},
                {"id": 4, "name": "Соусы", "is_active": True, "sort_order": 4},
                {"id": 5, "name": "Напитки", "is_active": True, "sort_order": 5},
            ]
            
            for cat_data in categories_data:
                category = Category(**cat_data)
                db.add(category)
            
            await db.commit()
            print("✅ Категории созданы")
            
            # Создаем тестовые добавки
            addons_data = [
                {"name": "Соус Сырный", "price": 240, "category": "Соусы"},
                {"name": "Соус Острый", "price": 240, "category": "Соусы"},
                {"name": "Соус Чесночный", "price": 240, "category": "Соусы"},
                {"name": "Дополнительный сыр", "price": 300, "category": "Добавки"},
                {"name": "Дополнительное мясо", "price": 500, "category": "Добавки"},
                {"name": "Овощи", "price": 200, "category": "Добавки"},
            ]
            
            created_addons = []
            for addon_data in addons_data:
                addon_request = AddonCreateRequest(**addon_data)
                addon = await menu_service.create_addon(addon_request)
                created_addons.append(addon)
                print(f"✅ Создана добавка: {addon.name} (ID: {addon.id})")
            
            # Создаем тестовые блюда
            dishes_data = [
                {
                    "name": "Комбо для ОДНОГО",
                    "description": "Фирменная шаурма, картошка фри и айран.",
                    "price": 2490,
                    "category_id": 1,
                    "is_available": True,
                    "is_popular": False,
                    "addon_ids": [1, 2, 3]  # Соусы
                },
                {
                    "name": "Фирменная Средняя шаурма",
                    "description": "Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, белый соус.",
                    "price": 1990,
                    "category_id": 2,
                    "is_available": True,
                    "is_popular": False,
                    "addon_ids": [1, 2, 3, 4, 5, 6]  # Все добавки
                },
                {
                    "name": "Классическая Средняя шаурма",
                    "description": "Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, красный соус, белый соус.",
                    "price": 1690,
                    "category_id": 2,
                    "is_available": True,
                    "is_popular": True,
                    "addon_ids": [1, 2, 3, 4, 5]  # Почти все добавки
                }
            ]
            
            for dish_data in dishes_data:
                dish_request = DishCreateRequest(**dish_data)
                dish = await menu_service.create_dish(dish_request)
                print(f"✅ Создано блюдо: {dish.name} (ID: {dish.id}) с {len(dish_data.get('addon_ids', []))} добавками")
            
            print("🎉 Тестовые данные успешно созданы!")
            
        except Exception as e:
            print(f"❌ Оши��ка при создании тестовых данных: {e}")
            await db.rollback()
            raise
        
        break  # Выходим из цикла после первой итерации


async def test_addon_operations():
    """Тестирование операций с добавками."""
    print("\n🧪 Тестирование операций с добавками...")
    
    async for db in get_db_session():
        menu_service = MenuService(db)
        
        try:
            # Получаем все добавки
            addons = await menu_service.get_addons(show_all=True)
            print(f"✅ Найдено {len(addons)} добавок")
            
            for addon in addons:
                print(f"  - {addon.name}: {addon.price}₸ ({addon.category})")
            
            # Получаем все блюда
            dishes = await menu_service.get_dishes(show_all=True)
            print(f"✅ Найдено {len(dishes)} блюд")
            
            # Тестируем обновление блюда с добавками
            if dishes:
                dish = dishes[0]
                print(f"\n🔄 Тестируем обновление блюда: {dish.name}")
                
                # Получае�� детальную информацию о блюде
                dish_detail = await menu_service.get_dish_by_id(dish.id)
                if dish_detail:
                    current_addons = dish_detail.get('addons', [])
                    print(f"  Текущие добавки: {len(current_addons)}")
                    
                    # Обновляем блюдо с новыми добавками
                    from app.schemas.menu import DishUpdateRequest
                    update_data = DishUpdateRequest(
                        addon_ids=[1, 2]  # Только первые две добавки
                    )
                    
                    updated_dish = await menu_service.update_dish(dish.id, update_data)
                    if updated_dish:
                        print("✅ Блюдо успешно обновлено")
                        
                        # Проверяем обновленные добавки
                        updated_detail = await menu_service.get_dish_by_id(dish.id)
                        if updated_detail:
                            new_addons = updated_detail.get('addons', [])
                            print(f"  Новые добавки: {len(new_addons)}")
                            for addon in new_addons:
                                print(f"    - {addon.name}: {addon.price}₸")
                    else:
                        print("❌ Не удалось обновить блюдо")
                else:
                    print("❌ Не удалось получить детали блюда")
            
        except Exception as e:
            print(f"❌ Ошибка при тестировании: {e}")
            import traceback
            traceback.print_exc()
        
        break


async def main():
    """Главная функция."""
    print("🚀 Запуск тестирования базы данных...")
    
    try:
        await create_test_data()
        await test_addon_operations()
        print("\n✅ Все тесты завершены успешно!")
        
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)