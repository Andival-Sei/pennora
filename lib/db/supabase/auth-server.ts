import { cache } from "react";
import { createClient } from "./server";
import type { User } from "@supabase/supabase-js";

/**
 * Кеширует результат getUser() для серверных компонентов
 * Использует React cache для кеширования в рамках одного запроса
 *
 * ВАЖНО: Используйте только в серверных компонентах!
 *
 * @returns Пользователь или null
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Получает пользователя с проверкой авторизации (для серверных компонентов)
 * Выбрасывает ошибку, если пользователь не авторизован
 *
 * @returns Пользователь (не null)
 * @throws Error если пользователь не авторизован
 */
export async function getAuthenticatedUser(): Promise<User> {
  const user = await getCachedUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }
  return user;
}

/**
 * Получает ID пользователя с проверкой авторизации (для серверных компонентов)
 *
 * @returns ID пользователя
 * @throws Error если пользователь не авторизован
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const user = await getAuthenticatedUser();
  return user.id;
}
