#!/usr/bin/env python3
"""
Простой скрипт для добавления поля pickup_address в таблицу orders
"""

import sqlite3
import os

def add_pickup_address_field():
    """Добавление поля pickup_address в таблицу orders"""
    try:
        print("🗄️  Добавление поля pickup_address в таблицу orders...")
        
        # Путь к базе данных
        db_path = "database.db"
        
        if not os.path.exists(db_path):
            print(f"❌ База данных {db_path} не найдена!")
            return
        
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # Проверяем существующие колонки
            cursor.execute("PRAGMA table_info(orders)")
            existing_columns = [row[1] for row in cursor.fetchall()]
            print(f"📋 Существующие колонки в orders: {len(existing_columns)}")
            
            # Добавляем поле pickup_address, если его еще нет
            field_name = "pickup_address"
            field_type = "VARCHAR(200)"
            
            if field_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE orders ADD COLUMN {field_name} {field_type}")
                    print(f"  ✅ Добавлено поле: {field_name}")
                except sqlite3.Error as e:
                    print(f"  ❌ Ошибка при добавлении поля {field_name}: {e}")
            else:
                print(f"  ⏭️  Поле {field_name} уже существует")
            
            conn.commit()
            
            # Проверяем обновленную структуру таблицы
            cursor.execute("PRAGMA table_info(orders)")
            columns = cursor.fetchall()
            
            print(f"\n📋 Обновленная структура таблицы orders ({len(columns)} полей):")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
                
        print("\n✅ Миграция поля pickup_address успешно завершена!")
        
    except Exception as e:
        print(f"❌ Ошибка при миграции: {e}")
        raise

if __name__ == "__main__":
    add_pickup_address_field()