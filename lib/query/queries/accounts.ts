import { createClient } from "@/lib/db/supabase/client";
import { getClientUser } from "@/lib/db/supabase/auth-client";
import type { Database } from "@/lib/db/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

/**
 * Загружает все счета пользователя (неархивированные)
 * Оптимизировано: использует конкретные поля вместо * для лучшей производительности
 */
export async function fetchAccounts(): Promise<Account[]> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("accounts")
    .select(
      "id, user_id, name, type, currency, balance, icon, color, is_archived, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as Account[];
}
