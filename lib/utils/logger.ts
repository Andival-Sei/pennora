/**
 * Централизованный логгер с интеграцией Sentry
 *
 * В development: логирует в console
 * В production: отправляет ошибки в Sentry, консоль чистая
 */

import { captureError, addBreadcrumb } from "@/lib/monitoring/sentry";
import { isNetworkError } from "./network";

const isDev = process.env.NODE_ENV === "development";

/**
 * Уровни логирования
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Контекст для лога
 */
export interface LogContext {
  /** Модуль/компонент источника */
  module?: string;
  /** Дополнительные данные */
  extra?: Record<string, unknown>;
  /** Теги для Sentry */
  tags?: Record<string, string>;
  /** Отправлять ли в Sentry (по умолчанию true для error) */
  sendToSentry?: boolean;
  /** Ожидаемая ошибка - не отправлять в Sentry (например, сетевая в offline-first) */
  isExpectedError?: boolean;
}

/**
 * Интерфейс логгера
 */
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(error: unknown, context?: LogContext): void;
  /** Создание логгера с привязкой к модулю */
  child(module: string): Logger;
}

/**
 * Определяет, нужно ли отправлять ошибку в Sentry
 */
function shouldSendToSentry(error: unknown, context?: LogContext): boolean {
  // Явно указано не отправлять
  if (context?.sendToSentry === false) return false;

  // Явно указано, что ошибка ожидаемая
  if (context?.isExpectedError === true) return false;

  // Сетевые ошибки не отправляем (offline-first архитектура)
  if (isNetworkError(error)) return false;

  return true;
}

/**
 * Форматирует префикс модуля
 */
function formatPrefix(module?: string): string {
  return module ? `[${module}]` : "[app]";
}

/**
 * Создает логгер с опциональной привязкой к модулю
 */
function createLogger(parentModule?: string): Logger {
  const getModule = (context?: LogContext): string =>
    context?.module || parentModule || "app";

  return {
    debug(message: string, context?: LogContext): void {
      if (isDev) {
        const prefix = formatPrefix(getModule(context));
        if (context?.extra) {
          console.debug(prefix, message, context.extra);
        } else {
          console.debug(prefix, message);
        }
      }
    },

    info(message: string, context?: LogContext): void {
      if (isDev) {
        const prefix = formatPrefix(getModule(context));
        if (context?.extra) {
          console.info(prefix, message, context.extra);
        } else {
          console.info(prefix, message);
        }
      }
      // Breadcrumb для трассировки в Sentry
      addBreadcrumb(message, {
        module: getModule(context),
        ...context?.extra,
      });
    },

    warn(message: string, context?: LogContext): void {
      if (isDev) {
        const prefix = formatPrefix(getModule(context));
        if (context?.extra) {
          console.warn(prefix, message, context.extra);
        } else {
          console.warn(prefix, message);
        }
      }
      // Breadcrumb для трассировки
      addBreadcrumb(`[WARN] ${message}`, {
        module: getModule(context),
        ...context?.extra,
      });
    },

    error(error: unknown, context?: LogContext): void {
      if (isDev) {
        const prefix = formatPrefix(getModule(context));
        if (context?.extra) {
          console.error(prefix, error, context.extra);
        } else {
          console.error(prefix, error);
        }
      }

      // Отправка в Sentry если нужно
      if (shouldSendToSentry(error, context)) {
        captureError(error, {
          extra: {
            module: getModule(context),
            ...context?.extra,
          },
          tags: context?.tags,
          level: "error",
        });
      }
    },

    child(module: string): Logger {
      return createLogger(module);
    },
  };
}

/**
 * Глобальный логгер
 */
export const logger = createLogger();

/**
 * Создает логгер для конкретного модуля
 *
 * @example
 * const log = createModuleLogger('sync');
 * log.error(error); // автоматически добавит module: 'sync'
 */
export function createModuleLogger(module: string): Logger {
  return createLogger(module);
}
