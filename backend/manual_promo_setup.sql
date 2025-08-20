-- Создание таблицы промокодов, если она не существует
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_limit_per_user INTEGER DEFAULT 1,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    total_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Создание таблицы использования промокодов
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id SERIAL PRIMARY KEY,
    promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_phone VARCHAR(20),
    user_email VARCHAR(255),
    order_id INTEGER,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Вставка тестовых промокодов
INSERT INTO promo_codes (code, name, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, usage_limit_per_user, valid_until, is_active)
VALUES 
    ('WELCOME10', 'Скидка для новых клиентов', '10% скидка на первый заказ', 'percentage', 10.00, 2000.00, 500.00, 100, 1, NOW() + INTERVAL '30 days', true),
    ('TESTPROMO', 'Тестовый промокод', '15% скидка для тестирования', 'percentage', 15.00, 1000.00, 300.00, 50, 3, NOW() + INTERVAL '365 days', true),
    ('DELIVERY500', 'Скидка на доставку', '500₸ скидка', 'fixed', 500.00, 1500.00, null, 200, 2, NOW() + INTERVAL '14 days', true)
ON CONFLICT (code) DO NOTHING;

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_usage_promo_user ON promo_code_usage(promo_code_id, user_id);
