"use client";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  fetchTransactions,
  fetchAvailableMonthsAndYears,
} from "@/lib/query/queries/transactions";
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/lib/query/mutations/transactions";
import type {
  TransactionUpdate,
  TransactionWithItems,
  TransactionWithItemsInsert,
  TransactionItemFormData,
} from "@/lib/types/transaction";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";

/**
 * Хук для работы с транзакциями
 * Использует React Query для кеширования и управления состоянием
 * Сохраняет обратную совместимость с предыдущим API
 */
export function useTransactions() {
  const queryClient = useQueryClient();

  // Используем mutations из lib/query/mutations
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  // Функция для загрузки транзакций (для обратной совместимости)
  // Возвращает Promise, как в старой версии
  const fetchTransactionsFn = async (filters?: {
    month?: number;
    year?: number;
  }): Promise<TransactionWithItems[]> => {
    // Используем queryClient для получения данных из кеша или загрузки
    const queryKey = queryKeys.transactions.list(filters);
    const cachedData =
      queryClient.getQueryData<TransactionWithItems[]>(queryKey);

    if (cachedData) {
      return cachedData;
    }

    // Если данных нет в кеше, загружаем их
    const data = await queryClient.fetchQuery({
      queryKey,
      queryFn: () => fetchTransactions(filters),
      staleTime: QUERY_STALE_TIME.TRANSACTIONS,
      gcTime: QUERY_GC_TIME.TRANSACTIONS,
    });

    return data;
  };

  // Функция для получения доступных месяцев и лет (для обратной совместимости)
  const getAvailableMonthsAndYears = async () => {
    const queryKey = queryKeys.transactions.availableMonths();
    const cachedData = queryClient.getQueryData<{
      months: Array<{ month: number; year: number }>;
      years: number[];
    }>(queryKey);

    if (cachedData) {
      return cachedData;
    }

    const data = await queryClient.fetchQuery({
      queryKey,
      queryFn: fetchAvailableMonthsAndYears,
      staleTime: QUERY_STALE_TIME.AVAILABLE_MONTHS,
      gcTime: QUERY_GC_TIME.AVAILABLE_MONTHS,
    });

    return data;
  };

  // Обертки для обратной совместимости
  const addTransaction = async (transaction: TransactionWithItemsInsert) => {
    const result = await createMutation.mutateAsync(transaction);
    return result || null;
  };

  const updateTransaction = async (
    id: string,
    transaction: TransactionUpdate,
    items?: TransactionItemFormData[]
  ) => {
    const result = await updateMutation.mutateAsync({ id, transaction, items });
    return result || null;
  };

  const deleteTransaction = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    return true;
  };

  return {
    // Для обратной совместимости
    loading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    fetchTransactions: fetchTransactionsFn,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getAvailableMonthsAndYears,
    // Прямой доступ к mutations для компонентов, которые хотят использовать React Query напрямую
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
