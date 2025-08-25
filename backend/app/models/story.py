from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Изображения для историй
    cover_image = Column(String(255), nullable=False)  # Обложка (превью)
    content_image = Column(String(255), nullable=False)  # Содержание (полная версия)
    
    # Позиционирование и статус
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Временные ограничения показа
    show_from = Column(DateTime(timezone=True), nullable=True)
    show_until = Column(DateTime(timezone=True), nullable=True)
    
    # Статистика
    view_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Story(id={self.id}, title='{self.title}')>"