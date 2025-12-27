import { createClient } from "@/lib/db/supabase/client";
import type { Database } from "@/lib/db/supabase/types";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];

/**
 * Загружает все бюджеты пользователя (активные и неактивные)
 * TODO: Добавить фильтрацию по is_active, период и т.д. при необходимости
 */
export async function fetchBudgets(): Promise<Budget[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as Budget[];
}

/**
 * Загружает один бюджет по ID
 * TODO: Реализовать при необходимости
 */
export async function fetchBudget(id: string): Promise<Budget> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data as Budget;
}
