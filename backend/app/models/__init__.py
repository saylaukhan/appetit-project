from app.models.user import User
from app.models.menu import Category, Dish, VariantGroup, Variant, Addon
from app.models.order import Order, OrderItem
from app.models.promo_code import PromoCode
from app.models.banner import Banner

# Импорт Base для создания таблиц
from app.core.database import Base

__all__ = [
    "Base",
    "User", 
    "Category", 
    "Dish", 
    "VariantGroup",
    "Variant",
    "Addon",
    "Order", 
    "OrderItem", 
    "PromoCode",
    "Banner"
]
