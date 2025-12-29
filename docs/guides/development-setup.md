# Настройка окружения разработки

Это руководство описывает настройку окружения для разработки проекта Pennora.

## Требования

- **Node.js** 18+ (рекомендуется 20+)
- **pnpm** 8+
- **Git**
- Редактор кода (рекомендуется VS Code)

## Настройка редактора

### VS Code

Рекомендуемые расширения:

- **ESLint** — проверка кода
- **Prettier** — форматирование кода
- **TypeScript** — поддержка TypeScript
- **Tailwind CSS IntelliSense** — автодополнение для Tailwind

### Настройки VS Code

Создайте файл `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Pre-commit hooks

Проект использует Husky для автоматической проверки кода перед коммитом:

- Автоматическая проверка ESLint
- Автоматическое форматирование Prettier
- Проверка типов TypeScript

Husky настраивается автоматически при установке зависимостей через `pnpm install`.

## Структура проекта

```
pennora/
├── app/                    # Next.js App Router
├── components/             # React компоненты
├── lib/                    # Утилиты и логика
├── docs/                   # Документация
├── messages/               # Переводы (i18n)
├── supabase/              # Supabase конфигурация
└── __tests__/             # Тесты
```

Подробнее см. [Architecture](../concepts/architecture.md).

## Работа с Git

### Создание feature ветки

```bash
# Переключиться на develop
git checkout develop
git pull origin develop

# Создать feature ветку
git checkout -b feature/my-feature
```

### Коммиты

Используйте [Conventional Commits](../processes/commit-convention.md):

```bash
feat(transactions): добавить фильтр по категориям
fix(auth): исправить обработку ошибок входа
docs(architecture): обновить описание кеширования
```

Подробнее см. [Git Workflow](../processes/git-workflow.md).

## Тестирование

### Запуск тестов

```bash
# Все тесты
pnpm test

# С UI интерфейсом
pnpm test:ui

# Бенчмарк тесты
pnpm test:bench

# Конкретный файл
pnpm test TransactionForm.test.tsx
```

### Покрытие кода

```bash
# Генерация отчета о покрытии
pnpm test --coverage
```

## Линтинг и форматирование

### Проверка кода

```bash
# Проверка ESLint
pnpm lint

# Автоисправление ESLint
pnpm lint:fix

# Проверка форматирования
pnpm format:check

# Форматирование кода
pnpm format
```

## Отладка

### React DevTools

Установите расширение [React Developer Tools](https://react.dev/learn/react-developer-tools) для отладки компонентов.

### TanStack Query DevTools

В режиме разработки доступны DevTools для TanStack Query (см. `lib/query/provider.tsx`).

### Логирование

Используйте `console.log` для отладки. В production логи автоматически фильтруются.

## Переменные окружения

### Локальная разработка

Создайте `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Типы переменных

Создайте файл `env.d.ts` для типизации переменных окружения (если еще не создан).

## Полезные ресурсы

- **[Architecture](../concepts/architecture.md)** — архитектура проекта
- **[Git Workflow](../processes/git-workflow.md)** — процесс разработки
- **[Commit Convention](../processes/commit-convention.md)** — формат коммитов
- **[Database Reference](../reference/database.md)** — работа с БД

## Следующие шаги

- Изучите [Architecture](../concepts/architecture.md)
- Прочитайте [Git Workflow](../processes/git-workflow.md)
- Начните разработку новой функции
