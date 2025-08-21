#!/usr/bin/env python3
"""
Скрипт для тестирования Telegram авторизации
"""

import asyncio
import sys
import os
from pathlib import Path

# Добавляем путь к проекту
sys.path.append(str(Path(__file__).parent))

from app.services.telegram import telegram_service
from app.core.config import settings

async def test_telegram_auth():
    """Тестирование Telegram авторизации"""
    
    print("🔧 Тестирование Telegram авторизации")
    print("=" * 50)
    
    # Проверка конфигурации
    print(f"📋 Конфигурация:")
    print(f"   TELEGRAM_ENABLED: {settings.TELEGRAM_ENABLED}")
    print(f"   TELEGRAM_API_ID: {'✓ Установлен' if settings.TELEGRAM_API_ID != 'your_telegram_api_id' else '✗ Не установлен'}")
    print(f"   TELEGRAM_API_HASH: {'✓ Установлен' if settings.TELEGRAM_API_HASH != 'your_telegram_api_hash' else '✗ Не установлен'}")
    print()
    
    if not settings.TELEGRAM_ENABLED:
        print("⚠️  Telegram отключен. Тестируем в режиме разработки...")
    
    # Запрос номера телефона
    phone = input("📱 Введите номер телефона (например, +77001234567): ").strip()
    
    if not phone.startswith('+7') or len(phone) != 12:
        print("❌ Неверный формат номера телефона. Используйте +77001234567")
        return
    
    try:
        # Шаг 1: Запрос кода
        print(f"\n📤 Отправляем код на {phone}...")
        result = await telegram_service.request_telegram_code(phone)
        
        if not result['success']:
            print(f"❌ Ошибка: {result['error']}")
            return
        
        print("✅ Код отправлен!")
        
        if result.get('dev_mode'):
            print(f"🔧 Режим разработки. Код: {result.get('dev_code')}")
        
        phone_code_hash = result.get('phone_code_hash')
        
        # Шаг 2: Ввод кода
        code = input("\n🔢 Введите код из Telegram: ").strip()
        
        if not code.isdigit() or len(code) < 4:
            print("❌ Неверный формат кода")
            return
        
        # Ша�� 3: Проверка кода
        print(f"\n🔍 Проверяем код...")
        verify_result = await telegram_service.verify_telegram_code(
            phone, code, phone_code_hash
        )
        
        if verify_result['success']:
            print("✅ Код подтвержден успешно!")
            if verify_result.get('user_info'):
                user_info = verify_result['user_info']
                print(f"👤 Информация о пользователе:")
                print(f"   Телефон: {user_info.get('phone')}")
                print(f"   Telegram ID: {user_info.get('telegram_id', 'N/A')}")
        else:
            print(f"❌ Ошибка проверки: {verify_result['error']}")
            
            if verify_result.get('requires_2fa'):
                print("🔐 Требуется двухфакторная аутентификация")
    
    except KeyboardInterrupt:
        print("\n\n⏹️  Тестирование прервано пользователем")
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {str(e)}")
    finally:
        # Очистка
        print("\n🧹 Очистка ресурсов...")
        await telegram_service.disconnect_all_clients()
        print("✅ Готово!")

async def test_cleanup():
    """Тестирование очистки истекших кодов"""
    print("\n🧹 Тестирование очистки истекших кодов...")
    await telegram_service.cleanup_expired_codes()
    print("✅ Очистка завершена")

def main():
    """Главная функция"""
    print("🚀 Запуск тестирования Telegram авторизации")
    print("   Убедитесь, что у вас настроены переменные окружения")
    print("   или включен режим разработки (TELEGRAM_ENABLED=false)")
    print()
    
    try:
        # Запуск тестирования
        asyncio.run(test_telegram_auth())
        
        # Тестирование очистки
        asyncio.run(test_cleanup())
        
    except KeyboardInterrupt:
        print("\n👋 До свидания!")
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()