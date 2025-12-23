"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getErrorTranslationKey } from "@/lib/utils/errorHandler";
import { saveInitialSettings } from "@/lib/settings/save-initial-settings";
import { getAppUrl } from "@/lib/utils";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: getErrorTranslationKey(error) };
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

  // Проверяем, есть ли параметр redirect в URL
  const redirectTo = formData.get("redirect") as string | null;
  if (redirectTo && redirectTo.startsWith("/dashboard")) {
    redirect(redirectTo);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  // Используем утилиту для получения правильного базового URL
  const appUrl = getAppUrl();
  const emailRedirectTo = `${appUrl}/callback?next=/dashboard/onboarding`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo,
    },
  });

  if (error) {
    return { error: getErrorTranslationKey(error) };
  }

  // Если есть сессия (пользователь сразу авторизован), редирект на онбординг
  // Если требуется подтверждение email, вернуть success для показа сообщения
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard/onboarding");
  }

  // Если требуется подтверждение email, возвращаем success и email
  return { success: true, requiresConfirmation: true, email };
}

export async function resendConfirmationEmail(email: string) {
  const supabase = await createClient();

  // Используем утилиту для получения правильного базового URL
  const appUrl = getAppUrl();
  const emailRedirectTo = `${appUrl}/callback?next=/dashboard/onboarding`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    return { error: getErrorTranslationKey(error) };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
