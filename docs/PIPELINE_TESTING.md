# Тестирование CI/CD пайплайна

## Локальная проверка (уже выполнена)

✅ **Pre-commit hooks**: Проверено - lint-staged работает корректно
✅ **TypeScript**: Проверено - компиляция проходит без ошибок
✅ **Конфигурации**: Все файлы созданы и валидны

## Проверка на GitHub

### 1. Проверка CI Workflow

1. Запушить текущую ветку `test/ci-pipeline-setup`:

   ```bash
   git push -u origin test/ci-pipeline-setup
   ```

2. Создать Pull Request из `test/ci-pipeline-setup` в `develop`

3. Проверить что:
   - ✅ CI workflow запустился автоматически
   - ✅ Все три job прошли успешно:
     - `lint` (Lint & Format Check)
     - `type-check` (TypeScript Type Check)
     - `build` (Build)

4. Если CI не запустился:
   - Проверить что файл `.github/workflows/ci.yml` существует
   - Проверить что workflow файл имеет правильный синтаксис YAML
   - Проверить логи в Actions tab на GitHub

### 2. Проверка Vercel Preview Deploy

1. После создания PR проверить:
   - ✅ Vercel автоматически создал preview deploy
   - ✅ Preview deploy доступен по ссылке в комментарии PR
   - ✅ Preview deploy работает корректно

2. Если preview deploy не создался:
   - Проверить настройки Vercel Dashboard
   - Убедиться что репозиторий подключен
   - Проверить что Preview Deploys включены

### 3. Проверка Branch Protection

1. Попытаться смерджить PR без одобрения:
   - ✅ Должно быть заблокировано

2. Попытаться смерджить PR с ошибками CI:
   - ✅ Должно быть заблокировано

3. После одобрения и прохождения CI:
   - ✅ Мердж должен быть разрешен

### 4. Полный цикл тестирования

1. **Создать feature ветку:**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/test-pipeline
   ```

2. **Сделать изменения и коммит:**

   ```bash
   # Внести небольшие изменения
   git add .
   git commit -m "feat: тестовая функция"
   git push -u origin feature/test-pipeline
   ```

3. **Создать PR в develop:**
   - Проверить что pre-commit hooks сработали локально
   - Проверить что CI запустился
   - Проверить что preview deploy создался

4. **Смерджить в develop:**
   - После одобрения и прохождения CI
   - Проверить что staging deploy создался (если настроен)

5. **Создать PR develop → main:**
   - Проверить что CI запустился
   - После одобрения и прохождения CI

6. **Смерджить в main:**
   - Проверить что production deploy создался
   - Проверить что приложение работает в production

## Troubleshooting

### CI не запускается

- Проверить синтаксис `.github/workflows/ci.yml`
- Проверить что файл находится в правильной директории
- Проверить что workflow имеет правильные триггеры (`on:`)

### Pre-commit hooks не работают

- Проверить что husky установлен: `pnpm exec husky`
- Проверить что `.husky/pre-commit` существует и исполняемый
- Проверить что `package.json` содержит `"prepare": "husky || true"`

### Vercel deploy не работает

- Проверить настройки в Vercel Dashboard
- Проверить что репозиторий подключен
- Проверить что Production Branch = `main`
- Проверить логи деплоя в Vercel Dashboard

### Dependabot не создает PR

- Проверить что `.github/dependabot.yml` существует
- Проверить что файл имеет правильный синтаксис
- Подождать до следующего scheduled времени (weekly, monday 09:00)
- Или вручную запустить через GitHub Actions (если доступно)

## Чеклист для финальной проверки

- [ ] Pre-commit hooks работают локально
- [ ] CI workflow запускается на PR
- [ ] Все CI проверки проходят успешно
- [ ] Vercel создает preview deploys для PR
- [ ] Branch Protection Rules работают
- [ ] Dependabot настроен (проверить через несколько дней)
- [ ] Production deploy работает при мердже в main
- [ ] Документация обновлена и доступна
