# Конфигурация проекта

Справочная информация о конфигурации проекта Pennora.

## Переменные окружения

### Обязательные

| Переменная                      | Описание                  | Пример                                    |
| ------------------------------- | ------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL проекта Supabase      | `https://xxx.supabase.co`                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key проекта Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_APP_URL`           | URL приложения            | `http://localhost:3000`                   |

### Опциональные

| Переменная | Описание                           | По умолчанию  |
| ---------- | ---------------------------------- | ------------- |
| `NODE_ENV` | Окружение (development/production) | `development` |

## Конфигурация Next.js

Основные настройки в `next.config.ts`:

- Security headers
- Code splitting
- Image optimization

## Конфигурация TanStack Query

Константы в `lib/constants/query.ts`:

- `staleTime` — время жизни кеша
- `gcTime` — время хранения в памяти
- `retry` — количество повторов при ошибке

## Конфигурация тестирования

Настройки в `vitest.config.ts`:

- Тестовое окружение
- Покрытие кода
- Глобальные настройки
