from pydantic import BaseModel, Field, validator
from typing import Optional
import re
import hashlib
import hmac

class LoginRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона в формате +7XXXXXXXXXX")
    password: str = Field(..., min_length=6, description="Пароль (минимум 6 символов)")

    @validator('phone')
    def validate_phone(cls, v):
        # Простая валидация номера телефона для Казахстана
        phone_pattern = r'^\+7\d{10}$'
        if not re.match(phone_pattern, v):
            raise ValueError('Неверный формат номера телефона. Используйте +7XXXXXXXXXX')
        return v

class RegisterRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона в формате +7XXXXXXXXXX")
    name: str = Field(..., min_length=2, max_length=50, description="Имя пользователя")
    password: str = Field(..., min_length=6, description="Пароль (минимум 6 символов)")

    @validator('phone')
    def validate_phone(cls, v):
        phone_pattern = r'^\+7\d{10}$'
        if not re.match(phone_pattern, v):
            raise ValueError('Неверный формат номера телефона. Используйте +7XXXXXXXXXX')
        return v

class SMSRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона в формате +7XXXXXXXXXX")

    @validator('phone')
    def validate_phone(cls, v):
        phone_pattern = r'^\+7\d{10}$'
        if not re.match(phone_pattern, v):
            raise ValueError('Неверный формат номера телефона. Используйте +7XXXXXXXXXX')
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TelegramAuthRequest(BaseModel):
    """Схема для авторизации через Telegram Login Widget"""
    id: int = Field(..., description="Telegram user ID")
    first_name: str = Field(..., description="Имя пользователя в Telegram")
    last_name: Optional[str] = Field(None, description="Фамилия пользователя в Telegram")
    username: Optional[str] = Field(None, description="Username в Telegram")
    photo_url: Optional[str] = Field(None, description="URL фото профиля")
    auth_date: int = Field(..., description="Время авторизации (Unix timestamp)")
    hash: str = Field(..., description="Хеш для проверки подлинности данных")

    @validator('hash')
    def validate_telegram_data(cls, v, values):
        """Проверка подлинности данных от Telegram"""
        # Эта проверка будет выполнена в сервисе
        return v

class UserResponse(BaseModel):
    id: int
    phone: Optional[str] = None
    name: str
    role: str
    is_active: bool
    created_at: str
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None

    class Config:
        from_attributes = True
