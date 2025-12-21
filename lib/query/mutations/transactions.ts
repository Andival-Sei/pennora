"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/db/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { queryKeys } from "../keys";
import { queueManager } from "@/lib/sync/queueManager";
import { isNetworkError } from "@/lib/utils/network";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import type {
  TransactionInsert,
  TransactionUpdate,
  TransactionWithCategory,
} from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";

/**
 * Создает новую транзакцию
 */
async function createTransaction(
  transaction: TransactionInsert
): Promise<TransactionWithCategory> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .insert(transaction)
    .select(
      `
      *,
      category:categories(*)
    `
    )
    .single();

  if (error) {
    throw error;
  }

  return data as TransactionWithCategory;
}

/**
 * Обновляет существующую транзакцию
 */
async function updateTransaction(
  id: string,
  transaction: TransactionUpdate
): Promise<TransactionWithCategory> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .update(transaction)
    .eq("id", id)
    .select(
      `
      *,
      category:categories(*)
    `
    )
    .single();

  if (error) {
    throw error;
  }

  return data as TransactionWithCategory;
}

/**
 * Удаляет транзакцию
 */
async function deleteTransaction(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Хук для создания транзакции с оптимистичным обновлением
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

  return useMutation({
    mutationFn: createTransaction,
    onMutate: async (newTransaction) => {
      // Отменяем исходящие запросы для предотвращения перезаписи
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.lists(),
      });

      // Сохраняем предыдущее значение для отката
      const previousQueries = queryClient.getQueriesData({
        queryKey: queryKeys.transactions.lists(),
      });

      // Получаем категорию из кеша, если category_id указан
      let category: Category | null = null;
      if (newTransaction.category_id && newTransaction.type !== "transfer") {
        const categoriesData = queryClient.getQueryData<Category[]>(
          queryKeys.categories.list()
        );
        if (categoriesData) {
          category =
            categoriesData.find(
              (cat) => cat.id === newTransaction.category_id
            ) || null;
        }
      }

      // Оптимистично обновляем кеш для всех списков транзакций
      queryClient.setQueriesData<TransactionWithCategory[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          const optimisticTransaction: TransactionWithCategory = {
            ...newTransaction,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category,
          } as TransactionWithCategory;
          return [optimisticTransaction, ...old];
        }
      );

      return { previousQueries };
    },
    onError: async (err, newTransaction, context) => {
      // Если это сетевая ошибка - добавляем в очередь и не откатываем оптимистичное обновление
      if (isNetworkError(err)) {
        try {
          await queueManager.enqueue(
            "transactions",
            "create",
            null,
            newTransaction
          );
          toast.success(tSync("willSyncWhenOnline"));
          // Не откатываем оптимистичное обновление - оставляем в UI
          return;
        } catch (queueError) {
          console.error("Error adding to sync queue:", queueError);
        }
      }

      // Для других ошибок откатываем изменения
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error creating transaction:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));

      // Используем функцию перевода с namespace errors
      const tErrors = (key: string) => {
        try {
          return t(`errors.${key}`);
        } catch (e) {
          console.error("Translation error:", e);
          return key;
        }
      };

      const errorMessage = getErrorMessage(err, tErrors);
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      // Обновляем оптимистичную транзакцию реальными данными из ответа сервера
      queryClient.setQueriesData<TransactionWithCategory[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          // Находим временную транзакцию по совпадению ключевых полей и заменяем её на реальную
          const tempIndex = old.findIndex(
            (t) =>
              t.id.startsWith("temp-") &&
              t.account_id === data.account_id &&
              t.amount === data.amount &&
              t.type === data.type &&
              Math.abs(
                new Date(t.created_at).getTime() -
                  new Date(data.created_at).getTime()
              ) < 5000 // В пределах 5 секунд
          );
          if (tempIndex !== -1) {
            const updated = [...old];
            updated[tempIndex] = data;
            return updated;
          }
          // Если не нашли временную, просто добавляем в начало
          return [data, ...old];
        }
      );

      toast.success(t("transactions.success.created"));
    },
    onSettled: () => {
      // Инвалидируем все списки транзакций для обновления данных
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists(),
      });
      // Также инвалидируем доступные месяцы/годы
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.availableMonths(),
      });
      // Инвалидируем статистику
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Инвалидируем кеш счетов для обновления балансов
      // Все транзакции (доходы, расходы, переводы) влияют на баланс счетов
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.list(),
      });
    },
  });
}

/**
 * Хук для обновления транзакции с оптимистичным обновлением
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

  return useMutation({
    mutationFn: ({
      id,
      transaction,
    }: {
      id: string;
      transaction: TransactionUpdate;
    }) => updateTransaction(id, transaction),
    onMutate: async ({ id, transaction }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.lists(),
      });

      const previousQueries = queryClient.getQueriesData({
        queryKey: queryKeys.transactions.lists(),
      });

      // Получаем категорию из кеша, если category_id изменен
      let category: Category | null | undefined = undefined;
      if (
        transaction.category_id !== undefined &&
        transaction.type !== "transfer"
      ) {
        const categoriesData = queryClient.getQueryData<Category[]>(
          queryKeys.categories.list()
        );
        if (categoriesData) {
          if (transaction.category_id) {
            category =
              categoriesData.find(
                (cat) => cat.id === transaction.category_id
              ) || null;
          } else {
            category = null;
          }
        }
      }

      // Оптимистично обновляем кеш
      queryClient.setQueriesData<TransactionWithCategory[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          return old.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...transaction,
                  updated_at: new Date().toISOString(),
                  // Обновляем категорию только если она была изменена
                  ...(category !== undefined && { category }),
                }
              : t
          );
        }
      );

      return { previousQueries };
    },
    onError: async (err, variables, context) => {
      // Если это сетевая ошибка - добавляем в очередь
      if (isNetworkError(err)) {
        try {
          await queueManager.enqueue(
            "transactions",
            "update",
            variables.id,
            variables.transaction
          );
          toast.success(tSync("changesWillSync"));
          return;
        } catch (queueError) {
          console.error("Error adding to sync queue:", queueError);
        }
      }

      // Для других ошибок откатываем изменения
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error updating transaction:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));

      // Используем функцию перевода с namespace errors
      const tErrors = (key: string) => {
        try {
          return t(`errors.${key}`);
        } catch (e) {
          console.error("Translation error:", e);
          return key;
        }
      };

      const errorMessage = getErrorMessage(err, tErrors);
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      // Обновляем транзакцию в кеше реальными данными из ответа сервера
      queryClient.setQueriesData<TransactionWithCategory[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          return old.map((t) => (t.id === data.id ? data : t));
        }
      );

      toast.success(t("transactions.success.updated"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists(),
      });
      // Инвалидируем статистику
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Инвалидируем кеш счетов для обновления балансов
      // Все транзакции (доходы, расходы, переводы) влияют на баланс счетов
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.list(),
      });
    },
  });
}

/**
 * Хук для удаления транзакции с оптимистичным обновлением
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

  return useMutation({
    mutationFn: deleteTransaction,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.lists(),
      });

      const previousQueries = queryClient.getQueriesData({
        queryKey: queryKeys.transactions.lists(),
      });

      // Оптимистично удаляем из кеша
      queryClient.setQueriesData<TransactionWithCategory[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          return old.filter((t) => t.id !== id);
        }
      );

      return { previousQueries };
    },
    onError: async (err, id, context) => {
      // Если это сетевая ошибка - добавляем в очередь
      if (isNetworkError(err)) {
        try {
          await queueManager.enqueue("transactions", "delete", id, { id });
          toast.success(tSync("deleteWillSync"));
          return;
        } catch (queueError) {
          console.error("Error adding to sync queue:", queueError);
        }
      }

      // Для других ошибок откатываем изменения
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error deleting transaction:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));

      // Используем функцию перевода с namespace errors
      const tErrors = (key: string) => {
        try {
          return t(`errors.${key}`);
        } catch (e) {
          console.error("Translation error:", e);
          return key;
        }
      };

      const errorMessage = getErrorMessage(err, tErrors);
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("transactions.success.deleted"));
    },
    onSettled: async () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.availableMonths(),
      });
      // Инвалидируем статистику
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Инвалидируем кеш счетов для обновления балансов
      // Все транзакции (доходы, расходы, переводы) влияют на баланс счетов
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.list(),
      });
    },
  });
}
