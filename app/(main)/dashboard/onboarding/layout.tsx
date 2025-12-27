import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Проверяем, прошел ли пользователь онбординг
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("id", user.id)
    .single();

  // Если default_currency установлен, значит пользователь уже прошел онбординг
  // Редиректим на dashboard
  if (profile?.default_currency) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
