"use client";

import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { queryClient } from "./client";
import { indexedDBStorage } from "@/lib/db/indexeddb/persister";

/**
 * Настраивает персистентное кеширование для React Query
 * Сохраняет данные в IndexedDB для доступа между сессиями и офлайн-режима
 *
 * Преимущества IndexedDB над localStorage:
 * - Больший объем хранилища (~50MB vs 5-10MB)
 * - Поддержка нативных типов (Date, File)
 * - Лучшая производительность для больших данных
 * - Автоматический офлайн-режим через TanStack Query
 */
export function setupPersistCache() {
  // Создаем persister для IndexedDB
  const persister = createAsyncStoragePersister({
    storage: indexedDBStorage,
    key: "PENNORA_QUERY_CACHE",
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    throttleTime: 1000, // Задержка для батчинга операций записи
  });

  // Настраиваем персистентное кеширование
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    // Персистентность для категорий и транзакций
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        const queryKey = query.queryKey;
        if (!Array.isArray(queryKey)) return false;

        // Персистируем категории (редко меняются)
        if (queryKey[0] === "categories" && queryKey[1] === "list") {
          return true;
        }

        // Персистируем транзакции (для офлайн-доступа)
        if (queryKey[0] === "transactions") {
          // Персистируем списки транзакций (с фильтрами или без)
          return queryKey[1] === "list";
        }

        return false;
      },
    },
  });
}
