"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/db/supabase/client";
import { toast } from "sonner";
import { queryKeys } from "../keys";
import type {
  Category,
  CategoryInsert,
  CategoryUpdate,
} from "@/lib/types/category";

/**
 * Создает новую категорию
 */
async function createCategory(
  category: Omit<CategoryInsert, "user_id">
): Promise<Category> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Если sort_order не указан, получаем максимальный и добавляем 1
  if (category.sort_order === undefined) {
    const { data: existingCategories } = await supabase
      .from("categories")
      .select("sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const maxSortOrder = existingCategories?.sort_order || 0;
    category.sort_order = maxSortOrder + 1;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...category, user_id: user.id })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Category;
}

/**
 * Обновляет существующую категорию
 */
async function updateCategory(
  id: string,
  updates: CategoryUpdate
): Promise<Category> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Category;
}

/**
 * Удаляет категорию (архивирует)
 */
async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("categories")
    .update({ is_archived: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

/**
 * Хук для создания категории с оптимистичным обновлением
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.categories.all,
      });

      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list()
      );

      // Оптимистично добавляем категорию
      queryClient.setQueryData<Category[]>(
        queryKeys.categories.list(),
        (old) => {
          if (!old) return old;
          const optimisticCategory: Category = {
            ...newCategory,
            id: `temp-${Date.now()}`,
            user_id: "",
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Category;
          return [...old, optimisticCategory];
        }
      );

      return { previousCategories };
    },
    onError: (err, newCategory, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
      console.error("Error creating category:", err);
      toast.error("Не удалось создать категорию");
    },
    onSuccess: () => {
      toast.success("Категория создана");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}

/**
 * Хук для обновления категории с оптимистичным обновлением
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CategoryUpdate }) =>
      updateCategory(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.categories.all,
      });

      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list()
      );

      // Оптимистично обновляем категорию
      queryClient.setQueryData<Category[]>(
        queryKeys.categories.list(),
        (old) => {
          if (!old) return old;
          return old.map((cat) =>
            cat.id === id
              ? { ...cat, ...updates, updated_at: new Date().toISOString() }
              : cat
          );
        }
      );

      return { previousCategories };
    },
    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
      console.error("Error updating category:", err);
      toast.error("Не удалось обновить категорию");
    },
    onSuccess: () => {
      toast.success("Категория обновлена");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}

/**
 * Хук для удаления категории с оптимистичным обновлением
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.categories.all,
      });

      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list()
      );

      // Оптимистично удаляем категорию (фильтруем по id)
      queryClient.setQueryData<Category[]>(
        queryKeys.categories.list(),
        (old) => {
          if (!old) return old;
          return old.filter((cat) => cat.id !== id);
        }
      );

      return { previousCategories };
    },
    onError: (err, id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
      console.error("Error deleting category:", err);
      toast.error("Не удалось удалить категорию");
    },
    onSuccess: () => {
      toast.success("Категория удалена");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}
