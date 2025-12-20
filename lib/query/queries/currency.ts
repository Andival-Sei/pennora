import { getExchangeRates } from "@/lib/currency/rates";
import type { ExchangeRates } from "@/lib/currency/rates";

/**
 * Загружает курсы валют
 * Использует существующую функцию getExchangeRates, которая уже имеет кеширование
 * React Query добавит дополнительный слой кеширования поверх существующего
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  return getExchangeRates();
}
