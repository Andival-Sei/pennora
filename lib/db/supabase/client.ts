import { createBrowserClient } from "@supabase/ssr";

/**
 * Создаёт Supabase клиент для использования в браузере (Client Components)
 *
 * Примечание: Создание нового клиента при каждом вызове - это рекомендуемый подход
 * от Supabase для обеспечения безопасности и правильной работы с cookies/sessions.
 * `createBrowserClient` оптимизирован внутри и не создает избыточных ресурсов.
 *
 * Для лучшей производительности клиент должен создаваться в начале каждой query/mutation
 * функции, а не переиспользоваться между разными запросами.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
