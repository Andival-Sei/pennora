import type { Database } from "@/lib/db/supabase/types";

type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
type Account = Database["public"]["Tables"]["accounts"]["Row"];

export type TranslationFn = (key: string) => string;

/**
 * Сервис для работы с бизнес-логикой счетов
 */
export class AccountService {
  /**
   * Преобразует строковое значение баланса в число
   * Поддерживает запятую и точку как разделитель
   */
  static parseBalance(balanceString: string): number {
    return parseFloat(balanceString.replace(",", "."));
  }

  /**
   * Формирует название карточного счета
   * Формат: "Название карты (Банк)" или просто "Название карты" для "other"
   * @param name - Название карты
   * @param bank - Код банка
   * @param tOnboarding - Функция перевода для названий банков
   * @returns Название счета
   */
  static formatCardAccountName(
    name: string,
    bank: string,
    tOnboarding: TranslationFn
  ): string {
    if (bank === "other") {
      return name;
    }
    const bankName = tOnboarding(`card.banks.${bank}`);
    return `${name} (${bankName})`;
  }

  /**
   * Подготавливает данные для создания карточного счета
   * @param cardData - Данные формы карточного счета
   * @param userId - ID пользователя
   * @param currency - Валюта счета
   * @param tOnboarding - Функция перевода
   * @returns Данные для вставки в БД
   */
  static prepareCardAccountData(
    cardData: {
      name: string;
      bank: string;
      balance: string;
    },
    userId: string,
    currency: string,
    tOnboarding: TranslationFn
  ): AccountInsert {
    const balance = this.parseBalance(cardData.balance);
    const accountName = this.formatCardAccountName(
      cardData.name,
      cardData.bank,
      tOnboarding
    );

    return {
      user_id: userId,
      name: accountName,
      type: "card",
      currency,
      balance,
    };
  }

  /**
   * Подготавливает данные для создания наличного счета
   * @param cashData - Данные формы наличного счета
   * @param userId - ID пользователя
   * @param currency - Валюта счета
   * @param defaultName - Название по умолчанию (из переводов)
   * @returns Данные для вставки в БД
   */
  static prepareCashAccountData(
    cashData: { balance: string },
    userId: string,
    currency: string,
    defaultName: string
  ): AccountInsert {
    const balance = this.parseBalance(cashData.balance);

    return {
      user_id: userId,
      name: defaultName,
      type: "cash",
      currency,
      balance,
    };
  }

  /**
   * Определяет доступные валюты для наличных счетов
   * Возвращает валюты, которых еще нет среди существующих наличных счетов
   * @param accounts - Массив существующих счетов
   * @param availableCurrencies - Список доступных валют
   * @returns Массив доступных валют
   */
  static getAvailableCashCurrencies(
    accounts: Account[],
    availableCurrencies: string[] = ["RUB", "USD", "EUR"]
  ): string[] {
    const existingCashCurrencies = accounts
      .filter((acc) => acc.type === "cash")
      .map((acc) => acc.currency);

    return availableCurrencies.filter(
      (currency) => !existingCashCurrencies.includes(currency)
    );
  }

  /**
   * Проверяет, есть ли все валюты наличных счетов
   */
  static hasAllCashCurrencies(
    accounts: Account[],
    availableCurrencies: string[] = ["RUB", "USD", "EUR"]
  ): boolean {
    const available = this.getAvailableCashCurrencies(
      accounts,
      availableCurrencies
    );
    return available.length === 0;
  }
}
