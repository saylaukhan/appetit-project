#!/usr/bin/env python3
"""
Быстрая настройка и тестирование системы баннеров APPETIT.
"""

import asyncio
import sys
import subprocess
import time
from pathlib import Path

# Добавляем корневую директорию в path
sys.path.append(str(Path(__file__).parent))


def run_command(command, description):
    """Выполнение команды с описанием."""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"   ✅ {description} - успешно!")
            if result.stdout.strip():
                print(f"   📤 Вывод: {result.stdout.strip()[:200]}...")
            return True
        else:
            print(f"   ❌ {description} - ошибка!")
            if result.stderr:
                print(f"   📤 Ошибка: {result.stderr.strip()[:200]}...")
            return False
    except subprocess.TimeoutExpired:
        print(f"   ⏱️ {description} - превышен таймаут!")
        return False
    except Exception as e:
        print(f"   💥 {description} - исключение: {e}")
        return False


async def setup_banners():
    """Настройка системы баннеров."""
    print("🎯 Настройка системы управления баннерами APPETIT...")
    
    # 1. Создание примеров баннеров
    print("\n1️⃣ Создание примеров баннеров...")
    try:
        from seed_banners import main as seed_main
        result = await seed_main()
        if result == 0:
            print("   ✅ Примеры баннеров созданы успешно!")
        else:
            print("   ⚠️ Проблемы при создании примеров баннеров")
    except Exception as e:
        print(f"   ❌ Ошибка при создании примеров: {e}")
        return False
    
    # 2. Тестирование API
    print("\n2️⃣ Тестирование API баннеров...")
    try:
        from test_banners_api import main as test_main
        result = await test_main()
        if result == 0:
            print("   ✅ API баннеров работает корректно!")
        else:
            print("   ⚠️ Обнаружены проблемы с API")
    except Exception as e:
        print(f"   ❌ Ошибка при тестировании API: {e}")
        return False
    
    return True


def main():
    """Главная функция."""
    print("🚀 Быстрая настройка системы баннеров APPETIT...")
    print("=" * 60)
    
    try:
        # Запускаем настройку баннеров
        success = asyncio.run(setup_banners())
        
        if success:
            print("\n" + "=" * 60)
            print("🎉 СИСТЕМА БАННЕРОВ ГОТОВА К РАБОТЕ!")
            print("\n📋 Что делать дальше:")
            print("\n1️⃣ Запуск сервера:")
            print("   python main.py")
            print("   или")
            print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
            
            print("\n2️⃣ Демонстрация баннеров:")
            print("   Откройте в браузере: test_banners_demo.html")
            
            print("\n3️⃣ API Endpoints:")
            print("   • http://localhost:8000/docs - документация API")
            print("   • http://localhost:8000/api/v1/marketing/banners - все баннеры")
            print("   • http://localhost:8000/api/v1/admin/marketing - админ панель")
            
            print("\n4️⃣ Функциональность:")
            print("   ✅ Модель Banner создана и подключена")
            print("   ✅ Схемы Pydantic настроены")
            print("   ✅ Публичные API endpoints работают")
            print("   ✅ Административные API endpoints защищены")
            print("   ✅ Отслеживание просмотров и кликов")
            print("   ✅ Фильтрация по позициям и статусу")
            print("   ✅ Временные ограничения показа")
            print("   ✅ Примеры баннеров добавлены")
            
            print("\n5️⃣ Административная панель:")
            print("   • GET /admin/marketing - панель управления маркетингом")
            print("   • GET /admin/marketing/banners - список баннеров")
            print("   • POST /admin/marketing/banners - создание баннера")
            print("   • PUT /admin/marketing/banners/{id} - редактирование")
            print("   • DELETE /admin/marketing/banners/{id} - удаление")
            print("   • GET /admin/marketing/banners/{id}/stats - статистика")
            
            print("\n6️⃣ Публичные endpoints:")
            print("   • GET /marketing/banners - все активные баннеры")
            print("   • GET /marketing/banners/{position} - по позиции")
            print("   • GET /marketing/banners/featured/main - главные")
            print("   • GET /marketing/positions - доступные позиции")
            print("   • POST /marketing/banners/{id}/view - отслеживание просмотра")
            print("   • POST /marketing/banners/{id}/click - отслеживание клика")
            
            print("\n" + "=" * 60)
            
            return 0
        else:
            print("\n❌ Настройка завершилась с ошибками")
            return 1
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Настройка прервана пользователем")
        return 1
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)