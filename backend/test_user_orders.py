"""Тест нового endpoint для заказов пользователя."""
import asyncio
import aiohttp

async def test_user_orders_endpoint():
    """Тест нового endpoint /users/me/orders."""
    async with aiohttp.ClientSession() as session:
        
        # Аутентификация
        auth_data = {
            "phone": "+77774567890",
            "password": "client123"
        }
        
        print("Аутентификация...")
        async with session.post('http://localhost:8000/api/v1/auth/login', json=auth_data) as response:
            if response.status == 200:
                auth_result = await response.json()
                token = auth_result['access_token']
                print("✓ Токен получен")
            else:
                print(f"✗ Ошибка аутентификации: {response.status}")
                return

        # Тестируем оба endpoint'а
        headers = {'Authorization': f'Bearer {token}'}
        
        print("\nТест /api/v1/orders/ (основной endpoint)...")
        async with session.get('http://localhost:8000/api/v1/orders/', headers=headers) as response:
            if response.status == 200:
                orders1 = await response.json()
                print(f"✓ Основной endpoint: {len(orders1)} заказов")
            else:
                error = await response.text()
                print(f"✗ Основной endpoint ошибка: {response.status} - {error}")

        print("\nТест /api/v1/users/me/orders (новый endpoint)...")
        async with session.get('http://localhost:8000/api/v1/users/me/orders', headers=headers) as response:
            if response.status == 200:
                orders2 = await response.json()
                print(f"✓ Новый endpoint: {len(orders2)} заказов")
                if orders2:
                    print(f"  Первый заказ: {orders2[0]['order_number']} - {orders2[0]['total_amount']} тг")
            else:
                error = await response.text()
                print(f"✗ Новый endpoint ошибка: {response.status} - {error}")

if __name__ == "__main__":
    asyncio.run(test_user_orders_endpoint())