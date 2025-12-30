# Миграция документации

Этот документ описывает реорганизацию документации проекта Pennora на основе best practices.

## Дата миграции

2025-01-27

## Изменения

### Новая структура

Документация реорганизована по принципу [Diátaxis Framework](https://diataxis.fr/):

```
docs/
├── README.md              # Точка входа с навигацией
├── guides/                # Tutorials и How-to guides
│   ├── getting-started.md
│   ├── development-setup.md
│   └── database-setup.md
├── reference/             # Справочная документация
│   ├── database.md
│   ├── api.md
│   ├── configuration.md
│   └── default-categories.md
├── concepts/              # Объяснения концепций
│   ├── architecture.md
│   ├── caching.md
│   ├── offline-sync.md
│   ├── receipts.md
│   └── categories.md
├── processes/              # Процессы разработки
│   ├── git-workflow.md
│   ├── commit-convention.md
│   └── testing.md
├── meta/                   # Мета-документация
│   ├── roadmap.md
│   ├── mvp-checklist.md
│   ├── comprehensive-analysis.md
│   ├── agents.md
│   └── implementation-prompt.md
└── .templates/             # Шаблоны для документации
    ├── guide-template.md
    ├── reference-template.md
    ├── concept-template.md
    └── process-template.md
```

### Перемещенные файлы

| Старый путь                 | Новый путь                        | Категория |
| --------------------------- | --------------------------------- | --------- |
| `ARCHITECTURE.md`           | `concepts/architecture.md`        | Concept   |
| `CACHING.md`                | `concepts/caching.md`             | Concept   |
| `OFFLINE_SYNC.md`           | `concepts/offline-sync.md`        | Concept   |
| `RECEIPTS.md`               | `concepts/receipts.md`            | Concept   |
| `CATEGORIES.md`             | `concepts/categories.md`          | Concept   |
| `DATABASE.md`               | `reference/database.md`           | Reference |
| `DEFAULT_CATEGORIES.md`     | `reference/default-categories.md` | Reference |
| `GIT_WORKFLOW.md`           | `processes/git-workflow.md`       | Process   |
| `COMMIT_CONVENTION.md`      | `processes/commit-convention.md`  | Process   |
| `ROADMAP.md`                | `meta/roadmap.md`                 | Meta      |
| `MVP_CHECKLIST.md`          | `meta/mvp-checklist.md`           | Meta      |
| `COMPREHENSIVE_ANALYSIS.md` | `meta/comprehensive-analysis.md`  | Meta      |
| `AGENTS.md`                 | `meta/agents.md`                  | Meta      |
| `IMPLEMENTATION_PROMPT.md`  | `meta/implementation-prompt.md`   | Meta      |

### Новые файлы

- `docs/README.md` — точка входа с навигацией
- `guides/getting-started.md` — руководство по началу работы
- `guides/development-setup.md` — настройка окружения разработки
- `guides/database-setup.md` — настройка базы данных
- `reference/api.md` — справочник по API
- `reference/configuration.md` — справочник по конфигурации
- `processes/testing.md` — процессы тестирования
- `.templates/` — шаблоны для документации

### Обновленные ссылки

Все ссылки в следующих файлах обновлены:

- `README.md` (основной)
- `docs/concepts/architecture.md`
- `docs/meta/agents.md`
- `docs/meta/implementation-prompt.md`
- `docs/meta/comprehensive-analysis.md`

## Принципы организации

### Diátaxis Framework

Документация организована по 4 типам:

1. **Guides (Руководства)** — помогают достичь конкретной цели
2. **Reference (Справочник)** — описывают факты о системе
3. **Concepts (Концепции)** — объясняют, как и почему что-то работает
4. **Processes (Процессы)** — описывают процессы и стандарты команды

### Преимущества новой структуры

- ✅ Четкая категоризация по типам документации
- ✅ Легкая навигация через `docs/README.md`
- ✅ Логичная структура папок
- ✅ Шаблоны для создания новой документации
- ✅ Соответствие industry best practices

## Использование

### Навигация

Начните с [`docs/README.md`](./README.md) для навигации по всей документации.

### Создание новой документации

1. Определите тип документа (guide, reference, concept, process, meta)
2. Используйте соответствующий шаблон из `.templates/`
3. Разместите файл в соответствующей папке
4. Добавьте ссылку в `docs/README.md`

## См. также

- [Diátaxis Framework](https://diataxis.fr/)
- [Documentation Best Practices](https://www.writethedocs.org/guide/)
