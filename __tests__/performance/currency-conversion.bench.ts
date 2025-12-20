/**
 * Performance тесты для конвертации валют
 */

import { bench, describe, vi } from "vitest";
import {
  convertCurrency,
  convertMultipleCurrencies,
} from "@/lib/currency/converter";
import type { CurrencyCode } from "@/lib/currency/rates";

// Мокируем getExchangeRate для стабильных результатов
vi.mock("@/lib/currency/rates", () => ({
  getExchangeRate: async (from: CurrencyCode, to: CurrencyCode) => {
    // Простые моки курсов для тестирования
    const rates: Record<string, number> = {
      "USD-RUB": 90,
      "RUB-USD": 1 / 90,
      "USD-EUR": 0.92,
      "EUR-USD": 1 / 0.92,
      "RUB-EUR": (1 / 90) * 0.92,
      "EUR-RUB": (1 / 0.92) * 90,
    };

    if (from === to) return 1;
    return rates[`${from}-${to}`] || 1;
  },
}));

describe("Currency Conversion Performance", () => {
  describe("convertCurrency", () => {
    bench(
      "convertCurrency - одна валюта",
      async () => {
        await convertCurrency(100, "USD", "RUB");
      },
      {
        time: 500,
      }
    );
  });

  describe("convertMultipleCurrencies", () => {
    const amounts = [
      { amount: 1000, currency: "USD" as CurrencyCode },
      { amount: 50000, currency: "RUB" as CurrencyCode },
      { amount: 500, currency: "EUR" as CurrencyCode },
    ];

    bench(
      "convertMultipleCurrencies - несколько валют",
      async () => {
        await convertMultipleCurrencies(amounts, "RUB");
      },
      {
        time: 500,
      }
    );

    bench(
      "convertMultipleCurrencies - много валют (10)",
      async () => {
        const manyAmounts = Array.from({ length: 10 }, (_, i) => ({
          amount: 100 * (i + 1),
          currency: (["USD", "RUB", "EUR"] as CurrencyCode[])[i % 3],
        }));
        await convertMultipleCurrencies(manyAmounts, "RUB");
      },
      {
        time: 500,
      }
    );
  });
});
