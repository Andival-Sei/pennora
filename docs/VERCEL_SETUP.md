# Настройка Vercel для проекта

## Требуемые настройки в Vercel Dashboard

### 1. Подключение GitHub репозитория

1. Перейти в [Vercel Dashboard](https://vercel.com/dashboard)
2. Выбрать проект или создать новый
3. Подключить GitHub репозиторий `Andival-Sei/pennora`

### 2. Настройка Production Branch

- **Production Branch**: `main`
- Это основная ветка для production деплоев

### 3. Настройка Preview Deploys

- **Preview Deploys**: Включены для всех веток
- Автоматически создаются preview деплои для всех Pull Requests
- URL формат: `pennora-git-{branch}-{username}.vercel.app`

### 4. Опционально: Staging Environment

Для ветки `develop` можно настроить отдельный staging проект:

1. Создать отдельный проект в Vercel для staging
2. Подключить тот же репозиторий
3. Настроить Production Branch: `develop`
4. Использовать отдельные environment variables для staging

### 5. Environment Variables

Настроить следующие переменные окружения в Vercel:

**Production:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Другие необходимые переменные

**Preview:**

- Можно использовать те же переменные или отдельные для тестирования

### 6. Проверка интеграции

После настройки проверить:

1. ✅ Создать PR из feature ветки → должен появиться preview deploy
2. ✅ Смерджить в `develop` → должен появиться staging deploy (если настроен)
3. ✅ Смерджить в `main` → должен появиться production deploy

## Автоматический деплой

Vercel автоматически деплоит при:

- Push в `main` → Production deploy
- Push в другие ветки → Preview deploy
- Pull Request → Preview deploy с комментарием в PR

## Troubleshooting

Если деплой не работает:

1. Проверить что репозиторий подключен в Vercel
2. Проверить что Production Branch = `main`
3. Проверить что Preview Deploys включены
4. Проверить логи деплоя в Vercel Dashboard
5. Убедиться что все environment variables настроены
