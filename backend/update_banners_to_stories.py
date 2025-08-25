#!/usr/bin/env python3
"""
Скрипт для обновления баннеров в стиле сторисов APPETIT.
"""

import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Добавляем корневую директорию в path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import engine, Base
from app.models.banner import Banner


async def update_banners_to_stories():
    """Обновление баннеров для показа как сторисы."""
    
    async with AsyncSession(engine) as session:
        try:
            # Создаем таблицы, если их нет
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            # Удаляем все существующие баннеры
            await session.execute(delete(Banner))
            
            # Новые баннеры-сторисы в стиле APPETIT
            story_banners = [
                {
                    "title": "Готовим без свинины",
                    "description": "Халяльная еда по традиционным рецептам",
                    "image": None,
                    "link": None,
                    "position": "featured",
                    "sort_order": 1,
                    "is_active": True
                },
                {
                    "title": "Осторожно, мошенники!",
                    "description": "Будьте внимательны при заказе",
                    "image": None,
                    "link": None,
                    "position": "featured",
                    "sort_order": 2,
                    "is_active": True
                },
                {
                    "title": "Нам 10 лет",
                    "description": "Празднуем юбилей вместе с вами",
                    "image": None,
                    "link": None,
                    "position": "featured",
                    "sort_order": 3,
                    "is_active": True
                },
                {
                    "title": "Новинка Чак-чак",
                    "description": "Традиционная сладость по семейному рецепту",
                    "image": None,
                    "link": None,
                    "position": "featured",
                    "sort_order": 4,
                    "is_active": True
                },
                {
                    "title": "Новинка: Дала Барбекю",
                    "description": "Попробуйте новое фирменное блюдо",
                    "image": None,
                    "link": None,
                    "position": "featured",
                    "sort_order": 5,
                    "is_active": True
                },
                {
                    "title": "В напитках новинки",
                    "description": "Свежие лимонады и смузи",
                    "image": None,
                    "link": None,
                    "position": "featured",
                    "sort_order": 6,
                    "is_active": True
                },
                {
                    "title": "Чебуреки по-домашнему",
                    "description": "Хрустящие и сочные, как у бабушки",
                    "image": None,
                    "link": None,
                    "position": "featured",
                    "sort_order": 7,
                    "is_active": True
                }
            ]
            
            # Создаем новые баннеры
            for banner_data in story_banners:
                banner = Banner(**banner_data)
                session.add(banner)
            
            await session.commit()
            
            print(f"✅ Успешно создано {len(story_banners)} баннеров-сторисов:")
            for banner_data in story_banners:
                print(f"   • {banner_data['title']}")
            
            print(f"\n🌐 Теперь можете проверить на сайте:")
            print(f"   • http://localhost:3001 - главная страница")
            print(f"   • http://localhost:8000/docs - API документация")
            
        except Exception as e:
            print(f"❌ Ошибка при обновлении баннеров: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def main():
    """Главная функция."""
    print("🎯 Обновление баннеров в стиле сторисов APPETIT...")
    
    try:
        await update_banners_to_stories()
        print("\n🎉 Баннеры-сторисы успешно созданы!")
        
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        return 1
    
    finally:
        # Закрываем соединение с базой данных
        await engine.dispose()
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)