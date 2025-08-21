#!/usr/bin/env python3
"""
Скрипт для установки зависимостей Telegram авторизации
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, cwd=None):
    """Выполнить команду в терминале"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            capture_output=True, 
            text=True,
            cwd=cwd
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def main():
    """Главная функция"""
    print("🚀 Установка зависимостей для Telegram авторизации")
    print("=" * 60)
    
    project_root = Path(__file__).parent
    backend_path = project_root / "backend"
    frontend_path = project_root / "frontend"
    
    # Проверка структуры проекта
    if not backend_path.exists():
        print("❌ Папка backend не найдена!")
        sys.exit(1)
    
    if not frontend_path.exists():
        print("❌ Папка frontend не найдена!")
        sys.exit(1)
    
    print("📁 Структура проекта проверена ✓")
    
    # Backend зависимости
    print("\n📦 Установка backend зависимостей...")
    
    # Проверка requirements.txt
    requirements_file = backend_path / "requirements.txt"
    if not requirements_file.exists():
        print("❌ Файл requirements.txt не найден!")
        sys.exit(1)
    
    # Установка зависимостей
    success, output = run_command("pip install -r requirements.txt", cwd=backend_path)
    if success:
        print("✅ Backend зависимости установлены")
    else:
        print(f"❌ Ошибка установки backend зависимостей: {output}")
        sys.exit(1)
    
    # Frontend зависимости
    print("\n📦 Установка frontend зависимостей...")
    
    # Проверка package.json
    package_json = frontend_path / "package.json"
    if package_json.exists():
        success, output = run_command("npm install", cwd=frontend_path)
        if success:
            print("✅ Frontend зависимости установлены")
        else:
            print(f"❌ Ошибка установки frontend зависимостей: {output}")
            print("💡 Попробуйте запустить 'npm install' вручную в папке frontend")
    else:
        print("⚠️  package.json не найден, пропускаем frontend зависимости")
    
    # Создание .env файла
    print("\n⚙️  Настройка конфигурации...")
    
    env_file = backend_path / ".env"
    env_example = backend_path / ".env.example"
    
    if not env_file.exists() and env_example.exists():
        print("📝 Создание .env файла из .env.example...")
        with open(env_example, 'r', encoding='utf-8') as f:
            content = f.read()
        
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Файл .env создан")
        print("⚠️  Не забудьте настроить Telegram API ключи в .env файле!")
    elif env_file.exists():
        print("✅ Файл .env уже существует")
    else:
        print("⚠️  .env.example не найден, создайте .env файл вручную")
    
    # Проверка миграций
    print("\n🗄️  Проверка базы данных...")
    
    alembic_ini = backend_path / "alembic.ini"
    if alembic_ini.exists():
        print("📋 Применение миграций базы данных...")
        success, output = run_command("alembic upgrade head", cwd=backend_path)
        if success:
            print("✅ Миграции применены")
        else:
            print(f"⚠️  Ошибка применения миграций: {output}")
            print("💡 Возможно, нужно создать базу данных вручную")
    else:
        print("⚠️  alembic.ini не найден, пропускаем миграции")
    
    # Финальные инструкции
    print("\n🎉 Установка завершена!")
    print("\n📋 Следующие шаги:")
    print("1. Настройте Telegram API в backend/.env:")
    print("   - TELEGRAM_API_ID=your_api_id")
    print("   - TELEGRAM_API_HASH=your_api_hash")
    print("   - TELEGRAM_ENABLED=true")
    print("\n2. Запустите backend сервер:")
    print("   cd backend && python main.py")
    print("\n3. Запустите frontend:")
    print("   cd frontend && npm start")
    print("\n4. Протестируйте Telegram авторизацию:")
    print("   cd backend && python test_telegram_auth.py")
    print("\n📖 Подробная документация: TELEGRAM_AUTH_SETUP.md")

if __name__ == "__main__":
    main()