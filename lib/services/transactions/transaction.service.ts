import type { Transaction, TransactionInsert } from "@/lib/types/transaction";
import type { TransactionFormValues } from "@/lib/validations/transactions";
import type { Database } from "@/lib/db/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

/**
 * Сервис для работы с бизнес-логикой транзакций
 */
export class TransactionService {
  /**
   * Форматирует дату в формат YYYY-MM-DD (без времени, чтобы избежать проблем с часовыми поясами)
   * Использует локальную дату, а не UTC
   */
  static formatTransactionDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Получает валюту из выбранного счета
   * @param accounts - Массив всех счетов
   * @param accountId - ID выбранного счета
   * @param defaultCurrency - Валюта по умолчанию (если счет не найден)
   * @returns Код валюты
   */
  static getTransactionCurrency(
    accounts: Account[],
    accountId: string,
    defaultCurrency: string = "RUB"
  ): string {
    const selectedAccount = accounts.find((acc) => acc.id === accountId);
    return selectedAccount?.currency || defaultCurrency;
  }

  /**
   * Определяет доступные счета для перевода
   * Фильтрует счета:
   * 1. Исключает исходный счет
   * 2. Показывает только счета с той же валютой (запрещает переводы между разными валютами)
   * @param accounts - Массив всех счетов
   * @param sourceAccountId - ID исходного счета
   * @returns Массив доступных счетов для перевода
   */
  static getAvailableToAccounts(
    accounts: Account[],
    sourceAccountId: string
  ): Account[] {
    const sourceAccount = accounts.find((acc) => acc.id === sourceAccountId);
    const sourceCurrency = sourceAccount?.currency;

    if (!sourceCurrency) {
      return [];
    }

    return accounts.filter(
      (acc) => acc.id !== sourceAccountId && acc.currency === sourceCurrency
    );
  }

  /**
   * Преобразует данные формы в TransactionInsert для сохранения в БД
   * @param formValues - Значения формы
   * @param accounts - Массив всех счетов
   * @param userId - ID пользователя
   * @param defaultCurrency - Валюта по умолчанию
   * @returns Данные транзакции для вставки в БД
   */
  static prepareTransactionData(
    formValues: TransactionFormValues,
    accounts: Account[],
    userId: string,
    defaultCurrency: string = "RUB"
  ): TransactionInsert {
    // Форматируем дату
    const transactionDate =
      formValues.date instanceof Date
        ? formValues.date
        : new Date(formValues.date);
    const dateString = this.formatTransactionDate(transactionDate);

    // Получаем валюту из выбранного счета
    const currency = this.getTransactionCurrency(
      accounts,
      formValues.account_id,
      defaultCurrency
    );

    // Формируем данные транзакции
    return {
      amount: formValues.amount,
      type: formValues.type,
      category_id:
        formValues.type === "transfer" ||
        formValues.category_id === "__none__" ||
        !formValues.category_id
          ? null
          : formValues.category_id,
      account_id: formValues.account_id,
      to_account_id:
        formValues.type === "transfer"
          ? formValues.to_account_id || null
          : null,
      date: dateString,
      description: formValues.description || null,
      currency,
      user_id: userId,
    };
  }

  /**
   * Получает валидную дату по умолчанию (сегодняшняя дата, время установлено на начало дня)
   */
  static getDefaultDate(): Date {
    const today = new Date();
    // Устанавливаем время на начало дня для консистентности
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Определяет, является ли объект полной транзакцией (с id)
   */
  static isFullTransaction(
    data:
      | Transaction
      | Partial<{
          amount: number;
          date: Date;
          description?: string;
          category_id?: string;
          account_id?: string;
          to_account_id?: string;
          type?: "income" | "expense" | "transfer";
        }>
      | undefined
  ): data is Transaction {
    return data !== undefined && "id" in data && data.id !== undefined;
  }

  /**
   * Получает начальные значения для формы из initialData
   * @param initialData - Начальные данные (полная транзакция или частичные данные с date как Date)
   * @returns Значения формы
   */
  static getInitialFormValues(
    initialData?:
      | Transaction
      | Partial<{
          amount: number;
          date: Date;
          description?: string;
          category_id?: string;
          account_id?: string;
          to_account_id?: string;
          type?: "income" | "expense" | "transfer";
        }>
  ): TransactionFormValues {
    const defaultDate = this.getDefaultDate();
    const isFull = this.isFullTransaction(initialData);

    // Если есть начальная дата, используем её
    let initialDate = defaultDate;
    if (initialData && "date" in initialData && initialData.date) {
      if (typeof initialData.date === "string") {
        initialDate = new Date(initialData.date);
      } else if (initialData.date instanceof Date) {
        initialDate = initialData.date;
      }
    }

    return {
      amount: (isFull ? initialData.amount : initialData?.amount) || 0,
      type: (isFull ? initialData.type : undefined) || "expense",
      category_id: isFull
        ? initialData.category_id || "__none__"
        : initialData?.category_id || "__none__",
      account_id:
        (isFull ? initialData.account_id : initialData?.account_id) || "",
      to_account_id:
        (isFull ? initialData.to_account_id : initialData?.to_account_id) || "",
      date: initialDate,
      description:
        (isFull ? initialData.description : initialData?.description) || "",
    };
  }

  /**
   * Получает пустые значения для сброса формы
   */
  static getEmptyFormValues(): TransactionFormValues {
    return {
      amount: 0,
      type: "expense",
      category_id: "__none__",
      account_id: "",
      to_account_id: "",
      date: this.getDefaultDate(),
      description: "",
    };
  }
}
