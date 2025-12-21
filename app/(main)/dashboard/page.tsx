import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";
import { ResponsiveContainer } from "@/components/layout";
import { Home } from "lucide-react";
import { ResetButton } from "./reset-button";
import { BalanceCards } from "./balance-cards";
import { EnhancedStatisticsCards } from "./enhanced-statistics-cards";
import { RecentTransactions } from "./recent-transactions";
import { QuickActions } from "./quick-actions";
import type { CurrencyCode } from "@/lib/currency/rates";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Параллельная загрузка профиля и счетов для ускорения
  const [profileResult, accountsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("default_currency, display_currency")
      .eq("id", user.id)
      .single(),
    supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: true }),
  ]);

  const profile = profileResult.data;
  const accounts = accountsResult.data;

  // Используем display_currency если есть, иначе default_currency
  const displayCurrency = (profile?.display_currency ||
    profile?.default_currency ||
    "RUB") as CurrencyCode;

  // Подготавливаем данные для конвертации (конвертация происходит в клиентском компоненте)

  // Проверяем, прошел ли пользователь онбординг
  // Если default_currency не установлен, перенаправляем на онбординг
  if (!profile?.default_currency) {
    redirect("/dashboard/onboarding");
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  {t("backToLanding")}
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

        {/* Карточки балансов с конвертацией валют */}
        <BalanceCards
          accounts={
            accounts?.map((acc) => ({
              currency: acc.currency as CurrencyCode,
              balance: Number(acc.balance),
              type: acc.type,
            })) || []
          }
          displayCurrency={displayCurrency}
          t={{
            total: t("balance.total"),
            card: t("balance.card"),
            cash: t("balance.cash"),
          }}
        />

        {/* Карточки статистики за текущий месяц с сравнением */}
        <EnhancedStatisticsCards
          displayCurrency={displayCurrency}
          t={{
            income: t("statistics.income"),
            expense: t("statistics.expense"),
            netResult: t("statistics.netResult"),
            vsPreviousMonth: t("statistics.vsPreviousMonth"),
          }}
        />

        {/* Быстрые действия */}
        <QuickActions />

        {/* Последние транзакции */}
        <RecentTransactions />

        <FadeIn delay={0.5}>
          <div className="flex justify-end mt-8">
            <ResetButton />
          </div>
        </FadeIn>
      </ResponsiveContainer>
    </main>
  );
}
