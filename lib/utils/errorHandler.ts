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
  return (
    "code" in error ||
    "message" in error ||
    "details" in error ||
    "hint" in error
  );
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
 * Маппинг ошибок Supabase Auth на ключи локализации
 */
const authErrorMap: Record<string, string> = {
  // Вход
  "Invalid login credentials": "errors.invalidCredentials",
  "Email not confirmed": "errors.emailNotConfirmed",
  "Invalid email or password": "errors.invalidCredentials",

  // Регистрация
  "User already registered": "errors.userAlreadyExists",
  "Password should be at least 6 characters": "errors.passwordTooShort",
  "Unable to validate email address: invalid format": "errors.invalidEmail",
  "Signup requires a valid password": "errors.passwordRequired",

  // Общие
  "Email rate limit exceeded": "errors.rateLimitExceeded",
  "For security purposes, you can only request this once every 60 seconds":
    "errors.rateLimitExceeded",
  "Database error saving new user": "errors.databaseError",

  // Сеть
  "fetch failed": "errors.networkError",
  "Failed to fetch": "errors.networkError",
};

/**
 * Получает сообщение об ошибке из различных типов ошибок
 */
function getErrorMessageString(error: unknown): string {
  if (isSupabaseError(error)) {
    return getSupabaseErrorMessage(error);
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "";
}

/**
 * Проверяет, является ли ошибка ошибкой аутентификации
 */
function isAuthError(error: unknown): boolean {
  const message = getErrorMessageString(error);
  if (!message) return false;

  // Проверяем точное совпадение
  if (authErrorMap[message]) {
    return true;
  }

  // Проверяем частичное совпадение
  const lowerMessage = message.toLowerCase();
  for (const [key] of Object.entries(authErrorMap)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Преобразует ошибку аутентификации в ключ перевода
 */
function getAuthErrorTranslationKey(error: unknown): string | null {
  if (!isAuthError(error)) return null;

  const message = getErrorMessageString(error);
  if (!message) return null;

  // Точное совпадение
  if (authErrorMap[message]) {
    return authErrorMap[message];
  }

  // Частичное совпадение
  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(authErrorMap)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  return null;
}

/**
 * Определяет тип ошибки и возвращает ключ перевода
 * Приоритет: сетевые ошибки > ошибки аутентификации > общие ошибки Supabase > стандартные ошибки
 */
export function getErrorTranslationKey(error: unknown): string {
  // Проверяем сетевые ошибки (высший приоритет)
  if (isNetworkError(error)) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return "errors.network.offline";
    }
    return "errors.network.failed";
  }

  // Проверяем ошибки аутентификации (перед общими ошибками Supabase)
  const authKey = getAuthErrorTranslationKey(error);
  if (authKey) {
    return authKey;
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
  // Логируем ошибку для отладки
  if (process.env.NODE_ENV === "development") {
    console.log("getErrorMessage called with:", error);
  }

  const translationKey = getErrorTranslationKey(error);

  // Убираем префикс "errors." если он есть, так как t уже в контексте "errors"
  const keyWithoutPrefix = translationKey.startsWith("errors.")
    ? translationKey.slice(7) // Убираем "errors."
    : translationKey;

  try {
    const message = t(keyWithoutPrefix);
    // Если сообщение совпадает с ключом, значит перевод не найден
    if (message === keyWithoutPrefix || message === translationKey) {
      console.warn(`Translation key not found: ${keyWithoutPrefix}`);
      // Пытаемся получить оригинальное сообщение об ошибке
      if (error instanceof Error) {
        return error.message || "Произошла неизвестная ошибка";
      }
      if (isSupabaseError(error)) {
        return getSupabaseErrorMessage(error) || "Произошла неизвестная ошибка";
      }
      return "Произошла неизвестная ошибка";
    }
    return message;
  } catch (e) {
    console.error("Error translating error message:", e);
    // Fallback на оригинальное сообщение
    if (error instanceof Error) {
      return error.message || "Произошла неизвестная ошибка";
    }
    if (isSupabaseError(error)) {
      return getSupabaseErrorMessage(error) || "Произошла неизвестная ошибка";
    }
    return "Произошла неизвестная ошибка";
  }
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
  if (translationKey !== "unknown") {
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
