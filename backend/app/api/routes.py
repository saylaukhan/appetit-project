from fastapi import APIRouter
from app.api.endpoints import auth, menu, orders, admin, courier, kitchen, analytics, marketing, users

# Главный роутер API
api_router = APIRouter()

# Подключение всех роутеров с их префиксами и тегами
api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["auth"]
)

api_router.include_router(
    menu.router, 
    prefix="/menu", 
    tags=["menu"]
)

api_router.include_router(
    orders.router, 
    prefix="/orders", 
    tags=["orders"]
)

api_router.include_router(
    admin.router, 
    prefix="/admin", 
    tags=["admin"]
)

api_router.include_router(
    courier.router, 
    prefix="/courier", 
    tags=["courier"]
)

api_router.include_router(
    kitchen.router, 
    prefix="/kitchen", 
    tags=["kitchen"]
)

api_router.include_router(
    analytics.router, 
    prefix="/analytics", 
    tags=["analytics"]
)

api_router.include_router(
    marketing.router, 
    prefix="/marketing", 
    tags=["marketing"]
)

api_router.include_router(
    users.router, 
    prefix="/users", 
    tags=["users"]
)
