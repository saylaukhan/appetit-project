# Настройка Telegram Login Widget для APPETIT

## Шаг 1: Создание Telegram бота

1. Откройте Telegram и найдите бота [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям:
   - Придумайте название для бота (например: "APPETIT Login Bot")
   - Придумайте username для бота (например: "appetit_login_bot")
4. BotFather предоставит вам токен бота в формате: `123456789:ABCdefGHIjklMNOpqrSTUvwxyz`

## Шаг 2: Настройка домена для Login Widget

1. В чате с @BotFather отправьте команду `/setdomain`
2. Выберите созданного бота
3. Укажите домен вашего приложения (например: `localhost:3000` для разработки или `appetit.kz` для продакшена)

## Шаг 3: Конфигурация backend

1. Откройте файл `.env` в папке `backend/` (или создайте его)
2. Добавьте следующие переменные:

```env
TELEGRAM_BOT_TOKEN=ВАШ_ТОКЕН_БОТА
TELEGRAM_BOT_USERNAME=ВАШ_USERNAME_БОТА
```

Например:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
TELEGRAM_BOT_USERNAME=appetit_login_bot
```

## Шаг 4: Обновление конфигурации frontend

1. Откройте файл `frontend/src/components/common/TelegramLoginWidget.jsx`
2. Замените `botUsername="appetit_bot"` на ваш реальный username бота:

```jsx
<TelegramLoginWidget 
  botUsername="ваш_username_бота" 
  className={styles.telegramWidget}
/>
```

## Шаг 5: Миграция базы данных

Выполните SQL миграцию для добавления полей Telegram:

```bash
# Если используете SQLite
sqlite3 database.db < migrate_telegram.sql

# Или выполните команды вручную в вашей СУБД
```

## Шаг 6: Перезапуск сервисов

1. Перезапустите backend сервер:
```bash
cd backend
python main.py
```

2. Перезапустите frontend:
```bash
cd frontend
npm start
```

## Тестирование

1. Откройте страницу авторизации
2. Должна появиться кнопка "Log in with Telegram"
3. При нажатии откроется окно Telegram для авторизации
4. После подтверждения пользователь будет автоматически зарегистрирован/авторизован

## Важные замечания

- Домен должен быть настроен корректно в @BotFather
- Для HTTPS сайтов требуется HTTPS домен
- Для разработки можно использовать `localhost`
- Токен бота должен быть сохранен в безопасности

## Безопасность

- Никогда не публикуйте токен бота в публичных репозиториях
- Используйте переменные окружения для хранения конфиденциальных данных
- Проверка подлинности данных от Telegram выполняется автоматически

## Устранение неполадок

1. **Кнопка не появляется**: Проверьте настройку домена в @BotFather
2. **Ошибка авторизации**: Проверьте правильность токена бота
3. **CORS ошибки**: Убедитесь, что домен добавлен в CORS настройки

