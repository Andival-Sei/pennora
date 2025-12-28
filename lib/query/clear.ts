"use client";

import { queryClient } from "./client";
import { indexedDBStorage } from "@/lib/db/indexeddb/persister";

/**
 * Полностью очищает все кэши приложения
 * Удаляет данные из QueryClient (синхронно) и IndexedDB (асинхронно)
 * Используется при выходе из аккаунта для предотвращения показа данных предыдущего пользователя
 */
export function clearAllCache(): void {
  // Очищаем все запросы из QueryClient (синхронно, чтобы данные не показывались при следующем рендере)
  queryClient.clear();

  // Очищаем персистентный кэш из IndexedDB (асинхронно, не ждем выполнения)
  // Это не критично, так как при следующем входе данные будут перезаписаны новыми
  indexedDBStorage.clear().catch((error) => {
    console.error("Ошибка при очистке IndexedDB кэша:", error);
  });
}
