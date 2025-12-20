"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function resetAccounts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Удаляем все транзакции пользователя
  const { error: transactionsError } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", user.id);

  if (transactionsError) {
    return { error: transactionsError.message };
  }

  // Удаляем все счета пользователя
  const { error: accountsError } = await supabase
    .from("accounts")
    .delete()
    .eq("user_id", user.id);

  if (accountsError) {
    return { error: accountsError.message };
  }

  // Удаляем все бюджеты пользователя
  const { error: budgetsError } = await supabase
    .from("budgets")
    .delete()
    .eq("user_id", user.id);

  if (budgetsError) {
    return { error: budgetsError.message };
  }

  // Очищаем валюту по умолчанию в профиле, чтобы запустить онбординг
  // Устанавливаем default_currency в null, чтобы обозначить, что онбординг не пройден
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      default_currency: null,
      // display_currency оставляем как есть, чтобы не терять настройки пользователя
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/onboarding", "layout");
  redirect("/dashboard/onboarding");
}
