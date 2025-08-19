from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Многие-ко-многим связь между блюдами и вариантами
dish_variant_table = Table(
    'dish_variants',
    Base.metadata,
    Column('dish_id', Integer, ForeignKey('dishes.id'), primary_key=True),
    Column('variant_id', Integer, ForeignKey('variants.id'), primary_key=True)
)

# Таблица связи блюд и добавок
dish_addon_table = Table(
    'dish_addons',
    Base.metadata,
    Column('dish_id', Integer, ForeignKey('dishes.id'), primary_key=True),
    Column('addon_id', Integer, ForeignKey('addons.id'), primary_key=True)
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
    variants = relationship("Variant", secondary=dish_variant_table, back_populates="dishes")
    addons = relationship("Addon", secondary=dish_addon_table, back_populates="dishes")

    def __repr__(self):
        return f"<Dish(id={self.id}, name='{self.name}', price={self.price})>"

# Группы вариантов (например, "Размер", "Тип теста", "Температура")
class VariantGroup(Base):
    __tablename__ = "variant_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # например "Размер", "Тип теста"
    is_required = Column(Boolean, default=True)  # Обязательно ли выбрать вариант из этой группы
    is_multiple = Column(Boolean, default=False)  # Можно ли выбрать несколько вариантов
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Отношения
    variants = relationship("Variant", back_populates="group")

    def __repr__(self):
        return f"<VariantGroup(id={self.id}, name='{self.name}')>"

# Варианты внутри группы (например, "Маленькая", "Средняя", "Большая" для группы "Размер")
class Variant(Base):
    __tablename__ = "variants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), default=0)  # Может быть 0 для базовых вариантов
    group_id = Column(Integer, ForeignKey("variant_groups.id"), nullable=False)
    is_default = Column(Boolean, default=False)  # Вариант по умолчанию в группе
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Отношения
    group = relationship("VariantGroup", back_populates="variants")
    dishes = relationship("Dish", secondary=dish_variant_table, back_populates="variants")

    def __repr__(self):
        return f"<Variant(id={self.id}, name='{self.name}', price={self.price})>"



class Addon(Base):
    __tablename__ = "addons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), default=0)  # Цена добавки
    category = Column(String(50), nullable=True)  # Категория добавки (например, "соусы", "сыры")
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Отношения
    dishes = relationship("Dish", secondary=dish_addon_table, back_populates="addons")

    def __repr__(self):
        return f"<Addon(id={self.id}, name='{self.name}', price={self.price})>"
