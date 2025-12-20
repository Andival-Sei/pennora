import { createClient } from "@/lib/db/supabase/client";
import { TransactionWithCategory } from "@/lib/types/transaction";

/**
 * Загружает транзакции пользователя с опциональной фильтрацией по месяцу и году
 */
export async function fetchTransactions(filters?: {
  month?: number;
  year?: number;
}): Promise<TransactionWithCategory[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  let query = supabase
    .from("transactions")
    .select(
      `
      *,
      category:categories(*)
    `
    )
    .eq("user_id", user.id);

  // Применяем фильтр по месяцу и году, если они указаны
  if (filters?.month !== undefined && filters?.year !== undefined) {
    const startDate = new Date(filters.year, filters.month, 1);
    const endDate = new Date(filters.year, filters.month + 1, 0, 23, 59, 59);
    query = query
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString());
  }

  // Сортируем по дате создания (created_at) по убыванию, чтобы новые транзакции были сверху
  // Если даты создания одинаковые, сортируем по дате транзакции
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as TransactionWithCategory[];
}

/**
 * Получает доступные месяцы и годы для фильтрации транзакций
 */
export async function fetchAvailableMonthsAndYears(): Promise<{
  months: Array<{ month: number; year: number }>;
  years: number[];
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { months: [], years: [] };
  }

  // Получаем все транзакции пользователя
  const { data, error } = await supabase
    .from("transactions")
    .select("date")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching available months/years:", error);
    return { months: [], years: [] };
  }

  // Извлекаем уникальные месяцы и годы
  const monthYearSet = new Set<string>();
  const yearSet = new Set<number>();

  data?.forEach((transaction) => {
    const date = new Date(transaction.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    monthYearSet.add(`${year}-${month}`);
    yearSet.add(year);
  });

  // Преобразуем в массивы и сортируем
  const months: Array<{ month: number; year: number }> = Array.from(
    monthYearSet
  )
    .map((item) => {
      const [year, month] = item.split("-").map(Number);
      return { month, year };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

  const years = Array.from(yearSet).sort((a, b) => b - a);

  return { months, years };
}

/**
 * Интерфейс для статистики за месяц
 */
export interface MonthlyStatistics {
  income: number; // Сумма доходов в исходной валюте
  expense: number; // Сумма расходов в исходной валюте
  balance: number; // income - expense
  transactions: Array<{
    amount: number;
    currency: string;
    type: "income" | "expense";
  }>; // Транзакции с валютами для конвертации
}

/**
 * Получает статистику транзакций за указанный месяц
 * Возвращает агрегированные суммы доходов и расходов
 * Исключает переводы (transfer) из статистики
 */
export async function fetchMonthlyStatistics(filters?: {
  month?: number;
  year?: number;
}): Promise<MonthlyStatistics> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Определяем месяц и год для фильтрации
  const currentDate = new Date();
  const month = filters?.month ?? currentDate.getMonth();
  const year = filters?.year ?? currentDate.getFullYear();

  // Вычисляем диапазон дат для месяца
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  // Загружаем транзакции за месяц, исключая переводы
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, currency, type")
    .eq("user_id", user.id)
    .in("type", ["income", "expense"]) // Исключаем transfer
    .gte("date", startDate.toISOString())
    .lte("date", endDate.toISOString());

  if (error) {
    throw error;
  }

  // Агрегируем транзакции по типам
  let income = 0;
  let expense = 0;
  const transactions: Array<{
    amount: number;
    currency: string;
    type: "income" | "expense";
  }> = [];

  data?.forEach((transaction) => {
    const amount = Number(transaction.amount);
    const currency = transaction.currency;

    transactions.push({
      amount,
      currency,
      type: transaction.type as "income" | "expense",
    });

    if (transaction.type === "income") {
      income += amount;
    } else if (transaction.type === "expense") {
      expense += amount;
    }
  });

  return {
    income,
    expense,
    balance: income - expense,
    transactions,
  };
}
