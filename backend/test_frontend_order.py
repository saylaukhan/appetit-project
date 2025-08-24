"""Тест создания заказа через фронтенд endpoint."""
import asyncio
import aiohttp
import json

async def test_frontend_order_flow():
    """Тест полного флоу создания заказа как с фронтенда."""
    async with aiohttp.ClientSession() as session:
        
        # Аутентификация как с фронтенда
        auth_data = {
            "phone": "+77774567890",
            "password": "client123"
        }
        
        print("1. Аутентификация...")
        async with session.post('http://localhost:8000/api/v1/auth/login', json=auth_data) as response:
            if response.status == 200:
                auth_result = await response.json()
                token = auth_result['access_token']
                print("✓ Токен получен")
            else:
                error = await response.text()
                print(f"✗ Ошибка аутентификации: {response.status} - {error}")
                return

        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        
        # Получаем блюда для заказа
        print("\n2. Получаем блюда...")
        async with session.get('http://localhost:8000/api/v1/menu/dishes') as response:
            if response.status == 200:
                dishes = await response.json()
                if dishes:
                    dish = dishes[0]
                    print(f"✓ Найдено блюдо: {dish['name']} - {dish['price']} тг")
                else:
                    print("✗ Блюда не найдены")
                    return
            else:
                error = await response.text()
                print(f"✗ Ошибка загрузки блюд: {response.status} - {error}")
                return

        # Создаем заказ как фронтенд
        print("\n3. Создаем заказ...")
        order_data = {
            "items": [
                {
                    "dish_id": dish['id'],
                    "quantity": 1,
                    "modifiers": []
                }
            ],
            "delivery_type": "pickup",
            "payment_method": "card",
            "comment": "Тест фронтенд заказа"
        }
        
        # Используем тот же endpoint что и фронтенд (без слэша в конце)
        async with session.post('http://localhost:8000/api/v1/orders', json=order_data, headers=headers) as response:
            if response.status == 200:
                order_result = await response.json()
                order_id = order_result['id']
                print(f"✓ Заказ создан: ID={order_id}, номер={order_result['order_number']}")
            else:
                error = await response.text()
                print(f"✗ Ошибка создания заказа: {response.status}")
                print(f"  Детали: {error}")
                return

        # Проверяем получение заказов пользователя через новый endpoint
        print("\n4. Загружаем историю заказов...")
        async with session.get('http://localhost:8000/api/v1/users/me/orders', headers=headers) as response:
            if response.status == 200:
                orders = await response.json()
                print(f"✓ Получено заказов: {len(orders)}")
                if orders:
                    latest_order = orders[0]
                    print(f"  Последний заказ: {latest_order['order_number']} - {latest_order['total_amount']} тг")
            else:
                error = await response.text()
                print(f"✗ Ошибка загрузки заказов: {response.status} - {error}")

        # Проверяем получение конкретного заказа
        print(f"\n5. Получаем детали заказа {order_id}...")
        async with session.get(f'http://localhost:8000/api/v1/orders/{order_id}', headers=headers) as response:
            if response.status == 200:
                order_details = await response.json()
                print(f"✓ Детали заказа получены:")
                print(f"  Статус: {order_details['status']}")
                print(f"  Сумма: {order_details['total_amount']} тг")
            else:
                error = await response.text()
                print(f"✗ Ошибка получения деталей: {response.status} - {error}")

if __name__ == "__main__":
    asyncio.run(test_frontend_order_flow())