"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

interface EnhancedStatisticsCardsProps {
  displayCurrency: CurrencyCode;
  t: {
    income: string;
    expense: string;
    netResult: string;
    vsPreviousMonth: string;
  };
}

export function EnhancedStatisticsCards({
  displayCurrency,
  t,
}: EnhancedStatisticsCardsProps) {
  // Вычисляем текущий месяц и год
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Вычисляем предыдущий месяц
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Загружаем статистику за текущий месяц
  const { data: currentStats, isLoading: isLoadingCurrent } =
    useQuery<MonthlyStatistics>({
      queryKey: queryKeys.statistics.monthly(currentMonth, currentYear),
      queryFn: () =>
        fetchMonthlyStatistics({ month: currentMonth, year: currentYear }),
      staleTime: 2 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: true,
    });

  // Загружаем статистику за предыдущий месяц
  const { data: previousStats, isLoading: isLoadingPrevious } =
    useQuery<MonthlyStatistics>({
      queryKey: queryKeys.statistics.monthly(previousMonth, previousYear),
      queryFn: () =>
        fetchMonthlyStatistics({ month: previousMonth, year: previousYear }),
      staleTime: 2 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: true,
    });

  const [convertedIncome, setConvertedIncome] = useState<number | null>(null);
  const [convertedExpense, setConvertedExpense] = useState<number | null>(null);
  const [convertedBalance, setConvertedBalance] = useState<number | null>(null);
  const [previousIncome, setPreviousIncome] = useState<number | null>(null);
  const [previousExpense, setPreviousExpense] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);

  // Конвертируем суммы текущего месяца
  useEffect(() => {
    async function convertStatistics() {
      if (!currentStats || currentStats.transactions.length === 0) {
        setConvertedIncome(0);
        setConvertedExpense(0);
        setConvertedBalance(0);
        return;
      }

      setConverting(true);

      try {
        const incomeTransactions = currentStats.transactions.filter(
          (t) => t.type === "income"
        );
        const expenseTransactions = currentStats.transactions.filter(
          (t) => t.type === "expense"
        );

        const incomeAmounts = incomeTransactions.map((t) => ({
          amount: t.amount,
          currency: t.currency as CurrencyCode,
        }));
        const convertedIncomeValue =
          incomeAmounts.length > 0
            ? await convertMultipleCurrencies(incomeAmounts, displayCurrency)
            : 0;

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
        setConvertedBalance(convertedIncomeValue - convertedExpenseValue);
      } catch (error) {
        console.error("Error converting statistics:", error);
        if (
          currentStats.transactions.every((t) => t.currency === displayCurrency)
        ) {
          setConvertedIncome(currentStats.income);
          setConvertedExpense(currentStats.expense);
          setConvertedBalance(currentStats.balance);
        } else {
          setConvertedIncome(0);
          setConvertedExpense(0);
          setConvertedBalance(0);
        }
      } finally {
        setConverting(false);
      }
    }

    convertStatistics();
  }, [currentStats, displayCurrency]);

  // Конвертируем суммы предыдущего месяца
  useEffect(() => {
    async function convertPreviousStatistics() {
      if (!previousStats || previousStats.transactions.length === 0) {
        setPreviousIncome(0);
        setPreviousExpense(0);
        return;
      }

      try {
        const incomeTransactions = previousStats.transactions.filter(
          (t) => t.type === "income"
        );
        const expenseTransactions = previousStats.transactions.filter(
          (t) => t.type === "expense"
        );

        const incomeAmounts = incomeTransactions.map((t) => ({
          amount: t.amount,
          currency: t.currency as CurrencyCode,
        }));
        const convertedIncomeValue =
          incomeAmounts.length > 0
            ? await convertMultipleCurrencies(incomeAmounts, displayCurrency)
            : 0;

        const expenseAmounts = expenseTransactions.map((t) => ({
          amount: t.amount,
          currency: t.currency as CurrencyCode,
        }));
        const convertedExpenseValue =
          expenseAmounts.length > 0
            ? await convertMultipleCurrencies(expenseAmounts, displayCurrency)
            : 0;

        setPreviousIncome(convertedIncomeValue);
        setPreviousExpense(convertedExpenseValue);
      } catch (error) {
        console.error("Error converting previous statistics:", error);
        if (
          previousStats.transactions.every(
            (t) => t.currency === displayCurrency
          )
        ) {
          setPreviousIncome(previousStats.income);
          setPreviousExpense(previousStats.expense);
        } else {
          setPreviousIncome(0);
          setPreviousExpense(0);
        }
      }
    }

    convertPreviousStatistics();
  }, [previousStats, displayCurrency]);

  const isLoadingData = isLoadingCurrent || isLoadingPrevious || converting;

  // Вычисляем процентные изменения
  const incomeChange =
    previousIncome !== null && previousIncome !== 0 && convertedIncome !== null
      ? ((convertedIncome - previousIncome) / previousIncome) * 100
      : null;
  const expenseChange =
    previousExpense !== null &&
    previousExpense !== 0 &&
    convertedExpense !== null
      ? ((convertedExpense - previousExpense) / previousExpense) * 100
      : null;

  if (isLoadingData) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[1, 2, 3].map((i) => (
          <FadeIn key={i} delay={0.1 * i}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-32">
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
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {/* Доходы */}
      <FadeIn delay={0.2}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">{t.income}</div>
              <ArrowUpCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {convertedIncome !== null
                ? formatCurrency(convertedIncome, displayCurrency)
                : formatCurrency(0, displayCurrency)}
            </div>
            {incomeChange !== null && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  incomeChange >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {incomeChange >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {incomeChange >= 0 ? "+" : ""}
                  {incomeChange.toFixed(1)}% {t.vsPreviousMonth}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Расходы */}
      <FadeIn delay={0.25}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">{t.expense}</div>
              <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {convertedExpense !== null
                ? formatCurrency(convertedExpense, displayCurrency)
                : formatCurrency(0, displayCurrency)}
            </div>
            {expenseChange !== null && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  expenseChange <= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {expenseChange <= 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                <span>
                  {expenseChange >= 0 ? "+" : ""}
                  {expenseChange.toFixed(1)}% {t.vsPreviousMonth}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Результат месяца */}
      <FadeIn delay={0.3}>
        <Card className="relative overflow-hidden">
          <div
            className={cn(
              "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16",
              (convertedBalance ?? 0) >= 0
                ? "bg-emerald-500/10"
                : "bg-red-500/10"
            )}
          />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">{t.netResult}</div>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div
              className={cn(
                "text-3xl font-bold",
                (convertedBalance ?? 0) >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {convertedBalance !== null
                ? formatCurrency(convertedBalance, displayCurrency)
                : formatCurrency(0, displayCurrency)}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
