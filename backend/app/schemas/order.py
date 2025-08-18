from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"  # Ожидает подтверждения
    CONFIRMED = "confirmed"  # Подтвержден
    PREPARING = "preparing"  # Готовится
    READY = "ready"  # Готов к выдаче
    IN_DELIVERY = "in_delivery"  # В доставке
    DELIVERED = "delivered"  # Доставлен
    CANCELLED = "cancelled"  # Отменен

class DeliveryType(str, Enum):
    DELIVERY = "delivery"
    PICKUP = "pickup"

class OrderItemRequest(BaseModel):
    dish_id: int
    quantity: int = Field(ge=1, description="Количество (минимум 1)")
    modifiers: List[int] = Field(default=[], description="ID модификаторов")

class OrderCreateRequest(BaseModel):
    items: List[OrderItemRequest]
    delivery_type: DeliveryType
    delivery_address: Optional[str] = Field(None, description="Адрес доставки (обязателен для delivery)")
    phone: Optional[str] = Field(None, description="Телефон (если не авторизован)")
    name: Optional[str] = Field(None, description="Имя (если не авторизован)")
    comment: Optional[str] = Field(None, description="Комментарий к заказу")
    promo_code: Optional[str] = Field(None, description="Промокод")

class OrderItemResponse(BaseModel):
    id: int
    dish_name: str
    quantity: int
    price: Decimal
    total_price: Decimal
    modifiers: List[str] = []

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    status: OrderStatus
    delivery_type: DeliveryType
    total_amount: Decimal
    delivery_address: Optional[str] = None
    customer_name: str
    customer_phone: str
    items: List[OrderItemResponse]
    created_at: str

    class Config:
        from_attributes = True
