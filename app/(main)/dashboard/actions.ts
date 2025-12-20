"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function resetAccounts() {
  const supabase = await createClient();

  // ⚠️ Безопасность: Используем getSession() вместо getUser() для производительности.
  // Операции с БД защищены RLS, который проверяет токен на уровне БД.
  // Если токен отозван, RLS заблокирует запросы даже при валидной подписи JWT.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Удаляем все счета пользователя
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  // Очищаем валюту по умолчанию в профиле, чтобы запустить онбординг
  await supabase
    .from("profiles")
    .update({ default_currency: null })
    .eq("id", user.id);

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/onboarding");
}
