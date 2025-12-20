-- Миграция: Добавление полей настроек пользователя в таблицу profiles
-- Добавляет поля для хранения темы, языка и валюты отображения

-- Добавляем поля настроек приложения
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'ru' CHECK (locale IN ('ru', 'en')),
ADD COLUMN IF NOT EXISTS display_currency TEXT DEFAULT 'RUB' CHECK (display_currency IN ('RUB', 'USD', 'EUR'));

-- Обновляем updated_at при изменении настроек
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаём триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Комментарии к полям
COMMENT ON COLUMN profiles.theme IS 'Тема оформления: light, dark, system';
COMMENT ON COLUMN profiles.locale IS 'Язык интерфейса: ru, en';
COMMENT ON COLUMN profiles.display_currency IS 'Валюта для отображения балансов: RUB, USD, EUR';

