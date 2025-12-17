// Маппинг ошибок Supabase Auth на ключи локализации
const errorMap: Record<string, string> = {
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
  "For security purposes, you can only request this once every 60 seconds": "errors.rateLimitExceeded",
  "Database error saving new user": "errors.databaseError",
  
  // Сеть
  "fetch failed": "errors.networkError",
  "Failed to fetch": "errors.networkError",
};

export function getAuthErrorKey(errorMessage: string): string {
  // Точное совпадение
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage];
  }
  
  // Частичное совпадение
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Неизвестная ошибка
  return "errors.unknown";
}

