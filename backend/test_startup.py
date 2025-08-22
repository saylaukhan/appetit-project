#!/usr/bin/env python3
"""
Тестовый скрипт для диагностики проблем запуска бекенда
"""
import sys
import traceback
import asyncio

def test_imports():
    """Тестирование импортов"""
    print("🔍 Тестирование импортов...")
    
    try:
        print("  ✓ Импорт FastAPI...")
        import fastapi
        
        print("  ✓ Импорт Uvicorn...")
        import uvicorn
        
        print("  ✓ Импорт SQLAlchemy...")
        import sqlalchemy
        
        print("  ✓ Импорт настроек...")
        from app.core.config import settings
        print(f"    - DEBUG: {settings.DEBUG}")
        print(f"    - DATABASE_URL: {settings.DATABASE_URL}")
        
        print("  ✓ Импорт базы данных...")
        from app.core.database import engine, Base
        
        print("  ✓ Импорт моделей...")
        from app.models import User, Category, Dish, Order
        
        print("  ✓ Импорт API роу��еров...")
        from app.api.routes import api_router
        
        print("✅ Все импорты успешны!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка импорта: {e}")
        traceback.print_exc()
        return False

async def test_database():
    """Тестирование подключения к базе данных"""
    print("\n🔍 Тестирование базы данных...")
    
    try:
        from app.core.database import engine, Base
        
        print("  ✓ Тестирование подключения...")
        async with engine.begin() as conn:
            print("  ✓ Подключение к БД успешно!")
            
            print("  ✓ Создание таблиц...")
            await conn.run_sync(Base.metadata.create_all)
            print("  ✓ Таблицы созданы!")
        
        print("✅ База данных работает!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка БД: {e}")
        traceback.print_exc()
        return False

def test_app_creation():
    """Тестирование создания приложения"""
    print("\n🔍 Тестирование создания прилож��ния...")
    
    try:
        from main import create_application
        
        print("  ✓ Создание приложения...")
        app = create_application()
        
        print(f"  ✓ Приложение создано: {app}")
        print(f"  ✓ Название: {app.title}")
        print(f"  ✓ Версия: {app.version}")
        
        print("✅ Приложение создано успешно!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка создания приложения: {e}")
        traceback.print_exc()
        return False

async def main():
    """Главная функция тестирования"""
    print("🚀 Диагностика запуска APPETIT Backend\n")
    
    # Тест 1: Импорты
    if not test_imports():
        print("\n❌ Тестирование остановлено из-за ошибок импорта")
        return False
    
    # Тест 2: База данных
    if not await test_database():
        print("\n❌ Тестирование остановлено из-за ошибок БД")
        return False
    
    # Тест 3: Создание приложения
    if not test_app_creation():
        print("\n❌ Тестирование остановлено из-за ошибок приложения")
        return False
    
    print("\n✅ Все тесты пройдены! Бекенд готов к запуску.")
    return True

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        if result:
            print("\n🎉 Диагностика завершена успешно!")
            sys.exit(0)
        else:
            print("\n💥 Обнаружены проблемы!")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⏹️ Тестирование прервано пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        traceback.print_exc()
        sys.exit(1)