"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/request";

/**
 * Сохраняет начальные настройки пользователя при первом входе/регистрации
 * Берет язык из cookie, тему из localStorage (через клиент)
 */
export async function saveInitialSettings(userId: string) {
  const supabase = await createClient();

  // Получаем текущую локаль из cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale = (localeCookie === "en" ? "en" : "ru") as Locale;

  // Обновляем профиль с начальными настройками
  // Тема будет установлена на клиенте через ThemeInitializer
  const { error } = await supabase
    .from("profiles")
    .update({
      locale: locale,
      theme: "system", // По умолчанию системная тема
    })
    .eq("id", userId);

  if (error) {
    console.error("Error saving initial settings:", error);
  }
}
