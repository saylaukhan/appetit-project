#!/usr/bin/env python3
"""
Скрипт для добавления примеров баннеров в базу данных APPETIT.
"""

import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Добавляем корневую директорию в path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine, Base
from app.models.banner import Banner


async def create_sample_banners():
    """Создание примеров баннеров."""
    
    async with AsyncSession(engine) as session:
        try:
            # Создаем таблицы, если их нет
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            # Проверяем, есть ли уже баннеры
            from sqlalchemy import select, func
            count_query = select(func.count(Banner.id))
            result = await session.execute(count_query)
            existing_banners = result.scalar()
            
            if existing_banners > 0:
                print(f"ℹ️  В базе уже есть {existing_banners} баннеров. Пропускаем создание примеров.")
                return
            
            # Примеры баннеров для демонстрации
            sample_banners = [
                {
                    "title": "Каждый вторник 1+1",
                    "description": "На фирменную среднюю шаурму",
                    "image": "/static/banners/tuesday-promo.jpg",
                    "link": "/menu/shawarma",
                    "position": "main",
                    "sort_order": 1,
                    "is_active": True
                },
                {
                    "title": "Осторожно, мошенники!",
                    "description": "В последнее время участились случаи мошенничества от нашего имени",
                    "image": "/static/banners/warning.jpg",
                    "link": None,
                    "position": "popup",
                    "sort_order": 1,
                    "is_active": True
                },
                {
                    "title": "Нам 10 лет",
                    "description": "Празднуем юбилей вместе с вами!",
                    "image": "/static/banners/anniversary.jpg",
                    "link": "/promo/anniversary",
                    "position": "hero",
                    "sort_order": 1,
                    "is_active": True,
                    "show_from": datetime.now(),
                    "show_until": datetime.now() + timedelta(days=30)
                },
                {
                    "title": "Новинка Чак-чак",
                    "description": "Попробуйте наш новый десерт",
                    "image": "/static/banners/chak-chak.jpg",
                    "link": "/menu/desserts/chak-chak",
                    "position": "featured",
                    "sort_order": 2,
                    "is_active": True
                },
                {
                    "title": "Готовим без свинины",
                    "description": "Все наши блюда без свинины",
                    "image": "/static/banners/halal.jpg",
                    "link": "/about/halal",
                    "position": "category",
                    "sort_order": 1,
                    "is_active": True
                },
                {
                    "title": "В напитках новинки",
                    "description": "Попробуйте наши новые напитки",
                    "image": "/static/banners/drinks.jpg",
                    "link": "/menu/drinks",
                    "position": "featured",
                    "sort_order": 3,
                    "is_active": True
                },
                {
                    "title": "Новинка: Дала Барбекю",
                    "description": "Попробуйте наше новое блюдо",
                    "image": "/static/banners/dalla-bbq.jpg",
                    "link": "/menu/meat/dalla-bbq",
                    "position": "featured",
                    "sort_order": 4,
                    "is_active": True
                },
                {
                    "title": "Бесплатная доставка",
                    "description": "При заказе от 3000₸",
                    "image": "/static/banners/free-delivery.jpg",
                    "link": "/delivery-info",
                    "position": "cart",
                    "sort_order": 1,
                    "is_active": True
                }
            ]
            
            # Создаем баннеры
            for banner_data in sample_banners:
                banner = Banner(**banner_data)
                session.add(banner)
            
            await session.commit()
            
            print(f"✅ Успешно создано {len(sample_banners)} примеров баннеров:")
            for banner_data in sample_banners:
                print(f"   • {banner_data['title']} (позиция: {banner_data['position']})")
            
            print(f"\n🌐 Теперь можете проверить API:")
            print(f"   • GET /api/v1/marketing/banners - все активные баннеры")
            print(f"   • GET /api/v1/marketing/banners/main - баннеры главной страницы")
            print(f"   • GET /api/v1/admin/marketing - панель управления маркетингом")
            
        except Exception as e:
            print(f"❌ Ошибка при создании баннеров: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def main():
    """Главная функция."""
    print("🎯 Создание примеров баннеров для APPETIT...")
    
    try:
        await create_sample_banners()
        print("\n🎉 Примеры баннеров успешно созданы!")
        
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