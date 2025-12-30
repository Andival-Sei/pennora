import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/currency/formatter";

describe("formatCurrency", () => {
  describe("форматирование целых чисел", () => {
    it("должен форматировать целое число в рублях", () => {
      expect(formatCurrency(100, "RUB")).toBe("100 ₽");
    });

    it("должен форматировать целое число в долларах", () => {
      expect(formatCurrency(100, "USD")).toBe("100 $");
    });

    it("должен форматировать целое число в евро", () => {
      expect(formatCurrency(100, "EUR")).toBe("100 €");
    });

    it("должен форматировать ноль", () => {
      expect(formatCurrency(0, "RUB")).toBe("0 ₽");
    });

    it("должен форматировать большие числа", () => {
      expect(formatCurrency(1000000, "RUB")).toBe("1000000 ₽");
    });
  });

  describe("форматирование с десятичными знаками", () => {
    it("должен сохранять один десятичный знак", () => {
      expect(formatCurrency(100.5, "RUB")).toBe("100.5 ₽");
    });

    it("должен сохранять два десятичных знака", () => {
      expect(formatCurrency(100.25, "RUB")).toBe("100.25 ₽");
    });

    it("должен убирать лишние нули в конце", () => {
      expect(formatCurrency(100.5, "RUB")).toBe("100.5 ₽");
    });

    it("должен форматировать 0.99", () => {
      expect(formatCurrency(0.99, "RUB")).toBe("0.99 ₽");
    });

    it("должен форматировать 0.01", () => {
      expect(formatCurrency(0.01, "RUB")).toBe("0.01 ₽");
    });
  });

  describe("округление", () => {
    it("должен округлять до 2 знаков после запятой", () => {
      expect(formatCurrency(100.999, "RUB")).toBe("101 ₽");
    });

    it("должен округлять 100.995 до 101", () => {
      expect(formatCurrency(100.995, "RUB")).toBe("101 ₽");
    });

    it("должен округлять 100.994 до 100.99", () => {
      expect(formatCurrency(100.994, "RUB")).toBe("100.99 ₽");
    });

    it("должен округлять 100.001 до 100", () => {
      expect(formatCurrency(100.001, "RUB")).toBe("100 ₽");
    });
  });

  describe("разные валюты", () => {
    it("должен форматировать GBP (фунт)", () => {
      expect(formatCurrency(100, "GBP")).toBe("100 £");
    });

    it("должен форматировать JPY (йена)", () => {
      expect(formatCurrency(100, "JPY")).toBe("100 ¥");
    });

    it("должен форматировать KZT (тенге)", () => {
      expect(formatCurrency(100, "KZT")).toBe("100 ₸");
    });

    it("должен форматировать UAH (гривна)", () => {
      expect(formatCurrency(100, "UAH")).toBe("100 ₴");
    });

    it("должен использовать код валюты для неизвестных валют", () => {
      expect(formatCurrency(100, "XXX")).toBe("100 XXX");
    });
  });

  describe("отрицательные числа", () => {
    it("должен форматировать отрицательное целое число", () => {
      expect(formatCurrency(-100, "RUB")).toBe("-100 ₽");
    });

    it("должен форматировать отрицательное число с десятичными знаками", () => {
      expect(formatCurrency(-100.5, "RUB")).toBe("-100.5 ₽");
    });
  });

  describe("граничные случаи", () => {
    it("должен обрабатывать очень маленькие числа", () => {
      expect(formatCurrency(0.001, "RUB")).toBe("0 ₽");
    });

    it("должен обрабатывать очень большие дробные числа", () => {
      expect(formatCurrency(999999.99, "RUB")).toBe("999999.99 ₽");
    });
  });
});
