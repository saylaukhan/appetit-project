"""
Миграция для добавления полей Telegram авторизации
"""
import asyncio
from sqlalchemy import text
from app.core.database import get_db_session

async def add_telegram_fields():
    """Добавляет поля для Telegram авторизации в таблицу users"""
    
    async for session in get_db_session():
        try:
            # Проверяем, есть ли уже поле telegram_id
            result = await session.execute(
                text("PRAGMA table_info(users)")
            )
            columns = [row[1] for row in result.fetchall()]
            
            if 'telegram_id' not in columns:
                print("Добавляем поля Telegram...")
                
                # Добавляем новые колонки
                await session.execute(text("""
                    ALTER TABLE users ADD COLUMN telegram_id VARCHAR(50) UNIQUE
                """))
                
                await session.execute(text("""
                    ALTER TABLE users ADD COLUMN telegram_username VARCHAR(100)
                """))
                
                await session.execute(text("""
                    ALTER TABLE users ADD COLUMN telegram_first_name VARCHAR(100)
                """))
                
                await session.execute(text("""
                    ALTER TABLE users ADD COLUMN telegram_last_name VARCHAR(100)
                """))
                
                await session.execute(text("""
                    ALTER TABLE users ADD COLUMN telegram_photo_url VARCHAR(500)
                """))
                
                await session.commit()
                print("✅ Поля Telegram успешно добавлены!")
                
                # Создаем индекс для telegram_id
                await session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)
                """))
                
                await session.commit()
                print("✅ Индекс для telegram_id создан!")
                
            else:
                print("ℹ️ Поля Telegram уже существуют")
                
        except Exception as e:
            print(f"❌ Ошибка при добавлении полей: {e}")
            await session.rollback()
        finally:
            await session.close()
            break

if __name__ == "__main__":
    asyncio.run(add_telegram_fields())

