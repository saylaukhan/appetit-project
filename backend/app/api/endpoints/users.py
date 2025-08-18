from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_users():
    """Получение списка пользователей."""
    return {"message": "Get users endpoint - coming soon"}

@router.get("/{user_id}")
async def get_user(user_id: int):
    """Получение информации о пользователе."""
    return {"message": f"Get user {user_id} endpoint - coming soon"}

@router.put("/me")
async def update_profile():
    """Обновление профиля текущего пользователя."""
    return {"message": "Update profile endpoint - coming soon"}
