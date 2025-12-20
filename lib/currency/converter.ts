/**
 * Модуль для конвертации валют
 */

import { getExchangeRate, type CurrencyCode } from "./rates";

/**
 * Конвертирует сумму из одной валюты в другую
 */
export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) {
    return amount;
  }

  const rate = await getExchangeRate(from, to);
  return amount * rate;
}

/**
 * Конвертирует массив сумм в разных валютах в одну валюту
 */
export async function convertMultipleCurrencies(
  amounts: Array<{ amount: number; currency: CurrencyCode }>,
  targetCurrency: CurrencyCode
): Promise<number> {
  const convertedAmounts = await Promise.all(
    amounts.map(async ({ amount, currency }) => {
      return await convertCurrency(amount, currency, targetCurrency);
    })
  );

  return convertedAmounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Форматирует сумму валюты для отображения
 * Убирает нули после запятой, если их нет
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: string = "ru-RU"
): string {
  // Округляем до 2 знаков после запятой
  const rounded = Math.round(amount * 100) / 100;

  // Проверяем, есть ли дробная часть
  const hasDecimals = rounded % 1 !== 0;

  if (hasDecimals) {
    // Если есть дробная часть, форматируем с 2 знаками
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  } else {
    // Если дробной части нет, показываем только целое число без десятичных знаков
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rounded);
  }
}
