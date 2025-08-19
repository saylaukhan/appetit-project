from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import event, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
import sqlite3
from typing import AsyncGenerator, Generator

from app.core.config import settings

# Создание асинхронного движка для SQLite
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Логирование SQL запросов в режиме отладки
    future=True,
    connect_args={"check_same_thread": False}  # Для SQLite
)

# Создание фабрики сессий
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Синхронный движок для совместимости
sync_engine = create_engine(
    settings.DATABASE_URL.replace("sqlite+aiosqlite://", "sqlite:///"),
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False}
)

# Синхронная фабрика сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Базовый класс для всех моделей
Base = declarative_base()


# Включение поддержки внешних ключей для SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Включение внешних ключей для SQLite при подключении."""
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency для получения асинхронной сессии базы данных.
    Используется в FastAPI endpoints через Depends(get_db_session).
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency для получения синхронной сессии базы данных.
    Используется в FastAPI endpoints через Depends(get_db).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def create_db_and_tables():
    """Создание базы данных и всех таблиц."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_db_and_tables():
    """Удаление всех таблиц (для тестов)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
