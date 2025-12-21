/**
 * Утилиты для обработки ошибок и преобразования их в понятные сообщения
 */

import { isNetworkError } from "./network";

/**
 * Типы ошибок Supabase
 */
export interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Проверяет, является ли ошибка ошибкой Supabase
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  if (!error || typeof error !== "object") return false;
  return "code" in error || "message" in error;
}

/**
 * Получает код ошибки Supabase
 */
function getSupabaseErrorCode(error: unknown): string | null {
  if (!isSupabaseError(error)) return null;
  return error.code || null;
}

/**
 * Получает сообщение об ошибке Supabase
 */
function getSupabaseErrorMessage(error: unknown): string {
  if (!isSupabaseError(error)) return "";
  return error.message || error.details || error.hint || "";
}

/**
 * Преобразует код ошибки Supabase в ключ перевода
 */
function getSupabaseErrorTranslationKey(error: unknown): string | null {
  const code = getSupabaseErrorCode(error);
  if (!code) return null;

  // PostgreSQL error codes
  const codeMap: Record<string, string> = {
    "23505": "errors.mutations.conflict", // Unique violation
    "23503": "errors.mutations.notFound", // Foreign key violation
    PGRST301: "errors.network.failed", // Network error from PostgREST
    "42501": "errors.mutations.forbidden", // Insufficient privilege
  };

  return codeMap[code] || null;
}

/**
 * Определяет тип ошибки и возвращает ключ перевода
 */
function getErrorTranslationKey(error: unknown): string {
  // Проверяем сетевые ошибки
  if (isNetworkError(error)) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return "errors.network.offline";
    }
    return "errors.network.failed";
  }

  // Проверяем ошибки Supabase
  if (isSupabaseError(error)) {
    // Проверяем код ошибки
    const codeKey = getSupabaseErrorTranslationKey(error);
    if (codeKey) return codeKey;

    // Проверяем сообщение на наличие ключевых слов
    const message = getSupabaseErrorMessage(error).toLowerCase();
    if (message.includes("network") || message.includes("connection")) {
      return "errors.network.failed";
    }
    if (message.includes("timeout")) {
      return "errors.network.timeout";
    }
    if (
      message.includes("unauthorized") ||
      message.includes("not authenticated")
    ) {
      return "errors.mutations.unauthorized";
    }
    if (message.includes("forbidden") || message.includes("permission")) {
      return "errors.mutations.forbidden";
    }
    if (message.includes("not found") || message.includes("does not exist")) {
      return "errors.mutations.notFound";
    }
    if (message.includes("conflict") || message.includes("duplicate")) {
      return "errors.mutations.conflict";
    }
  }

  // Проверяем стандартные ошибки Error
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("network") || message.includes("fetch")) {
      return "errors.network.failed";
    }
    if (message.includes("timeout")) {
      return "errors.network.timeout";
    }
    if (message.includes("unauthorized")) {
      return "errors.mutations.unauthorized";
    }
  }

  return "errors.unknown";
}

/**
 * Получает переведенное сообщение об ошибке
 *
 * @param error - Ошибка для обработки
 * @param t - Функция перевода из next-intl
 * @returns Переведенное сообщение об ошибке
 */
export function getErrorMessage(
  error: unknown,
  t: (key: string) => string
): string {
  const translationKey = getErrorTranslationKey(error);
  return t(translationKey);
}

/**
 * Получает детальное сообщение об ошибке (включая оригинальное сообщение, если доступно)
 */
export function getDetailedErrorMessage(
  error: unknown,
  t: (key: string) => string
): string {
  const baseMessage = getErrorMessage(error, t);

  // Если это известная ошибка с переводом, возвращаем только перевод
  const translationKey = getErrorTranslationKey(error);
  if (translationKey !== "errors.unknown") {
    return baseMessage;
  }

  // Для неизвестных ошибок добавляем оригинальное сообщение
  let originalMessage = "";

  if (isSupabaseError(error)) {
    originalMessage = getSupabaseErrorMessage(error);
  } else if (error instanceof Error) {
    originalMessage = error.message;
  } else if (typeof error === "string") {
    originalMessage = error;
  }

  if (originalMessage) {
    return `${baseMessage}: ${originalMessage}`;
  }

  return baseMessage;
}
