# Настройка базы данных

Это руководство описывает настройку базы данных Supabase для проекта Pennora.

## Предварительные требования

- Аккаунт в Supabase
- Доступ к проекту Supabase

## Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Запишите URL проекта и anon key

## Настройка переменных окружения

Добавьте в `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Применение миграций

### Автоматическое применение

Миграции применяются автоматически через Supabase MCP при разработке.

### Ручное применение

1. Откройте SQL Editor в Supabase Dashboard
2. Примените миграции из `supabase/migrations/` по порядку

## Проверка подключения

Запустите проект:

```bash
pnpm dev
```

Проверьте, что приложение подключается к базе данных без ошибок.

## Структура базы данных

Подробное описание схемы БД см. в [Database Reference](../reference/database.md).

## Следующие шаги

- Изучите [Database Reference](../reference/database.md) для понимания структуры
- Прочитайте [Architecture](../concepts/architecture.md) для понимания работы с БД
