"""Тест создания и получения заказов."""
import asyncio
import json
import aiohttp

async def test_auth_and_order():
    """Тест аутентификации и создания заказа."""
    async with aiohttp.ClientSession() as session:
        
        # 1. Аутентификация (получим токен для тестового пользователя)
        auth_data = {
            "phone": "+77774567890",  # Клиент Айгуль
            "password": "client123"
        }
        
        print("1. Тестируем аутентификацию...")
        async with session.post(
            'http://localhost:8000/api/v1/auth/login', 
            json=auth_data
        ) as response:
            if response.status == 200:
                auth_result = await response.json()
                token = auth_result['access_token']
                print(f"✓ Успешная аутентификация. Токен получен.")
            else:
                error_text = await response.text()
                print(f"✗ Ошибка аутентификации: {response.status} - {error_text}")
                return

        # 2. Получаем список блюд для заказа
        print("\n2. Получаем меню...")
        async with session.get('http://localhost:8000/api/v1/menu/dishes') as response:
            if response.status == 200:
                dishes = await response.json()
                if dishes:
                    first_dish = dishes[0]
                    print(f"✓ Меню загружено. Первое блюдо: {first_dish['name']} - {first_dish['price']} тг")
                else:
                    print("✗ Меню пусто")
                    return
            else:
                error_text = await response.text()
                print(f"✗ Ошибка загрузки меню: {response.status} - {error_text}")
                return

        # 3. Создаем тестовый заказ
        print("\n3. Создаем заказ...")
        order_data = {
            "items": [
                {
                    "dish_id": first_dish['id'],
                    "quantity": 2,
                    "modifiers": []
                }
            ],
            "delivery_type": "pickup",
            "payment_method": "card",
            "comment": "Тестовый заказ"
        }
        
        headers = {'Authorization': f'Bearer {token}'}
        async with session.post(
            'http://localhost:8000/api/v1/orders/', 
            json=order_data,
            headers=headers
        ) as response:
            if response.status == 200:
                order_result = await response.json()
                order_id = order_result['id']
                print(f"✓ Заказ создан успешно. ID: {order_id}, Номер: {order_result['order_number']}")
                print(f"  Сумма: {order_result['total_amount']} тг")
            else:
                error_text = await response.text()
                print(f"✗ Ошибка создания заказа: {response.status} - {error_text}")
                return

        # 4. Получаем историю заказов пользователя
        print("\n4. Получаем историю заказов...")
        async with session.get(
            'http://localhost:8000/api/v1/orders/',
            headers=headers
        ) as response:
            if response.status == 200:
                orders = await response.json()
                print(f"✓ История заказов получена. Количество заказов: {len(orders)}")
                if orders:
                    for order in orders:
                        print(f"  - Заказ {order['order_number']}: {order['status']} - {order['total_amount']} тг")
            else:
                error_text = await response.text()
                print(f"✗ Ошибка получения заказов: {response.status} - {error_text}")

        # 5. Получаем конкретный заказ
        print(f"\n5. Получаем детали заказа {order_id}...")
        async with session.get(
            f'http://localhost:8000/api/v1/orders/{order_id}',
            headers=headers
        ) as response:
            if response.status == 200:
                order_details = await response.json()
                print(f"✓ Детали заказа получены:")
                print(f"  Номер: {order_details['order_number']}")
                print(f"  Статус: {order_details['status']}")
                print(f"  Сумма: {order_details['total_amount']} тг")
                print(f"  Товаров: {len(order_details['items'])}")
            else:
                error_text = await response.text()
                print(f"✗ Ошибка получения деталей заказа: {response.status} - {error_text}")

if __name__ == "__main__":
    asyncio.run(test_auth_and_order())