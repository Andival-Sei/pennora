"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/db/supabase/client";
import { toast } from "sonner";
import { queryKeys } from "../keys";
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
    onError: (err, newTransaction, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error creating transaction:", err);
      toast.error("Не удалось добавить транзакцию");
    },
    onSuccess: () => {
      toast.success("Транзакция добавлена");
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
    },
  });
}

/**
 * Хук для обновления транзакции с оптимистичным обновлением
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

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
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error updating transaction:", err);
      toast.error("Не удалось обновить транзакцию");
    },
    onSuccess: () => {
      toast.success("Транзакция обновлена");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists(),
      });
    },
  });
}

/**
 * Хук для удаления транзакции с оптимистичным обновлением
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

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
    onError: (err, id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error deleting transaction:", err);
      toast.error("Не удалось удалить транзакцию");
    },
    onSuccess: () => {
      toast.success("Транзакция удалена");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.availableMonths(),
      });
    },
  });
}
