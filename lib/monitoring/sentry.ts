/**
 * Утилиты для работы с Sentry
 * Централизованные функции для отправки ошибок и установки контекста
 */

/**
 * Проверяет, доступен ли Sentry (инициализирован ли SDK)
 */
function isSentryAvailable(): boolean {
  try {
    // Используем require для проверки доступности Sentry в runtime
    // Это необходимо, так как Sentry может быть не инициализирован
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs");
    return typeof Sentry.captureException === "function";
  } catch {
    return false;
  }
}

/**
 * Контекст для отправки ошибок
 */
export interface SentryErrorContext {
  /** Дополнительные данные */
  extra?: Record<string, unknown>;
  /** Теги для фильтрации */
  tags?: Record<string, string>;
  /** Контекст (например, queryKey для React Query) */
  contexts?: Record<string, unknown>;
  /** Уровень ошибки */
  level?: "fatal" | "error" | "warning" | "info" | "debug";
}

/**
 * Отправляет ошибку в Sentry
 *
 * @param error - Ошибка для отправки
 * @param context - Дополнительный контекст
 */
export function captureError(
  error: unknown,
  context?: SentryErrorContext
): void {
  if (!isSentryAvailable()) {
    // В development режиме логируем в консоль
    if (process.env.NODE_ENV === "development") {
      console.error("Sentry not available, error:", error);
      if (context) {
        console.error("Context:", context);
      }
    }
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs");

    Sentry.captureException(error, {
      extra: context?.extra,
      tags: context?.tags,
      contexts: context?.contexts,
      level: context?.level || "error",
    });
  } catch (err) {
    // Если что-то пошло не так, просто логируем
    console.error("Failed to capture error in Sentry:", err);
  }
}

/**
 * Устанавливает контекст пользователя в Sentry
 *
 * @param user - Информация о пользователе
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  if (!isSentryAvailable()) {
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs");

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.email,
    });
  } catch (err) {
    console.error("Failed to set user context in Sentry:", err);
  }
}

/**
 * Очищает контекст пользователя в Sentry
 */
export function clearUserContext(): void {
  if (!isSentryAvailable()) {
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs");

    Sentry.setUser(null);
  } catch (err) {
    console.error("Failed to clear user context in Sentry:", err);
  }
}

/**
 * Добавляет breadcrumb в Sentry
 *
 * @param message - Сообщение breadcrumb
 * @param data - Дополнительные данные
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  if (!isSentryAvailable()) {
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs");

    Sentry.addBreadcrumb({
      message,
      data,
      level: "info",
      timestamp: Date.now() / 1000,
    });
  } catch (err) {
    console.error("Failed to add breadcrumb in Sentry:", err);
  }
}
