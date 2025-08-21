-- Добавление полей для Telegram авторизации
ALTER TABLE users ADD COLUMN telegram_id VARCHAR(50);
ALTER TABLE users ADD COLUMN telegram_username VARCHAR(100);
ALTER TABLE users ADD COLUMN telegram_first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN telegram_last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN telegram_photo_url VARCHAR(500);

-- Создание индекса для telegram_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Создание уникального индекса для telegram_id (только если значение не NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id_unique ON users(telegram_id) WHERE telegram_id IS NOT NULL;

