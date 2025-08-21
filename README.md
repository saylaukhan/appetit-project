# 🍕 APPETIT - Food Delivery Platform

![APPETIT Logo](./assets/Logo%20APPETIT.png)

**APPETIT** - это современная платформа доставки еды, разработанная с использованием React и FastAPI. Система включает в себя клиентский интерфейс, административную панель, интерфейс кухни (KDS) и мобильное приложение для курьеров.

## 🚀 Особенности

### 👥 Многоролевая система
- **Клиенты** - заказ еды, отслеживание доставки
- **Администраторы** - управление заказами, меню, аналитика
- **Кухня** - Kitchen Display System (KDS) для планшетов
- **Курьеры** - мобильный интерфейс с геолокацией

### 🎨 Дизайн и UX
- **Брендинг APPETIT** с фирменными шрифтами TTHoves
- **Адаптивный дизайн** для всех устройств
- **Современный UI** с CSS модулями
- **Темная/светлая тема** поддержка

### 🔧 Технологии

**Frontend:**
- React 18 + Vite
- CSS Modules
- React Router DOM
- React Query
- React Hot Toast
- Lucide React (иконки)
- JWT аутентификация

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite база данных
- JWT токены
- Swagger/OpenAPI документация
- Alembic миграции

## 📦 Установка и запуск

### Предварительные требования
- Node.js 18+
- Python 3.9+
- Git

### 🔧 Установка

1. **Клонируем репозиторий:**
```bash
git clone https://github.com/saylaukhan/appetit-project.git
cd appetit-project
```

2. **Настройка Backend:**
```bash
cd backend
pip install -r requirements.txt
python seed_database.py  # Заполнение тестовыми данными
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. **Настройка Frontend:**
```bash
cd frontend
npm install
npm run dev
```

4. **Настройка Telegram авторизации:**

См. подробные инструкции в файле [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)

Краткая настройка:
- Создайте бота через [@BotFather](https://t.me/botfather)
- Получите токен бота
- Настройте домен в @BotFather
- Добавьте токен в переменные окружения backend

### 🌐 Доступ к приложению

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Документация:** http://localhost:8000/docs

## 👤 Тестовые аккаунты

| Роль | Телефон | Пароль | Доступ |
|------|---------|---------|---------|
| 👨‍💼 Администратор | +77771234567 | admin123 | /admin |
| 👨‍🍳 Кухня | +77772345678 | kitchen123 | /kitchen |
| 🚗 Курьер | +77773456789 | courier123 | /courier |
| 👤 Клиент | +77774567890 | client123 | / |

## 📱 Интерфейсы

### 🛒 Клиентский интерфейс
- Каталог блюд с фильтрацией
- Корзина и оформление заказа
- Отслеживание статуса доставки
- Личный кабинет и история заказов

### ⚡ Административная панель
- **Дашборд** с основной статистикой
- **Управление заказами** в реальном времени
- **Управление меню** и категориями
- **Аналитика** с графиками и отчетами
- **Промокоды** и маркетинговые кампании

### 🍳 Kitchen Display System (KDS)
- Отображение активных заказов
- Управление статусами приготовления
- Таймеры и приоритизация
- Оптимизировано для планшетов

### 📱 Мобильный интерфейс курьера
- Список назначенных заказов
- Навигация и геолокация
- Обновление статусов доставки
- Связь с клиентами

## 🎯 Основные функции

### 🔐 Аутентификация
- JWT токены с ролевым доступом
- **Telegram Login Widget** для быстрой авторизации
- Защищенные маршруты
- Автоматическое перенаправление

### 📊 Аналитика
- Статистика продаж и заказов
- Графики по времени и популярности блюд
- Анализ клиентской базы
- Экспорт отчетов

### 💰 Промокоды
- Процентные и фиксированные скидки
- Условия и ограничения использования
- Отслеживание эффективности
- Управление активностью

## 🗂 Структура проекта

```
appetit-project/
├── 📁 frontend/           # React приложение
│   ├── 📁 public/         # Статические файлы
│   │   └── 📁 assets/     # Логотипы, шрифты
│   └── 📁 src/
│       ├── 📁 components/ # Компоненты
│       ├── 📁 pages/      # Страницы
│       ├── 📁 contexts/   # React контексты
│       ├── 📁 services/   # API сервисы
│       └── 📁 styles/     # Глобальные стили
├── 📁 backend/            # FastAPI приложение
│   ├── 📁 app/
│   │   ├── 📁 api/        # API маршруты
│   │   ├── 📁 core/       # Настройки, БД
│   │   ├── 📁 models/     # SQLAlchemy модели
│   │   ├── 📁 schemas/    # Pydantic схемы
│   │   └── 📁 services/   # Бизнес логика
│   └── 📄 main.py         # Входная точка
└── 📁 assets/             # Дизайн-система
    └── 📁 примеры страниц/ # UI мокапы
```

## 🔄 API Endpoints

### 🔐 Аутентификация
- `POST /api/v1/auth/register` - Регистрация (deprecated)
- `POST /api/v1/auth/login` - Вход (deprecated)
- `POST /api/v1/auth/telegram` - **Авторизация через Telegram**
- `GET /api/v1/auth/me` - Получение текущего пользователя

### 🍕 Меню
- `GET /api/v1/menu/categories` - Категории
- `GET /api/v1/menu/dishes` - Блюда
- `GET /api/v1/menu/dishes/{id}` - Детали блюда

### 📦 Заказы
- `POST /api/v1/orders/` - Создание заказа
- `GET /api/v1/orders/{id}` - Детали заказа
- `PUT /api/v1/orders/{id}/status` - Обновление статуса

## 🚀 Развертывание

### 🐳 Docker
```bash
# Сборка и запуск
docker-compose up --build

# В фоновом режиме
docker-compose up -d
```

### ☁️ Производство
- Frontend: Vercel, Netlify
- Backend: Railway, Heroku
- База данных: PostgreSQL, MongoDB

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку функций (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Запушьте в ветку (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

## 📞 Контакты

- **GitHub:** [@saylaukhan](https://github.com/saylaukhan)
- **Email:** your-email@example.com

---

<div align="center">
  <strong>Сделано с ❤️ для APPETIT</strong>
</div>