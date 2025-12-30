// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getExchangeRate,
  getExchangeRates,
  clearExchangeRatesCache,
  type ExchangeRates,
} from "@/lib/currency/rates";

describe("lib/currency/rates", () => {
  // Мокируем fetch
  const mockFetch = vi.fn();

  beforeEach(() => {
    // Очищаем кеш перед каждым тестом
    clearExchangeRatesCache();
    // Сбрасываем моки
    mockFetch.mockReset();
    // Устанавливаем глобальный fetch
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getExchangeRate", () => {
    it("должен вернуть 1 для одинаковых валют", async () => {
      const rate = await getExchangeRate("USD", "USD");
      expect(rate).toBe(1);
      // fetch не должен вызываться для одинаковых валют
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("должен вернуть 1 для RUB -> RUB", async () => {
      const rate = await getExchangeRate("RUB", "RUB");
      expect(rate).toBe(1);
    });

    it("должен конвертировать USD -> EUR через API", async () => {
      const mockRates: ExchangeRates = {
        base: "USD",
        date: "2025-12-30",
        rates: {
          USD: 1,
          EUR: 0.92,
          RUB: 90.0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          base: "USD",
          date: "2025-12-30",
          rates: mockRates.rates,
        }),
      });

      const rate = await getExchangeRate("USD", "EUR");

      // USD -> EUR: курс должен быть 0.92
      expect(rate).toBe(0.92);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("должен конвертировать RUB -> EUR через USD", async () => {
      const mockRates: ExchangeRates = {
        base: "USD",
        date: "2025-12-30",
        rates: {
          USD: 1,
          EUR: 0.92,
          RUB: 90.0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          base: "USD",
          date: "2025-12-30",
          rates: mockRates.rates,
        }),
      });

      const rate = await getExchangeRate("RUB", "EUR");

      // RUB -> USD: 1 RUB = 1/90 USD = 0.0111...
      // USD -> EUR: 1 USD = 0.92 EUR
      // RUB -> EUR: (1/90) * 0.92 = 0.0102...
      const expected = (1 / 90.0) * 0.92;
      expect(rate).toBeCloseTo(expected, 4);
    });

    it("должен использовать fallback курсы при ошибке API", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const rate = await getExchangeRate("USD", "EUR");

      // Fallback курсы: EUR = 0.92
      expect(rate).toBe(0.92);
    });
  });

  describe("getExchangeRates", () => {
    it("должен получить курсы из API", async () => {
      const mockRates = {
        base: "USD",
        date: "2025-12-30",
        rates: {
          USD: 1,
          EUR: 0.92,
          RUB: 90.0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRates,
      });

      const rates = await getExchangeRates();

      expect(rates).toEqual(mockRates);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("должен использовать кеш при повторных запросах", async () => {
      const mockRates = {
        base: "USD",
        date: "2025-12-30",
        rates: {
          USD: 1,
          EUR: 0.92,
          RUB: 90.0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRates,
      });

      // Первый запрос
      const rates1 = await getExchangeRates();
      expect(rates1).toEqual(mockRates);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Второй запрос - должен использовать кеш
      const rates2 = await getExchangeRates();
      expect(rates2).toEqual(mockRates);
      // fetch НЕ должен вызываться повторно
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("должен вернуть fallback курсы при ошибке API", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const rates = await getExchangeRates();

      // Проверяем, что вернулись fallback курсы
      expect(rates.base).toBe("USD");
      expect(rates.rates.USD).toBe(1);
      expect(rates.rates.EUR).toBe(0.92);
      expect(rates.rates.RUB).toBe(90.0);
    });

    it("должен обработать неудачный HTTP ответ", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
      });

      const rates = await getExchangeRates();

      // Должны вернуться fallback курсы
      expect(rates.base).toBe("USD");
      expect(rates.rates.USD).toBe(1);
    });
  });

  describe("clearExchangeRatesCache", () => {
    it("должен очистить кеш и вызвать API снова", async () => {
      const mockRates = {
        base: "USD",
        date: "2025-12-30",
        rates: {
          USD: 1,
          EUR: 0.92,
          RUB: 90.0,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRates,
      });

      // Первый запрос
      await getExchangeRates();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Второй запрос - использует кеш
      await getExchangeRates();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Очищаем кеш
      clearExchangeRatesCache();

      // Третий запрос - должен снова вызвать API
      await getExchangeRates();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("API формат v4 (без ключа)", () => {
    it("должен обработать формат v4 API", async () => {
      const mockResponseV4 = {
        base: "USD",
        date: "2025-12-30",
        rates: {
          USD: 1,
          EUR: 0.92,
          RUB: 90.0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseV4,
      });

      const rates = await getExchangeRates();

      expect(rates.base).toBe("USD");
      expect(rates.date).toBe("2025-12-30");
      expect(rates.rates).toEqual(mockResponseV4.rates);
    });
  });
});
