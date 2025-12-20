"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  TransactionInsert,
  TransactionUpdate,
  TransactionWithCategory,
} from "@/lib/types/transaction";

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
  }): Promise<TransactionWithCategory[]> => {
    // Используем queryClient для получения данных из кеша или загрузки
    const queryKey = queryKeys.transactions.list(filters);
    const cachedData =
      queryClient.getQueryData<TransactionWithCategory[]>(queryKey);

    if (cachedData) {
      return cachedData;
    }

    // Если данных нет в кеше, загружаем их
    const data = await queryClient.fetchQuery({
      queryKey,
      queryFn: () => fetchTransactions(filters),
      staleTime: 2 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
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
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });

    return data;
  };

  // Обертки для обратной совместимости
  const addTransaction = async (transaction: TransactionInsert) => {
    const result = await createMutation.mutateAsync(transaction);
    return result || null;
  };

  const updateTransaction = async (
    id: string,
    transaction: TransactionUpdate
  ) => {
    const result = await updateMutation.mutateAsync({ id, transaction });
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
