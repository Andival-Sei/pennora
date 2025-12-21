-- Миграция: Функция для удаления пользователя из auth.users
-- 
-- Эта миграция создаёт функцию, которая позволяет удалить пользователя
-- из auth.users после удаления всех связанных данных

-- Функция для удаления пользователя из auth.users
-- Использует SECURITY DEFINER для получения прав на удаление из auth.users
CREATE OR REPLACE FUNCTION public.delete_auth_user(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Удаляем пользователя из auth.users
  -- Это требует прав суперпользователя, которые предоставляет SECURITY DEFINER
  DELETE FROM auth.users WHERE id = user_uuid;
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION public.delete_auth_user(UUID) IS
'Удаляет пользователя из auth.users. Используется при удалении аккаунта.';

