"use client";

import { useState, memo, useCallback } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryItem } from "./CategoryItem";
import type {
  CategoryTree as CategoryTreeType,
  CategoryWithChildren,
  Category,
} from "@/lib/types/category";
import { useTranslations } from "next-intl";

interface CategoryTreeProps {
  tree: CategoryTreeType;
  onEdit?: (category: CategoryWithChildren) => void;
  onDelete?: (category: CategoryWithChildren) => void;
  allCategories?: Category[]; // Плоский список всех категорий для наследования цветов
}

// Мемоизированный компонент для группы категорий
interface CategoryGroupProps {
  categories: CategoryWithChildren[];
  type: "income" | "expense";
  expanded: Set<string>;
  onToggleExpand: (categoryId: string) => void;
  onEdit?: (category: CategoryWithChildren) => void;
  onDelete?: (category: CategoryWithChildren) => void;
  allCategories?: Category[];
  t: (key: string) => string;
}

const CategoryGroup = memo(function CategoryGroup({
  categories,
  type,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  allCategories = [],
  t,
}: CategoryGroupProps) {
  if (categories.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === "income" ? (
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          {type === "income" ? t("income") : t("expense")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {categories.map((category) => {
          const handleToggleExpand = () => onToggleExpand(category.id);
          return (
            <CategoryItem
              key={category.id}
              category={category}
              level={0}
              onEdit={onEdit}
              onDelete={onDelete}
              expanded={expanded.has(category.id)}
              onToggleExpand={handleToggleExpand}
              allCategories={allCategories}
            />
          );
        })}
      </CardContent>
    </Card>
  );
});

export const CategoryTree = memo(function CategoryTree({
  tree,
  onEdit,
  onDelete,
  allCategories = [],
}: CategoryTreeProps) {
  const t = useTranslations("categories");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((categoryId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      <CategoryGroup
        categories={tree.income}
        type="income"
        expanded={expanded}
        onToggleExpand={toggleExpand}
        onEdit={onEdit}
        onDelete={onDelete}
        allCategories={allCategories}
        t={t}
      />
      <CategoryGroup
        categories={tree.expense}
        type="expense"
        expanded={expanded}
        onToggleExpand={toggleExpand}
        onEdit={onEdit}
        onDelete={onDelete}
        allCategories={allCategories}
        t={t}
      />
    </div>
  );
});
