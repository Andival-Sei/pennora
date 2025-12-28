import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/db/supabase/server";
import { ResponsiveContainer } from "@/components/layout";
import { StatisticsPage } from "@/components/features/statistics";
import type { CurrencyCode } from "@/lib/currency/rates";

export default async function StatisticsPageRoute() {
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
  const displayCurrency = (profile?.display_currency ||
    profile?.default_currency ||
    "RUB") as CurrencyCode;

  const t = await getTranslations("statistics");

  return (
    <main className="min-h-screen bg-background">
      <ResponsiveContainer className="py-8">
        <StatisticsPage
          displayCurrency={displayCurrency}
          t={{
            title: t("title"),
            tabs: {
              overview: t("tabs.overview"),
              trends: t("tabs.trends"),
              categories: t("tabs.categories"),
            },
            filters: {
              period: t("filters.period"),
              thisMonth: t("filters.thisMonth"),
              lastMonth: t("filters.lastMonth"),
              last3Months: t("filters.last3Months"),
              last6Months: t("filters.last6Months"),
              thisYear: t("filters.thisYear"),
              custom: t("filters.custom"),
              type: t("filters.type"),
              income: t("filters.income"),
              expense: t("filters.expense"),
              all: t("filters.all"),
              categoryLevel: t("filters.categoryLevel"),
              topOnly: t("filters.topOnly"),
              allCategories: t("filters.allCategories"),
              hierarchy: t("filters.hierarchy"),
            },
            charts: {
              noData: t("charts.noData"),
              total: t("charts.total"),
              percentage: t("charts.percentage"),
            },
            overview: {
              income: t("overview.income"),
              expense: t("overview.expense"),
              balance: t("overview.balance"),
              vsPrevious: t("overview.vsPrevious"),
              topCategories: t("overview.topCategories"),
            },
            trends: {
              groupBy: t("trends.groupBy"),
              byDay: t("trends.byDay"),
              byWeek: t("trends.byWeek"),
              byMonth: t("trends.byMonth"),
              income: t("overview.income"),
              expense: t("overview.expense"),
            },
            categories: {
              category: t("categories.category"),
              amount: t("categories.amount"),
              percentage: t("categories.percentage"),
              transactions: t("categories.transactions"),
              showDetails: t("categories.showDetails"),
            },
          }}
        />
      </ResponsiveContainer>
    </main>
  );
}
