from pydantic import BaseModel, Field, validator
from typing import Optional
import re

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

class UserResponse(BaseModel):
    id: int
    phone: str
    name: str
    role: str
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True
