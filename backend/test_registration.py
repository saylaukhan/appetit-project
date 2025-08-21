#!/usr/bin/env python3
"""
Тест регистрации пользователей для проверки исправлений.
"""

import asyncio
import sqlite3
import sys
import os
from datetime import datetime

# Добавляем путь к приложению
sys.path.insert(0, '.')

async def test_registration():
    """Тест регистрации пользователя."""
    
    try:
        # Импортируем после добавления пути
        from app.models.user import User
        from app.services.auth import AuthService
        from app.schemas.auth import RegisterRequest
        from app.core.database import async_session_maker
        
        print("✓ Импорты успешны")
        
        # Проверяем базу данных
        db_path = "database.db"
        if not os.path.exists(db_path):
            print("✗ База данных не найдена")
            return False
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Проверяем структуру таблицы
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        required_columns = ['id', 'phone', 'name', 'hashed_password', 'telegram_id']
        missing_columns = [col for col in required_columns if col not in columns]
        
        if missing_columns:
            print(f"✗ Отсутствуют колонки: {', '.join(missing_columns)}")
            conn.close()
            return False
            
        print(f"✓ Структура таблицы корректна: {', '.join(columns)}")
        conn.close()
        
        # Тест создания пользователя
        async with async_session_maker() as session:
            auth_service = AuthService(session)
            
            # Создаем тестового пользователя
            test_user_data = RegisterRequest(
                phone="+79999999999",
                name="Тест Пользователь",
                password="testpassword123"
            )
            
            # Проверяем что пользователя нет
            existing_user = await auth_service.get_user_by_phone(test_user_data.phone)
            if existing_user:
                print("✓ Тестовый пользователь уже существует, пропускаем создание")
            else:
                # Создаем пользователя
                result = await auth_service.register(test_user_data)
                print("✓ Пользователь успешно зарегистрирован")
                print(f"  - ID: {result['user']['id']}")
                print(f"  - Телефон: {result['user']['phone']}")
                print(f"  - Имя: {result['user']['name']}")
                print(f"  - Роль: {result['user']['role']}")
            
            # Тест авторизации
            try:
                login_result = await auth_service.authenticate_user(
                    test_user_data.phone, 
                    test_user_data.password
                )
                if login_result:
                    print("✓ Авторизация прошла успешно")
                else:
                    print("✗ Ошибка авторизации")
                    return False
            except Exception as e:
                print(f"✗ Ошибка при авторизации: {e}")
                return False
                
        print("✓ Все тесты пройдены успешно!")
        return True
        
    except ImportError as e:
        print(f"✗ Ошибка импорта: {e}")
        return False
    except Exception as e:
        print(f"✗ Ошибка при тестировании: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("Тестирование регистрации пользователей...")
    print(f"Текущая директория: {os.getcwd()}")
    
    try:
        result = asyncio.run(test_registration())
        if result:
            print("\n🎉 Все исправления работают корректно!")
        else:
            print("\n❌ Обнаружены проблемы")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        sys.exit(1)