import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { FadeIn } from "@/components/motion";
import { ResponsiveContainer } from "@/components/layout";
import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ResetButton } from "./reset-button";

// Функция форматирования валют
function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Получаем профиль пользователя
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("id", user.id)
    .single();

  const defaultCurrency = profile?.default_currency || "RUB";

  // Получаем все счета пользователя
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  // Вычисляем балансы
  const totalBalance =
    accounts?.reduce((sum, account) => {
      // TODO: Конвертация валют (пока суммируем только одинаковую валюту)
      if (account.currency === defaultCurrency) {
        return sum + Number(account.balance);
      }
      return sum;
    }, 0) || 0;

  const cardBalance =
    accounts
      ?.filter((a) => a.type === "card" && a.currency === defaultCurrency)
      .reduce((sum, a) => sum + Number(a.balance), 0) || 0;

  const cashBalance =
    accounts
      ?.filter((a) => a.type === "cash" && a.currency === defaultCurrency)
      .reduce((sum, a) => sum + Number(a.balance), 0) || 0;

  // Проверяем, прошел ли пользователь онбординг (если нет счетов, перенаправляем)
  // Но не перенаправляем если он уже на онбординге
  if (!accounts || accounts.length === 0) {
    // Это проверка будет выполняться только если пользователь зашел на dashboard
    // Если он только что прошел онбординг, accounts может быть пустым из-за задержки репликации
    // Поэтому лучше проверять наличие default_currency в профиле
    if (!profile?.default_currency) {
      redirect("/dashboard/onboarding");
    }
  }

  const t = await getTranslations("dashboard");
  const tAuth = await getTranslations("auth");

  return (
    <main className="min-h-screen bg-background">
      <FadeIn>
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <ResponsiveContainer className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold text-foreground">Pennora</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <LocaleToggle />
              <ThemeToggle />
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <form action={signOut}>
                <Button variant="outline" size="sm">
                  {tAuth("logout")}
                </Button>
              </form>
            </div>
          </ResponsiveContainer>
        </header>
      </FadeIn>

      <ResponsiveContainer className="py-8">
        <FadeIn delay={0.1}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">{t("title")}</h2>
        </FadeIn>

        {/* Карточки балансов */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <FadeIn delay={0.2}>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">
                  {t("balance.total")}
                </div>
                <div className="text-3xl font-bold">
                  {formatCurrency(totalBalance, defaultCurrency)}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
          <FadeIn delay={0.25}>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">
                  {t("balance.card")}
                </div>
                <div className="text-3xl font-bold">
                  {formatCurrency(cardBalance, defaultCurrency)}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
          <FadeIn delay={0.3}>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">
                  {t("balance.cash")}
                </div>
                <div className="text-3xl font-bold">
                  {formatCurrency(cashBalance, defaultCurrency)}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        <FadeIn delay={0.35}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-muted-foreground">{t("welcome")}</p>
            <ResetButton />
          </div>
        </FadeIn>
      </ResponsiveContainer>
    </main>
  );
}
