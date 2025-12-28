import { createClient } from "@/lib/db/supabase/client";
import { getClientUser } from "@/lib/db/supabase/auth-client";
import type { TransactionWithItems } from "@/lib/types/transaction";
import type {
  CategoryStatistics,
  PeriodStatistics,
  StatisticsSummary,
  TrendPeriod,
} from "@/lib/types/statistics";
import type { Category } from "@/lib/types/category";
import type { CurrencyCode } from "@/lib/currency/rates";
import { convertMultipleCurrencies } from "@/lib/currency/converter";
import {
  aggregateByTopCategory,
  aggregateByAllCategories,
  aggregateWithHierarchy,
} from "@/lib/utils/category-hierarchy";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

/**
 * Загружает транзакции за указанный период
 */
export async function fetchTransactionsForPeriod(
  from: Date,
  to: Date
): Promise<TransactionWithItems[]> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const supabase = createClient();

  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      id,
      user_id,
      account_id,
      category_id,
      to_account_id,
      type,
      amount,
      currency,
      exchange_rate,
      description,
      date,
      created_at,
      updated_at,
      category:categories(
        id,
        user_id,
        name,
        type,
        icon,
        color,
        parent_id,
        sort_order,
        is_archived,
        is_system,
        created_at,
        updated_at
      ),
      items:transaction_items(
        id,
        transaction_id,
        category_id,
        amount,
        description,
        sort_order,
        created_at,
        updated_at,
        category:categories(
          id,
          user_id,
          name,
          type,
          icon,
          color,
          parent_id,
          sort_order,
          is_archived,
          is_system,
          created_at,
          updated_at
        )
      )
    `
    )
    .eq("user_id", user.id)
    .gte("date", fromStr)
    .lte("date", toStr)
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((item) => {
    const category = Array.isArray(item.category)
      ? item.category[0] || null
      : item.category || null;

    const mappedItems = (item.items || []).map(
      (i: Record<string, unknown>) => ({
        ...i,
        sort_order: (i.sort_order as number) ?? 0,
        category: Array.isArray(i.category)
          ? (i.category as Record<string, unknown>[])[0] || null
          : i.category || null,
      })
    );

    const items = mappedItems.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );

    return {
      ...item,
      category,
      items,
    };
  }) as TransactionWithItems[];
}

/**
 * Загружает все категории пользователя
 */
async function fetchAllCategories(): Promise<Category[]> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, user_id, name, type, icon, color, parent_id, sort_order, is_archived, is_system, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .eq("is_archived", false);

  if (error) {
    throw error;
  }

  return (data || []) as Category[];
}

/**
 * Конвертирует транзакции в displayCurrency
 * Оптимизировано: группирует транзакции по валютам для батч-конвертации
 */
async function convertTransactionsToCurrency(
  transactions: TransactionWithItems[],
  displayCurrency: CurrencyCode
): Promise<TransactionWithItems[]> {
  // Собираем все суммы для конвертации, группируя по валютам
  const amountsByCurrency = new Map<
    CurrencyCode,
    Array<{ amount: number; transactionIndex: number; itemIndex?: number }>
  >();

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    const currency = transaction.currency as CurrencyCode;

    if (transaction.items && transaction.items.length > 0) {
      // Обрабатываем items
      for (let j = 0; j < transaction.items.length; j++) {
        const item = transaction.items[j];
        if (!amountsByCurrency.has(currency)) {
          amountsByCurrency.set(currency, []);
        }
        amountsByCurrency.get(currency)!.push({
          amount: Number(item.amount),
          transactionIndex: i,
          itemIndex: j,
        });
      }
    } else {
      // Обрабатываем основную транзакцию
      if (!amountsByCurrency.has(currency)) {
        amountsByCurrency.set(currency, []);
      }
      amountsByCurrency.get(currency)!.push({
        amount: Number(transaction.amount),
        transactionIndex: i,
      });
    }
  }

  // Конвертируем суммы по валютам батчами
  const conversionRates = new Map<CurrencyCode, number>();
  for (const [currency, amounts] of amountsByCurrency.entries()) {
    if (currency === displayCurrency) {
      conversionRates.set(currency, 1);
    } else {
      const amountsToConvert = amounts.map((a) => ({
        amount: a.amount,
        currency,
      }));
      const totalConverted = await convertMultipleCurrencies(
        amountsToConvert,
        displayCurrency
      );
      const totalOriginal = amounts.reduce((sum, a) => sum + a.amount, 0);
      conversionRates.set(
        currency,
        totalOriginal > 0 ? totalConverted / totalOriginal : 1
      );
    }
  }

  // Применяем конвертацию к транзакциям
  return transactions.map((transaction) => {
    const currency = transaction.currency as CurrencyCode;
    const rate = conversionRates.get(currency) ?? 1;

    const convertedAmount = Number(transaction.amount) * rate;

    const convertedItems =
      transaction.items && transaction.items.length > 0
        ? transaction.items.map((item) => ({
            ...item,
            amount: Number(item.amount) * rate,
          }))
        : [];

    return {
      ...transaction,
      amount: convertedAmount,
      currency: displayCurrency as string,
      items: convertedItems,
    };
  });
}

/**
 * Получает статистику по категориям за период
 */
export async function fetchCategoryStatistics(filters: {
  from: Date;
  to: Date;
  type: "income" | "expense" | "all";
  level: "top" | "all" | "hierarchy";
  displayCurrency: CurrencyCode;
}): Promise<CategoryStatistics[]> {
  const [rawTransactions, categories] = await Promise.all([
    fetchTransactionsForPeriod(filters.from, filters.to),
    fetchAllCategories(),
  ]);

  // Конвертируем транзакции в displayCurrency
  const transactions = await convertTransactionsToCurrency(
    rawTransactions,
    filters.displayCurrency
  );

  switch (filters.level) {
    case "top":
      return aggregateByTopCategory(transactions, categories, filters.type);
    case "all":
      return aggregateByAllCategories(transactions, categories, filters.type);
    case "hierarchy":
      return aggregateWithHierarchy(transactions, categories, filters.type);
    default:
      return aggregateByTopCategory(transactions, categories, filters.type);
  }
}

/**
 * Группирует транзакции по периодам для графика трендов
 */
export async function fetchPeriodStatistics(filters: {
  from: Date;
  to: Date;
  groupBy: TrendPeriod;
  displayCurrency: CurrencyCode;
}): Promise<PeriodStatistics[]> {
  const rawTransactions = await fetchTransactionsForPeriod(
    filters.from,
    filters.to
  );

  // Конвертируем транзакции в displayCurrency
  const transactions = await convertTransactionsToCurrency(
    rawTransactions,
    filters.displayCurrency
  );

  const periodsMap = new Map<string, { income: number; expense: number }>();

  for (const transaction of transactions) {
    if (transaction.type === "transfer") continue;

    const date = parseISO(transaction.date);
    let periodKey: string;

    switch (filters.groupBy) {
      case "day":
        periodKey = format(date, "yyyy-MM-dd");
        break;
      case "week":
        periodKey = format(date, "yyyy-'W'ww");
        break;
      case "month":
      default:
        periodKey = format(date, "yyyy-MM");
        break;
    }

    const existing = periodsMap.get(periodKey) || { income: 0, expense: 0 };
    const amount = Number(transaction.amount);

    if (transaction.type === "income") {
      existing.income += amount;
    } else if (transaction.type === "expense") {
      existing.expense += amount;
    }

    periodsMap.set(periodKey, existing);
  }

  // Сортируем по ключу периода
  return Array.from(periodsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => {
      let periodLabel: string;

      if (filters.groupBy === "day") {
        const date = parseISO(period);
        periodLabel = format(date, "d MMM", { locale: ru });
      } else if (filters.groupBy === "week") {
        const weekNum = period.split("W")[1];
        periodLabel = `Нед ${weekNum}`;
      } else {
        const [year, month] = period.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        periodLabel = format(date, "LLL yyyy", { locale: ru });
      }

      return {
        period,
        periodLabel,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      };
    });
}

/**
 * Получает общую сводку статистики с сравнением периодов
 */
export async function fetchStatisticsSummary(
  from: Date,
  to: Date,
  displayCurrency: CurrencyCode
): Promise<StatisticsSummary> {
  const [rawTransactions, categories] = await Promise.all([
    fetchTransactionsForPeriod(from, to),
    fetchAllCategories(),
  ]);

  // Конвертируем транзакции в displayCurrency
  const transactions = await convertTransactionsToCurrency(
    rawTransactions,
    displayCurrency
  );

  // Считаем текущий период
  let totalIncome = 0;
  let totalExpense = 0;
  let transactionCount = 0;

  for (const transaction of transactions) {
    if (transaction.type === "transfer") continue;

    const amount = Number(transaction.amount);
    transactionCount++;

    if (transaction.type === "income") {
      totalIncome += amount;
    } else if (transaction.type === "expense") {
      totalExpense += amount;
    }
  }

  // Вычисляем предыдущий период такой же длины
  const periodLength = to.getTime() - from.getTime();
  const previousFrom = new Date(from.getTime() - periodLength);
  const previousTo = new Date(from.getTime() - 1);

  const rawPreviousTransactions = await fetchTransactionsForPeriod(
    previousFrom,
    previousTo
  );

  // Конвертируем предыдущие транзакции в displayCurrency
  const previousTransactions = await convertTransactionsToCurrency(
    rawPreviousTransactions,
    displayCurrency
  );

  let previousIncome = 0;
  let previousExpense = 0;

  for (const transaction of previousTransactions) {
    if (transaction.type === "transfer") continue;

    const amount = Number(transaction.amount);

    if (transaction.type === "income") {
      previousIncome += amount;
    } else if (transaction.type === "expense") {
      previousExpense += amount;
    }
  }

  // Вычисляем изменения
  const incomeChange =
    previousIncome > 0
      ? ((totalIncome - previousIncome) / previousIncome) * 100
      : null;
  const expenseChange =
    previousExpense > 0
      ? ((totalExpense - previousExpense) / previousExpense) * 100
      : null;

  const balance = totalIncome - totalExpense;
  const previousBalance = previousIncome - previousExpense;
  const balanceChange =
    previousBalance !== 0
      ? ((balance - previousBalance) / Math.abs(previousBalance)) * 100
      : null;

  // Топ категории расходов
  const topCategories = aggregateByTopCategory(
    transactions,
    categories,
    "expense"
  ).slice(0, 5);

  return {
    totalIncome,
    totalExpense,
    balance,
    incomeChange,
    expenseChange,
    balanceChange,
    transactionCount,
    topCategories,
  };
}
