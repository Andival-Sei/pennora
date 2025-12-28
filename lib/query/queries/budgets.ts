import { createClient } from "@/lib/db/supabase/client";
import { getClientUser } from "@/lib/db/supabase/auth-client";
import type { Database } from "@/lib/db/supabase/types";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];

/**
 * Загружает все бюджеты пользователя (активные и неактивные)
 * Оптимизировано: использует конкретные поля вместо * для лучшей производительности
 * TODO: Добавить фильтрацию по is_active, период и т.д. при необходимости
 */
export async function fetchBudgets(): Promise<Budget[]> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("budgets")
    .select(
      "id, user_id, category_id, name, amount, currency, period, start_date, is_active, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as Budget[];
}

/**
 * Загружает один бюджет по ID
 * Оптимизировано: использует конкретные поля вместо * для лучшей производительности
 */
export async function fetchBudget(id: string): Promise<Budget> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("budgets")
    .select(
      "id, user_id, category_id, name, amount, currency, period, start_date, is_active, created_at, updated_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data as Budget;
}
