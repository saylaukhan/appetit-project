import asyncio
import os
import sys
import json

# Добавляем текущую директорию в sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db_session
from app.models.user import User, UserRole
from app.api.endpoints.users import get_users
from app.schemas.user import UserListResponse
from sqlalchemy import select

async def test_users_api():
    print("🧪 Тестируем API users endpoint...")
    
    async for db in get_db_session():
        try:
            # Создаем mock admin пользователя
            admin_user = User(
                id=999,
                name="Test Admin",
                phone="+77777777777",
                role=UserRole.ADMIN,
                is_active=True,
                hashed_password="test"
            )
            
            print("📋 Тестируем получение пользователей...")
            
            # Вызываем функцию API напрямую
            response = await get_users(
                page=1,
                per_page=20,
                search=None,
                current_user=admin_user,
                db=db
            )
            
            print(f"✅ API ответ получен!")
            print(f"📊 Всего пользователей: {response.total}")
            print(f"📄 Страниц: {response.total_pages}")
            print(f"👥 Пользователей на этой странице: {len(response.users)}")
            
            print("\n👤 Детали пользователей:")
            print("-" * 80)
            for user in response.users:
                print(f"ID: {user.id} | {user.name} | {user.phone} | {user.role} | {'Активен' if user.is_active else 'Неактивен'}")
            
            break
            
        except Exception as e:
            print(f"❌ Ошибка при тестировании API: {e}")
            import traceback
            traceback.print_exc()
            break

if __name__ == "__main__":
    asyncio.run(test_users_api())