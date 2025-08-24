import sqlite3
import json

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Check if orders table exists and has data
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = cursor.fetchall()
print('Tables:', [t[0] for t in tables])

# Check orders
cursor.execute('SELECT COUNT(*) FROM orders')
orders_count = cursor.fetchone()[0]
print('Orders count:', orders_count)

if orders_count > 0:
    cursor.execute('SELECT * FROM orders LIMIT 5')
    orders = cursor.fetchall()
    cursor.execute('PRAGMA table_info(orders)')
    columns = cursor.fetchall()
    print('Orders columns:', [col[1] for col in columns])
    print('Sample order:', orders[0])

# Check users
cursor.execute('SELECT COUNT(*) FROM users')
users_count = cursor.fetchone()[0]
print('Users count:', users_count)

if users_count > 0:
    cursor.execute('SELECT id, phone, name, role FROM users LIMIT 5')
    users = cursor.fetchall()
    print('Sample users:', users)

conn.close()