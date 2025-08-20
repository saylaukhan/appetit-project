"""
Тестирование API промокодов
"""
import asyncio
import httpx

async def test_promo_api():
    """Тест API промокодов"""
    base_url = "http://localhost:8000/api/v1/promo-codes"
    
    async with httpx.AsyncClient() as client:
        # Тест валидации промокода
        print("🧪 Тестирование валидации промокода...")
        try:
            response = await client.get(f"{base_url}/TESTPROMO?order_total=2000")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Промокод TESTPROMO валиден: скидка {data['discount']}%")
                print(f"   Сумма скидки: {data['discount_amount']}₸")
            else:
                print(f"❌ Ошибка валидации: {response.status_code}")
        except Exception as e:
            print(f"❌ Ошибка подключения: {e}")
        
        # Тест применения промокода  
        print("\n🧪 Тестирование применения промокода...")
        try:
            response = await client.post(f"{base_url}/apply/TESTPROMO", 
                                       json={"order_total": 2000})
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Промокод применен: скидка {data['discount']}%")
                print(f"   Использований: {data['total_used']}")
            else:
                print(f"❌ Ошибка применения: {response.status_code}")
        except Exception as e:
            print(f"❌ Ошибка подключения: {e}")

if __name__ == "__main__":
    asyncio.run(test_promo_api())
