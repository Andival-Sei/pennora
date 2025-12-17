import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Если явно указан next параметр, используем его
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Проверяем, прошел ли пользователь онбординг
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("default_currency")
          .eq("id", user.id)
          .single();

        // Если нет default_currency, значит пользователь новый - отправляем на онбординг
        if (!profile?.default_currency) {
          return NextResponse.redirect(`${origin}/dashboard/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Ошибка — редирект на логин
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
