import asyncio
import os
import sys

# Добавляем текущую директорию в sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db_session
from app.models.user import User
from sqlalchemy import select, func

async def check_users():
    print("🔍 Проверяем пользователей в базе данных...")
    
    async for db in get_db_session():
        try:
            # Подсчитываем общее количество пользователей
            count_result = await db.execute(select(func.count(User.id)))
            total_count = count_result.scalar()
            print(f"📊 Всего пользователей в БД: {total_count}")
            
            if total_count > 0:
                # Получаем первых 10 пользователей
                result = await db.execute(select(User).limit(10))
                users = result.scalars().all()
                
                print("\n👥 Первые пользователи:")
                print("-" * 80)
                print(f"{'ID':<5} {'Имя':<20} {'Телефон':<15} {'Роль':<12} {'Активен':<8} {'Email':<25}")
                print("-" * 80)
                
                for user in users:
                    email = user.email or "—"
                    if len(email) > 24:
                        email = email[:21] + "..."
                    
                    print(f"{user.id:<5} {user.name[:19]:<20} {user.phone:<15} {user.role.value:<12} {'Да' if user.is_active else 'Нет':<8} {email:<25}")
            
            else:
                print("❌ В базе данных нет пользователей")
                print("💡 Запустите seed_database.py для создания тестовых пользователей")
            
            break
            
        except Exception as e:
            print(f"❌ Ошибка при запросе к БД: {e}")
            import traceback
            traceback.print_exc()
            break

if __name__ == "__main__":
    asyncio.run(check_users())