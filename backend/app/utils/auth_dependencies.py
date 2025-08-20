from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db_session
from app.services.auth import AuthService
from app.models.user import User, UserRole

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db_session)
) -> User:
    """Получить текущего пользователя из токена."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return user

def require_roles(allowed_roles: List[UserRole]):
    """Decorator для проверки ролей пользователя."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}. Your role: {current_user.role.value}"
            )
        return current_user
    return role_checker

# Специфичные dependency для каждой роли
def get_current_admin(current_user: User = Depends(require_roles([UserRole.ADMIN]))) -> User:
    """Получить текущего администратора."""
    return current_user

def get_current_kitchen(current_user: User = Depends(require_roles([UserRole.KITCHEN]))) -> User:
    """Получить текущего сотрудника кухни."""
    return current_user

def get_current_courier(current_user: User = Depends(require_roles([UserRole.COURIER]))) -> User:
    """Получить текущего курьера."""
    return current_user

def get_current_client(current_user: User = Depends(require_roles([UserRole.CLIENT]))) -> User:
    """Получить текущего клиента."""
    return current_user

def get_admin_or_kitchen(current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.KITCHEN]))) -> User:
    """Получить администратора или сотрудника кухни."""
    return current_user

def get_admin_or_courier(current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.COURIER]))) -> User:
    """Получить администратора или курьера."""
    return current_user

async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db_session)
) -> User | None:
    """Получить текущего пользователя из токена (опционально, без ошибки если токен отсутствует)."""
    if not credentials:
        return None
    
    auth_service = AuthService(db)
    try:
        user = await auth_service.get_current_user(credentials.credentials)
        if user and user.is_active:
            return user
        return None
    except Exception:
        return None