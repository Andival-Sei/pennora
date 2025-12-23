"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { Loader2 } from "lucide-react";
import {
  convertMultipleCurrencies,
  formatCurrency,
} from "@/lib/currency/converter";
import { queryKeys } from "@/lib/query/keys";
import {
  fetchMonthlyStatistics,
  type MonthlyStatistics,
} from "@/lib/query/queries/transactions";
import type { CurrencyCode } from "@/lib/currency/rates";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";

interface StatisticsCardsProps {
  displayCurrency: CurrencyCode;
  t: {
    income: string;
    expense: string;
  };
}

export function StatisticsCards({ displayCurrency, t }: StatisticsCardsProps) {
  // Вычисляем текущий месяц и год
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Загружаем статистику через TanStack Query
  const { data: statistics, isLoading } = useQuery<MonthlyStatistics>({
    queryKey: queryKeys.statistics.monthly(currentMonth, currentYear),
    queryFn: () =>
      fetchMonthlyStatistics({ month: currentMonth, year: currentYear }),
    staleTime: QUERY_STALE_TIME.TRANSACTIONS,
    gcTime: QUERY_GC_TIME.TRANSACTIONS,
    refetchOnWindowFocus: true,
  });

  const [convertedIncome, setConvertedIncome] = useState<number | null>(null);
  const [convertedExpense, setConvertedExpense] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);

  // Конвертируем суммы в display_currency
  useEffect(() => {
    async function convertStatistics() {
      if (!statistics || statistics.transactions.length === 0) {
        setConvertedIncome(0);
        setConvertedExpense(0);
        return;
      }

      setConverting(true);

      try {
        // Разделяем транзакции по типам
        const incomeTransactions = statistics.transactions.filter(
          (t) => t.type === "income"
        );
        const expenseTransactions = statistics.transactions.filter(
          (t) => t.type === "expense"
        );

        // Конвертируем доходы
        const incomeAmounts = incomeTransactions.map((t) => ({
          amount: t.amount,
          currency: t.currency as CurrencyCode,
        }));
        const convertedIncomeValue =
          incomeAmounts.length > 0
            ? await convertMultipleCurrencies(incomeAmounts, displayCurrency)
            : 0;

        // Конвертируем расходы
        const expenseAmounts = expenseTransactions.map((t) => ({
          amount: t.amount,
          currency: t.currency as CurrencyCode,
        }));
        const convertedExpenseValue =
          expenseAmounts.length > 0
            ? await convertMultipleCurrencies(expenseAmounts, displayCurrency)
            : 0;

        setConvertedIncome(convertedIncomeValue);
        setConvertedExpense(convertedExpenseValue);
      } catch (error) {
        console.error("Error converting statistics:", error);
        // Fallback: используем исходные значения, если валюта совпадает
        if (
          statistics.transactions.every((t) => t.currency === displayCurrency)
        ) {
          setConvertedIncome(statistics.income);
          setConvertedExpense(statistics.expense);
        } else {
          // Если валюты разные и конвертация не удалась, показываем 0
          setConvertedIncome(0);
          setConvertedExpense(0);
        }
      } finally {
        setConverting(false);
      }
    }

    convertStatistics();
  }, [statistics, displayCurrency]);

  const isLoadingData = isLoading || converting;

  if (isLoadingData) {
    return (
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {[1, 2].map((i) => (
          <FadeIn key={i} delay={0.1 * i}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-8">
      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">{t.income}</div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {convertedIncome !== null
                ? formatCurrency(convertedIncome, displayCurrency)
                : formatCurrency(0, displayCurrency)}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
      <FadeIn delay={0.25}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">
              {t.expense}
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {convertedExpense !== null
                ? formatCurrency(convertedExpense, displayCurrency)
                : formatCurrency(0, displayCurrency)}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
