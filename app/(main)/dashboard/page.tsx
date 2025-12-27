import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/db/supabase/server";
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

  // Загрузка профиля пользователя
  const profileResult = await supabase
    .from("profiles")
    .select("default_currency, display_currency")
    .eq("id", user.id)
    .single();

  const profile = profileResult.data;

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

  return (
    <main className="min-h-screen bg-background">
      <ResponsiveContainer className="py-8">
        <FadeIn delay={0.1}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">{t("title")}</h2>
        </FadeIn>

        {/* Карточки балансов с конвертацией валют */}
        <BalanceCards
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
          <div className="flex justify-end gap-2 mt-8">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t("toLanding")}</span>
              </Button>
            </Link>
            <ResetButton />
          </div>
        </FadeIn>
      </ResponsiveContainer>
    </main>
  );
}
