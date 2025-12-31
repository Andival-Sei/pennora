"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./client";
import { setupPersistCache } from "./persist";
import { syncManager } from "@/lib/sync/syncManager";
import { queueManager } from "@/lib/sync/queueManager";
import { useSyncStore } from "@/lib/stores/syncStore";
import { setUserContext, clearUserContext } from "@/lib/monitoring/sentry";
import { getClientUser } from "@/lib/db/supabase/auth-client";
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

  // Устанавливаем контекст пользователя в Sentry
  useEffect(() => {
    async function setupSentryUser() {
      try {
        const user = await getClientUser();
        if (user) {
          setUserContext({
            id: user.id,
            email: user.email || undefined,
            username: user.email || undefined,
          });
        } else {
          clearUserContext();
        }
      } catch (error) {
        // Игнорируем ошибки при получении пользователя (может быть не авторизован)
        console.debug("Failed to setup Sentry user context:", error);
      }
    }

    setupSentryUser();

    // Подписываемся на изменения аутентификации через события
    // Supabase автоматически обновляет сессию, поэтому мы периодически проверяем
    const interval = setInterval(setupSentryUser, 60000); // Проверяем каждую минуту

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
