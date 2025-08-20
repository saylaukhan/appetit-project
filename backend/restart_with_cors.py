#!/usr/bin/env python3
"""
Перезапуск сервера с правильными CORS настройками
"""
import uvicorn
import sys
import os

# Убеждаемся что мы в правильной директории
if not os.path.exists('main.py'):
    print("❌ Запустите скрипт из директории backend")
    sys.exit(1)

if __name__ == "__main__":
    print("🚀 Запускаем сервер с CORS настройками...")
    print("🌐 Frontend: http://localhost:3000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🔧 Admin: http://localhost:3000/admin")
    print("\n⚠️  Для остановки нажмите Ctrl+C")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True,
        reload_includes=["*.py"],
        reload_excludes=["*.pyc", "__pycache__"]
    )
