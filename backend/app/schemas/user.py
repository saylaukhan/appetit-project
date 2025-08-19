from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import re

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Имя пользователя")
    email: Optional[str] = Field(None, description="Email адрес")
    address: Optional[str] = Field(None, max_length=500, description="Адрес")
    birth_date: Optional[datetime] = Field(None, description="Дата рождения")

    @validator('email')
    def validate_email(cls, v):
        if v is not None:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError('Неверный формат email адреса')
        return v



class UserProfileResponse(BaseModel):
    id: int
    phone: str
    name: str
    email: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[datetime] = None
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
