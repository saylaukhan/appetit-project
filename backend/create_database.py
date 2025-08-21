#!/usr/bin/env python3
"""
Скрипт для создания базы данных с правильной структурой.
"""

import sqlite3
import os
from datetime import datetime


def create_database():
    """Создает базу данных с правильной структурой."""
    db_path = "database.db"
    
    # Удаляем старую базу если существует
    if os.path.exists(db_path):
        backup_path = f"{db_path}.old.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        os.rename(db_path, backup_path)
        print(f"✓ Старая база перемещена в: {backup_path}")
    
    # Создаем новую базу
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Создаем таблицу users
    cursor.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            phone VARCHAR(15) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'client' NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            is_verified BOOLEAN DEFAULT 0,
            avatar VARCHAR(255),
            address VARCHAR(500),
            birth_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            last_login DATETIME,
            sms_code VARCHAR(6),
            sms_code_expires DATETIME,
            telegram_id VARCHAR(50) UNIQUE
        )
    """)
    
    # Создаем индексы
    cursor.execute("CREATE INDEX ix_users_phone ON users (phone)")
    cursor.execute("CREATE INDEX ix_users_email ON users (email)")
    cursor.execute("CREATE UNIQUE INDEX ix_users_telegram_id ON users (telegram_id) WHERE telegram_id IS NOT NULL")
    
    # Создаем другие нужные таблицы (если есть)
    # Проверяем есть ли другие модели
    try:
        # Таблица для меню (если нужна)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100),
                image_url VARCHAR(500),
                is_available BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME
            )
        """)
        
        # Таблица заказов (если нужна)  
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                total_amount DECIMAL(10,2) NOT NULL,
                delivery_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
    except Exception as e:
        print(f"Предупреждение при создании дополнительных таблиц: {e}")
    
    conn.commit()
    conn.close()
    
    print("✓ База данных создана успешно")
    return True


if __name__ == "__main__":
    print("Создание базы данных...")
    if create_database():
        print("Готово!")
    else:
        print("Ошибка при создании базы данных")