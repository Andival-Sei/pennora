import { createClient } from "./client";
import type { User } from "@supabase/supabase-js";

/**
 * Получает пользователя для клиентских компонентов
 * Не использует кеширование, так как в клиентских компонентах
 * лучше использовать React Query или контекст
 *
 * @returns Пользователь или null
 */
export async function getClientUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
