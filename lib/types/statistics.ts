import type { Category } from "./category";
import { getCategoryColorWithInheritance } from "@/lib/utils/category-hierarchy";

/**
 * Статистика по категории с поддержкой иерархии
 */
export interface CategoryStatistics {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  parentId: string | null;
  amount: number;
  percentage: number;
  transactionCount: number;
  children?: CategoryStatistics[];
}

/**
 * Статистика за период для графиков трендов
 */
export interface PeriodStatistics {
  period: string; // "2025-01", "2025-W52", "2025-01-28"
  periodLabel: string; // "Январь 2025", "Неделя 52", "28 янв"
  income: number;
  expense: number;
  balance: number;
}

/**
 * Фильтры для статистики
 */
export interface StatisticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  type: "income" | "expense" | "all";
  categoryLevel: "top" | "all" | "hierarchy";
  accountId?: string;
  categoryId?: string; // Для drill-down
}

/**
 * Агрегированные данные для обзора
 */
export interface StatisticsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeChange: number | null; // Процент изменения к прошлому периоду
  expenseChange: number | null;
  balanceChange: number | null;
  transactionCount: number;
  topCategories: CategoryStatistics[];
}

/**
 * Период группировки для трендов
 */
export type TrendPeriod = "day" | "week" | "month";

/**
 * Типы графиков на странице статистики
 */
export type ChartType = "pie" | "bar" | "line" | "area";

/**
 * Данные для круговой диаграммы
 */
export interface PieChartData {
  name: string;
  value: number;
  color: string;
  icon?: string | null;
  categoryId: string;
}

/**
 * Цветовая палитра для категорий без заданного цвета
 */
export const CATEGORY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(215, 70%, 50%)",
  "hsl(280, 65%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(45, 85%, 50%)",
  "hsl(180, 60%, 45%)",
] as const;

/**
 * Получить цвет для категории
 * Поддерживает наследование цветов от родительских категорий
 */
export function getCategoryColor(
  category:
    | Pick<Category, "color" | "id" | "parent_id" | "type">
    | CategoryStatistics,
  index: number,
  allCategories?: Category[]
): string {
  // Если передан список категорий, используем наследование цветов
  if (allCategories && allCategories.length > 0) {
    // Преобразуем CategoryStatistics в Category для использования утилиты
    const categoryForInheritance: Pick<
      Category,
      "id" | "color" | "parent_id" | "type"
    > = {
      id: "categoryId" in category ? category.categoryId : category.id,
      color:
        "categoryColor" in category ? category.categoryColor : category.color,
      parent_id:
        "parentId" in category ? category.parentId : category.parent_id,
      type: "type" in category ? category.type : "expense", // CategoryStatistics не имеет type, используем дефолт
    };

    // Если это CategoryStatistics, нужно найти тип из allCategories
    if ("categoryId" in category) {
      const fullCategory = allCategories.find(
        (c) => c.id === category.categoryId
      );
      if (fullCategory) {
        categoryForInheritance.type = fullCategory.type;
      }
    }

    return getCategoryColorWithInheritance(
      categoryForInheritance,
      allCategories
    );
  }

  // Fallback: используем цвет категории или цвет из палитры
  const categoryColor =
    "categoryColor" in category ? category.categoryColor : category.color;
  return categoryColor || CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
