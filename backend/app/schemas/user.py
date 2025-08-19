from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import re

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Имя пользователя")
    email: Optional[str] = Field(None, description="Email адрес")
    address: Optional[str] = Field(None, max_length=500, description="Адрес")
    birth_date: Optional[datetime] = Field(None, description="Дата рождения")
    gender: Optional[str] = Field(None, description="Пол (male, female, other)")
    newsletter_subscribed: Optional[bool] = Field(None, description="Подписка на рассылку")
    sms_notifications: Optional[bool] = Field(None, description="SMS уведомления")

    @validator('email')
    def validate_email(cls, v):
        if v is not None:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError('Неверный формат email адреса')
        return v

    @validator('gender')
    def validate_gender(cls, v):
        if v is not None and v not in ['male', 'female', 'other']:
            raise ValueError('Пол должен быть: male, female или other')
        return v

class UserProfileResponse(BaseModel):
    id: int
    phone: str
    name: str
    email: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[datetime] = None
    gender: Optional[str] = None
    newsletter_subscribed: bool = False
    sms_notifications: bool = True
    role: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NewsletterSubscription(BaseModel):
    email: str = Field(..., description="Email для подписки на рассылку")

    @validator('email')
    def validate_email(cls, v):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Неверный формат email адреса')
        return v
