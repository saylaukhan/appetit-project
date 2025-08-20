from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class PromoCodeUsage(Base):
    """Таблица для отслеживания использований промокодов пользователями."""
    __tablename__ = "promo_code_usage"

    id = Column(Integer, primary_key=True, index=True)
    
    # Связи с другими таблицами
    promo_code_id = Column(Integer, ForeignKey("promo_codes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # nullable для анонимных пользователей
    
    # Информация о использовании
    user_phone = Column(String(20), nullable=True)  # Для анонимных пользователей
    user_email = Column(String(255), nullable=True)  # Для анонимных пользователей
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    
    # Временные метки
    used_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Статус использования
    is_active = Column(Boolean, default=True)  # Можно деактивировать если заказ отменен
    
    # Отношения
    promo_code = relationship("PromoCode", back_populates="usages")
    user = relationship("User")
    
    def __repr__(self):
        return f"<PromoCodeUsage(id={self.id}, promo_code_id={self.promo_code_id}, user_id={self.user_id})>"
