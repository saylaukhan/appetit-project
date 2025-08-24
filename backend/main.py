from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from pathlib import Path

from app.core.config import settings
from app.core.database import engine
from app.models import Base
from app.api.routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
    # Startup
    print("🚀 Starting APPETIT Backend...")
    
    # Создание таблиц базы данных
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("📊 Database tables created successfully")
    print(f"🌐 API Documentation: http://localhost:8000/docs")
    print(f"🔗 Alternative docs: http://localhost:8000/redoc")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down APPETIT Backend...")
    await engine.dispose()


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title="APPETIT API",
        description="""
        🍕 **APPETIT MVP API** - Платформа доставки еды
        
        ## Основные функции
        
        * **Аутентификация**: Регистрация и вход по номеру телефона с SMS
        * **Меню**: Управление категориями, блюдами и модификаторами
        * **Заказы**: Полный цикл от создания до доставки
        * **Роли**: Клиент, Администратор, Кухня, Курьер
        * **Аналитика**: Отчеты по продажам и UTM-меткам
        * **Маркетинг**: Промокоды, баннеры, push-уведомления
        
        ## Технологии
        
        * FastAPI + SQLAlchemy
        * JWT аутентификация
        * SQLite база данных
        * Firebase Cloud Messaging
        
        Документация API обновляется автоматически 📚
        """,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
        # Настройки OpenAPI
        openapi_tags=[
            {
                "name": "auth",
                "description": "Аутентификация и регистрация пользователей",
            },
            {
                "name": "menu",
                "description": "Управление меню, категориями и блюдами",
            },
            {
                "name": "orders",
                "description": "Создание и управление заказами",
            },
            {
                "name": "admin",
                "description": "Административные функции",
            },
            {
                "name": "courier",
                "description": "Интерфейс для курьеров",
            },
            {
                "name": "kitchen",
                "description": "Интерфейс для кухни (KDS)",
            },
            {
                "name": "analytics",
                "description": "Аналитика и отчеты",
            },
            {
                "name": "marketing",
                "description": "Маркетинговые инструменты",
            },
        ]
    )
    
    # CORS настройки - исправленные для разработки
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",  # React dev server
            "http://localhost:3001",  # Vite dev server (альтернативный порт)
            "http://localhost:5173",  # Vite dev server
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:5173"
        ],
        allow_credentials=True,  # Разрешаем отправку cookies и токенов
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # Подключение роутеров API
    app.include_router(api_router, prefix="/api/v1")
    
    # Статические файлы (для изображений, документов)
    static_path = Path("static")
    static_path.mkdir(exist_ok=True)
    app.mount("/static", StaticFiles(directory=static_path), name="static")
    
    # Корневой эндпоинт
    @app.get("/", tags=["root"])
    async def root():
        return {
            "message": "🍕 APPETIT API is running!",
            "version": "1.0.0",
            "docs": "/docs",
            "redoc": "/redoc",
            "status": "healthy"
        }
    
    # Health check эндпоинт
    @app.get("/health", tags=["health"])
    async def health_check():
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.0.0"
        }
    
    return app


# Создание экземпляра приложения
app = create_application()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
