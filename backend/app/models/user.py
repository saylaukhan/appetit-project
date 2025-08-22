from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, Float, Text
from sqlalchemy.sql import func
from enum import Enum
from app.core.database import Base

class UserRole(str, Enum):
    CLIENT = "client"
    ADMIN = "admin"
    KITCHEN = "kitchen"
    COURIER = "courier"

# class Gender(str, Enum):
#     MALE = "male"
#     FEMALE = "female"
#     OTHER = "other"

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
    address = Column(String(500), nullable=True)  # Основной текстовый адрес
    birth_date = Column(DateTime, nullable=True)
    
    # Детальная информация об адресе
    address_city = Column(String(100), nullable=True)      # Город
    address_street = Column(String(200), nullable=True)    # Улица и дом
    address_entrance = Column(String(10), nullable=True)   # Подъезд
    address_floor = Column(String(10), nullable=True)      # Этаж
    address_apartment = Column(String(20), nullable=True)  # Квартира
    address_comment = Column(Text, nullable=True)          # Комментарий к адресу
    address_latitude = Column(Float, nullable=True)        # Широта
    address_longitude = Column(Float, nullable=True)       # Долгота
    # gender = Column(SQLEnum(Gender), nullable=True)  # Временно отключено
    
    # Настройки подписок
    # newsletter_subscribed = Column(Boolean, default=False)  # Временно отключено
    # sms_notifications = Column(Boolean, default=True)  # Временно отключено
    
    # Служебные поля
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # SMS верификация
    verification_code = Column(String(4), nullable=True)  # 4-значный код для верификации
    sms_code_expires = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, phone='{self.phone}', role='{self.role}')>"
