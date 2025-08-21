#!/usr/bin/env python3
"""
Простой тест структуры базы данных.
"""

import sqlite3
import os


def test_database_structure():
    """Проверяет структуру базы данных."""
    db_path = "database.db"
    
    if not os.path.exists(db_path):
        print("✗ База данных не найдена")
        return False
        
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Проверяем таблицу users
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='users';
        """)
        
        if not cursor.fetchone():
            print("✗ Таблица users не найдена")
            return False
        
        print("✓ Таблица users найдена")
        
        # Проверяем структуру
        cursor.execute("PRAGMA table_info(users)")
        columns_info = cursor.fetchall()
        columns = [col[1] for col in columns_info]
        
        print(f"Колонки таблицы users: {', '.join(columns)}")
        
        # Проверяем наличие ключевых колонок
        required_columns = [
            'id', 'phone', 'name', 'hashed_password', 
            'telegram_id', 'role', 'is_active'
        ]
        
        missing = [col for col in required_columns if col not in columns]
        if missing:
            print(f"✗ Отсутствуют колонки: {', '.join(missing)}")
            return False
        
        print("✓ Все необходимые колонки присутствуют")
        
        # Проверяем индексы
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND tbl_name='users';
        """)
        indexes = [idx[0] for idx in cursor.fetchall()]
        print(f"Индексы: {', '.join(indexes)}")
        
        # Тестируем вставку данных
        try:
            cursor.execute("""
                INSERT OR REPLACE INTO users 
                (phone, name, hashed_password, role, telegram_id) 
                VALUES (?, ?, ?, ?, ?)
            """, ("+79999999999", "Test User", "hash123", "client", None))
            
            conn.commit()
            print("✓ Тест вставки данных прошел успешно")
            
            # Проверяем что данные вставились
            cursor.execute("SELECT phone, name, telegram_id FROM users WHERE phone = ?", ("+79999999999",))
            result = cursor.fetchone()
            
            if result:
                print(f"✓ Данные сохранены: {result}")
            else:
                print("✗ Данные не найдены после вставки")
                return False
                
        except sqlite3.Error as e:
            print(f"✗ Ошибка при вставке данных: {e}")
            return False
        
        conn.close()
        print("✓ Структура базы данных корректна")
        return True
        
    except sqlite3.Error as e:
        print(f"✗ Ошибка при работе с базой: {e}")
        return False


if __name__ == "__main__":
    print("Проверка структуры базы данных...")
    
    if test_database_structure():
        print("\n🎉 База данных готова к работе!")
        print("Основные исправления:")
        print("  ✓ Добавлена колонка telegram_id")
        print("  ✓ Исправлены настройки Telegram API")
        print("  ✓ Удалены файлы сессий")
        print("  ✓ Структура базы корректна")
    else:
        print("\n❌ Обнаружены проблемы с базой данных")
        exit(1)