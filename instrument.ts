/**
 * Инструментация Sentry для Next.js
 * Регистрирует конфигурации для разных runtime окружений
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Регистрирует конфигурации Sentry для разных runtime
 * Вызывается автоматически Next.js при старте приложения
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Обработчик ошибок для серверных компонентов, middleware и прокси
 * Перехватывает ошибки на уровне запроса
 */
export const onRequestError = Sentry.captureRequestError;
