from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re

class AddressUpdate(BaseModel):
    address: Optional[str] = Field(None, max_length=500, description="Полный адрес")
    address_city: Optional[str] = Field(None, max_length=100, description="Город")
    address_street: Optional[str] = Field(None, max_length=200, description="Улица и дом")
    address_entrance: Optional[str] = Field(None, max_length=10, description="Подъезд")
    address_floor: Optional[str] = Field(None, max_length=10, description="Этаж")
    address_apartment: Optional[str] = Field(None, max_length=20, description="Квартира")
    address_comment: Optional[str] = Field(None, description="Комментарий к адресу")
    address_latitude: Optional[float] = Field(None, description="Широта")
    address_longitude: Optional[float] = Field(None, description="Долгота")

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Имя пользователя")
    email: Optional[str] = Field(None, description="Email адрес")
    address: Optional[str] = Field(None, max_length=500, description="Адрес")
    birth_date: Optional[datetime] = Field(None, description="Дата рождения")
    
    # Детальные поля адреса
    address_city: Optional[str] = Field(None, max_length=100, description="Город")
    address_street: Optional[str] = Field(None, max_length=200, description="Улица и дом")
    address_entrance: Optional[str] = Field(None, max_length=10, description="Подъезд")
    address_floor: Optional[str] = Field(None, max_length=10, description="Этаж")
    address_apartment: Optional[str] = Field(None, max_length=20, description="Квартира")
    address_comment: Optional[str] = Field(None, description="Комментарий к адресу")
    address_latitude: Optional[float] = Field(None, description="Широта")
    address_longitude: Optional[float] = Field(None, description="Долгота")

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
    
    # Детальные поля адреса
    address_city: Optional[str] = None
    address_street: Optional[str] = None
    address_entrance: Optional[str] = None
    address_floor: Optional[str] = None
    address_apartment: Optional[str] = None
    address_comment: Optional[str] = None
    address_latitude: Optional[float] = None
    address_longitude: Optional[float] = None

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


class UserRoleEnum(str, Enum):
    CLIENT = "client"
    ADMIN = "admin"
    KITCHEN = "kitchen"
    COURIER = "courier"


class UserListItem(BaseModel):
    id: int
    phone: str
    name: str
    email: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    last_order_date: Optional[datetime] = None
    orders_count: int = 0
    address: Optional[str] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class UserRoleUpdate(BaseModel):
    role: UserRoleEnum = Field(..., description="Новая роль пользователя")


class UserStatusUpdate(BaseModel):
    is_active: bool = Field(..., description="Статус активности пользователя")
