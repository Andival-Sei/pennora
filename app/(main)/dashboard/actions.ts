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

export async function deleteAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const userId = user.id;

  // Удаляем все транзакции пользователя
  const { error: transactionsError } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId);

  if (transactionsError) {
    return { error: transactionsError.message };
  }

  // Удаляем все счета пользователя
  const { error: accountsError } = await supabase
    .from("accounts")
    .delete()
    .eq("user_id", userId);

  if (accountsError) {
    return { error: accountsError.message };
  }

  // Удаляем все бюджеты пользователя
  // Это автоматически удалит связанные записи из budget_members через CASCADE
  // (если foreign key настроен с ON DELETE CASCADE)
  const { error: budgetsError } = await supabase
    .from("budgets")
    .delete()
    .eq("user_id", userId);

  if (budgetsError) {
    return { error: budgetsError.message };
  }

  // Примечание: budget_members должны удалиться автоматически через CASCADE
  // при удалении budgets. Если CASCADE не настроен, записи останутся,
  // но это не критично, так как пользователь будет удалён из auth.users

  // Удаляем все категории пользователя (включая системные)
  const { error: categoriesError } = await supabase
    .from("categories")
    .delete()
    .eq("user_id", userId);

  if (categoriesError) {
    return { error: categoriesError.message };
  }

  // Удаляем профиль пользователя
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    return { error: profileError.message };
  }

  // Удаляем пользователя из auth.users через функцию
  const { error: deleteUserError } = await supabase.rpc("delete_auth_user", {
    user_uuid: userId,
  });

  if (deleteUserError) {
    return { error: deleteUserError.message };
  }

  // Выходим из аккаунта (на случай, если удаление не сработало)
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}
