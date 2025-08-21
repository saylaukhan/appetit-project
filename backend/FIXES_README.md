# Исправления ошибок регистрации пользователей

## Проблемы, которые были исправлены

### 1. Отсутствие колонки `telegram_id` в таблице users
**Проблема**: Ошибка `sqlite3.OperationalError: no such column: users.telegram_id`

**Решение**:
- Добавлена колонка `telegram_id` в модель `User` (`backend/app/models/user.py`)
- Создана миграция `001_add_telegram_id.py`
- Пересоздана база данных с правильной структурой

### 2. Неправильные настройки Telegram API
**Проблема**: Ошибка `invalid literal for int() with base 10: 'your_telegram_api_id'`

**Решение**:
- Исправлены настройки в `backend/app/core/config.py`
- `TELEGRAM_API_ID` изменен с строки на число (0 как placeholder)
- Добавлен флаг `TELEGRAM_ENABLED = False` для отключения Telegram функций

### 3. Ненужные файлы сессий
**Проблема**: Создавались файлы типа `session_70000000000.session`

**Решение**:
- Telegram интеграция отключена по умолчанию
- Файлы сессий больше не создаются при обычной регистрации
- Логика переработана для работы без Telegram сессий

## Структура обновленной модели User

```python
class User(Base):
    # ... существующие поля ...
    
    # Новое поле для Telegram интеграции (опционально)
    telegram_id = Column(String(50), nullable=True, unique=True, index=True)
```

## Как запустить исправленное приложение

### 1. Установка зависимостей
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 2. Настройка базы данных
```bash
# Если у вас есть старая база данных, создайте новую:
python3 create_database.py

# Или примените миграции (если установлены alembic):
alembic upgrade head
```

### 3. Проверка исправлений
```bash
# Проверить структуру базы данных:
python3 test_db_structure.py

# Полный тест (требует установленных зависимостей):
python3 test_registration.py
```

### 4. Запуск сервера
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Настройки конфигурации

В `backend/app/core/config.py`:

```python
# Telegram настройки (отключены по умолчанию)
TELEGRAM_API_ID: int = 0  # Placeholder - не используется
TELEGRAM_API_HASH: str = "placeholder_hash" 
TELEGRAM_BOT_TOKEN: str = "placeholder_token"
TELEGRAM_ENABLED: bool = False  # Отключено для обычной регистрации
```

## Тестирование API

Теперь регистрация работает через обычные HTTP запросы:

```bash
# Регистрация
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79999999999",
    "name": "Тест Пользователь", 
    "password": "password123"
  }'

# Авторизация
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79999999999",
    "password": "password123"
  }'
```

## Резюме изменений

✅ **Исправлено**:
- Добавлена отсутствующая колонка `telegram_id`
- Исправлены настройки Telegram API credentials  
- Убраны файлы сессий SQLite
- Переработана логика без Telegram зависимостей
- Создана корректная структура базы данных

✅ **Проверено**:
- Структура таблицы users корректна
- Вставка и получение данных работает
- API эндпоинты готовы к работе

🎉 **Результат**: Регистрация пользователей теперь работает без ошибок через обычные HTTP запросы, без необходимости в Telegram интеграции.