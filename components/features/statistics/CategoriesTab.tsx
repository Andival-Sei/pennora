"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query/keys";
import { fetchCategoryStatistics } from "@/lib/query/queries/statistics";
import { hasChildren, buildCategoryPath } from "@/lib/utils/category-hierarchy";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import { formatCurrency } from "@/lib/currency/converter";
import type { CurrencyCode } from "@/lib/currency/rates";
import type { CategoryStatistics } from "@/lib/types/statistics";
import { getCategoryColor } from "@/lib/types/statistics";
import { cn } from "@/lib/utils";
import { fetchCategories } from "@/lib/query/queries/categories";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryStatistics;
  }>;
  displayCurrency: CurrencyCode;
  transactionsLabel: string;
}

function CustomTooltip({
  active,
  payload,
  displayCurrency,
  transactionsLabel,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
      <div className="font-medium">{data.categoryName}</div>
      <div className="text-sm">
        {formatCurrency(data.amount, displayCurrency)}
      </div>
      <div className="text-xs text-muted-foreground">
        {data.percentage.toFixed(1)}% • {data.transactionCount}{" "}
        {transactionsLabel.toLowerCase()}
      </div>
    </div>
  );
}

interface CategoriesTabProps {
  dateRange: { from: Date; to: Date };
  transactionType: "income" | "expense" | "all";
  categoryLevel: "top" | "all" | "hierarchy";
  displayCurrency: CurrencyCode;
  t: {
    category: string;
    amount: string;
    percentage: string;
    transactions: string;
    showDetails: string;
  };
  chartT: {
    noData: string;
    total: string;
    percentage: string;
  };
}

export function CategoriesTab({
  dateRange,
  transactionType,
  categoryLevel,
  displayCurrency,
  t,
  chartT,
}: CategoriesTabProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const effectiveType = transactionType === "all" ? "expense" : transactionType;

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.statistics.byCategory({
      from: format(dateRange.from, "yyyy-MM-dd"),
      to: format(dateRange.to, "yyyy-MM-dd"),
      type: effectiveType,
      level: categoryLevel,
      displayCurrency,
    }),
    queryFn: () =>
      fetchCategoryStatistics({
        from: dateRange.from,
        to: dateRange.to,
        type: effectiveType,
        level: categoryLevel,
        displayCurrency,
      }),
    staleTime: QUERY_STALE_TIME.TRANSACTIONS,
    gcTime: QUERY_GC_TIME.TRANSACTIONS,
  });

  // Для проверки наличия дочерних категорий
  const { data: allCategories } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategories,
    staleTime: QUERY_STALE_TIME.CATEGORIES,
  });

  const toggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Вычисляем maxAmount до ранних возвратов (правило React Hooks)
  const maxAmount = useMemo(
    () =>
      categories && categories.length > 0
        ? Math.max(...categories.map((c) => c.amount))
        : 0,
    [categories]
  );

  // Подготовка данных для графика с правильными именами категорий
  const chartData = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories.slice(0, 10).map((category) => ({
      ...category,
      displayName:
        categoryLevel === "all" &&
        allCategories &&
        category.parentId &&
        category.categoryId !== "__uncategorized__" &&
        allCategories.some((c) => c.id === category.categoryId)
          ? buildCategoryPath(category.categoryId, allCategories)
          : category.categoryName,
    }));
  }, [categories, categoryLevel, allCategories]);

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

  const renderCategoryRow = (
    category: CategoryStatistics,
    index: number,
    depth: number = 0
  ) => {
    const hasChildCategories =
      allCategories && hasChildren(category.categoryId, allCategories);
    const isExpanded = expandedCategories.has(category.categoryId);
    const color = getCategoryColor(category, index, allCategories || []);
    const barWidth = (category.amount / maxAmount) * 100;

    // Для режима "all" показываем путь категории, если это подкатегория
    // Не показываем путь для "Без категории" или если категория не найдена
    const categoryDisplayName =
      categoryLevel === "all" &&
      allCategories &&
      category.parentId &&
      category.categoryId !== "__uncategorized__" &&
      allCategories.some((c) => c.id === category.categoryId)
        ? buildCategoryPath(category.categoryId, allCategories)
        : category.categoryName;

    return (
      <motion.div
        key={category.categoryId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <div
          className={cn(
            "flex items-center gap-3 py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors",
            depth > 0 && "ml-6"
          )}
        >
          {/* Expand button */}
          {categoryLevel === "hierarchy" && hasChildCategories ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => toggleExpand(category.categoryId)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          {/* Color indicator */}
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />

          {/* Category name */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate" title={categoryDisplayName}>
              {categoryDisplayName}
            </div>
            <div className="text-xs text-muted-foreground">
              {category.transactionCount} {t.transactions.toLowerCase()}
            </div>
          </div>

          {/* Progress bar */}
          <div className="hidden sm:block w-32 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            />
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <div className="font-medium">
              {formatCurrency(category.amount, displayCurrency)}
            </div>
            <div className="text-xs text-muted-foreground">
              {category.percentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && category.children && category.children.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {category.children.map((child, childIndex) =>
                renderCategoryRow(child, childIndex, depth + 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Горизонтальный Bar Chart */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  className="stroke-border/50"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                  }
                  className="fill-muted-foreground"
                />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={categoryLevel === "all" ? 150 : 90}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  content={(props) => (
                    <CustomTooltip
                      active={props.active}
                      payload={props.payload as CustomTooltipProps["payload"]}
                      displayCurrency={displayCurrency}
                      transactionsLabel={t.transactions}
                    />
                  )}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCategoryColor(entry, index, allCategories || [])}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Список категорий */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-1">
            {categories.map((category, index) =>
              renderCategoryRow(category, index)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
