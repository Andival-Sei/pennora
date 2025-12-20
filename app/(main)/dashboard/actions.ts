"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function resetAccounts() {
  const supabase = await createClient();

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
