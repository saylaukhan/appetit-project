from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, RegistrationInitRequest, VerifyCodeRequest
from app.core.config import settings
import secrets
import string

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

    def generate_verification_code(self) -> str:
        """Генерация 4-значного кода верификации."""
        return ''.join(secrets.choice(string.digits) for _ in range(4))

    def generate_sms_code(self) -> str:
        """Генерация SMS кода."""
        return ''.join(secrets.choice(string.digits) for _ in range(6))

    async def init_registration(self, request: RegistrationInitRequest):
        """Инициализация регистрации - создание пользователя с кодом верификации."""
        # Проверка, что пользователь не существует или удаление старого неподтвержденного
        existing_user = await self.get_user_by_phone(request.phone)
        if existing_user:
            if existing_user.is_verified:
                raise HTTPException(
                    status_code=400,
                    detail="Пользователь с таким номером телефона уже существует"
                )
            else:
                # Удаляем старого неподтвержденного пользователя
                await self.db.delete(existing_user)
                await self.db.commit()
        
        # Генерация кода верификации
        verification_code = self.generate_verification_code()
        
        # Создание нового пользователя с кодом
        hashed_password = self.get_password_hash(request.password)
        
        db_user = User(
            phone=request.phone,
            name=request.name,
            hashed_password=hashed_password,
            verification_code=verification_code,
            is_verified=False
        )
        
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        
        return {
            "message": "Код верификации сгенерирован",
            "verification_code": verification_code,
            "phone": request.phone
        }

    async def verify_registration_code(self, request: VerifyCodeRequest):
        """Подтверждение кода верификации и завершение регистрации."""
        user = await self.get_user_by_phone(request.phone)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        if user.verification_code != request.code:
            raise HTTPException(status_code=400, detail="Неверный код")
        
        if user.is_verified:
            raise HTTPException(status_code=400, detail="Пользователь уже подтвержден")
        
        # Подтверждение пользователя
        user.is_verified = True
        user.verification_code = None
        await self.db.commit()
        
        # Возвращение токена
        access_token = self.create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "phone": user.phone,
                "name": user.name,
                "role": user.role,
                "is_active": user.is_active,
                "is_verified": user.is_verified
            }
        }

    async def request_sms(self, phone: str):
        """Запрос SMS кода."""
        # В реальном проекте здесь будет отправка SMS через Twilio
        sms_code = self.generate_sms_code()
        
        # Логирование кода для разработки
        print(f"SMS код для {phone}: {sms_code}")
        
        # Сохранение кода в базе (если пользователь существует)
        user = await self.get_user_by_phone(phone)
        if user:
            user.verification_code = sms_code
            user.sms_code_expires = datetime.utcnow() + timedelta(minutes=10)
            await self.db.commit()
        
        return {"message": "SMS код отправлен"}

    async def verify_sms(self, phone: str, code: str):
        """Подтверждение SMS кода."""
        user = await self.get_user_by_phone(phone)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        if user.verification_code != code:
            raise HTTPException(status_code=400, detail="Неверный код")
        
        if user.sms_code_expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Код истек")
        
        # Подтверждение пользователя
        user.is_verified = True
        user.verification_code = None
        user.sms_code_expires = None
        await self.db.commit()
        
        # Возвращение токена
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