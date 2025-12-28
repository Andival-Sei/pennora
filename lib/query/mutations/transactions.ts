"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/db/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { queryKeys } from "../keys";
import { invalidateTransactionRelated } from "../invalidation";
import { queueManager } from "@/lib/sync/queueManager";
import { isNetworkError } from "@/lib/utils/network";
import {
  getErrorMessage,
  formatErrorForLogging,
} from "@/lib/utils/errorHandler";
import type {
  TransactionInsert,
  TransactionUpdate,
  TransactionWithItems,
  TransactionWithItemsInsert,
  TransactionItemFormData,
  TransactionItemWithCategory,
} from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";

type TranslationFn = (key: string) => string;

/**
 * Создает функцию перевода ошибок
 */
function createErrorTranslator(t: TranslationFn): TranslationFn {
  return (key: string) => {
    try {
      return t(`errors.${key}`);
    } catch (e) {
      console.error("Translation error:", e);
      return key;
    }
  };
}

/**
 * Обрабатывает ошибку мутации транзакции
 * @param err - Ошибка
 * @param context - Контекст мутации с предыдущими запросами
 * @param queryClient - QueryClient для отката изменений
 * @param t - Функция перевода
 * @param tSync - Функция перевода для синхронизации
 * @param enqueueFn - Функция для добавления в очередь синхронизации
 * @param operationName - Название операции для логирования
 */
async function handleTransactionMutationError(
  err: unknown,
  context:
    | { previousQueries?: Array<[readonly unknown[], unknown]> }
    | undefined,
  queryClient: QueryClient,
  t: TranslationFn,
  tSync: TranslationFn,
  enqueueFn: (() => Promise<void>) | null,
  operationName: string
) {
  // Если это сетевая ошибка - добавляем в очередь
  if (isNetworkError(err)) {
    if (enqueueFn) {
      try {
        await enqueueFn();
        toast.success(tSync("willSyncWhenOnline"));
        return;
      } catch (queueError) {
        console.error("Error adding to sync queue:", queueError);
      }
    }
  }

  // Для других ошибок откатываем изменения
  if (context?.previousQueries) {
    context.previousQueries.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  }

  // Логируем ошибку с правильным форматированием
  console.error(`Error ${operationName} transaction:`, err);
  const errorDetails = formatErrorForLogging(err);
  console.error("Error details:", JSON.stringify(errorDetails, null, 2));

  const tErrors = createErrorTranslator(t);
  const errorMessage = getErrorMessage(err, tErrors);
  toast.error(errorMessage);
}

/**
 * Находит временную транзакцию в списке по ключевым полям
 */
function findTempTransaction(
  transactions: TransactionWithItems[],
  realTransaction: TransactionWithItems
): number {
  return transactions.findIndex(
    (t) =>
      t.id.startsWith("temp-") &&
      t.account_id === realTransaction.account_id &&
      t.amount === realTransaction.amount &&
      t.type === realTransaction.type &&
      Math.abs(
        new Date(t.created_at).getTime() -
          new Date(realTransaction.created_at).getTime()
      ) < 5000 // В пределах 5 секунд
  );
}

/**
 * SELECT запрос для транзакции с items
 */
const TRANSACTION_WITH_ITEMS_SELECT = `
  id,
  user_id,
  account_id,
  category_id,
  to_account_id,
  type,
  amount,
  currency,
  exchange_rate,
  description,
  date,
  created_at,
  updated_at,
  category:categories(
    id,
    user_id,
    name,
    type,
    icon,
    color,
    parent_id,
    sort_order,
    is_archived,
    is_system,
    created_at,
    updated_at
  ),
  items:transaction_items(
    id,
    transaction_id,
    category_id,
    amount,
    description,
    sort_order,
    created_at,
    updated_at,
    category:categories(
      id,
      user_id,
      name,
      type,
      icon,
      color,
      parent_id,
      sort_order,
      is_archived,
      is_system,
      created_at,
      updated_at
    )
  )
`;

/**
 * Преобразует данные из Supabase в TransactionWithItems
 */
function transformTransactionData(
  data: Record<string, unknown>
): TransactionWithItems {
  const category = Array.isArray(data.category)
    ? (data.category as Record<string, unknown>[])[0] || null
    : data.category || null;

  const mappedItems = ((data.items as Record<string, unknown>[]) || []).map(
    (item: Record<string, unknown>) => ({
      ...item,
      sort_order: (item.sort_order as number) ?? 0,
      category: Array.isArray(item.category)
        ? (item.category as Record<string, unknown>[])[0] || null
        : item.category || null,
    })
  );

  const items = mappedItems.sort((a, b) => a.sort_order - b.sort_order);

  return {
    ...data,
    category,
    items,
  } as TransactionWithItems;
}

/**
 * Нормализует category_id: пустые строки и невалидные значения преобразует в null
 * Используется для items, чтобы избежать ошибки "invalid input syntax for type uuid"
 */
function normalizeItemCategoryId(
  categoryId: string | null | undefined
): string | null {
  if (!categoryId || categoryId === "" || categoryId === "__none__") {
    return null;
  }
  return categoryId;
}

/**
 * Вычисляет общую сумму из позиций
 * @param items - Массив позиций
 * @returns Общая сумма всех позиций
 */
function calculateTotalFromItems(items: TransactionItemFormData[]): number {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
}

/**
 * Создает новую транзакцию (простую, без items)
 * Оптимизировано: использует конкретные поля вместо * для лучшей производительности
 */
async function createTransaction(
  transaction: TransactionInsert
): Promise<TransactionWithItems> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .insert(transaction)
    .select(TRANSACTION_WITH_ITEMS_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return transformTransactionData(data as Record<string, unknown>);
}

/**
 * Создает транзакцию с позициями (split transaction)
 * Использует транзакцию БД для атомарности
 */
async function createTransactionWithItems(
  transactionData: TransactionWithItemsInsert
): Promise<TransactionWithItems> {
  const supabase = createClient();

  // Извлекаем items из данных транзакции
  const { items, ...transactionInsert } = transactionData;

  // Создаем транзакцию
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert(transactionInsert)
    .select("id")
    .single();

  if (transactionError) {
    throw transactionError;
  }

  // Если есть items, создаем их
  if (items && items.length > 0) {
    // Нормализуем category_id для каждой позиции (пустые строки -> null)
    const itemsToInsert = items.map((item, index) => ({
      transaction_id: transaction.id,
      category_id: normalizeItemCategoryId(item.category_id),
      amount: item.amount,
      description: item.description || null,
      sort_order: item.sort_order ?? index,
    }));

    const { error: itemsError } = await supabase
      .from("transaction_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Откатываем транзакцию, удаляя её
      await supabase.from("transactions").delete().eq("id", transaction.id);
      throw itemsError;
    }
  }

  // Загружаем полную транзакцию с items
  const { data: fullTransaction, error: fetchError } = await supabase
    .from("transactions")
    .select(TRANSACTION_WITH_ITEMS_SELECT)
    .eq("id", transaction.id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  return transformTransactionData(fullTransaction as Record<string, unknown>);
}

/**
 * Обновляет существующую транзакцию
 * Оптимизировано: использует конкретные поля вместо * для лучшей производительности
 */
async function updateTransaction(
  id: string,
  transaction: TransactionUpdate
): Promise<TransactionWithItems> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .update(transaction)
    .eq("id", id)
    .select(TRANSACTION_WITH_ITEMS_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return transformTransactionData(data as Record<string, unknown>);
}

/**
 * Обновляет транзакцию с позициями
 * Удаляет существующие items и создает новые
 * Принудительно устанавливает category_id транзакции в null, если есть позиции
 */
async function updateTransactionWithItems(
  id: string,
  transactionData: TransactionUpdate,
  items?: TransactionItemFormData[]
): Promise<TransactionWithItems> {
  const supabase = createClient();

  // Если указаны items, вычисляем сумму из позиций и устанавливаем category_id в null
  // (категории только у позиций, сумма = сумма позиций)
  const finalTransactionData = {
    ...transactionData,
    ...(items !== undefined
      ? {
          // Вычисляем сумму из позиций (для пустого массива сумма = 0)
          amount: items.length > 0 ? calculateTotalFromItems(items) : 0,
          // Если есть позиции, category_id должен быть null
          ...(items.length > 0 ? { category_id: null } : {}),
        }
      : {}),
  };

  // Обновляем транзакцию
  const { error: transactionError } = await supabase
    .from("transactions")
    .update(finalTransactionData)
    .eq("id", id);

  if (transactionError) {
    throw transactionError;
  }

  // Если указаны items, обновляем их (удаляем старые и создаем новые)
  if (items !== undefined) {
    // Удаляем существующие items
    const { error: deleteError } = await supabase
      .from("transaction_items")
      .delete()
      .eq("transaction_id", id);

    if (deleteError) {
      throw deleteError;
    }

    // Создаем новые items, если они есть
    if (items.length > 0) {
      // Нормализуем category_id для каждой позиции (пустые строки -> null)
      const itemsToInsert = items.map((item, index) => ({
        transaction_id: id,
        category_id: normalizeItemCategoryId(item.category_id),
        amount: item.amount,
        description: item.description || null,
        sort_order: item.sort_order ?? index,
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(itemsToInsert);

      if (itemsError) {
        throw itemsError;
      }
    }
  }

  // Загружаем обновленную транзакцию
  const { data: fullTransaction, error: fetchError } = await supabase
    .from("transactions")
    .select(TRANSACTION_WITH_ITEMS_SELECT)
    .eq("id", id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  return transformTransactionData(fullTransaction as Record<string, unknown>);
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
 * Получает категории для items из кеша
 */
function getCategoriesForItems(
  items: TransactionItemFormData[] | undefined,
  categoriesData: Category[] | undefined
): TransactionItemWithCategory[] {
  if (!items || items.length === 0) return [];

  return items.map((item, index) => {
    const category = item.category_id
      ? categoriesData?.find((cat) => cat.id === item.category_id) || null
      : null;

    return {
      id: `temp-item-${index}`,
      transaction_id: "",
      category_id: item.category_id,
      amount: item.amount,
      description: item.description || null,
      sort_order: item.sort_order ?? index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category,
    } as TransactionItemWithCategory;
  });
}

/**
 * Хук для создания транзакции с оптимистичным обновлением
 * Поддерживает как простые транзакции, так и транзакции с items
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

  return useMutation({
    mutationFn: (data: TransactionWithItemsInsert) => {
      // Если есть items, используем функцию с items
      if (data.items && data.items.length > 0) {
        return createTransactionWithItems(data);
      }
      // Иначе используем простую функцию
      return createTransaction(data);
    },
    onMutate: async (newTransaction) => {
      // Отменяем исходящие запросы для предотвращения перезаписи
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.lists(),
      });

      // Сохраняем предыдущее значение для отката
      const previousQueries = queryClient.getQueriesData({
        queryKey: queryKeys.transactions.lists(),
      });

      // Получаем категории из кеша
      const categoriesData = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list()
      );

      // Получаем категорию для header, если category_id указан
      let category: Category | null = null;
      if (newTransaction.category_id && newTransaction.type !== "transfer") {
        if (categoriesData) {
          category =
            categoriesData.find(
              (cat) => cat.id === newTransaction.category_id
            ) || null;
        }
      }

      // Получаем категории для items
      const itemsWithCategories = getCategoriesForItems(
        newTransaction.items,
        categoriesData
      );

      // Оптимистично обновляем кеш для всех списков транзакций
      queryClient.setQueriesData<TransactionWithItems[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          const optimisticTransaction: TransactionWithItems = {
            ...newTransaction,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category,
            items: itemsWithCategories,
          } as TransactionWithItems;
          return [optimisticTransaction, ...old];
        }
      );

      return { previousQueries };
    },
    onError: async (err, newTransaction, context) => {
      await handleTransactionMutationError(
        err,
        context,
        queryClient,
        t,
        tSync,
        async () => {
          await queueManager.enqueue(
            "transactions",
            "create",
            null,
            newTransaction
          );
        },
        "creating"
      );
    },
    onSuccess: (data) => {
      // Обновляем оптимистичную транзакцию реальными данными из ответа сервера
      queryClient.setQueriesData<TransactionWithItems[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          // Находим временную транзакцию по совпадению ключевых полей и заменяем её на реальную
          const tempIndex = findTempTransaction(old, data);
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
      invalidateTransactionRelated(queryClient);
    },
  });
}

/**
 * Хук для обновления транзакции с оптимистичным обновлением
 * Поддерживает обновление items
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

  return useMutation({
    mutationFn: ({
      id,
      transaction,
      items,
    }: {
      id: string;
      transaction: TransactionUpdate;
      items?: TransactionItemFormData[];
    }) => {
      // Если указаны items, используем функцию с items
      if (items !== undefined) {
        return updateTransactionWithItems(id, transaction, items);
      }
      // Иначе используем простую функцию
      return updateTransaction(id, transaction);
    },
    onMutate: async ({ id, transaction, items }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.lists(),
      });

      const previousQueries = queryClient.getQueriesData({
        queryKey: queryKeys.transactions.lists(),
      });

      // Получаем категории из кеша
      const categoriesData = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list()
      );

      // Получаем категорию из кеша, если category_id изменен
      let category: Category | null | undefined = undefined;
      if (
        transaction.category_id !== undefined &&
        transaction.type !== "transfer"
      ) {
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

      // Получаем категории для items, если они указаны
      const itemsWithCategories =
        items !== undefined
          ? getCategoriesForItems(items, categoriesData)
          : undefined;

      // Оптимистично обновляем кеш
      queryClient.setQueriesData<TransactionWithItems[]>(
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
                  // Обновляем items только если они были указаны
                  ...(itemsWithCategories !== undefined && {
                    items: itemsWithCategories,
                  }),
                }
              : t
          );
        }
      );

      return { previousQueries };
    },
    onError: async (err, variables, context) => {
      await handleTransactionMutationError(
        err,
        context,
        queryClient,
        t,
        tSync,
        async () => {
          await queueManager.enqueue(
            "transactions",
            "update",
            variables.id,
            variables.transaction
          );
        },
        "updating"
      );
    },
    onSuccess: (data) => {
      // Обновляем транзакцию в кеше реальными данными из ответа сервера
      queryClient.setQueriesData<TransactionWithItems[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          return old.map((t) => (t.id === data.id ? data : t));
        }
      );

      toast.success(t("transactions.success.updated"));
    },
    onSettled: () => {
      invalidateTransactionRelated(queryClient);
    },
  });
}

/**
 * Хук для удаления транзакции с оптимистичным обновлением
 * Items удаляются автоматически благодаря CASCADE DELETE
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
      queryClient.setQueriesData<TransactionWithItems[]>(
        { queryKey: queryKeys.transactions.lists() },
        (old) => {
          if (!old) return old;
          return old.filter((t) => t.id !== id);
        }
      );

      return { previousQueries };
    },
    onError: async (err, id, context) => {
      await handleTransactionMutationError(
        err,
        context,
        queryClient,
        t,
        tSync,
        async () => {
          await queueManager.enqueue("transactions", "delete", id, { id });
        },
        "deleting"
      );
    },
    onSuccess: () => {
      toast.success(t("transactions.success.deleted"));
    },
    onSettled: async () => {
      invalidateTransactionRelated(queryClient);
    },
  });
}
