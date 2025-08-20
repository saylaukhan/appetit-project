from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.utils.auth_dependencies import get_current_admin, get_current_user
from app.models.user import User
from app.schemas.user import UserProfileUpdate, UserProfileResponse, NewsletterSubscription

router = APIRouter()

@router.get("/")
async def get_users(current_user: User = Depends(get_current_admin)):
    """Получение списка пользователей (только для администратора)."""
    return {"message": "Get users endpoint - coming soon"}

@router.get("/{user_id}")
async def get_user(user_id: int, current_user: User = Depends(get_current_admin)):
    """Получение информации о пользователе (только для администратора)."""
    return {"message": f"Get user {user_id} endpoint - coming soon"}

@router.get("/me/profile", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение профиля текущего пользователя."""
    return current_user

@router.put("/me/profile", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Обновление профиля текущего пользователя."""
    try:
        # Обновляем только переданные поля
        for field, value in profile_data.dict(exclude_unset=True).items():
            setattr(current_user, field, value)
        
        await db.commit()
        await db.refresh(current_user)
        
        return current_user
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Ошибка обновления профиля: {str(e)}")

@router.post("/me/newsletter")
async def subscribe_newsletter(
    subscription: NewsletterSubscription,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Подписка на рассылку."""
    try:
        current_user.email = subscription.email
        
        await db.commit()
        
        return {"message": "Email успешно обновлен", "email": subscription.email}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Ошибка обновления email: {str(e)}")
