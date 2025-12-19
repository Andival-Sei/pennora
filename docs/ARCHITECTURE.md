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
│   │   │   └── TransactionFilters.tsx
│   │   ├── categories/
│   │   ├── currency/
│   │   │   ├── CurrencySelector.tsx
│   │   │   └── CurrencyConverter.tsx
│   │   └── sync/
│   │       └── SyncStatus.tsx
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
│   │   ├── indexeddb/           # IndexedDB через Dexie (TODO)
│   │   │   ├── database.ts
│   │   │   └── models.ts
│   │   └── rxdb/                # RxDB (TODO, если понадобится)
│   ├── hooks/                    # Переиспользуемые React хуки
│   │   ├── useSync.ts
│   │   ├── useTransactions.ts
│   │   ├── useBudgets.ts
│   │   └── useCurrency.ts
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts
│   │   ├── syncStore.ts
│   │   └── uiStore.ts
│   ├── sync/                     # Логика синхронизации
│   │   ├── syncManager.ts
│   │   ├── conflictResolver.ts
│   │   └── queueManager.ts
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
│   │   └── index.ts              # Общие утилиты (cn, etc.)
│   ├── validations/              # Схемы валидации
│   │   └── auth.ts
│   ├── auth-errors.ts            # Обработка ошибок аутентификации
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
│   ├── icons/                   # PWA иконки
│   ├── manifest.json            # PWA манифест
│   └── sw.js                    # Service Worker (next-pwa)
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

### Supabase (основная БД)

- **Клиент**: `lib/db/supabase/client.ts` (браузер) и `server.ts` (сервер)
- **Типы**: Автоматически генерируются из схемы БД в `lib/db/supabase/types.ts`
- **Реэкспорты**: Для обратной совместимости в `lib/supabase/`

### IndexedDB (офлайн-режим)

- **Планируется**: Использование Dexie для работы с IndexedDB
- **Структура**: `lib/db/indexeddb/`

### Синхронизация

- **Менеджер**: `lib/sync/syncManager.ts`
- **Разрешение конфликтов**: `lib/sync/conflictResolver.ts`
- **Очередь операций**: `lib/sync/queueManager.ts`

## State Management

### Zustand Stores

- **`authStore.ts`** — Состояние аутентификации
- **`syncStore.ts`** — Состояние синхронизации
- **`uiStore.ts`** — UI состояние (модалки, сайдбары и т.д.)

### React Hooks

- **`useBudgets`** — Работа с бюджетами
- **`useTransactions`** — Работа с транзакциями
- **`useCurrency`** — Работа с валютами
- **`useSync`** — Синхронизация данных

## Интернационализация

- **Библиотека**: next-intl
- **Файлы переводов**: `messages/en.json`, `messages/ru.json`
- **Конфигурация**: `i18n/`

## PWA и мобильное приложение

### PWA

- **Манифест**: `public/manifest.json`
- **Service Worker**: `public/sw.js` (будет генерироваться next-pwa)
- **Иконки**: `public/icons/`

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

## Принципы разработки

1. **Route Groups**: Использование для организации без влияния на URL
2. **Feature-based структура**: Компоненты группируются по доменам
3. **Типизация**: Строгая типизация TypeScript
4. **Офлайн-first**: Поддержка офлайн-режима через IndexedDB
5. **Синхронизация**: Автоматическая синхронизация при наличии сети
6. **Мультивалютность**: Поддержка нескольких валют с конвертацией

## TODO и будущие улучшения

- [ ] Реализация IndexedDB через Dexie
- [ ] Реализация синхронизации данных
- [ ] Реализация компонентов features
- [ ] Реализация хуков для работы с данными
- [ ] Настройка PWA (next-pwa)
- [ ] Настройка Capacitor для мобильного приложения
- [ ] Реализация разрешения конфликтов при синхронизации

## Зависимости

Основные зависимости:

- **Next.js 16** — React фреймворк
- **Supabase** — Backend и аутентификация
- **Zustand** — State management
- **next-intl** — Интернационализация
- **shadcn/ui** — UI компоненты
- **Tailwind CSS** — Стилизация
- **Framer Motion** — Анимации
