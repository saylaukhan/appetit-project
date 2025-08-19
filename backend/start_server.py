#!/usr/bin/env python3
"""
Скрипт для запуска FastAPI сервера
"""

import uvicorn
import sys
import os
import asyncio

# Добавляем путь к приложению
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from create_db_tables import create_tables

async def initialize_database():
    """Инициализация базы данных"""
    print("🔄 Инициализация базы данных...")
    await create_tables()
    print("✅ База данных готова!")

def start_server():
    """Запуск сервера"""
    try:
        # Инициализируем базу данных
        asyncio.run(initialize_database())
        
        print("\n🚀 Запуск APPETIT Backend сервера...")
        print("📊 API документация: http://localhost:8000/docs")
        print("🔗 Альтернативная документация: http://localhost:8000/redoc")
        print("👤 Профиль API: http://localhost:8000/users/me/profile")
        print("\n⏹️  Для остановки нажмите Ctrl+C\n")
        
        # Запускаем сервер
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен")
    except Exception as e:
        print(f"❌ Ошибка запуска сервера: {e}")

if __name__ == "__main__":
    start_server()
