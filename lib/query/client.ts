"use client";

import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import {
  QUERY_STALE_TIME,
  QUERY_GC_TIME,
  QUERY_RETRY,
} from "@/lib/constants/query";
import { captureError } from "@/lib/monitoring/sentry";
import { isNetworkError } from "@/lib/utils/network";

/**
 * Конфигурация QueryClient для React Query
 * Настройки оптимизированы для баланса между свежестью данных и производительностью
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Не отправляем сетевые ошибки (ожидаемые в офлайн-режиме)
      if (isNetworkError(error)) {
        return;
      }

      captureError(error, {
        extra: {
          queryKey: query.queryKey,
          queryHash: query.queryHash,
        },
        tags: {
          errorType: "react-query-query",
        },
        contexts: {
          query: {
            key: query.queryKey,
            hash: query.queryHash,
            state: query.state.status,
          },
        },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Не отправляем сетевые ошибки (ожидаемые в офлайн-режиме)
      if (isNetworkError(error)) {
        return;
      }

      captureError(error, {
        extra: {
          mutationKey: mutation.options.mutationKey,
        },
        tags: {
          errorType: "react-query-mutation",
        },
        contexts: {
          mutation: {
            key: mutation.options.mutationKey,
          },
        },
      });
    },
  }),
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
