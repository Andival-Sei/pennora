# Начало работы с Pennora

Это руководство поможет вам быстро начать работу с проектом Pennora.

## Предварительные требования

- **Node.js** 18+ (рекомендуется 20+)
- **pnpm** 8+ (менеджер пакетов)
- **Git** для клонирования репозитория

## Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd pennora
```

### 2. Установка зависимостей

```bash
pnpm install
```

### 3. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Настройка базы данных

Подробные инструкции по настройке базы данных см. в [Database Setup Guide](./database-setup.md) или [Database Reference](../reference/database.md).

## Запуск проекта

### Режим разработки

```bash
# Обычный режим
pnpm dev

# С Turbopack (быстрее)
pnpm dev:turbo
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Production сборка

```bash
# Сборка
pnpm build

# Запуск production сервера
pnpm start
```

## Следующие шаги

- **[Development Setup](./development-setup.md)** — настройка окружения для разработки
- **[Architecture Overview](../concepts/architecture.md)** — изучение архитектуры проекта
- **[Git Workflow](../processes/git-workflow.md)** — процесс разработки

## Полезные команды

| Команда          | Описание                       |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Запуск dev-сервера             |
| `pnpm dev:turbo` | Запуск dev-сервера с Turbopack |
| `pnpm build`     | Сборка для production          |
| `pnpm start`     | Запуск production сервера      |
| `pnpm lint`      | Проверка кода ESLint           |
| `pnpm lint:fix`  | Автоисправление ESLint ошибок  |
| `pnpm format`    | Форматирование кода Prettier   |
| `pnpm test`      | Запуск тестов (Vitest)         |
| `pnpm test:ui`   | Запуск тестов с UI интерфейсом |

## Получение помощи

- См. [README документации](../README.md) для навигации по всей документации
- Изучите [Architecture](../concepts/architecture.md) для понимания структуры проекта
- Проверьте [Git Workflow](../processes/git-workflow.md) для процесса разработки
