import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/providers/theme-provider";

// Мок-переводы для тестов (возвращаем ключ как значение)
const mockMessages = {
  common: {
    appName: "Pennora",
    loading: "Загрузка...",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Редактировать",
    add: "Добавить",
    search: "Поиск",
    settings: "Настройки",
    next: "Далее",
    skip: "Пропустить",
    back: "Назад",
    retry: "Повторить попытку",
    backToHome: "На главную",
  },
  errors: {
    invalidCredentials: "Неверный email или пароль",
    emailNotConfirmed: "Email не подтверждён",
    userAlreadyExists: "Пользователь с таким email уже существует",
    passwordTooShort: "Пароль должен содержать минимум 6 символов",
    invalidEmail: "Некорректный формат email",
    passwordRequired: "Введите пароль",
    rateLimitExceeded: "Слишком много попыток",
    databaseError: "Ошибка сервера",
    networkError: "Ошибка сети",
    unknown: "Произошла ошибка",
    validation: {
      transactions: {
        amountMin: "Сумма должна быть больше 0",
        accountRequired: "Выберите счет",
        toAccountDifferent: "Целевой счёт должен отличаться от исходного",
      },
    },
  },
  categories: {
    nameRequired: "Название категории обязательно",
    nameMaxLength: "Название категории не должно превышать 50 символов",
  },
  card: {
    bankRequired: "Название банка обязательно",
    nameRequired: "Название карты обязательно",
    balanceInvalid: "Неверный формат баланса",
  },
  cash: {
    balanceInvalid: "Неверный формат баланса",
  },
  transactions: {
    form: {
      type: "Тип",
      amount: "Сумма",
      account: "Счёт",
      category: "Категория",
      date: "Дата",
      description: "Описание",
      create: "Создать",
      update: "Обновить",
    },
  },
};

/**
 * Создаёт новый QueryClient для каждого теста (изоляция тестов)
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Отключаем повторные попытки в тестах
        gcTime: 0, // Отключаем кеширование для тестов
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  locale?: string;
  messages?: typeof mockMessages;
}

/**
 * Обёртка со всеми провайдерами для тестов
 */
function AllTheProviders({
  children,
  queryClient = createTestQueryClient(),
  locale = "ru",
  messages = mockMessages,
}: AllTheProvidersProps) {
  return (
    <ThemeProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  locale?: string;
  messages?: typeof mockMessages;
}

/**
 * Кастомная функция render с провайдерами
 * Используйте её вместо стандартного render из @testing-library/react
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />);
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    locale = "ru",
    messages = mockMessages,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AllTheProviders
        queryClient={queryClient}
        locale={locale}
        messages={messages}
      >
        {children}
      </AllTheProviders>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient, // Возвращаем queryClient для возможности инвалидации кеша в тестах
  };
}

// Реэкспорт всех утилит из @testing-library/react
export * from "@testing-library/react";

// Экспорт userEvent
export { default as userEvent } from "@testing-library/user-event";
