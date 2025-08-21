from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv
import os

# Загружаем переменные окружения перед определением класса
# Ищем .env файл в разных местах
import pathlib
current_dir = pathlib.Path(__file__).parent
project_root = current_dir.parent.parent.parent
env_paths = [
    current_dir / ".env",  # backend/app/core/.env
    project_root / "backend" / ".env",  # backend/.env
    project_root / ".env"  # корень проекта
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break
else:
    # Если .env не найден, загружаем из системных переменных
    load_dotenv()


class Settings(BaseSettings):
    """Настройки приложения."""
    # Основные настройки
    APP_NAME: str = "APPETIT API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # База данных
    DATABASE_URL: str = "sqlite+aiosqlite:///./database.db"
    
    # Секретные ключи
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 дней
    
    # CORS настройки
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://appetit.kz",
    ]
    

    
    # Telegram Bot настройки
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_BOT_USERNAME: str = os.getenv("TELEGRAM_BOT_USERNAME", "")
    
    # Firebase настройки
    FIREBASE_CREDENTIALS_PATH: str = "config/firebase-credentials.json"
    FCM_ENABLED: bool = False  # Отключено для разработки
    
    # Загрузка файлов
    UPLOAD_DIR: str = "static/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # Email настройки (если нужны)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@appetit.kz"
    
    # Настройки кеширования
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_ENABLED: bool = False
    
    # Google Analytics
    GA_TRACKING_ID: str = ""
    
    # Настройки пагинации
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Настройки заказов
    MIN_ORDER_AMOUNT: float = 1000.0  # Минимальная сумма заказа (тенге)
    DELIVERY_FEE: float = 500.0  # Стоимость доставки
    FREE_DELIVERY_AMOUNT: float = 3000.0  # Бесплатная доставка от суммы
    
    # Рабочие часы
    WORK_START_TIME: str = "09:00"
    WORK_END_TIME: str = "23:00"
    
    # Зоны доставки (координаты)
    DELIVERY_ZONES: List[dict] = [
        {
            "name": "Центр",
            "polygon": [
                {"lat": 43.2220, "lng": 76.8512},
                {"lat": 43.2566, "lng": 76.9286},
                # Добавить больше точек полигона
            ]
        }
    ]

    class Config:
        env_file = ".env"


# Создание глобального экземпляра настроек
settings = Settings()


# Настройки логирования
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "[{asctime}] {levelname} in {name}: {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "detailed": {
            "format": "[{asctime}] {levelname} {name}:{lineno} - {funcName}(): {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "default",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "DEBUG",
            "formatter": "detailed",
            "filename": "logs/app.log",
            "maxBytes": 10000000,
            "backupCount": 5,
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["console", "file"] if not settings.DEBUG else ["console"],
    },
}
