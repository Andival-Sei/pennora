"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/db/supabase/client";
import { getClientUser } from "@/lib/db/supabase/auth-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { queryKeys } from "../keys";
import { invalidateCategoryRelated } from "../invalidation";
import { queueManager } from "@/lib/sync/queueManager";
import { isNetworkError } from "@/lib/utils/network";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import type {
  Category,
  CategoryInsert,
  CategoryUpdate,
} from "@/lib/types/category";

/**
 * Создает новую категорию
 * Оптимизировано: использует getClientUser() для получения пользователя
 */
async function createCategory(
  category: Omit<CategoryInsert, "user_id">
): Promise<Category> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const supabase = createClient();

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
    .select(
      "id, user_id, name, type, icon, color, parent_id, sort_order, is_archived, is_system, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return data as Category;
}

/**
 * Обновляет существующую категорию
 * Оптимизировано: использует getClientUser() и конкретные поля
 */
async function updateCategory(
  id: string,
  updates: CategoryUpdate
): Promise<Category> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, user_id, name, type, icon, color, parent_id, sort_order, is_archived, is_system, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return data as Category;
}

/**
 * Удаляет категорию (архивирует)
 * Запрещает удаление системных категорий
 * Оптимизировано: использует getClientUser()
 */
async function deleteCategory(id: string): Promise<void> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const supabase = createClient();

  // Проверяем, является ли категория системной
  const { data: category, error: fetchError } = await supabase
    .from("categories")
    .select("is_system")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (category?.is_system) {
    throw new Error("Cannot delete system category");
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
  const t = useTranslations();
  const tSync = useTranslations("sync");

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
    onError: async (err, newCategory, context) => {
      // Если это сетевая ошибка - добавляем в очередь
      if (isNetworkError(err)) {
        try {
          await queueManager.enqueue("categories", "create", null, newCategory);
          toast.success(tSync("willSyncWhenOnline"));
          return;
        } catch (queueError) {
          console.error("Error adding to sync queue:", queueError);
        }
      }

      // Для других ошибок откатываем изменения
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
      console.error("Error creating category:", err);
      const errorMessage = getErrorMessage(err, (key) => t(`errors.${key}`));
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("categories.success.created"));
    },
    onSettled: () => {
      invalidateCategoryRelated(queryClient);
    },
  });
}

/**
 * Хук для обновления категории с оптимистичным обновлением
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

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
    onError: async (err, variables, context) => {
      // Если это сетевая ошибка - добавляем в очередь
      if (isNetworkError(err)) {
        try {
          await queueManager.enqueue(
            "categories",
            "update",
            variables.id,
            variables.updates
          );
          toast.success(tSync("changesWillSync"));
          return;
        } catch (queueError) {
          console.error("Error adding to sync queue:", queueError);
        }
      }

      // Для других ошибок откатываем изменения
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
      console.error("Error updating category:", err);
      const errorMessage = getErrorMessage(err, (key) => t(`errors.${key}`));
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("categories.success.updated"));
    },
    onSettled: () => {
      invalidateCategoryRelated(queryClient);
    },
  });
}

/**
 * Хук для удаления категории с оптимистичным обновлением
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

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
    onError: async (err, id, context) => {
      // Если это сетевая ошибка - добавляем в очередь
      if (isNetworkError(err)) {
        try {
          await queueManager.enqueue("categories", "delete", id, { id });
          toast.success(tSync("deleteWillSync"));
          return;
        } catch (queueError) {
          console.error("Error adding to sync queue:", queueError);
        }
      }

      // Для других ошибок откатываем изменения
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
      console.error("Error deleting category:", err);

      // Специальная обработка для системных категорий
      if (
        err instanceof Error &&
        err.message === "Cannot delete system category"
      ) {
        toast.error(t("categories.errors.cannotDeleteSystem"));
        return;
      }

      const errorMessage = getErrorMessage(err, (key) => t(`errors.${key}`));
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("categories.success.deleted"));
    },
    onSettled: () => {
      invalidateCategoryRelated(queryClient);
    },
  });
}
