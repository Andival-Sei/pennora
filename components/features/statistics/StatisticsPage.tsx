"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn } from "@/components/motion";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import type { CurrencyCode } from "@/lib/currency/rates";
import type { TrendPeriod } from "@/lib/types/statistics";

import { StatisticsFiltersComponent } from "./StatisticsFilters";
import { OverviewTab } from "./OverviewTab";
import { TrendsTab } from "./TrendsTab";
import { CategoriesTab } from "./CategoriesTab";

interface StatisticsPageProps {
  displayCurrency: CurrencyCode;
  t: {
    title: string;
    tabs: {
      overview: string;
      trends: string;
      categories: string;
    };
    filters: {
      period: string;
      thisMonth: string;
      lastMonth: string;
      last3Months: string;
      last6Months: string;
      thisYear: string;
      custom: string;
      type: string;
      income: string;
      expense: string;
      all: string;
      categoryLevel: string;
      topOnly: string;
      allCategories: string;
      hierarchy: string;
    };
    charts: {
      noData: string;
      total: string;
      percentage: string;
    };
    overview: {
      income: string;
      expense: string;
      balance: string;
      vsPrevious: string;
      topCategories: string;
    };
    trends: {
      groupBy: string;
      byDay: string;
      byWeek: string;
      byMonth: string;
      income: string;
      expense: string;
    };
    categories: {
      category: string;
      amount: string;
      percentage: string;
      transactions: string;
      showDetails: string;
    };
  };
}

type PeriodPreset =
  | "thisMonth"
  | "lastMonth"
  | "last3Months"
  | "last6Months"
  | "thisYear"
  | "custom";

export function StatisticsPage({ displayCurrency, t }: StatisticsPageProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Фильтры
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("thisMonth");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [transactionType, setTransactionType] = useState<
    "income" | "expense" | "all"
  >("expense");
  const [categoryLevel, setCategoryLevel] = useState<
    "top" | "all" | "hierarchy"
  >("top");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("month");

  // Вычисляем фактический диапазон дат на основе пресета
  const dateRange = useMemo(() => {
    const now = new Date();

    switch (periodPreset) {
      case "thisMonth":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case "last3Months":
        return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
      case "last6Months":
        return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
      case "thisYear":
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: new Date(now.getFullYear(), 11, 31),
        };
      case "custom":
        return customDateRange;
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  }, [periodPreset, customDateRange]);

  // Текстовое представление периода
  const periodLabel = useMemo(() => {
    const { from, to } = dateRange;
    if (format(from, "yyyy-MM") === format(to, "yyyy-MM")) {
      return format(from, "LLLL yyyy", { locale: ru });
    }
    return `${format(from, "d MMM yyyy", { locale: ru })} — ${format(to, "d MMM yyyy", { locale: ru })}`;
  }, [dateRange]);

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <FadeIn delay={0.1}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
              <p className="text-sm text-muted-foreground capitalize">
                {periodLabel}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Фильтры */}
      <FadeIn delay={0.15}>
        <StatisticsFiltersComponent
          periodPreset={periodPreset}
          onPeriodChange={setPeriodPreset}
          customDateRange={customDateRange}
          onCustomDateRangeChange={setCustomDateRange}
          transactionType={transactionType}
          onTransactionTypeChange={setTransactionType}
          categoryLevel={categoryLevel}
          onCategoryLevelChange={setCategoryLevel}
          t={t.filters}
        />
      </FadeIn>

      {/* Вкладки */}
      <FadeIn delay={0.2}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <PieChart className="h-4 w-4 hidden sm:block" />
              {t.tabs.overview}
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="h-4 w-4 hidden sm:block" />
              {t.tabs.trends}
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              {t.tabs.categories}
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="overview" className="mt-0">
                <OverviewTab
                  dateRange={dateRange}
                  transactionType={transactionType}
                  categoryLevel={categoryLevel}
                  displayCurrency={displayCurrency}
                  t={t.overview}
                  chartT={t.charts}
                />
              </TabsContent>

              <TabsContent value="trends" className="mt-0">
                <TrendsTab
                  dateRange={dateRange}
                  trendPeriod={trendPeriod}
                  onTrendPeriodChange={setTrendPeriod}
                  displayCurrency={displayCurrency}
                  t={t.trends}
                  chartT={t.charts}
                />
              </TabsContent>

              <TabsContent value="categories" className="mt-0">
                <CategoriesTab
                  dateRange={dateRange}
                  transactionType={transactionType}
                  categoryLevel={categoryLevel}
                  displayCurrency={displayCurrency}
                  t={t.categories}
                  chartT={t.charts}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </FadeIn>
    </div>
  );
}
