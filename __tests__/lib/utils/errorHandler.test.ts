import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getErrorTranslationKey,
  getErrorMessage,
} from "@/lib/utils/errorHandler";
import type { SupabaseError } from "@/lib/utils/errorHandler";

// Мокируем navigator для тестов
const mockNavigator = {
  onLine: true,
};

describe("errorHandler", () => {
  beforeEach(() => {
    // Мокируем navigator.onLine для всех тестов
    Object.defineProperty(global, "navigator", {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Восстанавливаем оригинальный navigator после каждого теста
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).navigator;
  });
  describe("getErrorTranslationKey", () => {
    describe("Обработка ошибок аутентификации", () => {
      it("должен обрабатывать 'Invalid login credentials'", () => {
        const error: SupabaseError = {
          message: "Invalid login credentials",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.invalidCredentials");
      });

      it("должен обрабатывать 'Email not confirmed'", () => {
        const error: SupabaseError = {
          message: "Email not confirmed",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.emailNotConfirmed");
      });

      it("должен обрабатывать 'Invalid email or password'", () => {
        const error: SupabaseError = {
          message: "Invalid email or password",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.invalidCredentials");
      });

      it("должен обрабатывать 'User already registered'", () => {
        const error: SupabaseError = {
          message: "User already registered",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.userAlreadyExists");
      });

      it("должен обрабатывать 'Password should be at least 6 characters'", () => {
        const error: SupabaseError = {
          message: "Password should be at least 6 characters",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.passwordTooShort");
      });

      it("должен обрабатывать 'Unable to validate email address: invalid format'", () => {
        const error: SupabaseError = {
          message: "Unable to validate email address: invalid format",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.invalidEmail");
      });

      it("должен обрабатывать 'Signup requires a valid password'", () => {
        const error: SupabaseError = {
          message: "Signup requires a valid password",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.passwordRequired");
      });

      it("должен обрабатывать 'Email rate limit exceeded'", () => {
        const error: SupabaseError = {
          message: "Email rate limit exceeded",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.rateLimitExceeded");
      });

      it("должен обрабатывать длинное сообщение о rate limit", () => {
        const error: SupabaseError = {
          message:
            "For security purposes, you can only request this once every 60 seconds",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.rateLimitExceeded");
      });

      it("должен обрабатывать 'Database error saving new user'", () => {
        const error: SupabaseError = {
          message: "Database error saving new user",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.databaseError");
      });

      it("должен обрабатывать 'fetch failed'", () => {
        const error: SupabaseError = {
          message: "fetch failed",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.networkError");
      });

      it("должен обрабатывать 'Failed to fetch'", () => {
        const error: SupabaseError = {
          message: "Failed to fetch",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.networkError");
      });
    });

    describe("Частичное совпадение сообщений", () => {
      it("должен находить ошибку по частичному совпадению", () => {
        const error: SupabaseError = {
          message: "Some error: Invalid login credentials occurred",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.invalidCredentials");
      });

      it("должен находить ошибку независимо от регистра", () => {
        const error: SupabaseError = {
          message: "INVALID LOGIN CREDENTIALS",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.invalidCredentials");
      });
    });

    describe("Приоритет ошибок аутентификации", () => {
      it("должен приоритизировать ошибки аутентификации над общими ошибками Supabase", () => {
        // Ошибка, которая может быть и auth ошибкой, и общей ошибкой
        const error: SupabaseError = {
          message: "Invalid login credentials",
          code: "23505", // Код конфликта
        };
        // Должна вернуться ошибка аутентификации, а не общая ошибка
        expect(getErrorTranslationKey(error)).toBe("errors.invalidCredentials");
      });
    });

    describe("Fallback на errors.unknown", () => {
      it("должен возвращать 'errors.unknown' для неизвестных ошибок аутентификации", () => {
        const error: SupabaseError = {
          message: "Some unknown auth error",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.unknown");
      });

      it("должен возвращать 'errors.unknown' для пустых ошибок", () => {
        const error: SupabaseError = {
          message: "",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.unknown");
      });
    });

    describe("Обработка различных типов ошибок", () => {
      it("должен обрабатывать Error объекты", () => {
        const error = new Error("Invalid login credentials");
        expect(getErrorTranslationKey(error)).toBe("errors.invalidCredentials");
      });

      it("должен обрабатывать строковые ошибки", () => {
        const error = "Invalid login credentials";
        expect(getErrorTranslationKey(error)).toBe("errors.invalidCredentials");
      });

      it("должен обрабатывать SupabaseError с details", () => {
        const error: SupabaseError = {
          details: "Invalid login credentials",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.invalidCredentials");
      });

      it("должен обрабатывать SupabaseError с hint", () => {
        const error: SupabaseError = {
          hint: "Invalid login credentials",
        };
        expect(getErrorTranslationKey(error)).toBe("errors.invalidCredentials");
      });
    });

    describe("Обратная совместимость", () => {
      it("должен сохранять формат ключей errors.* для ошибок аутентификации", () => {
        const error: SupabaseError = {
          message: "Invalid login credentials",
        };
        const key = getErrorTranslationKey(error);
        expect(key).toMatch(/^errors\./);
      });
    });
  });

  describe("getErrorMessage", () => {
    it("должен возвращать переведенное сообщение для ошибок аутентификации", () => {
      const error: SupabaseError = {
        message: "Invalid login credentials",
      };
      const t = vi.fn((key: string) => {
        if (key === "errors.invalidCredentials") {
          return "Неверный email или пароль";
        }
        return key;
      });

      const result = getErrorMessage(error, t);
      expect(result).toBe("Неверный email или пароль");
      expect(t).toHaveBeenCalledWith("errors.invalidCredentials");
    });

    it("должен возвращать fallback сообщение, если перевод не найден", () => {
      const error: SupabaseError = {
        message: "Invalid login credentials",
      };
      const t = vi.fn((key: string) => key); // Возвращает ключ, если перевод не найден

      const result = getErrorMessage(error, t);
      expect(result).toBe("Invalid login credentials");
    });

    it("должен возвращать fallback для неизвестных ошибок", () => {
      const error: SupabaseError = {
        message: "Some unknown error",
      };
      const t = vi.fn((key: string) => {
        if (key === "errors.unknown") {
          return "Произошла неизвестная ошибка";
        }
        return key;
      });

      const result = getErrorMessage(error, t);
      expect(result).toBe("Произошла неизвестная ошибка");
    });
  });
});
