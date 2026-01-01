/**
 * Хелперы для QueryClient в тестах
 * Переиспользуются в тестах мутаций (accounts, categories, transactions)
 */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

/**
 * Создаёт QueryClient для тестов с отключённым retry и кешированием
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Мок-переводы для тестов мутаций
 */
export const mockMutationMessages = {
  common: {
    loading: "Загрузка...",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
  },
  errors: {
    unknown: "Произошла ошибка",
    mutations: {
      unauthorized: "Вы не авторизованы",
      forbidden: "У вас нет прав",
      notFound: "Не найдено",
    },
    network: {
      offline: "Нет подключения",
    },
  },
  accounts: {
    createSuccess: "Счёт создан",
    updateSuccess: "Счёт обновлён",
    deleteSuccess: "Счёт удалён",
    errors: {
      createFailed: "Не удалось создать счёт",
      updateFailed: "Не удалось обновить счёт",
      deleteFailed: "Не удалось удалить счёт",
    },
  },
  categories: {
    createSuccess: "Категория создана",
    updateSuccess: "Категория обновлена",
    deleteSuccess: "Категория удалена",
    errors: {
      createFailed: "Не удалось создать категорию",
      updateFailed: "Не удалось обновить категорию",
      deleteFailed: "Не удалось удалить категорию",
      cannotDeleteSystem: "Нельзя удалить системную категорию",
    },
  },
  transactions: {
    createSuccess: "Транзакция создана",
    updateSuccess: "Транзакция обновлена",
    deleteSuccess: "Транзакция удалена",
    pendingSync: "Операция будет выполнена при восстановлении сети",
    errors: {
      createFailed: "Не удалось создать транзакцию",
      updateFailed: "Не удалось обновить транзакцию",
      deleteFailed: "Не удалось удалить транзакцию",
    },
  },
};

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Создаёт wrapper с QueryClient и i18n для renderHook
 */
export function createQueryWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();

  function Wrapper({ children }: WrapperProps) {
    // Вложенный элемент с QueryClientProvider
    const queryProviderElement = React.createElement(
      QueryClientProvider,
      { client },
      children
    );
    // Обёртка с NextIntlClientProvider
    return React.createElement(
      NextIntlClientProvider,
      { locale: "ru", messages: mockMutationMessages },
      queryProviderElement
    );
  }

  return { Wrapper, queryClient: client };
}
