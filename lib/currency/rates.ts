/**
 * Модуль для получения актуальных курсов валют
 * Использует exchangerate-api.io (бесплатный план: 1500 запросов/месяц)
 */

export type CurrencyCode = "RUB" | "USD" | "EUR";

export interface ExchangeRates {
  [key: string]: number; // Код валюты -> курс относительно базовой валюты
  base: string; // Базовая валюта (обычно USD)
  date: string; // Дата курса
}

// Кеш курсов валют (в памяти)
let cachedRates: ExchangeRates | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 час

/**
 * Получает курсы валют из API
 * Использует бесплатный API exchangerate-api.io
 * Для production нужно добавить API ключ в переменные окружения
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Используем бесплатный API без ключа (ограничение: только USD как базовая валюта)
  // Для production можно использовать API ключ для большей гибкости
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  const baseUrl = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
    : "https://api.exchangerate-api.com/v4/latest/USD";

  try {
    const response = await fetch(baseUrl, {
      next: { revalidate: 3600 }, // Кешируем на 1 час
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    const data = await response.json();

    // Преобразуем формат ответа в наш формат
    if (apiKey) {
      // v6 API формат
      return {
        base: data.base_code || "USD",
        date: data.time_last_update_utc || new Date().toISOString(),
        ...data.conversion_rates,
      };
    } else {
      // v4 API формат (бесплатный, без ключа)
      return {
        base: data.base || "USD",
        date: data.date || new Date().toISOString(),
        ...data.rates,
      };
    }
  } catch (error) {
    console.error("Error fetching exchange rates:", error);

    // Fallback: возвращаем фиксированные курсы при ошибке
    // В production лучше использовать последние сохранённые курсы из БД
    return getFallbackRates();
  }
}

/**
 * Возвращает фиксированные курсы валют (fallback)
 * Используется при недоступности API
 */
function getFallbackRates(): ExchangeRates {
  // Примерные курсы (должны обновляться вручную или из БД)
  return {
    base: "USD",
    date: new Date().toISOString(),
    USD: 1,
    EUR: 0.92,
    RUB: 90.0,
  };
}

/**
 * Получает актуальные курсы валют с кешированием
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();

  // Проверяем кеш
  if (cachedRates && now - cacheTimestamp < CACHE_DURATION) {
    return cachedRates;
  }

  // Получаем новые курсы
  const rates = await fetchExchangeRates();
  cachedRates = rates;
  cacheTimestamp = now;

  return rates;
}

/**
 * Получает курс конвертации из одной валюты в другую
 */
export async function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) {
    return 1;
  }

  const rates = await getExchangeRates();

  // Если базовая валюта USD, конвертируем через неё
  if (rates.base === "USD") {
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;

    // Конвертация: from -> USD -> to
    // Если from = RUB, то 1 RUB = 1/90 USD
    // Если to = EUR, то 1 USD = 0.92 EUR
    // Итого: 1 RUB = (1/90) * 0.92 EUR
    return (1 / fromRate) * toRate;
  }

  // Если базовая валюта другая, используем прямую конвертацию
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  return toRate / fromRate;
}

/**
 * Очищает кеш курсов валют
 * Полезно для принудительного обновления
 */
export function clearExchangeRatesCache(): void {
  cachedRates = null;
  cacheTimestamp = 0;
}
