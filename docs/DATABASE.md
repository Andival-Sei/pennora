# База данных Pennora

## Обзор

База данных размещена в **Supabase** (PostgreSQL) с включённым Row Level Security (RLS).

- **Регион:** eu-west-1 (Ирландия)
- **Версия PostgreSQL:** 17.6

## Схема

### profiles

Профили пользователей. Создаётся автоматически при регистрации.

| Поле             | Тип          | Описание                      |
| ---------------- | ------------ | ----------------------------- |
| id               | UUID (PK)    | ID пользователя из auth.users |
| email            | TEXT         | Email                         |
| display_name     | TEXT         | Отображаемое имя              |
| default_currency | TEXT         | Валюта по умолчанию (RUB)     |
| created_at       | TIMESTAMPTZ  | Дата создания                 |
| updated_at       | TIMESTAMPTZ  | Дата обновления               |

### accounts

Счета пользователя (кошельки, карты, банковские счета).

| Поле        | Тип          | Описание                                          |
| ----------- | ------------ | ------------------------------------------------- |
| id          | UUID (PK)    | ID счёта                                          |
| user_id     | UUID (FK)    | Владелец → profiles.id                            |
| name        | TEXT         | Название счёта                                    |
| type        | ENUM         | Тип: cash, card, bank, savings, investment, other |
| currency    | TEXT         | Валюта счёта                                      |
| balance     | DECIMAL      | Текущий баланс (обновляется триггером)            |
| icon        | TEXT         | Иконка                                            |
| color       | TEXT         | Цвет                                              |
| is_archived | BOOLEAN      | Архивирован                                       |
| created_at  | TIMESTAMPTZ  | Дата создания                                     |
| updated_at  | TIMESTAMPTZ  | Дата обновления                                   |

### categories

Категории доходов и расходов. Поддерживают иерархию (подкатегории).

| Поле        | Тип          | Описание                          |
| ----------- | ------------ | --------------------------------- |
| id          | UUID (PK)    | ID категории                      |
| user_id     | UUID (FK)    | Владелец → profiles.id            |
| name        | TEXT         | Название                          |
| type        | ENUM         | Тип: income, expense              |
| icon        | TEXT         | Иконка                            |
| color       | TEXT         | Цвет                              |
| parent_id   | UUID (FK)    | Родительская категория (опц.)     |
| sort_order  | INT          | Порядок сортировки                |
| is_archived | BOOLEAN      | Архивирована                      |
| created_at  | TIMESTAMPTZ  | Дата создания                     |
| updated_at  | TIMESTAMPTZ  | Дата обновления                   |

### transactions

Финансовые транзакции.

| Поле          | Тип          | Описание                              |
| ------------- | ------------ | ------------------------------------- |
| id            | UUID (PK)    | ID транзакции                         |
| user_id       | UUID (FK)    | Владелец → profiles.id                |
| account_id    | UUID (FK)    | Счёт списания → accounts.id           |
| category_id   | UUID (FK)    | Категория → categories.id (опц.)      |
| to_account_id | UUID (FK)    | Счёт зачисления (для переводов)       |
| type          | ENUM         | Тип: income, expense, transfer        |
| amount        | DECIMAL      | Сумма                                 |
| currency      | TEXT         | Валюта транзакции                     |
| exchange_rate | DECIMAL      | Курс конвертации                      |
| description   | TEXT         | Описание                              |
| date          | DATE         | Дата транзакции                       |
| created_at    | TIMESTAMPTZ  | Дата создания                         |
| updated_at    | TIMESTAMPTZ  | Дата обновления                       |

### budgets

Бюджеты (лимиты расходов по категориям).

| Поле        | Тип          | Описание                          |
| ----------- | ------------ | --------------------------------- |
| id          | UUID (PK)    | ID бюджета                        |
| user_id     | UUID (FK)    | Владелец → profiles.id            |
| category_id | UUID (FK)    | Категория → categories.id (опц.)  |
| name        | TEXT         | Название бюджета                  |
| amount      | DECIMAL      | Лимит                             |
| currency    | TEXT         | Валюта                            |
| period      | ENUM         | Период: weekly, monthly, yearly   |
| start_date  | DATE         | Дата начала                       |
| is_active   | BOOLEAN      | Активен                           |
| created_at  | TIMESTAMPTZ  | Дата создания                     |
| updated_at  | TIMESTAMPTZ  | Дата обновления                   |

### budget_members

Участники совместных бюджетов.

| Поле       | Тип          | Описание                         |
| ---------- | ------------ | -------------------------------- |
| id         | UUID (PK)    | ID записи                        |
| budget_id  | UUID (FK)    | Бюджет → budgets.id              |
| user_id    | UUID (FK)    | Участник → profiles.id           |
| role       | ENUM         | Роль: owner, editor, viewer      |
| invited_by | UUID (FK)    | Кто пригласил → profiles.id      |
| joined_at  | TIMESTAMPTZ  | Дата присоединения               |

## Триггеры

### on_auth_user_created

При регистрации пользователя автоматически создаётся запись в `profiles`.

### on_transaction_change

При INSERT/DELETE транзакции автоматически обновляется баланс счёта:
- `income` → увеличивает баланс
- `expense` → уменьшает баланс
- `transfer` → уменьшает исходный счёт, увеличивает целевой

### update_*_updated_at

Автоматически обновляет поле `updated_at` при любом UPDATE.

## Row Level Security (RLS)

Все таблицы защищены RLS. Пользователи могут:
- Видеть, создавать, редактировать и удалять **только свои** данные
- Для `budget_members`: видеть участников бюджетов, в которых состоят; добавлять/удалять участников может только owner

## Индексы

Созданы индексы на:
- `user_id` — для всех таблиц
- `account_id`, `category_id` — для transactions
- `date` — для transactions
- `parent_id` — для categories
- `budget_id` — для budget_members

## ER-диаграмма

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   profiles  │       │  accounts   │       │ categories  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ user_id(FK) │       │ id (PK)     │
│ email       │       │ id (PK)     │       │ user_id(FK) │──►profiles
│ display_name│       │ name        │       │ name        │
│ default_cur │       │ type        │       │ type        │
└─────────────┘       │ balance     │       │ parent_id   │──►categories
       │              └─────────────┘       └─────────────┘
       │                     │                     │
       │                     ▼                     ▼
       │              ┌─────────────┐       ┌─────────────┐
       │              │transactions │       │   budgets   │
       │              ├─────────────┤       ├─────────────┤
       └─────────────►│ user_id(FK) │       │ user_id(FK) │──►profiles
                      │ account_id  │──►acc │ category_id │──►categories
                      │ category_id │──►cat │ amount      │
                      │ to_account  │──►acc │ period      │
                      │ amount      │       └─────────────┘
                      │ type        │              │
                      └─────────────┘              ▼
                                           ┌──────────────┐
                                           │budget_members│
                                           ├──────────────┤
                                           │ budget_id(FK)│──►budgets
                                           │ user_id(FK)  │──►profiles
                                           │ role         │
                                           └──────────────┘
```

