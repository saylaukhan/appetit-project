from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from enum import Enum
from app.core.database import Base

class UserRole(str, Enum):
    CLIENT = "client"
    ADMIN = "admin"
    KITCHEN = "kitchen"
    COURIER = "courier"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(15), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CLIENT, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Подтвержден ли номер телефона
    
    # Дополнительные поля профиля
    avatar = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    birth_date = Column(DateTime, nullable=True)
    gender = Column(SQLEnum(Gender), nullable=True)
    
    # Настройки подписок
    newsletter_subscribed = Column(Boolean, default=False)
    sms_notifications = Column(Boolean, default=True)
    
    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # SMS верификация
    sms_code = Column(String(6), nullable=True)
    sms_code_expires = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, phone='{self.phone}', role='{self.role}')>"
