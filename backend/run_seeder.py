"""Запуск сидера базы данных."""
import asyncio
from app.core.database import async_session_maker
from app.utils.database_seeder import DatabaseSeeder

async def main():
    """Главная функция запуска сидера."""
    async with async_session_maker() as db:
        seeder = DatabaseSeeder(db)
        await seeder.seed_all()

if __name__ == "__main__":
    asyncio.run(main())