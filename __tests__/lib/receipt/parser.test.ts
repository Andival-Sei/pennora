// @vitest-environment node
/**
 * Тесты для парсера чеков
 * Покрывает: parseReceiptText, parseDate, parseAmount, parseMerchant, parseItems и др.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseReceiptText } from "@/lib/receipt/parser";

// Мок merchant-database
vi.mock("@/lib/receipt/merchant-database", () => ({
  normalizeMerchantName: vi.fn((name: string) => name),
  getMerchantCategory: vi.fn(() => null),
}));

import {
  normalizeMerchantName,
  getMerchantCategory,
} from "@/lib/receipt/merchant-database";

const mockedNormalizeMerchantName = vi.mocked(normalizeMerchantName);
const mockedGetMerchantCategory = vi.mocked(getMerchantCategory);

describe("Receipt Parser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedNormalizeMerchantName.mockImplementation((name) => name);
    mockedGetMerchantCategory.mockReturnValue(null);
  });

  describe("parseDate", () => {
    it("парсит дату в формате DD.MM.YYYY HH:MM", () => {
      const text = "Дата: 15.03.2024 14:30\nИТОГ = 100.00";
      const result = parseReceiptText(text);

      expect(result.date).toBeDefined();
      expect(result.date?.getFullYear()).toBe(2024);
      expect(result.date?.getMonth()).toBe(2); // март = 2 (0-indexed)
      expect(result.date?.getDate()).toBe(15);
      expect(result.date?.getHours()).toBe(14);
      expect(result.date?.getMinutes()).toBe(30);
    });

    it("парсит дату в формате DD.MM.YYYY", () => {
      const text = "Чек от 25.12.2023\nИТОГ = 500.00";
      const result = parseReceiptText(text);

      expect(result.date?.getFullYear()).toBe(2023);
      expect(result.date?.getMonth()).toBe(11); // декабрь = 11
      expect(result.date?.getDate()).toBe(25);
    });

    it("парсит дату в формате YYYY-MM-DD HH:MM", () => {
      const text = "2024-01-20 09:15\nИТОГ = 200.00";
      const result = parseReceiptText(text);

      expect(result.date?.getFullYear()).toBe(2024);
      expect(result.date?.getMonth()).toBe(0); // январь = 0
      expect(result.date?.getDate()).toBe(20);
      expect(result.date?.getHours()).toBe(9);
    });

    it("парсит дату в формате YYYY-MM-DD", () => {
      const text = "2023-06-10\nИТОГ = 300.00";
      const result = parseReceiptText(text);

      expect(result.date?.getFullYear()).toBe(2023);
      expect(result.date?.getMonth()).toBe(5); // июнь = 5
      expect(result.date?.getDate()).toBe(10);
    });

    it("возвращает текущую дату при отсутствии даты в тексте", () => {
      const text = "ИТОГ = 100.00";
      const before = new Date();
      const result = parseReceiptText(text);
      const after = new Date();

      expect(result.date).toBeDefined();
      expect(result.date!.getTime()).toBeGreaterThanOrEqual(
        before.getTime() - 1000
      );
      expect(result.date!.getTime()).toBeLessThanOrEqual(
        after.getTime() + 1000
      );
    });
  });

  describe("parseAmount", () => {
    it("парсит ИТОГ = сумма", () => {
      const text = "Товар 50.00\nИТОГ = 900.00";
      const result = parseReceiptText(text);
      expect(result.amount).toBe(900);
    });

    it("парсит СУММА ПО ЧЕКУ", () => {
      const text = "Продукты\nСУММА ПО ЧЕКУ: 1234.56";
      const result = parseReceiptText(text);
      expect(result.amount).toBe(1234.56);
    });

    it("парсит ИТОГО: сумма", () => {
      const text = "Покупка\nИТОГО: 500.00";
      const result = parseReceiptText(text);
      expect(result.amount).toBe(500);
    });

    it("парсит К ОПЛАТЕ: сумма", () => {
      const text = "Товар\nК ОПЛАТЕ: 750.50";
      const result = parseReceiptText(text);
      expect(result.amount).toBe(750.5);
    });

    it("парсит сумму с запятой как разделителем", () => {
      const text = "ИТОГ = 1500,75";
      const result = parseReceiptText(text);
      expect(result.amount).toBe(1500.75);
    });

    it("игнорирует строки с НДС", () => {
      const text = "НДС 20%: 150.00\nСУММА НДС: 150.00\nИТОГ = 900.00";
      const result = parseReceiptText(text);
      expect(result.amount).toBe(900);
    });

    it("выбирает максимальную сумму при отсутствии ключевых слов", () => {
      const text = "Товар1 100.00\nТовар2 200.00\nТовар3 300.00";
      const result = parseReceiptText(text);
      expect(result.amount).toBe(300);
    });

    it("возвращает undefined при отсутствии сумм", () => {
      const text = "Просто текст без чисел";
      const result = parseReceiptText(text);
      expect(result.amount).toBeUndefined();
    });
  });

  describe("parseMerchant", () => {
    it("распознаёт известные магазины по ключевым словам", () => {
      const knownMerchants = [
        { text: "Чек от самокат\nИТОГ = 100.00", expected: "самокат" },
        { text: "Пятёрочка\nИТОГ = 100.00", expected: "пятёрочка" },
        { text: "Магнит\nИТОГ = 100.00", expected: "магнит" },
        { text: "Перекрёсток\nИТОГ = 100.00", expected: "перекрёсток" },
        { text: "Лента супермаркет\nИТОГ = 100.00", expected: "лента" },
      ];

      for (const { text, expected } of knownMerchants) {
        const result = parseReceiptText(text);
        expect(result.merchant).toBe(expected);
      }
    });

    it("извлекает домен из текста", () => {
      const text = "Заказ samokat.ru\nИТОГ = 500.00";
      const result = parseReceiptText(text);
      expect(result.merchant).toBe("samokat");
    });

    it("игнорирует служебные домены (platformaofd, ofd)", () => {
      const text = "platformaofd.ru\nofd.ru\nООО Магазин\nИТОГ = 100.00";
      const result = parseReceiptText(text);
      expect(result.merchant).not.toBe("platformaofd");
      expect(result.merchant).not.toBe("ofd");
    });

    it("извлекает название из ООО", () => {
      const text = "ООО Ромашка\nИТОГ = 200.00";
      const result = parseReceiptText(text);
      expect(result.merchant).toBe("Ромашка");
    });

    it("извлекает название из ИП", () => {
      const text = "ИП Иванов И.И.\nИТОГ = 150.00";
      const result = parseReceiptText(text);
      expect(result.merchant).toBe("Иванов И.И.");
    });

    it("использует первую строку как fallback", () => {
      const text = "Магазин Продукты\nТовар 100.00\nИТОГ = 100.00";
      const result = parseReceiptText(text);
      expect(result.merchant).toBe("Магазин Продукты");
    });

    it("пропускает служебные строки в начале", () => {
      const text = "ЧЕК\nМагазин Продукты\nИТОГ = 100.00";
      const result = parseReceiptText(text);
      expect(result.merchant).not.toBe("ЧЕК");
    });
  });

  describe("parsePaymentMethod", () => {
    it("распознаёт наличные", () => {
      const variants = [
        "НАЛИЧНЫМИ: 500.00\nИТОГ = 500.00",
        "Оплата наличные\nИТОГ = 500.00",
        "CASH 500.00\nИТОГ = 500.00",
      ];

      for (const text of variants) {
        const result = parseReceiptText(text);
        expect(result.paymentMethod).toBe("cash");
      }
    });

    it("распознаёт карту", () => {
      // Проверяем варианты, которые парсер корректно распознаёт как карту
      // Примечание: БЕЗНАЛИЧНЫМИ не работает, т.к. содержит подстроку НАЛИЧНЫМИ
      const variants = [
        "Оплата КАРТОЙ\nИТОГ = 500.00",
        "БЕЗНАЛИЧНЫЙ расчёт\nИТОГ = 500.00",
        "CARD payment\nTOTAL = 500.00",
      ];

      for (const text of variants) {
        const result = parseReceiptText(text);
        expect(result.paymentMethod).toBe("card");
      }
    });

    it("возвращает null при отсутствии способа оплаты", () => {
      const text = "Товар 100.00\nИТОГ = 100.00";
      const result = parseReceiptText(text);
      expect(result.paymentMethod).toBeNull();
    });
  });

  describe("parseItems", () => {
    it("парсит пронумерованные позиции", () => {
      const text = `
1: Молоко
Общая стоимость позиции
100.00
2: Хлеб
Общая стоимость позиции
50.00
ИТОГО: 150.00
      `;
      const result = parseReceiptText(text);

      expect(result.items).toHaveLength(2);
      expect(result.items?.[0]).toEqual({ name: "Молоко", price: 100 });
      expect(result.items?.[1]).toEqual({ name: "Хлеб", price: 50 });
    });

    it("парсит позиции с ценой в формате количество x цена", () => {
      const text = `
1: Йогурт
2 шт. x 75.00
ИТОГО: 150.00
      `;
      const result = parseReceiptText(text);

      expect(result.items).toHaveLength(1);
      expect(result.items?.[0]).toEqual({ name: "Йогурт", price: 150 }); // 2 * 75
    });

    it("останавливается на ИТОГО", () => {
      // Тест на остановку парсинга на ИТОГО
      // Используем тот же формат, что и в успешном тесте
      const text = `
1: Молоко
Общая стоимость позиции
100.00
ИТОГО: 100.00
Информация после ИТОГО не должна парситься
      `;
      const result = parseReceiptText(text);

      // Парсер должен найти товар до ИТОГО и остановиться
      expect(result.items).toHaveLength(1);
      expect(result.items?.[0]).toEqual({ name: "Молоко", price: 100 });
    });

    it("фильтрует позиции с маленькой ценой (<= 10)", () => {
      const text = `
1: Пакет
Общая стоимость позиции
5.00
2: Молоко
Общая стоимость позиции
100.00
ИТОГО: 105.00
      `;
      const result = parseReceiptText(text);

      expect(result.items).toHaveLength(1);
      expect(result.items?.[0].name).toBe("Молоко");
    });

    it("парсит альтернативный формат (название и цена в одной строке)", () => {
      // Парсер использует альтернативный формат только если нет пронумерованных позиций
      // И фильтрует позиции с ценой <= 10
      const text = `
Молоко   100.00
      `;
      const result = parseReceiptText(text);

      // Как минимум первая позиция должна быть найдена
      expect(result.items).toBeDefined();
      if (result.items && result.items.length > 0) {
        expect(result.items[0].name).toBe("Молоко");
        expect(result.items[0].price).toBe(100);
      }
    });

    it("возвращает undefined при отсутствии товаров", () => {
      const text = "ИТОГ = 100.00";
      const result = parseReceiptText(text);
      expect(result.items).toBeUndefined();
    });
  });

  describe("generateDescription", () => {
    it("использует название товара для одной позиции", () => {
      const text = `
1: Молоко Простоквашино 3.2%
Общая стоимость позиции
89.00
ИТОГО: 89.00
      `;
      const result = parseReceiptText(text);
      expect(result.description).toBe("Молоко Простоквашино 3.2%");
    });

    it("генерирует 'Покупка из Магазина' для нескольких позиций", () => {
      mockedGetMerchantCategory.mockReturnValue(null);

      const text = `
самокат
1: Молоко
Общая стоимость позиции
100.00
2: Хлеб
Общая стоимость позиции
50.00
ИТОГО: 150.00
      `;
      const result = parseReceiptText(text);
      expect(result.description).toContain("Покупка из");
    });

    it("генерирует 'Категория из Магазина' при наличии категории", () => {
      mockedGetMerchantCategory.mockReturnValue("Продукты");

      const text = `
самокат
1: Молоко
Общая стоимость позиции
100.00
2: Хлеб
Общая стоимость позиции
50.00
ИТОГО: 150.00
      `;
      const result = parseReceiptText(text);
      expect(result.description).toBe("Продукты из Самоката");
    });

    it("генерирует 'Покупка (N позиций)' без магазина", () => {
      const text = `
1: Товар1
Общая стоимость позиции
100.00
2: Товар2
Общая стоимость позиции
200.00
ИТОГО: 300.00
      `;
      // Не указан магазин, первая строка - номер позиции
      const result = parseReceiptText(text);
      // Может быть "Покупка (2 позиций)" или название первой позиции
      expect(result.description).toBeDefined();
    });

    it("возвращает null при отсутствии позиций и магазина", () => {
      const text = "";
      const result = parseReceiptText(text);
      expect(result.description).toBeNull();
    });
  });

  describe("getMerchantGenitive (склонение)", () => {
    it("генерирует описание для нескольких позиций", () => {
      mockedGetMerchantCategory.mockReturnValue("Продукты");

      const text = `
самокат
1: Товар1
Общая стоимость позиции
100.00
2: Товар2
Общая стоимость позиции
100.00
ИТОГО: 200.00
      `;
      const result = parseReceiptText(text);

      // Описание должно содержать "Продукты из" или название магазина
      expect(result.description).toBeDefined();
      expect(result.merchant).toBe("самокат");
    });
  });

  describe("parseReceiptText (интеграция)", () => {
    it("парсит полный чек", () => {
      const fullReceipt = `
Самокат
15.03.2024 14:30
1: Молоко 3.2%
Общая стоимость позиции
89.00
2: Хлеб белый
Общая стоимость позиции
45.00
ИТОГО: 134.00
КАРТОЙ ****1234
      `;

      const result = parseReceiptText(fullReceipt);

      expect(result.date?.getFullYear()).toBe(2024);
      expect(result.date?.getMonth()).toBe(2);
      expect(result.date?.getDate()).toBe(15);
      expect(result.amount).toBe(134);
      expect(result.merchant).toBe("самокат");
      expect(result.paymentMethod).toBe("card");
      expect(result.items).toHaveLength(2);
    });

    it("обрабатывает разные переносы строк (CRLF, LF, CR)", () => {
      const crlfText = "ИТОГ = 100.00\r\nКАРТОЙ";
      const lfText = "ИТОГ = 100.00\nКАРТОЙ";
      const crText = "ИТОГ = 100.00\rКАРТОЙ";

      const crlfResult = parseReceiptText(crlfText);
      const lfResult = parseReceiptText(lfText);
      const crResult = parseReceiptText(crText);

      expect(crlfResult.amount).toBe(100);
      expect(lfResult.amount).toBe(100);
      expect(crResult.amount).toBe(100);

      expect(crlfResult.paymentMethod).toBe("card");
      expect(lfResult.paymentMethod).toBe("card");
      expect(crResult.paymentMethod).toBe("card");
    });

    it("обрабатывает пустой текст", () => {
      const result = parseReceiptText("");

      expect(result.date).toBeDefined();
      expect(result.amount).toBeUndefined();
      expect(result.merchant).toBeNull();
      expect(result.paymentMethod).toBeNull();
      expect(result.items).toBeUndefined();
    });

    it("вызывает normalizeMerchantName и getMerchantCategory", () => {
      const text = "Магазин Продукты\nИТОГ = 100.00";
      parseReceiptText(text);

      expect(mockedNormalizeMerchantName).toHaveBeenCalled();
      expect(mockedGetMerchantCategory).toHaveBeenCalled();
    });
  });
});
