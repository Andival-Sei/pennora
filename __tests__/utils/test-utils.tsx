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
    mutations: {
      unauthorized: "Вы не авторизованы",
      forbidden: "У вас нет прав для выполнения этого действия",
      notFound: "Запись не найдена",
      conflict: "Конфликт данных. Возможно, запись была изменена",
    },
    network: {
      offline: "Нет подключения к интернету",
      timeout: "Превышено время ожидания",
      failed: "Не удалось выполнить запрос",
    },
  },
  settings: {
    title: "Настройки",
    profile: {
      title: "Профиль",
      description: "Управление данными вашего аккаунта",
      emailHint: "Email нельзя изменить",
      save: "Сохранить",
      success: "Профиль успешно обновлён",
    },
    password: {
      title: "Пароль",
      description: "Изменить пароль для входа",
      current: "Текущий пароль",
      new: "Новый пароль",
      confirm: "Подтвердите пароль",
      save: "Изменить пароль",
      success: "Пароль успешно изменён",
    },
    emailChange: {
      title: "Изменение email",
      description: "Изменить адрес электронной почты",
      newEmail: "Новый email",
      code: "Код подтверждения",
      codeHint: "Введите 6-значный код, отправленный на новый email",
      confirm: "Подтвердить",
      sendCode: "Отправить код",
      success: "Email успешно изменён",
    },
    account: {
      title: "Настройки аккаунта",
      deleteAccount: {
        title: "Удалить аккаунт",
        description:
          "Это действие нельзя отменить. Все ваши данные будут безвозвратно удалены.",
        confirm: "Удалить аккаунт",
        button: "Удалить аккаунт",
      },
    },
    app: {
      title: "Настройки приложения",
      theme: {
        description: "Выберите тему оформления интерфейса",
      },
      language: {
        description: "Выберите язык интерфейса",
      },
      currency: {
        title: "Валюта отображения",
        description: "Выберите валюту для отображения балансов",
      },
      success: "Настройки успешно сохранены",
      logoutDescription: "Выйти из аккаунта",
    },
    connections: {
      title: "Связанные аккаунты",
      description: "Управление способами входа",
      googleLinked: "Аккаунт привязан",
      googleNotLinked: "Аккаунт не привязан",
      link: "Привязать",
      unlink: "Отвязать",
    },
    theme: {
      title: "Тема оформления",
      light: "Светлая",
      dark: "Тёмная",
      system: "Системная",
    },
    language: {
      title: "Язык",
      ru: "Русский",
      en: "English",
    },
  },
  auth: {
    email: "Email",
    password: "Пароль",
    displayName: "Имя",
    loading: "Загрузка...",
    backToHome: "На главную",
    orContinueWith: "или",
    continueWithGoogle: "Продолжить с Google",
    login: {
      title: "Вход",
      subtitle: "Войдите в свой аккаунт",
      submit: "Войти",
      noAccount: "Нет аккаунта?",
      registerLink: "Зарегистрироваться",
    },
    register: {
      title: "Регистрация",
      subtitle: "Создайте новый аккаунт",
      submit: "Создать аккаунт",
      hasAccount: "Уже есть аккаунт?",
      loginLink: "Войти",
      emailConfirmation: {
        title: "Проверьте вашу почту",
        message:
          "Мы отправили письмо с подтверждением на {email}. Пожалуйста, проверьте почту и перейдите по ссылке для подтверждения email.",
        note: "Примечание: Сейчас вы можете войти в аккаунт без подтверждения email.",
        resendButton: "Отправить письмо повторно",
        resendSuccess: "Письмо отправлено повторно",
        backToLogin: "Вернуться к входу",
      },
    },
    placeholders: {
      displayName: "Иван Иванов",
    },
    validation: {
      displayName: {
        min: "Имя должно содержать минимум 2 символа",
        max: "Имя не должно превышать 50 символов",
      },
      email: {
        required: "Введите email",
        invalid: "Введите корректный email",
      },
      password: {
        required: "Введите пароль",
        min: "Пароль должен содержать минимум 8 символов",
        latinOnly: "Пароль должен содержать только латинские буквы",
        uppercase: "Пароль должен содержать заглавную букву",
        lowercase: "Пароль должен содержать строчную букву",
        number: "Пароль должен содержать цифру",
        mismatch: "Пароли не совпадают",
      },
    },
    passwordStrength: {
      weak: "Слабый пароль",
      fair: "Средний пароль",
      good: "Хороший пароль",
      strong: "Надёжный пароль",
    },
    passwordRequirements: {
      latinOnly: "Только латинские буквы",
      minLength: "Минимум 8 символов",
      hasUppercase: "Заглавная буква (A-Z)",
      hasLowercase: "Строчная буква (a-z)",
      hasNumber: "Цифра",
    },
  },
  onboarding: {
    title: "Добро пожаловать",
    subtitle: "Настройте ваш аккаунт",
    finish: "Завершить",
    currency: {
      title: "Выбор валюты",
      description: "Выберите основную валюту для ваших счетов",
      required: "Выберите валюту",
      options: {
        RUB: { name: "Российский рубль" },
        USD: { name: "Доллар США" },
        EUR: { name: "Евро" },
      },
    },
    card: {
      title: "Дебетовая карта",
      description: "Добавьте основную дебетовую карту",
      bankLabel: "Банк",
      bankPlaceholder: "Выберите банк",
      nameLabel: "Название карты",
      namePlaceholder: "Моя карта",
      balanceLabel: "Текущий баланс",
      bankRequired: "Выберите банк",
      nameRequired: "Введите название карты",
      balanceInvalid: "Введите корректную сумму",
      banks: {
        sberbank: "Сбербанк",
        vtb: "ВТБ",
        tinkoff: "Тинькофф",
        alpha: "Альфа-Банк",
        ozon: "Озон Банк",
        yandex: "Яндекс Банк",
        other: "Другой",
      },
    },
    cash: {
      title: "Наличные",
      description: "Добавьте счёт для наличных",
      balanceLabel: "Текущий баланс",
      balanceInvalid: "Введите корректную сумму",
      defaultName: "Наличные",
    },
  },
  categories: {
    title: "Категории",
    description: "Организуйте доходы и расходы с помощью категорий",
    add: "Добавить категорию",
    addFirst: "Добавить первую категорию",
    edit: "Редактировать категорию",
    delete: "Удалить категорию",
    deleteTitle: "Удалить категорию",
    deleteDescription:
      'Вы уверены, что хотите удалить категорию "{name}"? Это действие нельзя отменить.',
    deleteConfirm: 'Вы уверены, что хотите удалить категорию "{name}"?',
    income: "Доходы",
    expense: "Расходы",
    name: "Название",
    namePlaceholder: "Введите название категории",
    nameRequired: "Название категории обязательно",
    nameMaxLength: "Название категории не должно превышать 50 символов",
    type: "Тип",
    parent: "Родительская категория",
    noParent: "Нет родителя (верхний уровень)",
    icon: "Иконка",
    noIcon: "Нет",
    color: "Цвет",
    noColor: "По умолчанию",
    empty: "Категорий пока нет",
    emptyDescription:
      "Создайте первую категорию, чтобы начать организовывать свои финансы",
    addDescription: "Создайте новую категорию для доходов или расходов",
    editDescription: "Обновите информацию о категории",
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
    title: "Транзакции",
    add: "Добавить",
    createTitle: "Создать транзакцию",
    editTitle: "Редактировать транзакцию",
    loading: "Загрузка...",
    noTransactions: "Транзакций пока нет",
    deleteConfirm: "Вы уверены, что хотите удалить эту транзакцию?",
    uncategorized: "Без категории",
    list: {
      date: "Дата",
      category: "Категория",
      description: "Описание",
      amount: "Сумма",
      transferFrom: "С",
      transferTo: "На",
    },
    actions: {
      edit: "Редактировать",
      delete: "Удалить",
    },
    form: {
      type: "Тип",
      types: {
        income: "Доход",
        expense: "Расход",
        transfer: "Перевод",
      },
      amount: "Сумма",
      account: "Счёт",
      accountPlaceholder: "Выберите счёт",
      category: "Категория",
      date: "Дата",
      datePlaceholder: "Выберите дату",
      description: "Описание",
      descriptionPlaceholder: "Введите описание транзакции (необязательно)",
      create: "Создать",
      update: "Обновить",
      none: "Нет",
      toAccount: "На счёт",
      toAccountPlaceholder: "Выберите целевой счёт",
      toAccountError: "Выберите целевой счёт",
      toAccountSameError: "Целевой счёт должен отличаться от исходного",
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
