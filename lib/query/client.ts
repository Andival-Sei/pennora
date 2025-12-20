"use client";

import { QueryClient } from "@tanstack/react-query";

/**
 * Конфигурация QueryClient для React Query
 * Настройки оптимизированы для баланса между свежестью данных и производительностью
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Время, в течение которого данные считаются свежими (5 минут)
      // Пока данные свежие, React Query не будет делать повторные запросы
      staleTime: 5 * 60 * 1000, // 5 минут

      // Время жизни кеша после того, как данные стали stale (30 минут)
      // После этого времени данные будут удалены из кеша
      gcTime: 30 * 60 * 1000, // 30 минут (было cacheTime в v4)

      // Обновлять данные при возврате фокуса на вкладку
      refetchOnWindowFocus: true,

      // Обновлять данные при восстановлении сетевого соединения
      refetchOnReconnect: true,

      // Не обновлять при монтировании, если данные уже есть в кеше
      refetchOnMount: false,

      // Количество попыток повтора при ошибке
      retry: 2,

      // Интервал между попытками повтора (экспоненциальный backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Количество попыток повтора при ошибке мутации
      retry: 1,
    },
  },
});
