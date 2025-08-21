#!/usr/bin/env python3
"""
Скрипт для исправления структуры базы данных.
Добавляет недостающие колонки и настраивает схему.
"""

import sqlite3
import os
import sys


def check_and_fix_database():
    """Проверяет и исправляет структуру базы данных."""
    db_path = "database.db"
    
    # Создаем резервную копию
    if os.path.exists(db_path):
        backup_path = f"{db_path}.backup"
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✓ Создана резервная копия: {backup_path}")
    
    # Подключаемся к базе
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Проверяем существование таблицы users
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='users';
        """)
        
        if not cursor.fetchone():
            print("✗ Таблица users не найдена")
            conn.close()
            return False
        
        # Получаем информацию о колонках
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Текущие колонки в таблице users: {', '.join(columns)}")
        
        # Проверяем наличие telegram_id
        if 'telegram_id' not in columns:
            print("➤ Добавляем колонку telegram_id...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN telegram_id TEXT;
            """)
            
            # Создаем индекс
            try:
                cursor.execute("""
                    CREATE UNIQUE INDEX ix_users_telegram_id 
                    ON users (telegram_id) 
                    WHERE telegram_id IS NOT NULL;
                """)
            except sqlite3.Error as e:
                if "already exists" not in str(e):
                    print(f"Предупреждение при создании индекса: {e}")
            
            conn.commit()
            print("✓ Колонка telegram_id добавлена")
        else:
            print("✓ Колонка telegram_id уже существует")
        
        # Проверяем финальную структуру
        cursor.execute("PRAGMA table_info(users)")
        final_columns = [col[1] for col in cursor.fetchall()]
        print(f"Финальные колонки: {', '.join(final_columns)}")
        
        conn.close()
        print("✓ База данных исправлена успешно")
        return True
        
    except sqlite3.Error as e:
        print(f"✗ Ошибка при работе с базой данных: {e}")
        return False


if __name__ == "__main__":
    print("Исправление структуры базы данных...")
    if check_and_fix_database():
        print("Готово!")
        sys.exit(0)
    else:
        print("Ошибка при исправлении базы данных")
        sys.exit(1)