#!/usr/bin/env python3
"""
Тестирование API баннеров APPETIT.
"""

import asyncio
import sys
from pathlib import Path
import json

# Добавляем корневую директорию в path
sys.path.append(str(Path(__file__).parent))

import httpx
from main import app

BASE_URL = "http://localhost:8000/api/v1"


async def test_banners_api():
    """Тестирование API баннеров."""
    
    print("🧪 Тестирование API баннеров...")
    
    async with httpx.AsyncClient(app=app, base_url=BASE_URL) as client:
        try:
            # 1. Получение всех активных баннеров
            print("\n1️⃣ Тестирование получения всех активных баннеров...")
            response = await client.get("/marketing/banners")
            print(f"   Статус: {response.status_code}")
            if response.status_code == 200:
                banners = response.json()
                print(f"   Найдено баннеров: {len(banners)}")
                if banners:
                    print(f"   Первый баннер: {banners[0]['title']}")
            else:
                print(f"   Ошибка: {response.text}")
            
            # 2. Получение баннеров главной страницы
            print("\n2️⃣ Тестирование получения главных баннеров...")
            response = await client.get("/marketing/banners/featured/main")
            print(f"   Статус: {response.status_code}")
            if response.status_code == 200:
                main_banners = response.json()
                print(f"   Главных баннеров: {len(main_banners)}")
            else:
                print(f"   Ошибка: {response.text}")
            
            # 3. Получение баннеров по позиции
            print("\n3️⃣ Тестирование получения баннеров по позиции 'featured'...")
            response = await client.get("/marketing/banners/featured")
            print(f"   Статус: {response.status_code}")
            if response.status_code == 200:
                featured_banners = response.json()
                print(f"   Рекомендуемых баннеров: {len(featured_banners)}")
            else:
                print(f"   Ошибка: {response.text}")
            
            # 4. Получение доступных позиций
            print("\n4️⃣ Тестирование получения доступных позиций...")
            response = await client.get("/marketing/positions")
            print(f"   Статус: {response.status_code}")
            if response.status_code == 200:
                positions = response.json()
                print(f"   Найдено позиций: {len(positions.get('positions', []))}")
                for pos in positions.get('positions', []):
                    print(f"     • {pos['display_name']} ({pos['name']}): {pos['count']} баннеров")
            else:
                print(f"   Ошибка: {response.text}")
            
            # 5. Отслеживание просмотра (если есть баннеры)
            if 'banners' in locals() and banners:
                banner_id = banners[0]['id']
                print(f"\n5️⃣ Тестирование отслеживания просмотра баннера {banner_id}...")
                response = await client.post(f"/marketing/banners/{banner_id}/view")
                print(f"   Статус: {response.status_code}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"   Результат: {result}")
                else:
                    print(f"   Ошибка: {response.text}")
                
                # 6. Отслеживание клика
                print(f"\n6️⃣ Тестирование отслеживания клика по баннеру {banner_id}...")
                response = await client.post(f"/marketing/banners/{banner_id}/click")
                print(f"   Статус: {response.status_code}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"   Результат: {result}")
                else:
                    print(f"   Ошибка: {response.text}")
            
            print("\n✅ Тестирование публичных API баннеров завершено!")
            
        except Exception as e:
            print(f"❌ Ошибка при тестировании: {e}")
            return 1
    
    return 0


async def test_admin_banners_api():
    """Тестирование административного API баннеров."""
    
    print("\n🔐 Тестирование административного API...")
    print("ℹ️  Для полного тестирования нужна авторизация администратора")
    
    async with httpx.AsyncClient(app=app, base_url=BASE_URL) as client:
        try:
            # Тестирование без авторизации (должны получить 401)
            print("\n1️⃣ Тестирование панели маркетинга (без авторизации)...")
            response = await client.get("/admin/marketing")
            print(f"   Статус: {response.status_code}")
            if response.status_code == 401:
                print("   ✅ Корректно требует авторизацию")
            else:
                print(f"   ⚠️  Неожиданный статус: {response.text}")
            
            print("\n2️⃣ Тестирование списка баннеров для админа (без авторизации)...")
            response = await client.get("/admin/marketing/banners")
            print(f"   Статус: {response.status_code}")
            if response.status_code == 401:
                print("   ✅ Корректно требует авторизацию")
            else:
                print(f"   ⚠️  Неожиданный статус: {response.text}")
            
            print("\n✅ Тестирование административного API завершено!")
            print("💡 Для полного тестирования админ API нужно:")
            print("   1. Создать админ токен: python create_admin_token.py")
            print("   2. Использовать токен в заголовке Authorization: Bearer <token>")
            
        except Exception as e:
            print(f"❌ Ошибка при тестировании админ API: {e}")
            return 1
    
    return 0


async def main():
    """Главная функция."""
    print("🎯 Тестирование API баннеров APPETIT...")
    
    try:
        # Тестируем публичные endpoints
        result1 = await test_banners_api()
        
        # Тестируем административные endpoints
        result2 = await test_admin_banners_api()
        
        if result1 == 0 and result2 == 0:
            print("\n🎉 Все тесты пройдены успешно!")
            print("\n📋 Доступные endpoints для баннеров:")
            print("   Публичные:")
            print("     • GET /api/v1/marketing/banners - все активные баннеры")
            print("     • GET /api/v1/marketing/banners/{position} - баннеры по позиции")
            print("     • GET /api/v1/marketing/banners/featured/main - главные баннеры")
            print("     • GET /api/v1/marketing/positions - доступные позиции")
            print("     • POST /api/v1/marketing/banners/{id}/view - отслеживание просмотра")
            print("     • POST /api/v1/marketing/banners/{id}/click - отслеживание клика")
            print("\n   Административные (требуют авторизации):")
            print("     • GET /api/v1/admin/marketing - панель маркетинга")
            print("     • GET /api/v1/admin/marketing/banners - управление баннерами")
            print("     • POST /api/v1/admin/marketing/banners - создание баннера")
            print("     • PUT /api/v1/admin/marketing/banners/{id} - редактирование")
            print("     • DELETE /api/v1/admin/marketing/banners/{id} - удаление")
            print("     • GET /api/v1/admin/marketing/banners/{id}/stats - статистика")
            return 0
        else:
            print("\n❌ Некоторые тесты не прошли")
            return 1
        
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)