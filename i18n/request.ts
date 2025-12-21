import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { loadUserSettings } from "@/lib/settings/load-user-settings";

// Поддерживаемые локали
export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

/**
 * Определяет локаль пользователя из:
 * 1. Cookie (если пользователь выбрал язык) - ПРИОРИТЕТ для производительности
 * 2. Настройки пользователя в БД (если залогинен и нет cookie)
 * 3. Accept-Language заголовка браузера
 * 4. По умолчанию — русский
 */
async function getLocale(): Promise<Locale> {
  // Сначала проверяем cookie - это самый быстрый способ и не требует БД
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale;
  }

  // Только если нет cookie, проверяем настройки пользователя в БД
  // Это происходит только при первом визите или после очистки cookie
  try {
    const settings = await loadUserSettings();
    if (settings.locale && locales.includes(settings.locale)) {
      return settings.locale;
    }
  } catch {
    // Игнорируем ошибки при загрузке настроек (пользователь может быть не залогинен)
  }

  // Проверяем Accept-Language заголовок
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  if (acceptLanguage) {
    // Парсим Accept-Language: "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
    const languages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().split("-")[0]);

    for (const lang of languages) {
      if (locales.includes(lang as Locale)) {
        return lang as Locale;
      }
    }
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await getLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
