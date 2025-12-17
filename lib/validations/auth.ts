import { z } from "zod";

// Требования к паролю
export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  noCyrillic: /^[^\u0400-\u04FF]*$/, // Без кириллицы
};

// Проверка каждого требования отдельно
export function checkPasswordRequirements(password: string) {
  return {
    latinOnly: passwordRequirements.noCyrillic.test(password),
    minLength: password.length >= passwordRequirements.minLength,
    hasUppercase: passwordRequirements.hasUppercase.test(password),
    hasLowercase: passwordRequirements.hasLowercase.test(password),
    hasNumber: passwordRequirements.hasNumber.test(password),
  };
}

// Функция для расчёта силы пароля (0-100)
// Сила рассчитывается ТОЛЬКО на основе выполненных требований
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  const checks = checkPasswordRequirements(password);
  
  // Если есть кириллица — сразу 0
  if (!checks.latinOnly) return 0;

  const requirements = [
    checks.minLength,
    checks.hasUppercase,
    checks.hasLowercase,
    checks.hasNumber,
  ];

  const passedCount = requirements.filter(Boolean).length;
  const baseScore = (passedCount / requirements.length) * 80;

  // Бонус за длину сверх минимума
  let lengthBonus = 0;
  if (checks.minLength) {
    if (password.length >= 12) lengthBonus += 10;
    if (password.length >= 16) lengthBonus += 10;
  }

  return Math.min(100, baseScore + lengthBonus);
}

// Получить уровень силы пароля
export function getPasswordStrengthLevel(
  strength: number
): "weak" | "fair" | "good" | "strong" {
  if (strength < 40) return "weak";
  if (strength < 60) return "fair";
  if (strength < 80) return "good";
  return "strong";
}

// Проверка валидности пароля (все требования выполнены)
export function isPasswordValid(password: string): boolean {
  const checks = checkPasswordRequirements(password);
  return Object.values(checks).every(Boolean);
}

// Схема для регистрации
export const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, "validation.displayName.min")
    .max(50, "validation.displayName.max")
    .regex(/^[\p{L}\p{N}\s\-_]+$/u, "validation.displayName.invalid"),
  email: z.string().email("validation.email.invalid"),
  password: z
    .string()
    .min(8, "validation.password.min")
    .max(128, "validation.password.max")
    .regex(/^[^\u0400-\u04FF]+$/, "validation.password.latinOnly")
    .regex(/[A-Z]/, "validation.password.uppercase")
    .regex(/[a-z]/, "validation.password.lowercase")
    .regex(/[0-9]/, "validation.password.number"),
});

// Схема для входа (упрощённая - просто проверяем что поля заполнены)
export const loginSchema = z.object({
  email: z.string().min(1, "validation.email.required").email("validation.email.invalid"),
  password: z.string().min(1, "validation.password.required"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
