from fastapi import APIRouter, Depends
from app.utils.auth_dependencies import get_current_admin, get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/")
async def get_users(current_user: User = Depends(get_current_admin)):
    """Получение списка пользователей (только для администратора)."""
    return {"message": "Get users endpoint - coming soon"}

@router.get("/{user_id}")
async def get_user(user_id: int, current_user: User = Depends(get_current_admin)):
    """Получение информации о пользователе (только для администратора)."""
    return {"message": f"Get user {user_id} endpoint - coming soon"}

@router.put("/me")
async def update_profile(current_user: User = Depends(get_current_user)):
    """Обновление профиля текущего пользователя."""
    return {"message": "Update profile endpoint - coming soon"}
