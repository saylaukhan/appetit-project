"""
Скрипт для заполнения базы данных тестовыми данными.
Запускать из корневой папки backend: python seed_database.py
"""

import asyncio
from app.core.database import async_session_maker, create_db_and_tables
from app.utils.database_seeder import run_seeder


async def main():
    """Основная функция для инициализации базы данных."""
    print("🚀 Инициализация базы данных APPETIT...")
    
    # Создание таблиц
    await create_db_and_tables()
    print("📊 Таблицы базы данных созданы")
    
    # Заполнение тестовыми данными
    async with async_session_maker() as session:
        try:
            await run_seeder(session)
            print("✅ База данных успешно инициализирована!")
            print("\n📋 Тестовые аккаунты:")
            print("👨‍💼 Админ: +77771234567 / admin123")
            print("👨‍🍳 Кухня: +77772345678 / kitchen123") 
            print("🚗 Курьер: +77773456789 / courier123")
            print("👤 Клиент: +77774567890 / client123")
            print("\n🌐 Запустите сервер: uvicorn main:app --reload")
            print("📖 Документация API: http://localhost:8000/docs")
            
        except Exception as e:
            print(f"❌ Ошибка при заполнении базы данных: {e}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(main())
