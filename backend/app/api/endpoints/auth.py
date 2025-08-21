from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, SMSRequest, TelegramAuthRequest
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

@router.post("/request-sms")
async def request_sms(
    request: SMSRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Запрос SMS кода для подтверждения номера телефона."""
    auth_service = AuthService(db)
    return await auth_service.request_sms(request.phone)

@router.post("/verify-sms", response_model=TokenResponse)
async def verify_sms(
    phone: str,
    code: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Подтверждение SMS кода и завершение регистрации."""
    auth_service = AuthService(db)
    return await auth_service.verify_sms(phone, code)

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
    return {
        "telegram_bot_username": settings.TELEGRAM_BOT_USERNAME,
        "sms_enabled": settings.SMS_ENABLED,
        "telegram_enabled": bool(settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_BOT_USERNAME)
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
