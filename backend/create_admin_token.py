import asyncio
import os
import sys
from datetime import datetime, timedelta

# Добавляем текущую директорию в sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db_session
from app.models.user import User, UserRole
from app.utils.auth import create_access_token, get_password_hash
from sqlalchemy import select

async def create_admin_and_token():
    print("🔐 Создание администраторского токена...")
    
    async for db in get_db_session():
        try:
            # Ищем администратора
            query = select(User).where(User.role == UserRole.ADMIN)
            result = await db.execute(query)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                print("❌ Администратор не найден в БД")
                
                # Создаем администратора
                admin_user = User(
                    name="Test Admin",
                    phone="+77777777777",
                    hashed_password=get_password_hash("admin123"),
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True
                )
                
                db.add(admin_user)
                await db.commit()
                await db.refresh(admin_user)
                print("✅ Администратор создан")
            
            print(f"👤 Администратор найден: {admin_user.name} (ID: {admin_user.id})")
            
            # Создаем токен
            token_data = {
                "sub": str(admin_user.id),
                "name": admin_user.name,
                "phone": admin_user.phone,
                "role": admin_user.role.value
            }
            
            # Токен на 24 часа
            expires_delta = timedelta(hours=24)
            access_token = create_access_token(
                data=token_data,
                expires_delta=expires_delta
            )
            
            print("\n🎫 ТОКЕН АДМИНИСТРАТОРА:")
            print("-" * 60)
            print(access_token)
            print("-" * 60)
            
            print(f"\n📝 Сохраните этот токен в localStorage браузера:")
            print(f"Ключ: auth_token")
            print(f"Значение: {access_token}")
            
            print(f"\n👨‍💼 Данные пользователя для localStorage:")
            print(f"Ключ: auth_user") 
            user_data = {
                "id": admin_user.id,
                "name": admin_user.name,
                "phone": admin_user.phone,
                "role": admin_user.role.value,
                "is_active": admin_user.is_active
            }
            print(f"Значение: {user_data}")
            
            print(f"\n🌐 Проверьте API эндпоинт:")
            print(f"curl -H 'Authorization: Bearer {access_token}' http://localhost:8000/api/v1/users")
            
            break
            
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            import traceback
            traceback.print_exc()
            break

if __name__ == "__main__":
    asyncio.run(create_admin_and_token())