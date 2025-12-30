# Тестирование

Процессы и стандарты тестирования в проекте Pennora.

## Обзор

Проект использует **Vitest** для unit и integration тестов.

## Структура тестов

```
__tests__/
├── components/          # Тесты компонентов
├── lib/                 # Тесты утилит и логики
│   ├── services/       # Тесты сервисов
│   ├── utils/          # Тесты утилит
│   └── validations/    # Тесты валидаций
├── fixtures/           # Тестовые данные
└── performance/       # Бенчмарк тесты
```

## Запуск тестов

```bash
# Все тесты
pnpm test

# С UI интерфейсом
pnpm test:ui

# Бенчмарк тесты
pnpm test:bench

# Конкретный файл
pnpm test TransactionForm.test.tsx

# Watch mode
pnpm test --watch
```

## Покрытие кода

```bash
# Генерация отчета о покрытии
pnpm test --coverage
```

## Типы тестов

### Unit тесты

Тестирование отдельных функций и утилит:

- Сервисы (`lib/services/`)
- Утилиты (`lib/utils/`)
- Валидации (`lib/validations/`)

### Component тесты

Тестирование React компонентов:

- Рендеринг
- Взаимодействие пользователя
- Состояние компонентов

### Performance тесты

Бенчмарк тесты для проверки производительности:

- `__tests__/performance/auth-performance.bench.ts`
- `__tests__/performance/currency-conversion.bench.ts`
- `__tests__/performance/dashboard-performance.bench.ts`

## Best Practices

1. **Тестируйте бизнес-логику**, а не детали реализации
2. **Используйте фикстуры** для тестовых данных
3. **Изолируйте тесты** — каждый тест должен быть независимым
4. **Пишите понятные названия** тестов
5. **Покрывайте edge cases** и ошибки

## Примеры

### Unit тест

```typescript
import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils/currency";

describe("formatCurrency", () => {
  it("форматирует валюту правильно", () => {
    expect(formatCurrency(1000, "RUB")).toBe("1 000 ₽");
  });
});
```

### Component тест

```typescript
import { render, screen } from "@testing-library/react";
import { TransactionForm } from "@/components/features/transactions/TransactionForm";

describe("TransactionForm", () => {
  it("рендерит форму транзакции", () => {
    render(<TransactionForm />);
    expect(screen.getByLabelText("Сумма")).toBeInTheDocument();
  });
});
```

## См. также

- [Development Setup](../guides/development-setup.md) — настройка окружения
- [Git Workflow](./git-workflow.md) — процесс разработки
