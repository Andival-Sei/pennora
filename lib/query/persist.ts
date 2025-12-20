"use client";

import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { queryClient } from "./client";
import { queryKeys } from "./keys";

/**
 * Настраивает персистентное кеширование для React Query
 * Сохраняет данные в localStorage для доступа между сессиями
 */
export function setupPersistCache() {
  // Создаем persister для localStorage
  const persister = createSyncStoragePersister({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    key: "PENNORA_QUERY_CACHE",
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });

  // Настраиваем персистентное кеширование
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    // Персистентность только для определенных query keys
    // В данном случае для категорий (они редко меняются)
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        // Персистируем только категории
        const queryKey = query.queryKey;
        return (
          Array.isArray(queryKey) &&
          queryKey[0] === "categories" &&
          queryKey[1] === "list"
        );
      },
    },
  });
}
