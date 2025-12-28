/**
 * Сервис для парсинга данных из текста чека
 */

import type { ReceiptData } from "./types";
import {
  normalizeMerchantName,
  getMerchantCategory,
} from "./merchant-database";

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
 * Ищет в различных местах: домены, ООО/ИП, известные магазины
 */
function parseMerchant(text: string): string | null {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const fullText = text.toLowerCase();

  // Сначала ищем известные магазины по ключевым словам в тексте
  // (приоритет выше, так как это более точное определение)
  const knownKeywords = [
    "самокат",
    "samokat",
    "пятёрочка",
    "5ka",
    "магнит",
    "magnit",
    "перекрёсток",
    "perekrestok",
    "ашан",
    "auchan",
    "лента",
    "lenta",
    "окей",
    "okey",
    "дикси",
    "dixy",
    "метро",
    "metro",
    "яндекс.лавка",
    "yandex.lavka",
    "яндекс.еда",
    "yandex.eda",
  ];

  for (const keyword of knownKeywords) {
    if (fullText.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }

  // Ищем домены в тексте (например, samokat.ru, 5ka.ru)
  const domainPattern = /([a-z0-9-]+)\.(?:ru|com|net|org|рф)/gi;
  const domainMatches = Array.from(fullText.matchAll(domainPattern));
  if (domainMatches && domainMatches.length > 0) {
    // Берем первый найденный домен
    for (const match of domainMatches) {
      const domain = match[1]; // Извлекаем название до точки
      if (domain && domain.length > 2) {
        // Проверяем, не служебный ли это домен
        const serviceDomains = [
          "mail",
          "www",
          "http",
          "https",
          "ftp",
          "platformaofd", // Платформа ОФД (доставка чеков), не магазин
          "chek", // chek.pofd.ru - платформа ОФД
          "pofd", // pofd.ru - платформа ОФД
          "ofd", // Оператор фискальных данных
          "nalog", // nalog.ru - налоговая служба
          "fns", // fns.ru - федеральная налоговая служба
        ];
        if (!serviceDomains.includes(domain.toLowerCase())) {
          return domain;
        }
      }
    }
  }

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
 * Проверяет, является ли строка служебной (не товаром)
 */
function isServiceLine(line: string): boolean {
  const trimmed = line.trim();

  // Пустые строки
  if (!trimmed) {
    return true;
  }

  // Строки с количеством (1 шт. x, x 186.00, ×)
  if (
    trimmed.match(/^\d+\s*шт\.?\s*x?\s*\d*/i) ||
    trimmed.match(/^\d+\s*x\s*\d+/i) ||
    trimmed.match(/^x\s*\d+/i) ||
    trimmed.match(/^×\s*\d+/i) ||
    trimmed.match(/^\d+\s*шт\.?$/i)
  ) {
    return true;
  }

  // Служебные строки российских чеков
  const servicePatterns = [
    /^(ЧЕК|RECEIPT|КАССОВЫЙ|ФИСКАЛЬНЫЙ)/i,
    /^(ИТОГ|ИТОГО|СУММА|К\s+ОПЛАТЕ|TOTAL)/i,
    /^(ООО|ИП|OOO|IP)/i,
    /^(ОПЛАТА|НАЛИЧНЫМИ|БЕЗНАЛИЧНЫМИ)/i,
    /^(НДС|СТАВКА\s+НДС|ставка\s+\d+%)/i,
    /^(СПОСОБ\s+РАСЧЕТА|Признак\s+предмета\s+расчета)/i,
    /^(ЗАЧЕТ|ПРЕДОПЛАТ|АВАНС|АВАНСА)/i,
    /^СУММА\s+ПО\s+ЧЕКУ/i,
    /^СУММА\s+НДС\s+ЧЕКА/i,
    /^Общая\s+стоимость\s+позиции/i, // Это служебная строка, не товар
    /^=\s*\d+/i, // "= 858.00"
    /^(ПОЛНЫЙ|ЧАСТИЧНЫЙ|АВАНСОВЫЙ)\s+РАСЧЕТ/i,
    /^(Товар|Услуга|Работа)/i, // Признак предмета расчета
  ];

  return servicePatterns.some((pattern) => trimmed.match(pattern));
}

/**
 * Проверяет, является ли строка маркером конца секции товаров
 */
function isEndOfItemsSection(line: string): boolean {
  const trimmed = line.trim().toUpperCase();
  return (
    trimmed.startsWith("ИТОГ") ||
    trimmed.startsWith("ИТОГО") ||
    !!trimmed.match(/^СУММА\s+ПО\s+ЧЕКУ/i) ||
    !!trimmed.match(/^ЗАЧЕТ/i) ||
    !!trimmed.match(/^ПРЕДОПЛАТ/i) ||
    !!trimmed.match(/^АВАНС/i)
  );
}

/**
 * Находит цену товара, начиная с указанного индекса
 * Ищет в структуре: "Общая стоимость позиции..." -> следующая строка с ценой
 * Также ищет цену в строке с количеством: "1 шт. x 186.00"
 */
function findItemPrice(lines: string[], startIndex: number): number | null {
  // Ищем строку "Общая стоимость позиции..."
  // Ограничиваем поиск следующими 15 строками или до следующего товара
  for (let i = startIndex; i < Math.min(startIndex + 15, lines.length); i++) {
    const line = lines[i].trim();

    // Если встретили следующий товар (новый номер), прекращаем поиск
    if (i > startIndex && line.match(/^\d+:\s*/)) {
      break;
    }

    // Если встретили конец секции товаров, прекращаем поиск
    if (isEndOfItemsSection(line)) {
      break;
    }

    // Ищем строку "Общая стоимость позиции..." с ценой
    const hasTotalPrice = line.match(/Общая\s+стоимость\s+позиции/i);
    if (hasTotalPrice) {
      // Проверяем, есть ли цена в самой строке
      const totalPriceMatch = line.match(
        /Общая\s+стоимость\s+позиции[^:]*[:=]?\s*(\d+[.,]\d{2})/i
      );
      if (totalPriceMatch && totalPriceMatch[1]) {
        const price = parseFloat(totalPriceMatch[1].replace(",", "."));
        // Фильтруем слишком маленькие суммы (вероятно НДС или другие служебные суммы)
        if (!isNaN(price) && price > 10) {
          return price;
        }
      }

      // Проверяем следующую строку на наличие цены
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const priceMatch = nextLine.match(/^(\d+[.,]\d{2})$/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(",", "."));
          // Фильтруем слишком маленькие суммы
          if (!isNaN(price) && price > 10) {
            return price;
          }
        }
      }
    }

    // Ищем цену в строке с количеством: "1 шт. x 186.00" или "x 186.00"
    // Это цена за единицу, но если нет "Общая стоимость", используем её
    const quantityPriceMatch = line.match(
      /(?:^\d+\s*шт\.?\s*x\s*|^x\s*|^×\s*)(\d+[.,]\d{2})/i
    );
    if (quantityPriceMatch && quantityPriceMatch[1]) {
      const price = parseFloat(quantityPriceMatch[1].replace(",", "."));
      // Если это цена за единицу, умножаем на количество (если указано)
      const quantityMatch = line.match(/^(\d+)\s*шт\.?\s*x/i);
      if (quantityMatch) {
        const quantity = parseInt(quantityMatch[1]);
        if (!isNaN(quantity) && quantity > 0 && !isNaN(price) && price > 10) {
          return price * quantity;
        }
      } else if (!isNaN(price) && price > 10) {
        // Если количество не указано, используем цену как есть
        return price;
      }
    }
  }

  return null;
}

/**
 * Парсит список товаров из текста чека
 * Поддерживает формат российских кассовых чеков с пронумерованными позициями
 */
function parseItems(text: string): Array<{ name: string; price: number }> {
  const items: Array<{ name: string; price: number }> = [];
  const lines = text.split("\n").map((line) => line.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Если встретили конец секции товаров, прекращаем обработку
    if (isEndOfItemsSection(line)) {
      break;
    }

    // Пропускаем служебные строки
    if (isServiceLine(line)) {
      continue;
    }

    // Ищем формат с номером: "1: Название товара"
    const numberedItemMatch = line.match(/^(\d+):\s*(.+)$/);
    if (numberedItemMatch) {
      const name = numberedItemMatch[2].trim();

      // Пропускаем, если название пустое или это служебная строка
      if (!name || isServiceLine(name)) {
        continue;
      }

      // Ищем цену в следующих строках (в блоке "Общая стоимость позиции...")
      const price = findItemPrice(lines, i + 1);

      // Добавляем товар только если есть название и цена
      if (name.length > 0 && price !== null && price > 0) {
        items.push({ name, price });
      }

      // Пропускаем строки до следующего товара или конца секции
      // (чтобы не обрабатывать служебные строки этого товара повторно)
      continue;
    }

    // Альтернативный формат: "Название товара    123.45" (цена в конце строки)
    // Используем только если нет пронумерованных позиций
    if (items.length === 0) {
      const priceMatch = line.match(/^(.+?)\s+(\d+[.,]\d{2})$/);
      if (priceMatch) {
        const name = priceMatch[1].trim();
        const price = parseFloat(priceMatch[2].replace(",", "."));

        // Пропускаем служебные строки
        if (isServiceLine(name)) {
          continue;
        }

        if (
          name.length > 0 &&
          !isNaN(price) &&
          price > 0 &&
          !name.match(/^(ИТОГО|СУММА|НАЛИЧНЫМИ|БЕЗНАЛИЧНЫМИ|НДС|СТАВКА)/i)
        ) {
          items.push({ name, price });
        }
      }
    }
  }

  return items;
}

/**
 * Склоняет название магазина в родительный падеж для фразы "из [название]"
 * @param merchant - название магазина в именительном падеже
 * @returns название в родительном падеже
 */
function getMerchantGenitive(merchant: string): string {
  const lower = merchant.toLowerCase();

  // Специальные случаи для известных магазинов
  const specialCases: Record<string, string> = {
    самокат: "Самоката",
    "яндекс.лавка": "Яндекс.Лавки",
    "яндекс еда": "Яндекс.Еды",
    "яндекс.еда": "Яндекс.Еды",
    пятёрочка: "Пятёрочки",
    магнит: "Магнита",
    перекрёсток: "Перекрёстка",
    ашан: "Ашана",
    лента: "Ленты",
    окей: "О'Кея",
    дикси: "Дикси",
    метро: "Метро",
    макдональдс: "Макдональдса",
    kfc: "KFC",
    "burger king": "Burger King",
  };

  if (specialCases[lower]) {
    return specialCases[lower];
  }

  // Общие правила склонения
  // Если заканчивается на согласную (кроме й, ь), добавляем "а"
  if (/[бвгджзклмнпрстфхцчшщ]$/i.test(merchant)) {
    return merchant + "а";
  }

  // Если заканчивается на "й", заменяем на "я"
  if (/й$/i.test(merchant)) {
    return merchant.slice(0, -1) + "я";
  }

  // Если заканчивается на "ь", заменяем на "я"
  if (/ь$/i.test(merchant)) {
    return merchant.slice(0, -1) + "я";
  }

  // Если заканчивается на гласную, добавляем "а" (для большинства случаев)
  if (/[аеёиоуыэюя]$/i.test(merchant)) {
    // Для слов на "а" заменяем на "ы" (но есть исключения)
    if (/а$/i.test(merchant) && merchant.length > 3) {
      return merchant.slice(0, -1) + "ы";
    }
    return merchant + "а";
  }

  // Если не подошло ни одно правило, возвращаем исходное
  return merchant;
}

/**
 * Генерирует описание транзакции на основе данных чека
 * Для сплит-транзакций (несколько позиций) создаёт общее описание
 * Для одиночных позиций использует название товара
 */
function generateDescription(
  merchant: string | null,
  items: Array<{ name: string; price: number }>,
  merchantCategory: string | null
): string | null {
  // Если нет позиций и нет продавца, возвращаем null
  if (items.length === 0 && !merchant) {
    return null;
  }

  // Если одна позиция, используем название товара
  if (items.length === 1) {
    return items[0].name;
  }

  // Если несколько позиций, создаём общее описание
  if (items.length > 1) {
    if (merchant && merchantCategory) {
      // Формат: "Категория из Магазина" (магазин в родительном падеже)
      const merchantGenitive = getMerchantGenitive(merchant);
      return `${merchantCategory} из ${merchantGenitive}`;
    } else if (merchant) {
      // Формат: "Покупка из Магазина" (магазин в родительном падеже)
      const merchantGenitive = getMerchantGenitive(merchant);
      return `Покупка из ${merchantGenitive}`;
    } else {
      // Если нет магазина, используем количество позиций
      return `Покупка (${items.length} позиций)`;
    }
  }

  // Если нет позиций, но есть продавец
  if (merchant) {
    return `Покупка в ${merchant}`;
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

  // Парсим продавца и нормализуем название
  const rawMerchant = parseMerchant(normalizedText);
  let merchant: string | null = null;
  let merchantCategory: string | null = null;

  if (rawMerchant) {
    merchant = normalizeMerchantName(rawMerchant);
    merchantCategory = getMerchantCategory(merchant);
  }

  // Генерируем описание на основе количества позиций
  const description = generateDescription(merchant, items, merchantCategory);

  return {
    date: date || undefined,
    amount: amount || undefined,
    description: description || null,
    merchant: merchant || null,
    paymentMethod: paymentMethod || null,
    items: items.length > 0 ? items : undefined,
  };
}
