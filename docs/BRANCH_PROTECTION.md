# Настройка Branch Protection Rules

## Требуемые настройки в GitHub

### Для ветки `main`

1. Перейти в Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Настроить следующие правила:

**Protect matching branches:**

- ✅ Require a pull request before merging
  - Require approvals: `1` (минимум 1 одобрение)
  - Dismiss stale pull request approvals when new commits are pushed: ✅
- ✅ Require status checks to pass before merging
  - Require branches to be up to date before merging: ✅
  - Status checks that are required:
    - `lint` (Lint & Format Check)
    - `type-check` (TypeScript Type Check)
    - `build` (Build)
- ✅ Require conversation resolution before merging: ✅ (опционально)
- ✅ Do not allow bypassing the above settings: ✅
- ✅ Include administrators: ✅ (применять правила даже к админам)

### Для ветки `develop`

1. Перейти в Settings → Branches → Add rule
2. Branch name pattern: `develop`
3. Настроить следующие правила:

**Protect matching branches:**

- ✅ Require a pull request before merging
  - Require approvals: `1` (минимум 1 одобрение)
  - Dismiss stale pull request approvals when new commits are pushed: ✅
- ✅ Require status checks to pass before merging
  - Require branches to be up to date before merging: ✅
  - Status checks that are required:
    - `lint` (Lint & Format Check)
    - `type-check` (TypeScript Type Check)
    - `build` (Build)
- ⚠️ Allow specified actors to bypass required pull requests: (опционально, для экстренных случаев)
- ⚠️ Do not allow bypassing the above settings: (по усмотрению)

## Как проверить что правила работают

1. Создать feature ветку
2. Создать PR в `develop`
3. Попытаться смерджить без одобрения → должно быть заблокировано
4. Попытаться смерджить с ошибками CI → должно быть заблокировано
5. После одобрения и прохождения CI → мердж должен быть разрешен

## Альтернативный способ (через GitHub CLI)

Если у вас установлен GitHub CLI, можно настроить через команды:

```bash
# Для main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint","type-check","build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null

# Для develop
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint","type-check","build"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

Заменить `:owner` и `:repo` на `Andival-Sei` и `pennora` соответственно.
