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

