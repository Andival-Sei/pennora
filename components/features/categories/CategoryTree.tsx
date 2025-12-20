"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryItem } from "./CategoryItem";
import type {
  CategoryTree as CategoryTreeType,
  CategoryWithChildren,
} from "@/lib/types/category";
import { useTranslations } from "next-intl";

interface CategoryTreeProps {
  tree: CategoryTreeType;
  onEdit?: (category: CategoryWithChildren) => void;
  onDelete?: (category: CategoryWithChildren) => void;
}

export function CategoryTree({ tree, onEdit, onDelete }: CategoryTreeProps) {
  const t = useTranslations("categories");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (categoryId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderCategoryGroup = (
    categories: CategoryWithChildren[],
    type: "income" | "expense"
  ) => {
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
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              level={0}
              onEdit={onEdit}
              onDelete={onDelete}
              expanded={expanded.has(category.id)}
              onToggleExpand={() => toggleExpand(category.id)}
            />
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {renderCategoryGroup(tree.income, "income")}
      {renderCategoryGroup(tree.expense, "expense")}
    </div>
  );
}
