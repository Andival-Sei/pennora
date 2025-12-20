-- Миграция: Сохранение начальных настроек при создании профиля
-- Обновляет функцию создания профиля для сохранения языка и темы из cookie/localStorage

-- Функция для получения начальной локали из cookie (вызывается при создании профиля)
-- В реальности это будет делаться на стороне приложения, но для триггера используем дефолтные значения
CREATE OR REPLACE FUNCTION on_profile_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Создаём предустановленные категории (только если их ещё нет)
  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = NEW.id LIMIT 1) THEN
    PERFORM create_default_categories(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION on_profile_created() IS 
'Автоматически создаёт предустановленные категории при создании профиля пользователя. Начальные настройки (язык, тема) устанавливаются на стороне приложения при первом входе.';

