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

  // Удаляем все пользовательские категории (оставляем только системные)
  const { error: categoriesError } = await supabase
    .from("categories")
    .delete()
    .eq("user_id", user.id)
    .eq("is_system", false);

  if (categoriesError) {
    return { error: categoriesError.message };
  }

  // Проверяем, есть ли системные категории. Если нет - создаём их
  const { data: systemCategories, error: checkError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_system", true)
    .limit(1);

  if (checkError) {
    return { error: checkError.message };
  }

  // Если системных категорий нет, создаём их заново
  if (!systemCategories || systemCategories.length === 0) {
    const { error: createCategoriesError } = await supabase.rpc(
      "create_default_categories",
      { user_uuid: user.id }
    );

    if (createCategoriesError) {
      return { error: createCategoriesError.message };
    }
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
