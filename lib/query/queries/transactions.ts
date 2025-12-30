import { createClient } from "@/lib/db/supabase/client";
import { getClientUser } from "@/lib/db/supabase/auth-client";
import {
  TransactionWithCategory,
  TransactionWithItems,
} from "@/lib/types/transaction";

/**
 * Загружает транзакции пользователя с опциональной фильтрацией по месяцу и году
 * Включает позиции (items) для split transactions
 * Оптимизировано: использует конкретные поля вместо * для лучшей производительности
 */
export async function fetchTransactions(filters?: {
  month?: number;
  year?: number;
}): Promise<TransactionWithItems[]> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const supabase = createClient();

  let query = supabase
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
    .eq("user_id", user.id);

  // Применяем фильтр по месяцу и году, если они указаны
  // Используем формат YYYY-MM-DD для корректной фильтрации без проблем с часовыми поясами
  if (filters?.month !== undefined && filters?.year !== undefined) {
    // Начало месяца: 1 число выбранного месяца
    const startDateStr = `${filters.year}-${String(filters.month + 1).padStart(2, "0")}-01`;
    // Конец месяца: последний день выбранного месяца (первый день следующего месяца минус 1)
    const lastDay = new Date(filters.year, filters.month + 1, 0).getDate();
    const endDateStr = `${filters.year}-${String(filters.month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("date", startDateStr).lte("date", endDateStr);
  }

  // Сортируем по дате транзакции (date) по убыванию, чтобы новые транзакции были сверху
  const { data, error } = await query.order("date", { ascending: false });

  if (error) {
    throw error;
  }

  // Преобразуем данные в нужный формат
  return (data || []).map((item) => {
    // Преобразуем category из массива в объект или null
    const category = Array.isArray(item.category)
      ? item.category[0] || null
      : item.category || null;

    // Преобразуем items с их категориями
    const mappedItems = (item.items || []).map(
      (i: Record<string, unknown>) => ({
        ...i,
        sort_order: (i.sort_order as number) ?? 0,
        category: Array.isArray(i.category)
          ? (i.category as Record<string, unknown>[])[0] || null
          : i.category || null,
      })
    );

    const items = mappedItems.sort((a, b) => a.sort_order - b.sort_order);

    return {
      ...item,
      category,
      items,
    };
  }) as TransactionWithItems[];
}

/**
 * Загружает последние N транзакций пользователя
 * Оптимизировано: использует limit на уровне БД для минимизации данных
 * Включает позиции (items) для split transactions
 */
export async function fetchRecentTransactions(
  limit: number = 5
): Promise<TransactionWithItems[]> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const supabase = createClient();

  const query = supabase
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
    .order("date", { ascending: false })
    .limit(limit);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Преобразуем данные в нужный формат
  return (data || []).map((item) => {
    // Преобразуем category из массива в объект или null
    const category = Array.isArray(item.category)
      ? item.category[0] || null
      : item.category || null;

    // Преобразуем items с их категориями
    const mappedItems = (item.items || []).map(
      (i: Record<string, unknown>) => ({
        ...i,
        sort_order: (i.sort_order as number) ?? 0,
        category: Array.isArray(i.category)
          ? (i.category as Record<string, unknown>[])[0] || null
          : i.category || null,
      })
    );

    const items = mappedItems.sort((a, b) => a.sort_order - b.sort_order);

    return {
      ...item,
      category,
      items,
    };
  }) as TransactionWithItems[];
}

/**
 * Загружает транзакции без items (для обратной совместимости)
 */
export async function fetchTransactionsSimple(filters?: {
  month?: number;
  year?: number;
}): Promise<TransactionWithCategory[]> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const supabase = createClient();

  let query = supabase
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
      )
    `
    )
    .eq("user_id", user.id);

  if (filters?.month !== undefined && filters?.year !== undefined) {
    const startDateStr = `${filters.year}-${String(filters.month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(filters.year, filters.month + 1, 0).getDate();
    const endDateStr = `${filters.year}-${String(filters.month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("date", startDateStr).lte("date", endDateStr);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((item) => ({
    ...item,
    category: Array.isArray(item.category)
      ? item.category[0] || null
      : item.category || null,
  })) as TransactionWithCategory[];
}

/**
 * Получает доступные месяцы и годы для фильтрации транзакций
 * Оптимизировано: загружает только поле date для минимизации данных
 */
export async function fetchAvailableMonthsAndYears(): Promise<{
  months: Array<{ month: number; year: number }>;
  years: number[];
}> {
  const user = await getClientUser();
  if (!user) {
    return { months: [], years: [] };
  }

  const supabase = createClient();

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
 * Оптимизировано: загружает только необходимые поля (amount, currency, type)
 */
export async function fetchMonthlyStatistics(filters?: {
  month?: number;
  year?: number;
}): Promise<MonthlyStatistics> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const supabase = createClient();

  // Определяем месяц и год для фильтрации
  const currentDate = new Date();
  const month = filters?.month ?? currentDate.getMonth();
  const year = filters?.year ?? currentDate.getFullYear();

  // Вычисляем диапазон дат для месяца
  // Используем формат YYYY-MM-DD для корректной фильтрации без проблем с часовыми поясами
  const startDateStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Загружаем транзакции за месяц, исключая переводы
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, currency, type")
    .eq("user_id", user.id)
    .in("type", ["income", "expense"]) // Исключаем transfer
    .gte("date", startDateStr)
    .lte("date", endDateStr);

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
