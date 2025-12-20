-- Миграция: Разрешение NULL для default_currency в profiles
-- Позволяет использовать NULL для обозначения "не прошел онбординг"

-- Удаляем NOT NULL constraint с default_currency (если он есть)
-- Сначала проверяем, есть ли constraint, и удаляем его
DO $$
BEGIN
  -- Проверяем, есть ли NOT NULL constraint
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'default_currency'
      AND is_nullable = 'NO'
  ) THEN
    -- Удаляем NOT NULL constraint
    ALTER TABLE profiles 
    ALTER COLUMN default_currency DROP NOT NULL;
  END IF;
END $$;

-- Комментарий к полю
COMMENT ON COLUMN profiles.default_currency IS 
'Валюта по умолчанию. NULL означает, что пользователь не прошел онбординг.';

