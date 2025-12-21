/**
 * Утилиты для парсинга и форматирования названий счетов
 */

// Список банков для обратного поиска
const BANK_NAMES = {
  sberbank: ["СберБанк", "Сбер", "SberBank", "Sber"],
  vtb: ["ВТБ", "VTB"],
  tinkoff: ["Т-Банк", "Тинькофф", "T-Bank", "Tinkoff"],
  alpha: ["Альфа-Банк", "Альфа", "Alfa-Bank", "Alfa"],
  ozon: ["Ozon Банк", "Ozon", "Озон Банк", "Озон"],
  yandex: ["Яндекс Банк", "Яндекс", "Yandex Bank", "Yandex"],
} as const;

type BankKey = keyof typeof BANK_NAMES;

/**
 * Находит ключ банка по его названию (переведенному)
 * @param bankName - Название банка на русском или английском
 * @returns Ключ банка или "other" если не найден
 */
function findBankKey(bankName: string): BankKey | "other" {
  const normalizedName = bankName.trim();

  for (const [key, names] of Object.entries(BANK_NAMES)) {
    if (names.some((name) => name === normalizedName)) {
      return key as BankKey;
    }
  }

  return "other";
}

/**
 * Парсит название карты для извлечения названия карты и банка
 * @param name - Название счета в формате "Название (Банк)" или просто "Название"
 * @returns Объект с названием карты и ключом банка
 */
export function parseCardAccountName(name: string): {
  cardName: string;
  bank: string;
} {
  // Паттерн: "Название (Банк)" или просто "Название"
  const match = name.match(/^(.+?)\s*\((.+?)\)\s*$/);

  if (match) {
    const cardName = match[1].trim();
    const bankName = match[2].trim();
    const bank = findBankKey(bankName);
    return { cardName, bank };
  }

  // Если нет скобок, значит это "other" банк
  return { cardName: name.trim(), bank: "other" };
}

/**
 * Парсит название наличных для извлечения валюты
 * @param name - Название счета в формате "Наличные (Валюта)"
 * @returns Код валюты или null
 */
export function parseCashAccountName(name: string): {
  currency: string | null;
} {
  // Паттерн: "Наличные (Валюта)" или "Cash (Currency)"
  const match = name.match(/^(?:Наличные|Cash)\s*\((.+?)\)\s*$/i);

  if (match) {
    const currencyName = match[1].trim();
    // Маппинг названий валют на коды
    const currencyMap: Record<string, string> = {
      Рубли: "RUB",
      Доллары: "USD",
      Евро: "EUR",
      "Russian Rubles": "RUB",
      "US Dollars": "USD",
      Euros: "EUR",
    };

    return { currency: currencyMap[currencyName] || null };
  }

  return { currency: null };
}

/**
 * Форматирует название карты с банком
 * @param cardName - Название карты
 * @param bank - Ключ банка
 * @param bankNameTranslations - Функция для получения переведенного названия банка
 * @returns Отформатированное название
 */
export function formatCardAccountName(
  cardName: string,
  bank: string,
  bankNameTranslations: (key: string) => string
): string {
  if (bank === "other") {
    return cardName.trim();
  }

  const bankName = bankNameTranslations(`card.banks.${bank}`);
  return `${cardName.trim()} (${bankName})`;
}

/**
 * Форматирует название наличных с валютой
 * @param currencyCode - Код валюты
 * @param currencyNameTranslations - Функция для получения переведенного названия валюты
 * @param defaultNameTranslations - Функция для получения переведенного названия "Наличные"
 * @returns Отформатированное название
 */
export function formatCashAccountName(
  currencyCode: string,
  currencyNameTranslations: (key: string) => string,
  defaultNameTranslations: (key: string) => string
): string {
  const currencyName = currencyNameTranslations(
    `currency.options.${currencyCode}.name`
  );
  const defaultName = defaultNameTranslations("cash.defaultName");
  return `${defaultName} (${currencyName})`;
}
