import sqlite3
from datetime import datetime

def create_test_order():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    current_time = datetime.now().isoformat()
    
    print('🎯 СОЗДАНИЕ ТЕСТОВОГО ЗАКАЗА ДЛЯ ПРОВЕРКИ СОРТИРОВКИ')
    print('=' * 60)
    print(f'⏰ Текущее время: {current_time}')
    
    # Создаем заказ с текущим временем
    test_order = (
        'ORD-2025-ТЕСТ999',  # Номер заказа
        'Тест Клиент НОВЫЙ',  # Имя клиента
        '+77777777777',       # Телефон
        'DELIVERY',           # Тип доставки
        'ул. Тестовая 999',   # Адрес
        'PENDING',            # Статус
        'CARD',               # Способ оплаты
        2500.0,               # Подитог
        2800.0,               # Общая сумма
        300.0,                # Доставка
        0,                    # Скидка
        current_time          # Время создания (ТЕКУЩЕЕ!)
    )
    
    cursor.execute('''INSERT INTO orders 
                     (order_number, customer_name, customer_phone, delivery_type, 
                      delivery_address, status, payment_method, subtotal, total_amount, 
                      delivery_fee, discount_amount, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', test_order)
    
    order_id = cursor.lastrowid
    print(f'✅ Создан заказ ID: {order_id} | {test_order[0]}')
    
    # Добавляем один товар к заказу
    cursor.execute('''INSERT INTO order_items 
                     (order_id, dish_name, quantity, unit_price, total_price) 
                     VALUES (?, ?, ?, ?, ?)''', 
                   (order_id, 'Тест Пицца', 1, 2500.0, 2500.0))
    
    conn.commit()
    
    print('')
    print('🧪 ПРОВЕРКА СОРТИРОВКИ:')
    cursor.execute('''SELECT order_number, customer_name, created_at
                      FROM orders 
                      WHERE order_number LIKE "ORD-2025-%" 
                      ORDER BY created_at DESC 
                      LIMIT 3''')

    orders = cursor.fetchall()
    print('📋 ТОП-3 САМЫХ НОВЫХ ЗАКАЗА:')
    for i, order in enumerate(orders, 1):
        number, name, created_at = order
        emoji = '🥇' if i == 1 else '🥈' if i == 2 else '🥉'
        print(f'{emoji} {number} | {name} | {created_at}')

    print('')
    print('🎯 ПРОВЕРЬТЕ СЕЙЧАС В БРАУЗЕРЕ:')
    print('1. Обновите "Управление заказами" - новый заказ должен быть ПЕРВЫМ')
    print('2. Обновите "Дашборд" - новый заказ должен появиться в таблице')
    print('3. Подождите 30 секунд - данные должны обновиться автоматически')

    conn.close()

if __name__ == "__main__":
    create_test_order()