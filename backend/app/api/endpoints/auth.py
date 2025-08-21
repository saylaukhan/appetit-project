from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, TelegramAuthRequest
from app.services.auth import AuthService
from app.models.user import User

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Регистрация нового пользователя по номеру телефона."""
    auth_service = AuthService(db)
    return await auth_service.register(request)

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Вход в систему по номеру телефона и паролю."""
    auth_service = AuthService(db)
    return await auth_service.login(request)



@router.post("/telegram", response_model=TokenResponse)
async def telegram_auth(
    request: TelegramAuthRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Авторизация через Telegram Login Widget."""
    auth_service = AuthService(db)
    return await auth_service.telegram_auth(request)

@router.get("/config")
async def get_auth_config():
    """Получить конфигурацию авторизации (публичная информация)."""
    from app.core.config import settings
    
    # Очистка значений от кавычек, если они есть
    telegram_token = settings.TELEGRAM_BOT_TOKEN.strip().strip('"').strip("'") if settings.TELEGRAM_BOT_TOKEN else ""
    telegram_username = settings.TELEGRAM_BOT_USERNAME.strip().strip('"').strip("'") if settings.TELEGRAM_BOT_USERNAME else ""
    
    # Проверяем, что значения не пустые и не являются placeholder'ами
    token_valid = telegram_token and telegram_token not in ["", "your_bot_token_here", "your_telegram_bot_token"]
    username_valid = telegram_username and telegram_username not in ["", "your_bot_username_here", "your_telegram_bot_username"]
    
    telegram_enabled = token_valid and username_valid
    
    return {
        "telegram_bot_username": telegram_username if username_valid else "",
        "telegram_enabled": telegram_enabled
    }

@router.get("/me")
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db_session)
):
    """Получение информации о текущем пользователе."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    return user