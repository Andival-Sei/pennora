/**
 * Утилиты для работы с сетью
 */

/**
 * Проверяет, является ли ошибка сетевой ошибкой
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Проверяем наличие сети
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  // Проверяем типы ошибок
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("failed to fetch")
    );
  }

  // Проверяем объекты ошибок Supabase
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    // Supabase может возвращать ошибки с кодом или сообщением
    if (
      err.code === "PGRST301" ||
      err.message?.toString().includes("network")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Проверяет, доступна ли сеть
 */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
