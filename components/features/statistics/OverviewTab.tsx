"use client";

import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys } from "@/lib/query/keys";
import { fetchStatisticsSummary } from "@/lib/query/queries/statistics";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import { formatCurrency } from "@/lib/currency/converter";
import type { CurrencyCode } from "@/lib/currency/rates";
import { cn } from "@/lib/utils";

import { CategoryPieChart } from "./CategoryPieChart";

interface OverviewTabProps {
  dateRange: { from: Date; to: Date };
  transactionType: "income" | "expense" | "all";
  categoryLevel: "top" | "all" | "hierarchy";
  displayCurrency: CurrencyCode;
  t: {
    income: string;
    expense: string;
    balance: string;
    vsPrevious: string;
    topCategories: string;
  };
  chartT: {
    noData: string;
    total: string;
    percentage: string;
  };
}

export const OverviewTab = memo(function OverviewTab({
  dateRange,
  transactionType,
  categoryLevel,
  displayCurrency,
  t,
  chartT,
}: OverviewTabProps) {
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.statistics.summary(
      format(dateRange.from, "yyyy-MM-dd"),
      format(dateRange.to, "yyyy-MM-dd"),
      displayCurrency
    ),
    queryFn: () =>
      fetchStatisticsSummary(dateRange.from, dateRange.to, displayCurrency),
    staleTime: QUERY_STALE_TIME.TRANSACTIONS,
    gcTime: QUERY_GC_TIME.TRANSACTIONS,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Ошибка загрузки данных
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {chartT.noData}
      </div>
    );
  }

  const renderChange = (change: number | null, isExpense: boolean = false) => {
    if (change === null) return null;

    // Для расходов: рост = плохо (красный), падение = хорошо (зелёный)
    // Для доходов/баланса: рост = хорошо (зелёный), падение = плохо (красный)
    const isPositive = isExpense ? change <= 0 : change >= 0;
    const Icon = change >= 0 ? TrendingUp : TrendingDown;

    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs",
          isPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        )}
      >
        <Icon className="h-3 w-3" />
        <span>
          {change >= 0 ? "+" : ""}
          {change.toFixed(1)}% {t.vsPrevious}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Карточки метрик */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Доходы */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative">
            <div className="text-sm text-muted-foreground mb-2">{t.income}</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalIncome, displayCurrency)}
            </div>
            <div className="min-h-[20px] mt-1">
              {renderChange(summary.incomeChange)}
            </div>
          </CardContent>
        </Card>

        {/* Расходы */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative">
            <div className="text-sm text-muted-foreground mb-2">
              {t.expense}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.totalExpense, displayCurrency)}
            </div>
            <div className="min-h-[20px] mt-1">
              {renderChange(summary.expenseChange, true)}
            </div>
          </CardContent>
        </Card>

        {/* Баланс */}
        <Card className="relative overflow-hidden">
          <div
            className={cn(
              "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16",
              summary.balance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
            )}
          />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Wallet className="h-4 w-4" />
              {t.balance}
            </div>
            <div
              className={cn(
                "text-2xl sm:text-3xl font-bold",
                summary.balance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {formatCurrency(summary.balance, displayCurrency)}
            </div>
            <div className="min-h-[20px] mt-1">
              {renderChange(summary.balanceChange)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Круговая диаграмма */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.topCategories}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryPieChart
            dateRange={dateRange}
            transactionType={
              transactionType === "all" ? "expense" : transactionType
            }
            categoryLevel={categoryLevel}
            displayCurrency={displayCurrency}
            chartT={chartT}
          />
        </CardContent>
      </Card>
    </div>
  );
});
