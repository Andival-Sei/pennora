"use client";

import { QueryClient } from "@tanstack/react-query";
import {
  QUERY_STALE_TIME,
  QUERY_GC_TIME,
  QUERY_RETRY,
} from "@/lib/constants/query";

/**
 * Конфигурация QueryClient для React Query
 * Настройки оптимизированы для баланса между свежестью данных и производительностью
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Время, в течение которого данные считаются свежими
      // Пока данные свежие, React Query не будет делать повторные запросы
      staleTime: QUERY_STALE_TIME.DEFAULT,

      // Время жизни кеша после того, как данные стали stale
      // После этого времени данные будут удалены из кеша
      gcTime: QUERY_GC_TIME.DEFAULT,

      // Обновлять данные при возврате фокуса на вкладку
      refetchOnWindowFocus: true,

      // Обновлять данные при восстановлении сетевого соединения
      refetchOnReconnect: true,

      // Не обновлять при монтировании, если данные уже есть в кеше
      refetchOnMount: false,

      // Количество попыток повтора при ошибке
      retry: QUERY_RETRY.QUERIES,

      // Интервал между попытками повтора (экспоненциальный backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Количество попыток повтора при ошибке мутации
      retry: QUERY_RETRY.MUTATIONS,
    },
  },
});
