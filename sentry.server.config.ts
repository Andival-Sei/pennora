/**
 * Серверная конфигурация Sentry
 * Инициализируется в Node.js runtime
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Настройка трассировки производительности
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 10% в production, 100% в development

  // Окружение
  environment: process.env.NODE_ENV || "development",

  // Игнорируем известные ошибки
  ignoreErrors: [
    // Ошибки сети (ожидаемые в офлайн-режиме)
    "NetworkError",
    "Failed to fetch",
    "Network request failed",
  ],

  // Фильтрация событий перед отправкой
  beforeSend(event) {
    // В development режиме не отправляем, если DSN не установлен
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.NEXT_PUBLIC_SENTRY_DSN
    ) {
      return null;
    }

    return event;
  },
});
