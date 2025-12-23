import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  checkPasswordRequirements,
  calculatePasswordStrength,
  getPasswordStrengthLevel,
  isPasswordValid,
  passwordRequirements,
} from "@/lib/validations/auth";

describe("registerSchema", () => {
  describe("валидация", () => {
    it("должен валидировать валидные данные регистрации", () => {
      const validData = {
        displayName: "Иван Иванов",
        email: "test@example.com",
        password: "Password123",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("должен отклонять displayName короче 2 символов", () => {
      const invalidData = {
        displayName: "А",
        email: "test@example.com",
        password: "Password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const displayNameError = result.error.issues.find(
          (issue) => issue.path[0] === "displayName"
        );
        expect(displayNameError?.message).toBe("validation.displayName.min");
      }
    });

    it("должен отклонять displayName длиннее 50 символов", () => {
      const invalidData = {
        displayName: "А".repeat(51),
        email: "test@example.com",
        password: "Password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const displayNameError = result.error.issues.find(
          (issue) => issue.path[0] === "displayName"
        );
        expect(displayNameError?.message).toBe("validation.displayName.max");
      }
    });

    it("должен отклонять displayName с недопустимыми символами", () => {
      const invalidData = {
        displayName: "Иван@Иванов",
        email: "test@example.com",
        password: "Password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const displayNameError = result.error.issues.find(
          (issue) => issue.path[0] === "displayName"
        );
        expect(displayNameError?.message).toBe(
          "validation.displayName.invalid"
        );
      }
    });

    it("должен принимать displayName с дефисом и подчеркиванием", () => {
      const validData = {
        displayName: "Иван-Иванов_123",
        email: "test@example.com",
        password: "Password123",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("должен отклонять невалидный email", () => {
      const invalidData = {
        displayName: "Иван Иванов",
        email: "invalid-email",
        password: "Password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email"
        );
        expect(emailError?.message).toBe("validation.email.invalid");
      }
    });

    it("должен отклонять пароль короче 8 символов", () => {
      const invalidData = {
        displayName: "Иван Иванов",
        email: "test@example.com",
        password: "Pass123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("validation.password.min");
      }
    });

    it("должен отклонять пароль длиннее 128 символов", () => {
      const invalidData = {
        displayName: "Иван Иванов",
        email: "test@example.com",
        password: "A".repeat(129),
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("validation.password.max");
      }
    });

    it("должен отклонять пароль с кириллицей", () => {
      const invalidData = {
        displayName: "Иван Иванов",
        email: "test@example.com",
        password: "Password123Пароль",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("validation.password.latinOnly");
      }
    });

    it("должен отклонять пароль без заглавных букв", () => {
      const invalidData = {
        displayName: "Иван Иванов",
        email: "test@example.com",
        password: "password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("validation.password.uppercase");
      }
    });

    it("должен отклонять пароль без строчных букв", () => {
      const invalidData = {
        displayName: "Иван Иванов",
        email: "test@example.com",
        password: "PASSWORD123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("validation.password.lowercase");
      }
    });

    it("должен отклонять пароль без цифр", () => {
      const invalidData = {
        displayName: "Иван Иванов",
        email: "test@example.com",
        password: "Password",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("validation.password.number");
      }
    });

    it("должен принимать пароль на границе минимальной длины (8 символов)", () => {
      const validData = {
        displayName: "Иван Иванов",
        email: "test@example.com",
        password: "Pass1234",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("должен принимать пароль на границе максимальной длины (128 символов)", () => {
      // Пароль должен содержать заглавные, строчные буквы и цифры
      const validData = {
        displayName: "Иван Иванов",
        email: "test@example.com",
        password: "P".repeat(120) + "ass123",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe("loginSchema", () => {
  describe("валидация", () => {
    it("должен валидировать валидные данные входа", () => {
      const validData = {
        email: "test@example.com",
        password: "anypassword",
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("должен отклонять пустой email", () => {
      const invalidData = {
        email: "",
        password: "anypassword",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email"
        );
        expect(emailError?.message).toBe("validation.email.required");
      }
    });

    it("должен отклонять невалидный email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "anypassword",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email"
        );
        expect(emailError?.message).toBe("validation.email.invalid");
      }
    });

    it("должен отклонять пустой пароль", () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("validation.password.required");
      }
    });
  });
});

describe("checkPasswordRequirements", () => {
  describe("проверка требований", () => {
    it("должен проверять все требования для валидного пароля", () => {
      const password = "Password123";
      const checks = checkPasswordRequirements(password);

      expect(checks.latinOnly).toBe(true);
      expect(checks.minLength).toBe(true);
      expect(checks.hasUppercase).toBe(true);
      expect(checks.hasLowercase).toBe(true);
      expect(checks.hasNumber).toBe(true);
    });

    it("должен обнаруживать кириллицу в пароле", () => {
      const password = "Password123Пароль";
      const checks = checkPasswordRequirements(password);

      expect(checks.latinOnly).toBe(false);
    });

    it("должен обнаруживать недостаточную длину", () => {
      const password = "Pass123";
      const checks = checkPasswordRequirements(password);

      expect(checks.minLength).toBe(false);
    });

    it("должен обнаруживать отсутствие заглавных букв", () => {
      const password = "password123";
      const checks = checkPasswordRequirements(password);

      expect(checks.hasUppercase).toBe(false);
    });

    it("должен обнаруживать отсутствие строчных букв", () => {
      const password = "PASSWORD123";
      const checks = checkPasswordRequirements(password);

      expect(checks.hasLowercase).toBe(false);
    });

    it("должен обнаруживать отсутствие цифр", () => {
      const password = "Password";
      const checks = checkPasswordRequirements(password);

      expect(checks.hasNumber).toBe(false);
    });

    it("должен проверять минимальную длину (8 символов)", () => {
      const shortPassword = "Pass123";
      const validPassword = "Password123";

      expect(checkPasswordRequirements(shortPassword).minLength).toBe(false);
      expect(checkPasswordRequirements(validPassword).minLength).toBe(true);
    });
  });
});

describe("calculatePasswordStrength", () => {
  describe("расчет силы пароля", () => {
    it("должен возвращать 0 для пустого пароля", () => {
      expect(calculatePasswordStrength("")).toBe(0);
    });

    it("должен возвращать 0 для пароля с кириллицей", () => {
      expect(calculatePasswordStrength("Password123Пароль")).toBe(0);
    });

    it("должен рассчитывать силу для пароля с минимальными требованиями", () => {
      const strength = calculatePasswordStrength("Password123");
      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThanOrEqual(100);
    });

    it("должен давать бонус за длину 12+ символов", () => {
      const shortPassword = "Password123"; // 11 символов
      const longPassword = "Password1234"; // 12 символов

      const shortStrength = calculatePasswordStrength(shortPassword);
      const longStrength = calculatePasswordStrength(longPassword);

      expect(longStrength).toBeGreaterThan(shortStrength);
    });

    it("должен давать бонус за длину 16+ символов", () => {
      const mediumPassword = "Password12345"; // 14 символов
      const longPassword = "Password12345678"; // 16 символов

      const mediumStrength = calculatePasswordStrength(mediumPassword);
      const longStrength = calculatePasswordStrength(longPassword);

      expect(longStrength).toBeGreaterThan(mediumStrength);
    });

    it("должен возвращать максимум 100", () => {
      const veryLongPassword = "Password12345678901234567890";
      const strength = calculatePasswordStrength(veryLongPassword);

      expect(strength).toBeLessThanOrEqual(100);
    });

    it("должен учитывать количество выполненных требований", () => {
      const allRequirements = "Password123"; // все требования
      const missingNumber = "Password"; // без цифры

      const allStrength = calculatePasswordStrength(allRequirements);
      const missingStrength = calculatePasswordStrength(missingNumber);

      expect(allStrength).toBeGreaterThan(missingStrength);
    });
  });
});

describe("getPasswordStrengthLevel", () => {
  describe("получение уровня силы", () => {
    it("должен возвращать 'weak' для силы < 40", () => {
      expect(getPasswordStrengthLevel(0)).toBe("weak");
      expect(getPasswordStrengthLevel(20)).toBe("weak");
      expect(getPasswordStrengthLevel(39)).toBe("weak");
    });

    it("должен возвращать 'fair' для силы 40-59", () => {
      expect(getPasswordStrengthLevel(40)).toBe("fair");
      expect(getPasswordStrengthLevel(50)).toBe("fair");
      expect(getPasswordStrengthLevel(59)).toBe("fair");
    });

    it("должен возвращать 'good' для силы 60-79", () => {
      expect(getPasswordStrengthLevel(60)).toBe("good");
      expect(getPasswordStrengthLevel(70)).toBe("good");
      expect(getPasswordStrengthLevel(79)).toBe("good");
    });

    it("должен возвращать 'strong' для силы >= 80", () => {
      expect(getPasswordStrengthLevel(80)).toBe("strong");
      expect(getPasswordStrengthLevel(90)).toBe("strong");
      expect(getPasswordStrengthLevel(100)).toBe("strong");
    });
  });
});

describe("isPasswordValid", () => {
  describe("проверка валидности пароля", () => {
    it("должен возвращать true для валидного пароля", () => {
      expect(isPasswordValid("Password123")).toBe(true);
      expect(isPasswordValid("MySecurePass123")).toBe(true);
      expect(isPasswordValid("Test1234")).toBe(true);
    });

    it("должен возвращать false для пароля с кириллицей", () => {
      expect(isPasswordValid("Password123Пароль")).toBe(false);
    });

    it("должен возвращать false для короткого пароля", () => {
      expect(isPasswordValid("Pass123")).toBe(false);
    });

    it("должен возвращать false для пароля без заглавных букв", () => {
      expect(isPasswordValid("password123")).toBe(false);
    });

    it("должен возвращать false для пароля без строчных букв", () => {
      expect(isPasswordValid("PASSWORD123")).toBe(false);
    });

    it("должен возвращать false для пароля без цифр", () => {
      expect(isPasswordValid("Password")).toBe(false);
    });

    it("должен возвращать false для пустого пароля", () => {
      expect(isPasswordValid("")).toBe(false);
    });
  });
});

describe("passwordRequirements", () => {
  it("должен иметь правильные значения констант", () => {
    expect(passwordRequirements.minLength).toBe(8);
    expect(passwordRequirements.maxLength).toBe(128);
    expect(passwordRequirements.hasUppercase).toBeInstanceOf(RegExp);
    expect(passwordRequirements.hasLowercase).toBeInstanceOf(RegExp);
    expect(passwordRequirements.hasNumber).toBeInstanceOf(RegExp);
    expect(passwordRequirements.noCyrillic).toBeInstanceOf(RegExp);
  });
});
