from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TelegramAuthRequest
from app.core.config import settings

import hashlib
import hmac

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Проверка пароля."""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Хеширование пароля."""
        return pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: timedelta = None):
        """Создание JWT токена."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
            )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    async def get_user_by_phone(self, phone: str) -> User:
        """Получение пользователя по номеру телефона."""
        result = await self.db.execute(
            select(User).where(User.phone == phone)
        )
        return result.scalar_one_or_none()

    async def get_user_by_telegram_id(self, telegram_id: str) -> User:
        """Получение пользователя по Telegram ID."""
        result = await self.db.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        return result.scalar_one_or_none()

    async def create_user(self, user_data: RegisterRequest) -> User:
        """Создание нового пользователя."""
        hashed_password = self.get_password_hash(user_data.password)
        
        db_user = User(
            phone=user_data.phone,
            name=user_data.name,
            hashed_password=hashed_password
        )
        
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        
        return db_user

    async def authenticate_user(self, phone: str, password: str) -> User:
        """Аутентификация пользователя."""
        user = await self.get_user_by_phone(phone)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    async def login(self, request: LoginRequest):
        """Вход в систему."""
        user = await self.authenticate_user(request.phone, request.password)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Неверный номер телефона или пароль"
            )
        
        access_token = self.create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "phone": user.phone,
                "name": user.name,
                "role": user.role,
                "is_active": user.is_active
            }
        }

    async def register(self, request: RegisterRequest):
        """Регистрация нового пользователя."""
        # Проверка, что пользователь не существует
        existing_user = await self.get_user_by_phone(request.phone)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Пользователь с таким номером телефона уже существует"
            )
        
        # Создание пользователя
        user = await self.create_user(request)
        
        # Создание токена
        access_token = self.create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "phone": user.phone,
                "name": user.name,
                "role": user.role,
                "is_active": user.is_active
            }
        }



    async def get_current_user(self, token: str) -> User:
        """Получение текущего пользователя по токену."""
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
        except JWTError:
            return None
        
        result = await self.db.execute(
            select(User).where(User.id == int(user_id))
        )
        return result.scalar_one_or_none()

    def verify_telegram_auth(self, auth_data: dict) -> bool:
        """Проверка подлинности данных от Telegram Login Widget"""
        # Очищаем токен от кавычек
        bot_token = settings.TELEGRAM_BOT_TOKEN.strip().strip('"').strip("'") if settings.TELEGRAM_BOT_TOKEN else ""
        
        if not bot_token or bot_token in ["your_bot_token_here", "your_telegram_bot_token"]:
            raise HTTPException(
                status_code=500,
                detail="Telegram Bot Token не настроен"
            )

        # Убираем hash из данных для проверки
        received_hash = auth_data.pop('hash', '')
        
        # Создаем строку для проверки хеша
        data_check_string = '\n'.join([f'{k}={v}' for k, v in sorted(auth_data.items())])
        
        # Создаем секретный ключ из токена бота
        secret_key = hashlib.sha256(bot_token.encode()).digest()
        
        # Вычисляем хеш
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        return hmac.compare_digest(computed_hash, received_hash)

    async def telegram_auth(self, request: TelegramAuthRequest):
        """Авторизация через Telegram"""
        # Проверяем подлинность данных
        auth_data = request.dict()
        if not self.verify_telegram_auth(auth_data):
            raise HTTPException(
                status_code=400,
                detail="Неверные данные авторизации Telegram"
            )

        # Проверяем, что данные не слишком старые (максимум 1 час)
        current_time = datetime.utcnow().timestamp()
        if current_time - request.auth_date > 3600:
            raise HTTPException(
                status_code=400,
                detail="Данные авторизации устарели"
            )

        telegram_id = str(request.id)
        
        # Ищем существующего пользователя
        user = await self.get_user_by_telegram_id(telegram_id)
        
        if not user:
            # Создаем нового пользователя
            user_name = request.first_name
            if request.last_name:
                user_name += f" {request.last_name}"
            
            user = User(
                name=user_name,
                telegram_id=telegram_id,
                telegram_username=request.username,
                telegram_first_name=request.first_name,
                telegram_last_name=request.last_name,
                telegram_photo_url=request.photo_url,
                is_verified=True,  # Telegram пользователи считаются верифицированными
                hashed_password=""  # Пароль не нужен для Telegram пользователей
            )
            
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
        else:
            # Обновляем информацию пользователя
            user.telegram_username = request.username
            user.telegram_first_name = request.first_name
            user.telegram_last_name = request.last_name
            user.telegram_photo_url = request.photo_url
            user.last_login = datetime.utcnow()
            await self.db.commit()

        # Создаем токен
        access_token = self.create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "role": user.role,
                "is_active": user.is_active,
                "telegram_id": user.telegram_id,
                "telegram_username": user.telegram_username
            }
        }
