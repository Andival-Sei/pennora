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
  CategoryTree,
} from "@/lib/types/category";

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
    staleTime: 10 * 60 * 1000, // 10 минут - данные редко меняются
    gcTime: 24 * 60 * 60 * 1000, // 24 часа
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
    } catch (err) {
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
    } catch (err) {
      return null;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (err) {
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
