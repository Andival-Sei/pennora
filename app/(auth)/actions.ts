"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthErrorKey } from "@/lib/auth-errors";
import { saveInitialSettings } from "@/lib/settings/save-initial-settings";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: getAuthErrorKey(error.message) };
  }

  // Проверяем, прошел ли пользователь онбординг
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_currency, locale, theme")
      .eq("id", user.id)
      .single();

    // Если нет настроек, сохраняем начальные настройки
    if (!profile?.locale || !profile?.theme) {
      await saveInitialSettings(user.id);
    }

    // Если нет default_currency, значит пользователь новый - отправляем на онбординг
    if (!profile?.default_currency) {
      revalidatePath("/", "layout");
      redirect("/dashboard/onboarding");
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/callback?next=/dashboard/onboarding`,
    },
  });

  if (error) {
    return { error: getAuthErrorKey(error.message) };
  }

  // Если есть сессия (пользователь сразу авторизован), редирект на онбординг
  // Если требуется подтверждение email, вернуть success для показа сообщения
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard/onboarding");
  }

  // Если требуется подтверждение email, возвращаем success
  return { success: true, requiresConfirmation: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
