// Маппинг символов валют
const currencySymbols: Record<string, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  KZT: "₸",
  UAH: "₴",
};

/**
 * Форматирует сумму с символом валюты
 * Убирает нули после запятой, если они есть
 * Всегда использует точку для десятичных знаков и одинаковые символы валют (₽, $, €)
 * @param amount - сумма
 * @param currency - код валюты (RUB, USD, EUR и т.д.)
 * @returns отформатированная строка (например: "100 ₽" или "100.50 ₽")
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = currencySymbols[currency] || currency;

  // Округляем до 2 знаков после запятой
  const rounded = Math.round(amount * 100) / 100;

  // Проверяем, есть ли дробная часть
  const hasDecimals = rounded % 1 !== 0;

  if (hasDecimals) {
    // Если есть дробная часть, форматируем с 2 знаками (используем точку)
    const formatted = rounded.toFixed(2);
    // Убираем лишние нули в конце (100.50 -> 100.5, 100.00 -> 100)
    const trimmed = formatted.replace(/\.?0+$/, "");
    return `${trimmed} ${symbol}`;
  } else {
    // Если дробной части нет, показываем только целое число
    return `${Math.round(rounded)} ${symbol}`;
  }
}
