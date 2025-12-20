# Git Workflow

## Модель ветвления

Проект использует упрощенную модель Git Flow:

```
main (production)
  └── develop (staging/integration)
       ├── feature/* (новые функции)
       ├── fix/* (исправления багов)
       └── hotfix/* (критические исправления из main)
```

## Ветки

### `main`

- Production-ready код
- Защищена от прямых коммитов
- Сливается только через PR из `develop`
- После мерджа создается тег версии

### `develop`

- Интеграционная ветка для разработки
- Разрешены прямые коммиты и пуши (для быстрой разработки)
- Также может сливаться через PR из `feature/*` и `fix/*`
- Всегда должна быть в рабочем состоянии

### `feature/*`

- Ветки для новых функций
- Формат: `feature/краткое-описание` (например: `feature/add-budget-charts`)
- Отпочковывается от `develop`
- Сливается обратно в `develop` через PR
- Удаляется после мерджа

### `fix/*`

- Ветки для исправления багов
- Формат: `fix/краткое-описание` (например: `fix/transaction-sync-bug`)
- Отпочковывается от `develop`
- Сливается обратно в `develop` через PR

### `hotfix/*`

- Критические исправления в production
- Формат: `hotfix/краткое-описание`
- Отпочковывается от `main`
- Сливается в `main` и `develop` через PR

## Процесс работы

### Работа напрямую с develop

Для быстрой разработки можно коммитить и пушить напрямую в `develop`:

```bash
# Переключиться на develop и обновить
git checkout develop
git pull origin develop

# Внести изменения и закоммитить
git add .
git commit -m "fix: исправить баг"
git push origin develop
```

**Примечание**: Для больших изменений или когда нужен code review, рекомендуется использовать feature ветки и Pull Request.

### 1. Создание feature ветки

```bash
# Переключиться на develop и обновить
git checkout develop
git pull origin develop

# Создать новую feature ветку
git checkout -b feature/my-feature

# Запушить ветку в удаленный репозиторий
git push -u origin feature/my-feature
```

### 2. Разработка

- Делать коммиты по [Conventional Commits](COMMIT_CONVENTION.md)
- Pre-commit hooks автоматически проверят код перед коммитом
- Регулярно пушить изменения в удаленную ветку

```bash
# После изменений
git add .
git commit -m "feat: добавить новую функцию"
git push
```

### 3. Создание Pull Request

1. Перейти на GitHub и создать PR из `feature/*` в `develop`
2. Заполнить описание PR (что изменено, зачем)
3. Дождаться прохождения CI проверок
4. Дождаться code review (минимум 1 одобрение)
5. После одобрения и прохождения CI - смерджить PR

### 4. Релиз в production

1. Создать PR из `develop` в `main`
2. После мерджа создать тег версии:

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Pre-commit Hooks

При каждом коммите автоматически запускаются:

- **ESLint**: проверка кода на ошибки
- **Prettier**: автоматическое форматирование кода

Если проверки не проходят, коммит будет заблокирован. Исправьте ошибки и попробуйте снова.

## CI/CD Pipeline

При создании PR автоматически запускаются проверки:

1. **Lint & Format Check**: проверка ESLint и Prettier
2. **Type Check**: проверка TypeScript типов
3. **Build**: сборка проекта

Все проверки должны пройти успешно перед мерджем.

## Vercel Deploys

- **Preview Deploys**: автоматически создаются для всех PR
- **Staging Deploy**: автоматически создается при мердже в `develop` (если настроено)
- **Production Deploy**: автоматически создается при мердже в `main`

## FAQ

### Как обновить feature ветку с последними изменениями из develop?

```bash
git checkout feature/my-feature
git fetch origin
git merge origin/develop
# Или через rebase (если предпочитаете)
git rebase origin/develop
```

### Что делать если есть конфликты при мердже?

1. Обновить feature ветку с последними изменениями из develop
2. Разрешить конфликты локально
3. Запушить изменения
4. PR обновится автоматически

### Можно ли коммитить напрямую в develop или main?

- **develop**: Да, прямые коммиты и пуши разрешены для быстрой разработки
- **main**: Нет. Все изменения в main должны проходить через Pull Request из develop для обеспечения code review и проверок CI

### Как отменить изменения в feature ветке?

```bash
# Отменить последний коммит (сохранив изменения)
git reset --soft HEAD~1

# Отменить последний коммит (удалив изменения)
git reset --hard HEAD~1

# Отменить все локальные изменения
git checkout .
```

### Как удалить локальную ветку после мерджа?

```bash
# Удалить локальную ветку
git branch -d feature/my-feature

# Удалить удаленную ветку (обычно делается автоматически при мердже PR)
git push origin --delete feature/my-feature
```
