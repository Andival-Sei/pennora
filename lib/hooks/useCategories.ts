"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/db/supabase/client";
import type {
  Category,
  CategoryInsert,
  CategoryUpdate,
  CategoryWithChildren,
  CategoryTree,
} from "@/lib/types/category";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Загрузка категорий
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Создание категории
  const createCategory = useCallback(
    async (category: Omit<CategoryInsert, "user_id">) => {
      try {
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("User not authenticated");
          return null;
        }

        // Если sort_order не указан, устанавливаем максимальный + 1
        if (category.sort_order === undefined) {
          const maxSortOrder = categories.reduce(
            (max, cat) => Math.max(max, cat.sort_order),
            0
          );
          category.sort_order = maxSortOrder + 1;
        }

        const { data, error: insertError } = await supabase
          .from("categories")
          .insert({ ...category, user_id: user.id })
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
          return null;
        }

        // Оптимистичное обновление
        setCategories((prev) => [...prev, data]);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [supabase, categories]
  );

  // Обновление категории
  const updateCategory = useCallback(
    async (id: string, updates: CategoryUpdate) => {
      try {
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("User not authenticated");
          return null;
        }

        const { data, error: updateError } = await supabase
          .from("categories")
          .update(updates)
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (updateError) {
          setError(updateError.message);
          return null;
        }

        // Оптимистичное обновление
        setCategories((prev) =>
          prev.map((cat) => (cat.id === id ? data : cat))
        );
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [supabase]
  );

  // Удаление категории (архивация)
  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("User not authenticated");
          return false;
        }

        const { error: deleteError } = await supabase
          .from("categories")
          .update({ is_archived: true })
          .eq("id", id)
          .eq("user_id", user.id);

        if (deleteError) {
          setError(deleteError.message);
          return false;
        }

        // Оптимистичное обновление
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [supabase]
  );

  // Построение дерева категорий
  const buildTree = useCallback((): CategoryTree => {
    const income: CategoryWithChildren[] = [];
    const expense: CategoryWithChildren[] = [];

    // Создаём мапы для быстрого доступа
    const categoryMap = new Map<string, CategoryWithChildren>();

    // Инициализируем все категории
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Строим дерево
    categories.forEach((cat) => {
      const categoryWithChildren = categoryMap.get(cat.id)!;

      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(categoryWithChildren);
        }
      } else {
        // Корневая категория
        if (cat.type === "income") {
          income.push(categoryWithChildren);
        } else {
          expense.push(categoryWithChildren);
        }
      }
    });

    // Сортируем детей по sort_order
    const sortChildren = (items: CategoryWithChildren[]) => {
      items.sort((a, b) => a.sort_order - b.sort_order);
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          sortChildren(item.children);
        }
      });
    };

    sortChildren(income);
    sortChildren(expense);

    return { income, expense };
  }, [categories]);

  // Загружаем категории при монтировании
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    buildTree,
    refresh: loadCategories,
  };
}
