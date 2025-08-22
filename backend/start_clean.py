#!/usr/bin/env python3
"""
Чистый запуск сервера с минимальными зависимостями
"""
import uvicorn
import sys
import os

# Добавляем текущую директорию в путь
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    """Запуск сервера"""
    print("🚀 Запуск APPETIT Backend...")
    print("📍 Порт: 8000")
    print("🌐 Документация: http://localhost:8000/docs")
    print("⏹️  Остановка: Ctrl+C")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n⏹️ Сервер остановлен пользователем")
    except Exception as e:
        print(f"\n❌ Ошибка запуска сервера: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()