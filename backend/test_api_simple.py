#!/usr/bin/env python3
"""
Простой тест API баннеров
"""
import requests
import json

def test_banners_api():
    """Тестирование API баннеров"""
    base_url = "http://localhost:8000"
    
    print("🧪 Тестирование API баннеров...")
    
    # Тест 1: получение всех баннеров
    try:
        response = requests.get(f"{base_url}/api/v1/marketing/banners")
        print(f"\n1️⃣ Все баннеры:")
        print(f"   Статус: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Найдено: {len(data)} баннеров")
            for banner in data:
                print(f"     • {banner['title']} (позиция: {banner['position']})")
        else:
            print(f"   Ошибка: {response.text}")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Тест 2: получение featured баннеров
    try:
        response = requests.get(f"{base_url}/api/v1/marketing/banners/featured")
        print(f"\n2️⃣ Featured баннеры:")
        print(f"   Статус: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Найдено: {len(data)} featured баннеров")
            for banner in data:
                print(f"     • {banner['title']}")
        else:
            print(f"   Ошибка: {response.text}")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Тест 3: проверка документации
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"\n3️⃣ Документация:")
        print(f"   Статус: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Документация доступна: {base_url}/docs")
        else:
            print(f"   ❌ Документация недоступна")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")

if __name__ == "__main__":
    test_banners_api()