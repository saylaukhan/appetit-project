#!/usr/bin/env python3
"""
Простой скрипт для добавления полей адреса в таблицу users
"""

import sqlite3
import os

def migrate_address_fields():
    """Добавление полей адреса в таблицу users"""
    try:
        print("🗄️  Добавление полей адреса в таблицу users...")
        
        # Путь к базе данных
        db_path = "database.db"
        
        if not os.path.exists(db_path):
            print(f"❌ База данных {db_path} не найдена!")
            return
        
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # Проверяем существующие колонки
            cursor.execute("PRAGMA table_info(users)")
            existing_columns = [row[1] for row in cursor.fetchall()]
            print(f"📋 Существующие колонки: {len(existing_columns)}")
            
            # Список новых полей для добавления
            new_fields = [
                ("address_city", "VARCHAR(100)"),
                ("address_street", "VARCHAR(200)"),
                ("address_entrance", "VARCHAR(10)"),
                ("address_floor", "VARCHAR(10)"),
                ("address_apartment", "VARCHAR(20)"),
                ("address_comment", "TEXT"),
                ("address_latitude", "REAL"),
                ("address_longitude", "REAL")
            ]
            
            # Добавляем поля, которых еще нет
            for field_name, field_type in new_fields:
                if field_name not in existing_columns:
                    try:
                        cursor.execute(f"ALTER TABLE users ADD COLUMN {field_name} {field_type}")
                        print(f"  ✅ Добавлено поле: {field_name}")
                    except sqlite3.Error as e:
                        print(f"  ❌ Ошибка при добавлении поля {field_name}: {e}")
                else:
                    print(f"  ⏭️  Поле {field_name} уже существует")
            
            conn.commit()
            
            # Проверяем обновленную структуру таблицы
            cursor.execute("PRAGMA table_info(users)")
            columns = cursor.fetchall()
            
            print(f"\n📋 Обновленная структура таблицы users ({len(columns)} полей):")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
                
        print("\n✅ Миграция полей адреса успешно завершена!")
        
    except Exception as e:
        print(f"❌ Ошибка при миграции: {e}")
        raise

if __name__ == "__main__":
    migrate_address_fields()
