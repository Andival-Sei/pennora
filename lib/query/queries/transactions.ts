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

  const { data, error } = await query.order("date", { ascending: false });

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
