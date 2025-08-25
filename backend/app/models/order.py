from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from app.core.database import Base

class OrderStatus(str, Enum):
    PENDING = "pending"  # Ожидает подтверждения
    CONFIRMED = "confirmed"  # Подтвержден
    PREPARING = "preparing"  # Готовится
    READY = "ready"  # Готов к выдаче
    DELIVERING = "delivering"  # Доставляется
    DELIVERED = "delivered"  # Доставлен
    CANCELLED = "cancelled"  # Отменен

class DeliveryType(str, Enum):
    DELIVERY = "delivery"
    PICKUP = "pickup"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"

class PaymentMethod(str, Enum):
    CARD = "card"  # Банковская карта
    CASH = "cash"  # Наличные

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), unique=True, index=True, nullable=False)  # Например: ORD-2024-001
    
    # Связь с пользователем (может быть None для гостевых заказов)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Информация о клиенте
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(15), nullable=False)
    customer_email = Column(String(100), nullable=True)
    
    # Тип и адрес доставки
    delivery_type = Column(SQLEnum(DeliveryType), nullable=False)
    delivery_address = Column(Text, nullable=True)  # JSON с адресом
    pickup_address = Column(String(200), nullable=True)  # Адрес ресторана для самовывоза
    
    # Статусы
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    
    # Суммы
    subtotal = Column(Numeric(10, 2), nullable=False)  # Сумма без скидки
    discount_amount = Column(Numeric(10, 2), default=0)  # Размер скидки
    delivery_fee = Column(Numeric(10, 2), default=0)  # Стоимость доставки
    total_amount = Column(Numeric(10, 2), nullable=False)  # Итоговая сумма
    
    # Промокод
    promo_code = Column(String(50), nullable=True)
    promo_discount = Column(Numeric(10, 2), default=0)
    
    # Комментарии
    customer_comment = Column(Text, nullable=True)
    admin_comment = Column(Text, nullable=True)
    
    # Исполнители
    assigned_courier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # UTM метки для аналитики
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    ready_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Отношения
    user = relationship("User", foreign_keys=[user_id])
    assigned_courier = relationship("User", foreign_keys=[assigned_courier_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order(id={self.id}, number='{self.order_number}', status='{self.status}')>"

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    dish_id = Column(Integer, ForeignKey("dishes.id"), nullable=False)
    
    # Информация о блюде на момент заказа (для истории)
    dish_name = Column(String(100), nullable=False)
    dish_price = Column(Numeric(10, 2), nullable=False)
    
    quantity = Column(Integer, nullable=False, default=1)
    price = Column(Numeric(10, 2), nullable=False)  # Цена за единицу с модификаторами
    total_price = Column(Numeric(10, 2), nullable=False)  # price * quantity
    
    # Модификаторы (JSON массив)
    modifiers = Column(JSON, nullable=True)  # [{"id": 1, "name": "Большая порция", "price": 200}]
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Отношения
    order = relationship("Order", back_populates="items")
    dish = relationship("Dish")

    def __repr__(self):
        return f"<OrderItem(id={self.id}, dish='{self.dish_name}', quantity={self.quantity})>"
