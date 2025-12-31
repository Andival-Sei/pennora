// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  convertCurrency,
  convertMultipleCurrencies,
  formatCurrency,
} from "@/lib/currency/converter";
import * as rates from "@/lib/currency/rates";

// Мокируем модуль rates
vi.mock("@/lib/currency/rates", async () => {
  const actual = await vi.importActual("@/lib/currency/rates");
  return {
    ...actual,
    getExchangeRate: vi.fn(),
  };
});

describe("lib/currency/converter", () => {
  const mockGetExchangeRate = vi.mocked(rates.getExchangeRate);

  beforeEach(() => {
    mockGetExchangeRate.mockReset();
  });

  describe("convertCurrency", () => {
    it("должен вернуть ту же сумму для одинаковых валют", async () => {
      const result = await convertCurrency(100, "USD", "USD");
      expect(result).toBe(100);
      // getExchangeRate не должен вызываться
      expect(mockGetExchangeRate).not.toHaveBeenCalled();
    });

    it("должен вернуть ту же сумму для RUB -> RUB", async () => {
      const result = await convertCurrency(5000, "RUB", "RUB");
      expect(result).toBe(5000);
    });

    it("должен конвертировать USD -> EUR", async () => {
      mockGetExchangeRate.mockResolvedValueOnce(0.92);

      const result = await convertCurrency(100, "USD", "EUR");

      expect(result).toBe(92);
      expect(mockGetExchangeRate).toHaveBeenCalledWith("USD", "EUR");
      expect(mockGetExchangeRate).toHaveBeenCalledTimes(1);
    });

    it("должен конвертировать RUB -> USD", async () => {
      // 1 RUB = 0.011 USD (примерно 1/90)
      mockGetExchangeRate.mockResolvedValueOnce(0.011111);

      const result = await convertCurrency(9000, "RUB", "USD");

      expect(result).toBeCloseTo(100, 0);
      expect(mockGetExchangeRate).toHaveBeenCalledWith("RUB", "USD");
    });

    it("должен обрабатывать дробные суммы", async () => {
      mockGetExchangeRate.mockResolvedValueOnce(0.92);

      const result = await convertCurrency(100.5, "USD", "EUR");

      expect(result).toBeCloseTo(92.46, 2);
    });

    it("должен обрабатывать нулевую сумму", async () => {
      mockGetExchangeRate.mockResolvedValueOnce(0.92);

      const result = await convertCurrency(0, "USD", "EUR");

      expect(result).toBe(0);
    });
  });

  describe("convertMultipleCurrencies", () => {
    it("должен конвертировать массив сумм в одну валюту", async () => {
      // USD -> RUB: курс 90
      // EUR -> RUB: курс 100
      mockGetExchangeRate
        .mockResolvedValueOnce(90) // USD -> RUB
        .mockResolvedValueOnce(100); // EUR -> RUB

      const result = await convertMultipleCurrencies(
        [
          { amount: 100, currency: "USD" },
          { amount: 50, currency: "EUR" },
        ],
        "RUB"
      );

      // 100 USD * 90 + 50 EUR * 100 = 9000 + 5000 = 14000 RUB
      expect(result).toBe(14000);
      expect(mockGetExchangeRate).toHaveBeenCalledTimes(2);
    });

    it("должен обрабатывать пустой массив", async () => {
      const result = await convertMultipleCurrencies([], "RUB");

      expect(result).toBe(0);
      expect(mockGetExchangeRate).not.toHaveBeenCalled();
    });

    it("должен обрабатывать одну валюту", async () => {
      // RUB -> RUB: курс 1 (одинаковые валюты)
      const result = await convertMultipleCurrencies(
        [{ amount: 1000, currency: "RUB" }],
        "RUB"
      );

      // Одинаковые валюты, должно вернуть ту же сумму
      expect(result).toBe(1000);
    });

    it("должен суммировать несколько сумм в одной валюте", async () => {
      const result = await convertMultipleCurrencies(
        [
          { amount: 100, currency: "USD" },
          { amount: 200, currency: "USD" },
          { amount: 300, currency: "USD" },
        ],
        "USD"
      );

      // Все в USD, сумма должна быть 600
      expect(result).toBe(600);
    });

    it("должен обрабатывать дробные суммы", async () => {
      mockGetExchangeRate
        .mockResolvedValueOnce(90.5) // USD -> RUB
        .mockResolvedValueOnce(100.25); // EUR -> RUB

      const result = await convertMultipleCurrencies(
        [
          { amount: 10.5, currency: "USD" },
          { amount: 20.75, currency: "EUR" },
        ],
        "RUB"
      );

      // 10.5 * 90.5 + 20.75 * 100.25 = 950.25 + 2080.1875 = 3030.4375
      expect(result).toBeCloseTo(3030.4375, 2);
    });
  });

  describe("formatCurrency (из converter.ts)", () => {
    it("должен форматировать целое число", () => {
      const result = formatCurrency(100, "USD", "en-US");
      // Ожидаем формат "$100" или "$100.00" в зависимости от локали
      expect(result).toContain("100");
      expect(result).toContain("$");
    });

    it("должен форматировать дробное число", () => {
      const result = formatCurrency(100.5, "USD", "en-US");
      expect(result).toContain("100");
      expect(result).toContain("$");
    });

    it("должен использовать русскую локаль", () => {
      const result = formatCurrency(1000, "RUB", "ru-RU");
      expect(result).toContain("1");
      expect(result).toContain("000");
    });

    it("должен обрабатывать ноль", () => {
      const result = formatCurrency(0, "EUR", "en-US");
      expect(result).toContain("0");
      expect(result).toContain("€");
    });
  });
});
