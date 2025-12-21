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
            category: null,
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
      const errorMessage = getErrorMessage(err, (key) => t(key));
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("transactions.success.created"));
    },
    onSettled: (data, error, variables) => {
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
      // Если это перевод, инвалидируем кеш счетов для обновления балансов
      if (variables.type === "transfer") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.accounts.list(),
        });
      }
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

      // Оптимистично обновляем кеш
      queryClient.setQueriesData<TransactionWithCategory[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          return old.map((t) =>
            t.id === id
              ? { ...t, ...transaction, updated_at: new Date().toISOString() }
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
      const errorMessage = getErrorMessage(err, (key) => t(key));
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("transactions.success.updated"));
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists(),
      });
      // Инвалидируем статистику
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Если это перевод или изменен тип на перевод, инвалидируем кеш счетов
      if (
        variables.transaction.type === "transfer" ||
        (data && data.type === "transfer")
      ) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.accounts.list(),
        });
      }
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
      const errorMessage = getErrorMessage(err, (key) => t(key));
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("transactions.success.deleted"));
    },
    onSettled: async (data, error, id) => {
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
      // Проверяем, была ли удаленная транзакция переводом
      // Для этого нужно получить транзакцию из кеша перед удалением
      const previousQueries = queryClient.getQueriesData<
        TransactionWithCategory[]
      >({
        queryKey: queryKeys.transactions.lists(),
      });
      // Ищем удаленную транзакцию в кеше для проверки типа
      let wasTransfer = false;
      for (const [, transactions] of previousQueries) {
        if (transactions) {
          const deletedTransaction = transactions.find((t) => t.id === id);
          if (deletedTransaction?.type === "transfer") {
            wasTransfer = true;
            break;
          }
        }
      }
      // Если это был перевод, инвалидируем кеш счетов
      if (wasTransfer) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.accounts.list(),
        });
      }
    },
  });
}
