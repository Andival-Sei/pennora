# Архитектура проекта Pennora

## Обзор

Pennora — это приложение для учёта личного и семейного бюджета, построенное на Next.js 16 с App Router. Проект поддерживает офлайн-режим, синхронизацию данных и мультивалютность.

## Структура проекта

```
pennora/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route Group для аутентификации
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── callback/
│   │   │   └── route.ts
│   │   └── actions.ts
│   ├── (main)/                   # Route Group для основного приложения
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Главная страница дашборда
│   │   │   ├── transactions/     # Все транзакции
│   │   │   ├── categories/       # Все категории
│   │   │   ├── budgets/          # Список всех бюджетов
│   │   │   ├── settings/         # Настройки
│   │   │   │   ├── currencies/   # Настройки валют
│   │   │   │   └── profile/      # Профиль пользователя
│   │   │   ├── onboarding/       # Онбординг для новых пользователей
│   │   │   ├── actions.ts
│   │   │   └── reset-button.tsx
│   │   ├── budgets/
│   │   │   └── [id]/             # Детальная страница бюджета
│   │   │       ├── page.tsx
│   │   │       ├── transactions/ # Транзакции конкретного бюджета
│   │   │       ├── categories/   # Категории конкретного бюджета
│   │   │       └── members/      # Участники бюджета
│   │   └── layout.tsx            # Layout для основного приложения
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Главная страница (landing)
│
├── components/
│   ├── ui/                       # shadcn/ui компоненты
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── features/                 # Функциональные компоненты по доменам
│   │   ├── budgets/
│   │   │   ├── BudgetCard.tsx
│   │   │   ├── BudgetForm.tsx
│   │   │   └── BudgetMembers.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── TransactionFilters.tsx
│   │   │   ├── ReceiptInputDialog.tsx  # Диалог выбора метода ввода чека
│   │   │   ├── ReceiptUploader.tsx     # Компонент загрузки файлов
│   │   │   └── ReceiptCamera.tsx       # Компонент камеры
│   │   ├── categories/
│   │   ├── currency/
│   │   │   ├── CurrencySelector.tsx
│   │   │   └── CurrencyConverter.tsx
│   │   └── sync/
│   │       └── SyncStatus.tsx     # Компонент статуса синхронизации
│   ├── layouts/                  # Layout компоненты
│   │   ├── MainLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── layout/                   # Вспомогательные layout компоненты
│   ├── navigation/                # Навигация
│   │   └── bottom-nav.tsx
│   └── motion/                   # Анимации
│
├── lib/
│   ├── db/                       # Работа с базами данных
│   │   ├── supabase/            # Supabase клиент и типы
│   │   │   ├── client.ts        # Браузерный клиент
│   │   │   ├── server.ts        # Серверный клиент
│   │   │   └── types.ts         # TypeScript типы из Supabase
│   │   ├── indexeddb/           # IndexedDB через Dexie
│   │   │   ├── persister.ts     # Адаптер для TanStack Query
│   │   │   ├── database.ts      # База данных для очереди синхронизации
│   │   │   └── models.ts        # Типы для очереди операций
│   │   └── rxdb/                # RxDB (TODO, если понадобится)
│   ├── services/                # Слой сервисов (бизнес-логика)
│   │   ├── transactions/        # Сервисы для транзакций
│   │   │   ├── transaction.service.ts  # Бизнес-логика транзакций
│   │   │   └── index.ts
│   │   ├── accounts/            # Сервисы для счетов
│   │   │   ├── account.service.ts      # Бизнес-логика счетов
│   │   │   └── index.ts
│   │   └── index.ts             # Экспорт всех сервисов
│   ├── receipt/                 # Обработка чеков
│   │   ├── processor.ts         # Главный процессор чеков
│   │   ├── ocr.ts               # OCR обработка (Tesseract.js, pdfjs-dist)
│   │   ├── qr-reader.ts         # Чтение QR-кодов
│   │   ├── parser.ts            # Парсинг текста чеков
│   │   ├── email-parser.ts      # Обработка EML файлов
│   │   ├── category-matcher.ts  # Сопоставление категорий
│   │   └── types.ts             # Типы для чеков
│   ├── query/                    # TanStack Query (кеширование)
│   │   ├── client.ts            # Конфигурация QueryClient
│   │   ├── provider.tsx         # QueryClientProvider
│   │   ├── persist.ts          # Персистентное кеширование
│   │   ├── keys.ts              # Query keys factory
│   │   ├── queries/             # Query функции для чтения
│   │   │   ├── transactions.ts
│   │   │   ├── categories.ts
│   │   │   ├── currency.ts
│   │   │   └── accounts.ts
│   │   └── mutations/           # Mutation хуки для изменения
│   │       ├── transactions.ts
│   │       └── categories.ts
│   ├── hooks/                    # Переиспользуемые React хуки
│   │   ├── useSync.ts
│   │   ├── useTransactions.ts   # Использует TanStack Query
│   │   ├── useCategories.ts     # Использует TanStack Query
│   │   ├── useBudgets.ts
│   │   └── useCurrency.ts
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts
│   │   ├── syncStore.ts
│   │   └── uiStore.ts
│   ├── sync/                     # Логика синхронизации
│   │   ├── syncManager.ts        # Менеджер синхронизации
│   │   └── queueManager.ts       # Менеджер очереди операций
│   ├── currency/                 # Работа с валютами
│   │   ├── converter.ts
│   │   ├── rates.ts
│   │   └── formatter.ts
│   ├── types/                    # TypeScript типы
│   │   ├── budget.ts
│   │   ├── transaction.ts
│   │   ├── currency.ts
│   │   └── sync.ts
│   ├── utils/                    # Утилиты
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   ├── network.ts            # Утилиты для работы с сетью
│   │   ├── errorHandler.ts       # Унифицированная обработка ошибок (Supabase, Auth, сетевые)
│   │   └── index.ts              # Общие утилиты (cn, etc.)
│   ├── validations/              # Схемы валидации
│   │   ├── auth.ts              # Схемы валидации для аутентификации
│   │   ├── transactions.ts      # Схемы валидации для транзакций
│   │   ├── categories.ts        # Схемы валидации для категорий
│   │   └── accounts.ts          # Схемы валидации для счетов
│   └── supabase/                 # Реэкспорты для обратной совместимости
│       ├── client.ts
│       ├── server.ts
│       └── types.ts
│
├── supabase/
│   ├── migrations/              # SQL миграции
│   ├── functions/               # Edge Functions (опционально)
│   └── seed.sql                 # Начальные данные (валюты)
│
├── public/
│   ├── icons/                   # PWA иконки (192x192, 512x512, apple-touch-icon)
│   └── sw.js                    # Service Worker (Workbox CDN)
│
├── messages/                    # Переводы (next-intl)
│   ├── en.json
│   └── ru.json
│
├── providers/                   # React провайдеры
│   └── theme-provider.tsx
│
├── i18n/                        # Интернационализация
│   ├── actions.ts
│   └── request.ts
│
├── middleware.ts                # Next.js middleware (защита роутов)
├── capacitor.config.ts          # Конфигурация Capacitor для мобильного приложения
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Route Groups

Проект использует Next.js Route Groups для организации маршрутов:

### `(auth)` — Аутентификация

- **URL не включает** `(auth)` в путь
- Маршруты: `/login`, `/register`, `/callback`
- Используется для страниц входа и регистрации

### `(main)` — Основное приложение

- **URL не включает** `(main)` в путь
- Все маршруты защищены middleware
- Имеет общий layout с навигацией

## Маршруты приложения

### Публичные маршруты

- `/` — Landing страница
- `/login` — Вход
- `/register` — Регистрация
- `/callback` — Callback для OAuth

### Защищённые маршруты (требуют авторизации)

#### Дашборд

- `/dashboard` — Главная страница с балансами
- `/dashboard/transactions` — Все транзакции
- `/dashboard/categories` — Все категории
- `/dashboard/budgets` — Список всех бюджетов
- `/dashboard/settings` — Настройки
- `/dashboard/settings/currencies` — Настройки валют
- `/dashboard/settings/profile` — Профиль пользователя
- `/dashboard/onboarding` — Онбординг для новых пользователей

#### Бюджеты

- `/budgets/[id]` — Детальная страница бюджета
- `/budgets/[id]/transactions` — Транзакции конкретного бюджета
- `/budgets/[id]/categories` — Категории конкретного бюджета
- `/budgets/[id]/members` — Участники бюджета

## Компоненты

### Структура компонентов

1. **`components/ui/`** — Базовые UI компоненты из shadcn/ui
2. **`components/features/`** — Функциональные компоненты, сгруппированные по доменам
3. **`components/layouts/`** — Layout компоненты для страниц
4. **`components/navigation/`** — Компоненты навигации
5. **`components/motion/`** — Компоненты анимаций

### Принципы организации компонентов

- **По доменам**: Компоненты группируются по функциональным доменам (budgets, transactions, etc.)
- **Переиспользование**: Общие компоненты в `ui/` и `layout/`
- **Изоляция**: Каждый домен имеет свои компоненты

## Работа с данными

### Кеширование (TanStack Query)

- **Документация**: [`docs/CACHING.md`](./CACHING.md) — подробное описание системы кеширования
- **Конфигурация**: `lib/query/client.ts` — настройки QueryClient
- **Константы**: `lib/constants/query.ts` — централизованные константы для staleTime, gcTime, retry
- **Провайдер**: `lib/query/provider.tsx` — QueryClientProvider для всего приложения
- **Query функции**: `lib/query/queries/` — функции для загрузки данных
- **Mutation функции**: `lib/query/mutations/` — функции для изменения данных с оптимистичными обновлениями
- **Query Keys**: `lib/query/keys.ts` — централизованная фабрика ключей кеша
- **Персистентность**: `lib/query/persist.ts` — персистентное кеширование в IndexedDB

**Основные принципы:**

- Все данные из Supabase кешируются через TanStack Query
- Оптимистичные обновления для мгновенного UI
- Автоматическая инвалидация кеша при мутациях
- Персистентное кеширование в IndexedDB для категорий и транзакций
- Офлайн-режим для чтения данных через IndexedDB persister

### Supabase (основная БД)

- **Клиент**: `lib/db/supabase/client.ts` (браузер) и `server.ts` (сервер)
- **Типы**: Автоматически генерируются из схемы БД в `lib/db/supabase/types.ts`
- **Утилиты авторизации**: `lib/db/supabase/auth.ts` - кеширование пользователя, получение авторизованного пользователя
- **Централизованные утилиты**: `lib/db/supabase/utils.ts` - создание клиентов, батчинг запросов
- **Кеширование**: Все запросы к Supabase кешируются через TanStack Query
- **Оптимизация запросов**: Использование конкретных полей вместо `*` для лучшей производительности
- **Кеширование пользователя**: Использование React cache для серверных компонентов

#### Утилиты для работы с Supabase

- `getCachedUser()` - Кеширует пользователя для серверных компонентов (React cache)
- `getAuthenticatedUser()` - Получает пользователя с проверкой авторизации
- `getClientUser()` - Получает пользователя для клиентских компонентов
- `createAuthenticatedClient()` - Создает клиент с предварительной проверкой авторизации
- `batchQueries()` - Выполняет несколько запросов параллельно

### IndexedDB (офлайн-режим)

- **Реализовано**: Использование Dexie для работы с IndexedDB
- **Структура**: `lib/db/indexeddb/`
  - `persister.ts` — адаптер для TanStack Query persister
  - `database.ts` — база данных Dexie для очереди синхронизации
  - `models.ts` — типы для очереди операций
- **Интеграция**: Работает совместно с TanStack Query для офлайн-доступа
- **Документация**: [`docs/OFFLINE_SYNC.md`](./OFFLINE_SYNC.md) — подробное описание офлайн-режима

### Синхронизация

- **Менеджер**: `lib/sync/syncManager.ts` — основной менеджер синхронизации
- **Очередь операций**: `lib/sync/queueManager.ts` — управление очередью операций
- **Store**: `lib/stores/syncStore.ts` — Zustand store для состояния синхронизации
- **Инвалидация кеша**: Автоматическая инвалидация TanStack Query при синхронизации
- **Документация**: [`docs/OFFLINE_SYNC.md`](./OFFLINE_SYNC.md) — подробное описание синхронизации

## State Management

### TanStack Query (Серверное состояние)

- **Назначение**: Кеширование и управление серверным состоянием
- **Документация**: [`docs/CACHING.md`](./CACHING.md)
- **Использование**: Все данные из Supabase кешируются через TanStack Query
- **Особенности**:
  - Автоматическое кеширование при переходах между вкладками
  - Оптимистичные обновления для мгновенного UI
  - Автоматическая инвалидация кеша при мутациях
  - Персистентное кеширование для категорий

### Zustand Stores (Клиентское состояние)

- **`authStore.ts`** — Состояние аутентификации
- **`syncStore.ts`** — Состояние синхронизации
- **`uiStore.ts`** — UI состояние (модалки, сайдбары и т.д.)

### React Hooks

- **`useTransactions`** — Работа с транзакциями (использует TanStack Query)
- **`useCategories`** — Работа с категориями (использует TanStack Query)
- **`useBudgets`** — Работа с бюджетами
- **`useCurrency`** — Работа с валютами
- **`useSync`** — Синхронизация данных

## Интернационализация

- **Библиотека**: next-intl
- **Файлы переводов**: `messages/en.json`, `messages/ru.json`
- **Конфигурация**: `i18n/`

## PWA и мобильное приложение

### PWA

- **Манифест**: `app/manifest.ts` (встроенная поддержка Next.js 16)
- **Service Worker**: `public/sw.js` (Workbox CDN, ручная реализация)
- **Иконки**: `public/icons/` (192x192, 512x512, apple-touch-icon)
- **Регистрация**: `app/components/service-worker-register.tsx`

**Подход:**

- Используется официальная документация Next.js 16
- Workbox через CDN (не требует webpack)
- Работает с Turbopack
- Интегрировано с существующей оффлайн-синхронизацией через IndexedDB

### Capacitor

- **Конфигурация**: `capacitor.config.ts`
- **Планируется**: Поддержка iOS и Android

## Middleware

Файл `middleware.ts` защищает маршруты:

- Проверяет авторизацию для защищённых роутов
- Редиректит авторизованных пользователей со страниц входа
- Настраивает Supabase клиент для работы с cookies

## Миграции и база данных

- **Миграции**: `supabase/migrations/`
- **Seed данные**: `supabase/seed.sql`
- **Документация БД**: `docs/DATABASE.md`

## Слой сервисов

Слой сервисов (`lib/services/`) содержит бизнес-логику приложения, вынесенную из компонентов и хуков. Это улучшает тестируемость, переиспользование и поддержку кода.

### Структура

- **`lib/services/transactions/`** — сервисы для работы с транзакциями
  - `transaction.service.ts` — основная бизнес-логика (форматирование дат, преобразование данных, фильтрация счетов)
- **`lib/services/accounts/`** — сервисы для работы со счетами
  - `account.service.ts` — бизнес-логика счетов (создание, валидация)

### Принципы

- **Чистые функции**: Сервисы не имеют side effects (кроме работы с данными)
- **Тестируемость**: Легко покрываются unit тестами
- **Переиспользование**: Используются в компонентах, хуках и других сервисах
- **Независимость от React**: Сервисы не зависят от React, их можно использовать в любой части приложения

### Пример использования

```typescript
import { TransactionService } from "@/lib/services/transactions";

// Преобразование данных формы в TransactionInsert
const transactionData = TransactionService.prepareTransactionData(
  formValues,
  accounts,
  userId
);

// Получение доступных счетов для перевода
const availableAccounts = TransactionService.getAvailableToAccounts(
  accounts,
  sourceAccountId
);
```

## Валидационные схемы

Валидационные схемы (`lib/validations/`) централизованы и используют фабрики для поддержки переводов.

### Структура

- **`lib/validations/transactions.ts`** — схемы для транзакций
- **`lib/validations/categories.ts`** — схемы для категорий
- **`lib/validations/accounts.ts`** — схемы для счетов
- **`lib/validations/auth.ts`** — схемы для аутентификации

### Принципы

- **Фабрики схем**: Схемы создаются через фабрики, принимающие функцию перевода
- **Переиспользование**: Схемы можно использовать в формах и API
- **Типобезопасность**: Типы данных выводятся из схем через TypeScript

### Пример использования

```typescript
import { createTransactionFormSchema } from "@/lib/validations/transactions";

const schema = createTransactionFormSchema(tErrors);
const form = useForm({
  resolver: zodResolver(schema),
  // ...
});
```

## Принципы разработки

1. **Route Groups**: Использование для организации без влияния на URL
2. **Feature-based структура**: Компоненты группируются по доменам
3. **Типизация**: Строгая типизация TypeScript
4. **Кеширование**: Все данные из Supabase кешируются через TanStack Query (см. [`docs/CACHING.md`](./CACHING.md))
5. **Офлайн-first**: Поддержка офлайн-режима через IndexedDB
6. **Синхронизация**: Автоматическая синхронизация при наличии сети
7. **Мультивалютность**: Поддержка нескольких валют с конвертацией
8. **Разделение ответственности**: Бизнес-логика в сервисах, валидация в схемах, UI в компонентах

## TODO и будущие улучшения

- [x] Реализация IndexedDB через Dexie
- [x] Реализация синхронизации данных
- [ ] Ручное разрешение конфликтов через UI
- [ ] Синхронизация через Supabase Realtime
- [x] Настройка PWA (официальный подход Next.js 16 с Workbox CDN)
- [ ] Настройка Capacitor для мобильного приложения

## Зависимости

Основные зависимости:

- **Next.js 16** — React фреймворк
- **Supabase** — Backend и аутентификация
- **TanStack Query 5** — Серверное состояние и кеширование
- **Zustand** — Клиентское состояние (UI, auth, sync)
- **next-intl** — Интернационализация
- **shadcn/ui** — UI компоненты
- **Tailwind CSS** — Стилизация
- **Framer Motion** — Анимации
- **Tesseract.js** — OCR для распознавания текста из изображений
- **pdfjs-dist** — Обработка PDF файлов
- **jsQR** — Чтение QR-кодов

## Обработка чеков

- **Модуль**: `lib/receipt/` — обработка чеков с OCR и парсингом
- **Компоненты**: `components/features/transactions/Receipt*.tsx` — UI компоненты для работы с чеками
- **API**: `app/api/receipts/parse-email/` — серверный API для парсинга EML файлов
- **Документация**: [`docs/RECEIPTS.md`](./RECEIPTS.md) — подробное описание функционала обработки чеков

**Поддерживаемые форматы:**

- Изображения (фото с камеры или файлы) — OCR через Tesseract.js
- PDF файлы — извлечение текста через pdfjs-dist
- EML файлы (email) — парсинг вложений и текста письма
- QR-коды ФНС — чтение данных из QR-кодов российских чеков

**Основные возможности:**

- Автоматическое распознавание текста из чеков
- Извлечение даты, суммы, описания, способа оплаты
- Автоматическое заполнение формы транзакции
- Предложение категории на основе описания

## Документация

- **Архитектура**: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) (этот файл)
- **Кеширование**: [`docs/CACHING.md`](./CACHING.md) — подробное описание системы кеширования через TanStack Query
- **Офлайн и синхронизация**: [`docs/OFFLINE_SYNC.md`](./OFFLINE_SYNC.md) — подробное описание офлайн-режима и синхронизации данных
- **Обработка чеков**: [`docs/RECEIPTS.md`](./RECEIPTS.md) — подробное описание функционала обработки чеков
- **Для AI-агентов**: [`docs/AGENTS.md`](./AGENTS.md) — контекст для AI-ассистентов
