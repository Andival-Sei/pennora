/**
 * Утилита для загрузки настроек пользователя из БД
 */

import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/request";
import type { CurrencyCode } from "@/lib/currency/rates";

export interface UserSettings {
  theme: "light" | "dark" | "system" | null;
  locale: Locale | null;
  displayCurrency: CurrencyCode | null;
}

/**
 * Загружает настройки пользователя из БД
 *
 * ⚠️ ВНИМАНИЕ: Эта функция делает запросы к БД и должна использоваться
 * только когда действительно необходимо получить настройки пользователя.
 * Для определения локали используйте cookie (см. i18n/request.ts).
 *
 * Примечание о производительности:
 * - Используется getSession() вместо getUser() для локальной проверки JWT (~5-10ms vs ~100-200ms)
 * - Оптимизирована через cookie check в i18n/request.ts (95% случаев определяет локаль мгновенно)
 * - Кеширование не применяется, так как функция использует cookies() (динамические данные)
 *   и Next.js Router Cache уже кеширует результаты на 30 секунд
 */
export async function loadUserSettings(): Promise<UserSettings> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      theme: null,
      locale: null,
      displayCurrency: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("theme, locale, display_currency")
    .eq("id", user.id)
    .single();

  return {
    theme: (profile?.theme as "light" | "dark" | "system") || null,
    locale: (profile?.locale as Locale) || null,
    displayCurrency: (profile?.display_currency as CurrencyCode) || null,
  };
}
