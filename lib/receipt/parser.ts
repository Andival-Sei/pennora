/**
 * Сервис для парсинга данных из текста чека
 */

import type { ReceiptData } from "./types";

/**
 * Парсит дату из текста чека
 * Ищет паттерны: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
 */
function parseDate(text: string): Date | null {
  // Паттерны для даты
  const datePatterns = [
    // DD.MM.YYYY HH:MM
    /(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/,
    // DD.MM.YYYY
    /(\d{2})\.(\d{2})\.(\d{4})/,
    // YYYY-MM-DD HH:MM
    /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/,
    // YYYY-MM-DD
    /(\d{4})-(\d{2})-(\d{2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        if (pattern === datePatterns[0]) {
          // DD.MM.YYYY HH:MM
          const [, day, month, year, hour, minute] = match;
          return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute)
          );
        } else if (pattern === datePatterns[1]) {
          // DD.MM.YYYY
          const [, day, month, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (pattern === datePatterns[2]) {
          // YYYY-MM-DD HH:MM
          const [, year, month, day, hour, minute] = match;
          return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute)
          );
        } else if (pattern === datePatterns[3]) {
          // YYYY-MM-DD
          const [, year, month, day] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      } catch (error) {
        console.error("Ошибка при парсинге даты:", error);
      }
    }
  }

  // Если не нашли дату, возвращаем текущую дату
  return new Date();
}

/**
 * Парсит сумму из текста чека
 * Ищет ключевые слова: ИТОГО, СУММА ПО ЧЕКУ, К ОПЛАТЕ, TOTAL
 * Приоритет: ИТОГ > СУММА ПО ЧЕКУ > другие паттерны
 */
function parseAmount(text: string): number | null {
  // Приоритетные паттерны для суммы (ищем первыми)
  const priorityPatterns = [
    // ИТОГ = 900.00
    /ИТОГ\s*[=:]\s*(\d+[.,]\d{2})/i,
    // СУММА ПО ЧЕКУ (БСО) 900.00
    /СУММА\s+ПО\s+ЧЕКУ[^:]*[:=]?\s*(\d+[.,]\d{2})/i,
    // ИТОГО: 900.00
    /ИТОГО\s*[:=]\s*(\d+[.,]\d{2})/i,
    // К ОПЛАТЕ: 900.00
    /К\s+ОПЛАТЕ\s*[:=]\s*(\d+[.,]\d{2})/i,
  ];

  // Сначала ищем по приоритетным паттернам
  for (const pattern of priorityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amountStr = match[1].replace(",", ".");
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  // Если не нашли, ищем в строках с ключевыми словами
  const lines = text.split("\n");
  for (const line of lines) {
    // Пропускаем строки с НДС, налогами и другими служебными суммами
    if (
      line.match(/НДС|НАЛОГ|СТАВКА|СУММА\s+НДС/i) &&
      !line.match(/ИТОГ|СУММА\s+ПО\s+ЧЕКУ/i)
    ) {
      continue;
    }

    // Ищем ИТОГО, СУММА, К ОПЛАТЕ
    const match = line.match(
      /(?:ИТОГО|СУММА|К\s+ОПЛАТЕ|TOTAL)\s*[:=]?\s*(\d+[.,]\d{2})/i
    );
    if (match && match[1]) {
      const amountStr = match[1].replace(",", ".");
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  // Если не нашли, ищем любое большое число (вероятно сумма)
  // Но пропускаем маленькие суммы (вероятно НДС или цены товаров)
  const numbers = text.match(/\d+[.,]\d{2}/g);
  if (numbers && numbers.length > 0) {
    // Берем самое большое число (вероятно итоговая сумма)
    const amounts = numbers
      .map((n) => parseFloat(n.replace(",", ".")))
      .filter((n) => !isNaN(n) && n > 0 && n < 1000000)
      .sort((a, b) => b - a);

    if (amounts.length > 0) {
      return amounts[0]; // Самое большое число
    }
  }

  return null;
}

/**
 * Парсит наименование продавца из текста чека
 * Обычно это первая строка или строка после "ООО", "ИП"
 */
function parseMerchant(text: string): string | null {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  // Ищем ООО или ИП
  for (const line of lines) {
    const match = line.match(/(?:ООО|ИП|OOO|IP)\s+(.+)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Берем первую непустую строку (обычно там название)
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Пропускаем служебные строки
    if (
      !firstLine.match(/^(ЧЕК|RECEIPT|КАССОВЫЙ|ФИСКАЛЬНЫЙ)/i) &&
      firstLine.length > 3
    ) {
      return firstLine;
    }
  }

  return null;
}

/**
 * Определяет способ оплаты из текста чека
 */
function parsePaymentMethod(text: string): "cash" | "card" | null {
  const upperText = text.toUpperCase();

  if (upperText.match(/(?:НАЛИЧНЫМИ|НАЛИЧНЫЕ|CASH)/i)) {
    return "cash";
  }

  if (
    upperText.match(
      /(?:КАРТОЙ|КАРТА|БЕЗНАЛИЧНЫЙ|БЕЗНАЛИЧНЫМИ|CARD|DEBIT|CREDIT)/i
    )
  ) {
    return "card";
  }

  return null;
}

/**
 * Парсит список товаров из текста чека
 */
function parseItems(text: string): Array<{ name: string; price: number }> {
  const items: Array<{ name: string; price: number }> = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Пропускаем служебные строки
    if (
      line.match(
        /^(ЧЕК|RECEIPT|ИТОГО|СУММА|К\s+ОПЛАТЕ|TOTAL|ООО|ИП|ОПЛАТА|НАЛИЧНЫМИ|БЕЗНАЛИЧНЫМИ|НДС|СТАВКА|СПОСОБ|ПРИЗНАК)/i
      )
    ) {
      continue;
    }

    // Ищем строки с товарами в формате:
    // 1: Название товара
    // или
    // Название товара    123.45
    // или
    // Общая стоимость позиции с учетом скидок и наценок 900.00

    // Формат с номером: "1: Фонарь Эра GB-608..."
    const numberedItemMatch = line.match(/^\d+:\s*(.+)/);
    if (numberedItemMatch) {
      const name = numberedItemMatch[1].trim();
      // Ищем цену в следующей строке или в текущей
      let price = 0;

      // Проверяем следующую строку на наличие цены
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const priceMatch = nextLine.match(/(\d+[.,]\d{2})/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(",", "."));
        }
      }

      if (name.length > 0 && !name.match(/^(шт\.|x|×)/i)) {
        items.push({ name, price });
      }
      continue;
    }

    // Формат: "Общая стоимость позиции с учетом скидок и наценок 900.00"
    const totalPriceMatch = line.match(
      /Общая\s+стоимость\s+позиции[^:]*[:=]?\s*(\d+[.,]\d{2})/i
    );
    if (totalPriceMatch && items.length > 0) {
      // Обновляем цену последнего товара
      const price = parseFloat(totalPriceMatch[1].replace(",", "."));
      if (!isNaN(price) && price > 0) {
        items[items.length - 1].price = price;
      }
      continue;
    }

    // Формат: Название товара    123.45
    const priceMatch = line.match(/(.+?)\s+(\d+[.,]\d{2})$/);
    if (priceMatch) {
      const name = priceMatch[1].trim();
      const price = parseFloat(priceMatch[2].replace(",", "."));

      // Пропускаем служебные строки с суммами
      if (name.match(/^(ИТОГО|СУММА|НАЛИЧНЫМИ|БЕЗНАЛИЧНЫМИ|НДС|СТАВКА)/i)) {
        continue;
      }

      if (name.length > 0 && !isNaN(price) && price > 0) {
        items.push({ name, price });
      }
    }
  }

  return items;
}

/**
 * Извлекает название первого товара для использования в описании
 */
function parseFirstItemName(text: string): string | null {
  const items = parseItems(text);
  if (items.length > 0 && items[0].name) {
    return items[0].name;
  }
  return null;
}

/**
 * Парсит данные из текста чека
 */
export function parseReceiptText(text: string): Partial<ReceiptData> {
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const date = parseDate(normalizedText);
  const amount = parseAmount(normalizedText);
  const paymentMethod = parsePaymentMethod(normalizedText);
  const items = parseItems(normalizedText);

  // Для описания приоритет: название товара > название продавца
  const firstItemName = parseFirstItemName(normalizedText);
  const merchantName = parseMerchant(normalizedText);
  const description = firstItemName || merchantName;

  return {
    date: date || undefined,
    amount: amount || undefined,
    description: description || null,
    paymentMethod: paymentMethod || null,
    items: items.length > 0 ? items : undefined,
  };
}
