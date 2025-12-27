/**
 * Централизованная фабрика query keys для типобезопасности
 * Используется для создания уникальных ключей кеша для каждого запроса
 */

export const queryKeys = {
  transactions: {
    all: ["transactions"] as const,
    lists: () => [...queryKeys.transactions.all, "list"] as const,
    list: (filters?: { month?: number; year?: number }) =>
      [...queryKeys.transactions.lists(), filters] as const,
    detail: (id: string) =>
      [...queryKeys.transactions.all, "detail", id] as const,
    availableMonths: () =>
      [...queryKeys.transactions.all, "availableMonths"] as const,
  },
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    tree: () => [...queryKeys.categories.all, "tree"] as const,
  },
  currency: {
    rates: () => ["currency", "rates"] as const,
  },
  accounts: {
    all: ["accounts"] as const,
    lists: () => [...queryKeys.accounts.all, "list"] as const,
    list: () => [...queryKeys.accounts.lists()] as const,
    detail: (id: string) => [...queryKeys.accounts.all, "detail", id] as const,
  },
  statistics: {
    all: ["statistics"] as const,
    monthly: (month?: number, year?: number) =>
      [...queryKeys.statistics.all, "monthly", month, year] as const,
  },
  budgets: {
    all: ["budgets"] as const,
    lists: () => [...queryKeys.budgets.all, "list"] as const,
    list: () => [...queryKeys.budgets.lists()] as const,
    detail: (id: string) => [...queryKeys.budgets.all, "detail", id] as const,
  },
} as const;
