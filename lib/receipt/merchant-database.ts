/**
 * База данных известных магазинов и продавцов
 * Используется для нормализации названий и улучшения распознавания
 */

/**
 * Известные магазины с их вариантами названий
 */
export const KNOWN_MERCHANTS: Record<
  string,
  {
    displayName: string; // Понятное название для пользователя
    legalNames?: string[]; // Юридические названия (ООО, ИП и т.д.)
    domains?: string[]; // Домены сайтов
    keywords?: string[]; // Ключевые слова для поиска
    category?: string; // Предполагаемая категория
  }
> = {
  // Доставка еды и готовой еды
  самокат: {
    displayName: "Самокат",
    legalNames: ["ООО УМНЫЙ РИТЕЙЛ", "УМНЫЙ РИТЕЙЛ"],
    domains: ["samokat.ru", "samokat"],
    keywords: ["самокат", "samokat"],
    category: "Готовая еда",
  },
  "яндекс.лавка": {
    displayName: "Яндекс.Лавка",
    legalNames: ["ЯНДЕКС.ЛАВКА", "YANDEX.LAVKA"],
    domains: ["lavka.yandex.ru", "lavka.yandex"],
    keywords: ["яндекс.лавка", "yandex.lavka", "лавка"],
    category: "Готовая еда",
  },
  "яндекс еда": {
    displayName: "Яндекс.Еда",
    legalNames: ["ЯНДЕКС.ЕДА", "YANDEX.EDA"],
    domains: ["eda.yandex.ru", "eda.yandex"],
    keywords: ["яндекс.еда", "yandex.eda", "доставка еды"],
    category: "Доставка еды",
  },
  delivery: {
    displayName: "Delivery Club",
    legalNames: ["ДЕЛИВЕРИ КЛАБ", "DELIVERY CLUB"],
    domains: ["deliveryclub.ru", "deliveryclub"],
    keywords: ["delivery club", "деливери клаб"],
    category: "Доставка еды",
  },

  // Супермаркеты
  пятёрочка: {
    displayName: "Пятёрочка",
    legalNames: ["ПЯТЁРОЧКА", "X5 RETAIL GROUP"],
    domains: ["5ka.ru", "5ka"],
    keywords: ["пятёрочка", "5ka", "пятерочка"],
    category: "Продукты",
  },
  магнит: {
    displayName: "Магнит",
    legalNames: ["МАГНИТ", "MAGNIT"],
    domains: ["magnit.ru", "magnit"],
    keywords: ["магнит", "magnit"],
    category: "Продукты",
  },
  перекрёсток: {
    displayName: "Перекрёсток",
    legalNames: ["ПЕРЕКРЁСТОК", "PERERKRESTOK"],
    domains: ["perekrestok.ru", "perekrestok"],
    keywords: ["перекрёсток", "perekrestok"],
    category: "Продукты",
  },
  ашан: {
    displayName: "Ашан",
    legalNames: ["АШАН", "AUCHAN"],
    domains: ["auchan.ru", "auchan"],
    keywords: ["ашан", "auchan"],
    category: "Продукты",
  },
  лента: {
    displayName: "Лента",
    legalNames: ["ЛЕНТА", "LENTA"],
    domains: ["lenta.com", "lenta"],
    keywords: ["лента", "lenta"],
    category: "Продукты",
  },
  окей: {
    displayName: "О'Кей",
    legalNames: ["О'КЕЙ", "OKEY"],
    domains: ["okeydostavka.ru", "okey"],
    keywords: ["окей", "okey", "о'кей"],
    category: "Продукты",
  },
  дикси: {
    displayName: "Дикси",
    legalNames: ["ДИКСИ", "DIXY"],
    domains: ["dixy.ru", "dixy"],
    keywords: ["дикси", "dixy"],
    category: "Продукты",
  },
  метро: {
    displayName: "Метро",
    legalNames: ["МЕТРО", "METRO"],
    domains: ["metro-cc.ru", "metro"],
    keywords: ["метро", "metro"],
    category: "Продукты",
  },

  // Рестораны и кафе
  макдональдс: {
    displayName: "Макдональдс",
    legalNames: ["МАКДОНАЛЬДС", "MCDONALDS"],
    domains: ["mcdonalds.ru", "mcdonalds"],
    keywords: ["макдональдс", "mcdonalds", "макдак"],
    category: "Рестораны и кафе",
  },
  kfc: {
    displayName: "KFC",
    legalNames: ["KFC", "КЕНТАККИ"],
    domains: ["kfc.ru", "kfc"],
    keywords: ["kfc", "кентакки"],
    category: "Рестораны и кафе",
  },
  "burger king": {
    displayName: "Burger King",
    legalNames: ["БУРГЕР КИНГ", "BURGER KING"],
    domains: ["burgerking.ru", "burgerking"],
    keywords: ["burger king", "бургер кинг"],
    category: "Рестораны и кафе",
  },
};

/**
 * Нормализует название продавца, используя базу известных магазинов
 * @param merchantName - сырое название продавца из чека
 * @returns нормализованное название или исходное, если не найдено
 */
export function normalizeMerchantName(
  merchantName: string | null
): string | null {
  if (!merchantName) return null;

  const lowerName = merchantName.toLowerCase().trim();

  // Ищем точное совпадение по ключевым словам
  for (const merchant of Object.values(KNOWN_MERCHANTS)) {
    // Проверяем ключевые слова
    if (merchant.keywords) {
      for (const keyword of merchant.keywords) {
        if (lowerName.includes(keyword.toLowerCase())) {
          return merchant.displayName;
        }
      }
    }

    // Проверяем юридические названия
    if (merchant.legalNames) {
      for (const legalName of merchant.legalNames) {
        if (lowerName.includes(legalName.toLowerCase())) {
          return merchant.displayName;
        }
      }
    }

    // Проверяем домены
    if (merchant.domains) {
      for (const domain of merchant.domains) {
        if (lowerName.includes(domain.toLowerCase())) {
          return merchant.displayName;
        }
      }
    }
  }

  // Если не нашли, возвращаем исходное название, но очищенное
  return merchantName.trim();
}

/**
 * Получает предполагаемую категорию для магазина
 * @param merchantName - название магазина
 * @returns название категории или null
 */
export function getMerchantCategory(
  merchantName: string | null
): string | null {
  if (!merchantName) return null;

  const lowerName = merchantName.toLowerCase().trim();

  for (const merchant of Object.values(KNOWN_MERCHANTS)) {
    if (merchant.displayName.toLowerCase() === lowerName) {
      return merchant.category || null;
    }
  }

  return null;
}
