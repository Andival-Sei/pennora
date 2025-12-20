import { createClient } from "@/lib/db/supabase/client";
import type { Database } from "@/lib/db/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

/**
 * Загружает все счета пользователя (неархивированные)
 */
export async function fetchAccounts(): Promise<Account[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as Account[];
}
