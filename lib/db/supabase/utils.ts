import { createClient } from "./client";
import { createClient as createServerClient } from "./server";
import { getAuthenticatedUser } from "./auth-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Создает Supabase клиент с предварительной проверкой авторизации пользователя
 * Полезно для серверных компонентов, где нужна гарантия авторизации
 *
 * @returns Supabase клиент и пользователь
 * @throws Error если пользователь не авторизован
 */
export async function createAuthenticatedClient(): Promise<{
  supabase: SupabaseClient<Database>;
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>;
}> {
  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();
  return { supabase, user };
}

/**
 * Выполняет несколько запросов параллельно
 * Полезно для оптимизации производительности при множественных запросах
 *
 * @param queries - Массив функций-запросов
 * @returns Массив результатов запросов
 */
export async function batchQueries<T>(
  queries: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(queries.map((query) => query()));
}

/**
 * Создает Supabase клиент для клиентских компонентов
 * Используется в браузере
 *
 * @returns Supabase клиент
 */
export function createClientSupabase(): SupabaseClient<Database> {
  return createClient();
}

/**
 * Создает Supabase клиент для серверных компонентов
 * Используется на сервере
 *
 * @returns Supabase клиент
 */
export async function createServerSupabase(): Promise<
  SupabaseClient<Database>
> {
  return createServerClient();
}
