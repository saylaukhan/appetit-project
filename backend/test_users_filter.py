import asyncio
import os
import sys

# Добавляем текущую директорию в sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db_session
from app.models.user import User, UserRole
from app.api.endpoints.users import get_users
from sqlalchemy import select

async def test_users_filter():
    print("🧪 Тестируем фильтрацию пользователей...")
    
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
            
            print("\n📋 1. Тест получения всех пользователей:")
            response = await get_users(
                page=1,
                per_page=20,
                search=None,
                role=None,
                is_active=None,
                current_user=admin_user,
                db=db
            )
            print(f"✅ Всего пользователей: {response.total}")
            
            print("\n🔍 2. Тест поиска по имени 'Клиент':")
            response = await get_users(
                page=1,
                per_page=20,
                search="Клиент",
                role=None,
                is_active=None,
                current_user=admin_user,
                db=db
            )
            print(f"✅ Найдено пользователей: {response.total}")
            for user in response.users:
                print(f"   - {user.name} ({user.role})")
            
            print("\n👨‍💼 3. Тест фильтра по роли 'admin':")
            response = await get_users(
                page=1,
                per_page=20,
                search=None,
                role="admin",
                is_active=None,
                current_user=admin_user,
                db=db
            )
            print(f"✅ Найдено администраторов: {response.total}")
            for user in response.users:
                print(f"   - {user.name} ({user.role})")
            
            print("\n👥 4. Тест фильтра по роли 'client':")
            response = await get_users(
                page=1,
                per_page=20,
                search=None,
                role="client",
                is_active=None,
                current_user=admin_user,
                db=db
            )
            print(f"✅ Найдено клиентов: {response.total}")
            for user in response.users:
                print(f"   - {user.name} ({user.role})")
            
            print("\n🍳 5. Тест фильтра по роли 'kitchen':")
            response = await get_users(
                page=1,
                per_page=20,
                search=None,
                role="kitchen",
                is_active=None,
                current_user=admin_user,
                db=db
            )
            print(f"✅ Найдено поваров: {response.total}")
            for user in response.users:
                print(f"   - {user.name} ({user.role})")
            
            print("\n🚚 6. Тест фильтра по роли 'courier':")
            response = await get_users(
                page=1,
                per_page=20,
                search=None,
                role="courier",
                is_active=None,
                current_user=admin_user,
                db=db
            )
            print(f"✅ Найдено курьеров: {response.total}")
            for user in response.users:
                print(f"   - {user.name} ({user.role})")
            
            print("\n🟢 7. Тест фильтра по статусу активности (активные):")
            response = await get_users(
                page=1,
                per_page=20,
                search=None,
                role=None,
                is_active=True,
                current_user=admin_user,
                db=db
            )
            print(f"✅ Найдено активных: {response.total}")
            
            print("\n🔍🍳 8. Тест комбинированного фильтра (поиск + роль):")
            response = await get_users(
                page=1,
                per_page=20,
                search="Повар",
                role="kitchen",
                is_active=None,
                current_user=admin_user,
                db=db
            )
            print(f"✅ Найдено поваров с именем 'Повар': {response.total}")
            for user in response.users:
                print(f"   - {user.name} ({user.role})")
            
            break
            
        except Exception as e:
            print(f"❌ Ошибка при тестировании API: {e}")
            import traceback
            traceback.print_exc()
            break

if __name__ == "__main__":
    asyncio.run(test_users_filter())