-- Добавление новых полей адреса в таблицу users
-- Выполнить этот SQL скрипт для обновления структуры базы данных

ALTER TABLE users ADD COLUMN address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN address_street VARCHAR(200);
ALTER TABLE users ADD COLUMN address_entrance VARCHAR(10);
ALTER TABLE users ADD COLUMN address_floor VARCHAR(10);
ALTER TABLE users ADD COLUMN address_apartment VARCHAR(20);
ALTER TABLE users ADD COLUMN address_comment TEXT;
ALTER TABLE users ADD COLUMN address_latitude FLOAT;
ALTER TABLE users ADD COLUMN address_longitude FLOAT;

-- Проверка что поля добавлены
PRAGMA table_info(users);
