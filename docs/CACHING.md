# Кеширование данных в Pennora

## Обзор

В проекте используется **TanStack Query v5** для управления серверным состоянием и кеширования данных. Это обеспечивает:

- Мгновенную загрузку данных при переходах между вкладками
- Оптимистичные обновления UI
- Автоматическую инвалидацию кеша при изменениях
- Персистентное кеширование критичных данных
- Фоновое обновление данных

## Архитектура кеширования

### Многоуровневая стратегия

```
┌─────────────────────────────────────┐
│  Клиентский кеш (TanStack Query)    │
│  - В памяти браузера                │
│  - Время жизни: 5-30 минут          │
│  - Все запросы к Supabase           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Персистентный кеш (localStorage)   │
│  - Сохранение между сессиями        │
│  - Только для категорий             │
│  - Время жизни: 24 часа              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Next.js Router Cache               │
│  - React Server Component payload   │
│  - Время жизни: 30 секунд            │
└─────────────────────────────────────┘
```

## Структура файлов

```
lib/
├── query/
│   ├── client.ts                 # Конфигурация QueryClient
│   ├── provider.tsx              # QueryClientProvider
│   ├── persist.ts                # Персистентное кеширование
│   ├── keys.ts                   # Query keys factory
│   ├── queries/                  # Query функции для чтения
│   │   ├── transactions.ts
│   │   ├── categories.ts
│   │   ├── currency.ts
│   │   └── accounts.ts
│   └── mutations/                # Mutation хуки для изменения
│       ├── transactions.ts
│       └── categories.ts
└── hooks/                        # Публичные хуки (обертки)
    ├── useTransactions.ts
    └── useCategories.ts
```

## Query Keys

Централизованная фабрика query keys обеспечивает типобезопасность и единообразие:

```typescript
// lib/query/keys.ts
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
    tree: () => [...queryKeys.categories.all, "tree"] as const,
  },
  // ...
};
```

## Стратегии кеширования по типам данных

### Транзакции (Transactions)

**Настройки:**

- `staleTime`: 2 минуты (данные часто меняются)
- `gcTime`: 15 минут
- `refetchOnWindowFocus`: true
- `refetchOnMount`: false

**Особенности:**

- Кеширование по фильтрам (месяц/год)
- Инвалидация при создании/обновлении/удалении
- Оптимистичные обновления для мгновенного UI

**Использование:**

```typescript
const { data: transactions, isLoading } = useQuery({
  queryKey: queryKeys.transactions.list(filters),
  queryFn: () => fetchTransactions(filters),
});
```

### Категории (Categories)

**Настройки:**

- `staleTime`: 10 минут (данные редко меняются)
- `gcTime`: 24 часа
- `persist: true` (персистентное кеширование)
- `refetchOnMount`: false

**Особенности:**

- Персистентное кеширование в localStorage
- Доступны офлайн после первой загрузки
- Инвалидация при изменении структуры

**Использование:**

```typescript
const { categories, loading } = useCategories();
// Данные автоматически кешируются и персистируются
```

### Курсы валют (Currency Rates)

**Настройки:**

- `staleTime`: 1 час
- `gcTime`: 24 часа
- `refetchOnMount`: false

**Особенности:**

- Интеграция с существующим кешем из `lib/currency/rates.ts`
- Обновление раз в час
- Fallback при ошибке API

### Счета (Accounts)

**Настройки:**

- `staleTime`: 10 минут
- `gcTime`: 30 минут
- `refetchOnMount`: false

## Оптимистичные обновления

При мутациях (создание, обновление, удаление) UI обновляется мгновенно, до получения ответа от сервера:

```typescript
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onMutate: async (newTransaction) => {
      // 1. Отменяем исходящие запросы
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.lists() });

      // 2. Сохраняем предыдущее состояние
      const previousQueries = queryClient.getQueriesData({ ... });

      // 3. Оптимистично обновляем UI
      queryClient.setQueriesData(/* обновляем кеш */);

      return { previousQueries };
    },
    onError: (err, newTransaction, context) => {
      // 4. Откатываем при ошибке
      if (context?.previousQueries) {
        // Восстанавливаем предыдущее состояние
      }
    },
    onSettled: () => {
      // 5. Инвалидируем кеш для обновления данных
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
    },
  });
}
```

## Инвалидация кеша

Кеш автоматически инвалидируется при мутациях:

### После создания транзакции:

```typescript
queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
queryClient.invalidateQueries({
  queryKey: queryKeys.transactions.availableMonths(),
});
```

### После изменения категории:

```typescript
queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
```

## Персистентное кеширование

Категории сохраняются в localStorage для доступа между сессиями:

```typescript
// lib/query/persist.ts
persistQueryClient({
  queryClient,
  persister: createSyncStoragePersister({
    storage: window.localStorage,
    key: "PENNORA_QUERY_CACHE",
  }),
  maxAge: 24 * 60 * 60 * 1000, // 24 часа
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Персистируем только категории
      return query.queryKey[0] === "categories";
    },
  },
});
```

## Правила использования

### Когда добавлять кеширование

**Обязательно кешировать:**

- ✅ Данные, которые загружаются при переходах между вкладками
- ✅ Данные, которые используются в нескольких компонентах
- ✅ Данные, которые редко меняются (категории, настройки)
- ✅ Данные, которые нужны для офлайн-доступа

**Не кешировать:**

- ❌ Временные данные (токены, сессии)
- ❌ Данные, которые должны быть всегда свежими (текущий баланс)
- ❌ Большие объемы данных, которые редко используются

### Как добавить кеширование для новых данных

1. **Создать query функцию:**

```typescript
// lib/query/queries/newData.ts
export async function fetchNewData(): Promise<NewData[]> {
  const supabase = createClient();
  // ... логика загрузки
  return data;
}
```

2. **Добавить query key:**

```typescript
// lib/query/keys.ts
export const queryKeys = {
  // ...
  newData: {
    all: ["newData"] as const,
    list: () => [...queryKeys.newData.all, "list"] as const,
  },
};
```

3. **Использовать в компоненте:**

```typescript
const { data, isLoading } = useQuery({
  queryKey: queryKeys.newData.list(),
  queryFn: fetchNewData,
  staleTime: 5 * 60 * 1000, // Настроить под тип данных
});
```

4. **Создать mutation (если нужны изменения):**

```typescript
// lib/query/mutations/newData.ts
export function useCreateNewData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNewData,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.newData.all });
    },
  });
}
```

## Конфигурация QueryClient

```typescript
// lib/query/client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 30 * 60 * 1000, // 30 минут
      refetchOnWindowFocus: true, // Обновление при фокусе
      refetchOnReconnect: true, // Обновление при восстановлении сети
      refetchOnMount: false, // Использовать кеш если есть
      retry: 2, // 2 попытки при ошибке
    },
    mutations: {
      retry: 1,
    },
  },
});
```

## Интеграция с компонентами

### Использование хуков (рекомендуется)

```typescript
// Простое использование
const { categories, loading } = useCategories();
const { transactions } = useTransactions();

// С фильтрами
const { data: transactions } = useQuery({
  queryKey: queryKeys.transactions.list({ month: 11, year: 2024 }),
  queryFn: () => fetchTransactions({ month: 11, year: 2024 }),
});
```

### Прямое использование React Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchData } from "@/lib/query/queries/data";

const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.data.list(),
  queryFn: fetchData,
});
```

## Отладка

### React Query Devtools

В режиме разработки доступны Devtools для отладки кеша:

- Просмотр всех queries и их состояния
- Инвалидация кеша вручную
- Просмотр данных в кеше
- Мониторинг сетевых запросов

Открываются через кнопку в левом нижнем углу (только в development).

### Проверка кеша в консоли

```typescript
import { queryClient } from "@/lib/query/client";

// Получить данные из кеша
const cachedData = queryClient.getQueryData(queryKeys.categories.list());

// Инвалидировать кеш вручную
queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
```

## Производительность

### Метрики

- **Время загрузки при переходах**: < 100ms (из кеша)
- **Снижение запросов к Supabase**: 60-80%
- **Улучшение UX**: Мгновенный отклик при навигации

### Оптимизация

1. **Настройка staleTime** под частоту изменений данных
2. **Персистентность** только для критичных данных
3. **Инвалидация** только необходимых query keys
4. **Оптимистичные обновления** для мгновенного UI

## Troubleshooting

### Данные не обновляются

1. Проверить инвалидацию кеша в mutation
2. Проверить `staleTime` - возможно данные еще свежие
3. Использовать `refetch()` для принудительного обновления

### Кеш не работает между вкладками

1. Убедиться, что `QueryProvider` обернут вокруг всего приложения
2. Проверить, что используется один и тот же `queryClient`

### Персистентный кеш не сохраняется

1. Проверить, что `setupPersistCache()` вызывается
2. Проверить `shouldDehydrateQuery` в конфигурации
3. Проверить localStorage в DevTools

## Дополнительные ресурсы

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- Внутренняя документация: `lib/query/` - исходный код реализации
