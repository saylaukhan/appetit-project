from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, Numeric
from sqlalchemy.sql import func
from enum import Enum
from app.core.database import Base

class DiscountType(str, Enum):
    PERCENTAGE = "percentage"  # Процентная скидка
    FIXED = "fixed"  # Фиксированная сумма

class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    
    # Тип и размер скидки
    discount_type = Column(SQLEnum(DiscountType), nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)  # Процент или сумма
    
    # Ограничения
    min_order_amount = Column(Numeric(10, 2), nullable=True)  # Минимальная сумма заказа
    max_discount_amount = Column(Numeric(10, 2), nullable=True)  # Максимальная сумма скидки
    usage_limit = Column(Integer, nullable=True)  # Лимит использований (None = безлимитно)
    usage_limit_per_user = Column(Integer, default=1)  # Лимит на пользователя
    
    # Временные ограничения
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    
    # Статус
    is_active = Column(Boolean, default=True)
    
    # Счетчики
    total_used = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<PromoCode(id={self.id}, code='{self.code}', discount={self.discount_value})>"
