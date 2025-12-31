/**
 * Клиентская конфигурация Sentry
 * Инициализируется в браузере
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Включаем отправку PII (персональных данных) для пользователей
  sendDefaultPii: true,

  // Настройка трассировки производительности
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 10% в production, 100% в development

  // Окружение
  environment: process.env.NODE_ENV || "development",

  // Интеграции
  integrations: [],

  // Игнорируем известные ошибки, которые не требуют отправки
  ignoreErrors: [
    // Ошибки сети (ожидаемые в офлайн-режиме)
    "NetworkError",
    "Failed to fetch",
    "Network request failed",
    // Ошибки, связанные с расширениями браузера
    "ResizeObserver loop limit exceeded",
    // Chrome extensions
    "chrome-extension://",
    // Firefox extensions
    "moz-extension://",
  ],

  // Фильтрация событий перед отправкой
  beforeSend(event, hint) {
    // В development режиме не отправляем, если DSN не установлен
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.NEXT_PUBLIC_SENTRY_DSN
    ) {
      return null;
    }

    // Игнорируем ошибки из известных источников (например, расширения браузера)
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message);
        if (
          message.includes("chrome-extension://") ||
          message.includes("moz-extension://") ||
          message.includes("ResizeObserver loop")
        ) {
          return null;
        }
      }
    }

    return event;
  },
});
