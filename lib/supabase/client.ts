import { createBrowserClient } from "@supabase/ssr";

/**
 * Создаёт Supabase клиент для использования в браузере (Client Components)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
