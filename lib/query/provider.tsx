"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./client";
import { setupPersistCache } from "./persist";
import type { ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Провайдер React Query для всего приложения
 * Обеспечивает доступ к QueryClient во всех компонентах
 * Настраивает персистентное кеширование для категорий
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Настраиваем персистентное кеширование при монтировании
  useEffect(() => {
    setupPersistCache();
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
