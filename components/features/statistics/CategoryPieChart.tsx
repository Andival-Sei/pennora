"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import { Loader2 } from "lucide-react";
import { queryKeys } from "@/lib/query/keys";
import { fetchCategoryStatistics } from "@/lib/query/queries/statistics";
import { fetchCategories } from "@/lib/query/queries/categories";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import { formatCurrency } from "@/lib/currency/converter";
import type { CurrencyCode } from "@/lib/currency/rates";
import { getCategoryColor } from "@/lib/types/statistics";

interface CategoryPieChartProps {
  dateRange: { from: Date; to: Date };
  transactionType: "income" | "expense";
  categoryLevel: "top" | "all" | "hierarchy";
  displayCurrency: CurrencyCode;
  chartT: {
    noData: string;
    total: string;
    percentage: string;
  };
  onCategoryClick?: (categoryId: string) => void;
}

export function CategoryPieChart({
  dateRange,
  transactionType,
  categoryLevel,
  displayCurrency,
  chartT,
  onCategoryClick,
}: CategoryPieChartProps) {
  // Для круговой диаграммы используем только "top" или "all", иерархию не показываем
  const effectiveLevel = categoryLevel === "hierarchy" ? "top" : categoryLevel;

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.statistics.byCategory({
      from: format(dateRange.from, "yyyy-MM-dd"),
      to: format(dateRange.to, "yyyy-MM-dd"),
      type: transactionType,
      level: effectiveLevel,
      displayCurrency,
    }),
    queryFn: () =>
      fetchCategoryStatistics({
        from: dateRange.from,
        to: dateRange.to,
        type: transactionType,
        level: effectiveLevel,
        displayCurrency,
      }),
    staleTime: QUERY_STALE_TIME.TRANSACTIONS,
    gcTime: QUERY_GC_TIME.TRANSACTIONS,
  });

  // Загружаем все категории для наследования цветов
  const { data: allCategories } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategories,
    staleTime: QUERY_STALE_TIME.CATEGORIES,
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

  if (!categories || categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {chartT.noData}
      </div>
    );
  }

  const chartData = categories.map((cat, index) => ({
    name: cat.categoryName,
    value: cat.amount,
    color: getCategoryColor(cat, index, allCategories || []),
    categoryId: cat.categoryId,
    percentage: cat.percentage,
    icon: cat.categoryIcon,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderLegend = () => {
    return (
      <div className="space-y-2">
        {chartData.slice(0, 8).map((item) => (
          <button
            key={item.categoryId}
            className="flex items-center justify-between w-full gap-3 text-sm hover:opacity-80 transition-opacity p-2 rounded-lg hover:bg-muted/50"
            onClick={() => onCategoryClick?.(item.categoryId)}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-foreground truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-foreground font-medium">
                {formatCurrency(item.value, displayCurrency)}
              </span>
              <span className="text-muted-foreground text-xs">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload as (typeof chartData)[0];
    return (
      <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
        <div className="font-medium">{data.name}</div>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(data.value, displayCurrency)}
        </div>
        <div className="text-xs text-muted-foreground">
          {data.percentage.toFixed(1)}%
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
      {/* Контейнер диаграммы с абсолютным позиционированием для центрального текста */}
      <div className="relative h-80 sm:h-96 lg:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={2}
              dataKey="value"
              onClick={(data) => onCategoryClick?.(data.categoryId)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip} />
          </PieChart>
        </ResponsiveContainer>

        {/* Центральная сумма - абсолютное позиционирование */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-sm sm:text-base text-muted-foreground">
              {chartT.total}
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {formatCurrency(total, displayCurrency)}
            </div>
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="lg:pl-2">{renderLegend()}</div>
    </div>
  );
}
