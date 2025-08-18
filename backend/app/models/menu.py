from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Многие-ко-многим связь между блюдами и модификаторами
dish_modifier_table = Table(
    'dish_modifiers',
    Base.metadata,
    Column('dish_id', Integer, ForeignKey('dishes.id'), primary_key=True),
    Column('modifier_id', Integer, ForeignKey('modifiers.id'), primary_key=True)
)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Отношения
    dishes = relationship("Dish", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"

class Dish(Base):
    __tablename__ = "dishes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    image = Column(String(255), nullable=True)
    weight = Column(String(50), nullable=True)  # например "250г", "0.5л"
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    is_available = Column(Boolean, default=True)
    is_popular = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    # Пищевая ценность (опционально)
    calories = Column(Integer, nullable=True)
    proteins = Column(Numeric(5, 2), nullable=True)
    fats = Column(Numeric(5, 2), nullable=True)
    carbs = Column(Numeric(5, 2), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Отношения
    category = relationship("Category", back_populates="dishes")
    modifiers = relationship("Modifier", secondary=dish_modifier_table, back_populates="dishes")

    def __repr__(self):
        return f"<Dish(id={self.id}, name='{self.name}', price={self.price})>"

class Modifier(Base):
    __tablename__ = "modifiers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), default=0)  # Может быть 0 для бесплатных модификаторов
    is_required = Column(Boolean, default=False)  # Обязательный ли модификатор
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Отношения
    dishes = relationship("Dish", secondary=dish_modifier_table, back_populates="modifiers")

    def __repr__(self):
        return f"<Modifier(id={self.id}, name='{self.name}', price={self.price})>"

# Таблица для связи блюд и модификаторов (если нужны дополнительные поля)
class DishModifier(Base):
    __tablename__ = "dish_modifier_details"

    id = Column(Integer, primary_key=True, index=True)
    dish_id = Column(Integer, ForeignKey("dishes.id"), nullable=False)
    modifier_id = Column(Integer, ForeignKey("modifiers.id"), nullable=False)
    is_default = Column(Boolean, default=False)  # Модификатор по умолчанию
    sort_order = Column(Integer, default=0)

    def __repr__(self):
        return f"<DishModifier(dish_id={self.dish_id}, modifier_id={self.modifier_id})>"
