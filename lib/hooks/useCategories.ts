"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  fetchCategories,
  buildCategoryTree,
} from "@/lib/query/queries/categories";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/query/mutations/categories";
import type {
  Category,
  CategoryInsert,
  CategoryUpdate,
} from "@/lib/types/category";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";

/**
 * Хук для работы с категориями
 * Использует React Query для кеширования и управления состоянием
 * Сохраняет обратную совместимость с предыдущим API
 */
export function useCategories() {
  // Query для загрузки категорий
  const {
    data: categories = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategories,
    staleTime: QUERY_STALE_TIME.CATEGORIES,
    gcTime: QUERY_GC_TIME.CATEGORIES,
    // Персистентное кеширование будет настроено отдельно
  });

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Построение дерева категорий из кешированных данных
  const tree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  // Обертки для обратной совместимости
  const createCategory = async (
    category: Omit<CategoryInsert, "user_id">
  ): Promise<Category | null> => {
    try {
      const result = await createMutation.mutateAsync(category);
      return result || null;
    } catch {
      return null;
    }
  };

  const updateCategory = async (
    id: string,
    updates: CategoryUpdate
  ): Promise<Category | null> => {
    try {
      const result = await updateMutation.mutateAsync({ id, updates });
      return result || null;
    } catch {
      return null;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    categories,
    loading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    createCategory,
    updateCategory,
    deleteCategory,
    buildTree: () => tree, // Для обратной совместимости
    refresh: () => refetch(), // Для обратной совместимости
    // Прямой доступ к mutations для компонентов, которые хотят использовать React Query напрямую
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
