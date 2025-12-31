/**
 * Edge конфигурация Sentry
 * Инициализируется в Edge runtime
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Настройка трассировки производительности (меньше для edge)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Окружение
  environment: process.env.NODE_ENV || "development",

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
