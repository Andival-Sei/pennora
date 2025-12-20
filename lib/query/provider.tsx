"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./client";
import { setupPersistCache } from "./persist";
import { syncManager } from "@/lib/sync/syncManager";
import { queueManager } from "@/lib/sync/queueManager";
import { useSyncStore } from "@/lib/stores/syncStore";
import type { ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Провайдер React Query для всего приложения
 * Обеспечивает доступ к QueryClient во всех компонентах
 * Настраивает персистентное кеширование и синхронизацию
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Настраиваем персистентное кеширование при монтировании
  useEffect(() => {
    setupPersistCache();
  }, []);

  // Инициализируем менеджер синхронизации
  useEffect(() => {
    syncManager.initialize();

    // Обновляем количество ожидающих операций периодически
    const updatePendingCount = async () => {
      const status = await queueManager.getStatus();
      useSyncStore
        .getState()
        .setPendingOperations(status.pending + status.failed);
    };

    // Обновляем сразу и затем каждые 30 секунд
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools только в режиме разработки */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
