/**
 * Централизованная система инвалидации кеша
 * Обеспечивает единообразную инвалидацию связанных данных
 */

import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";

/**
 * Инвалидирует все кеши, связанные с транзакциями
 * Вызывается после создания, обновления или удаления транзакции
 */
export function invalidateTransactionRelated(queryClient: QueryClient): void {
  // Инвалидируем все списки транзакций
  queryClient.invalidateQueries({
    queryKey: queryKeys.transactions.lists(),
  });

  // Инвалидируем доступные месяцы/годы (могут измениться при добавлении/удалении)
  queryClient.invalidateQueries({
    queryKey: queryKeys.transactions.availableMonths(),
  });

  // Инвалидируем статистику (зависит от транзакций)
  queryClient.invalidateQueries({
    queryKey: queryKeys.statistics.all,
  });

  // Инвалидируем кеш счетов (балансы могут измениться при изменении транзакций)
  queryClient.invalidateQueries({
    queryKey: queryKeys.accounts.all,
  });
}

/**
 * Инвалидирует все кеши, связанные с категориями
 * Вызывается после создания, обновления или удаления категории
 */
export function invalidateCategoryRelated(queryClient: QueryClient): void {
  // Инвалидируем все категории (включая tree)
  queryClient.invalidateQueries({
    queryKey: queryKeys.categories.all,
  });

  // Примечание: транзакции не инвалидируются, так как category_id в транзакциях
  // используется только для отображения, не влияет на структуру данных
}

/**
 * Инвалидирует все кеши, связанные со счетами
 * Вызывается после создания, обновления или удаления счета
 */
export function invalidateAccountRelated(queryClient: QueryClient): void {
  // Инвалидируем все счета
  queryClient.invalidateQueries({
    queryKey: queryKeys.accounts.all,
  });

  // Инвалидируем статистику (может зависеть от счетов через транзакции)
  // Примечание: обычно статистика зависит только от транзакций, но на всякий случай
  queryClient.invalidateQueries({
    queryKey: queryKeys.statistics.all,
  });
}

/**
 * Инвалидирует все кеши, связанные с бюджетами
 * Вызывается после создания, обновления или удаления бюджета
 */
export function invalidateBudgetRelated(queryClient: QueryClient): void {
  // Инвалидируем все бюджеты
  queryClient.invalidateQueries({
    queryKey: queryKeys.budgets.all,
  });

  // Примечание: бюджеты могут влиять на статистику, но это зависит от реализации
  // Если бюджеты влияют на статистику, добавим инвалидацию здесь
}

/**
 * Инвалидирует все кеши приложения
 * Используется после полной синхронизации или критических изменений
 */
export function invalidateAll(queryClient: QueryClient): void {
  invalidateTransactionRelated(queryClient);
  invalidateCategoryRelated(queryClient);
  invalidateAccountRelated(queryClient);
  invalidateBudgetRelated(queryClient);

  // Инвалидируем курсы валют (на всякий случай, хотя они редко меняются)
  queryClient.invalidateQueries({
    queryKey: queryKeys.currency.rates(),
  });
}
