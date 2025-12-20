# getSession() vs getUser() - Безопасность и производительность

## Проблема

Supabase предупреждает о потенциальной небезопасности использования `getSession()`:

> "Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic."

## Разница между getSession() и getUser()

| Метод          | Проверка                                                                     | Производительность      | Безопасность         |
| -------------- | ---------------------------------------------------------------------------- | ----------------------- | -------------------- |
| `getSession()` | Проверяет только валидность JWT локально (подпись, срок действия)            | ~0.0018ms (локально)    | Зависит от контекста |
| `getUser()`    | Делает запрос к серверу для полной валидации (проверяет, что сессия активна) | ~109ms (сетевой запрос) | Высокая              |

## Почему getSession() безопасен в нашем случае

### 1. RLS (Row Level Security) защита

Все таблицы в БД защищены RLS. При каждом запросе к БД:

1. RLS проверяет токен из JWT
2. Если токен отозван (даже если подпись валидна), RLS заблокирует запрос
3. Если токен валиден, RLS разрешит доступ только к данным пользователя

### 2. Как мы используем user.id

Мы используем `user.id` только для:

- Проверки авторизации (redirect если нет user)
- Запросов к БД через `.eq("id", user.id)` или `.eq("user_id", user.id)`

Все эти запросы защищены RLS на уровне БД.

### 3. Пример безопасного использования

```typescript
// ✅ Безопасно: RLS проверяет токен на уровне БД
const {
  data: { session },
} = await supabase.auth.getSession();
const user = session?.user;

if (!user) redirect("/login");

// Этот запрос защищен RLS - если токен отозван, запрос будет отклонен
const { data } = await supabase
  .from("accounts")
  .select("*")
  .eq("user_id", user.id); // RLS проверяет токен здесь
```

## Когда использовать getUser()

Используйте `getUser()` для:

1. **Критичных операций**:
   - Платежи
   - Удаление аккаунта
   - Изменение пароля
   - Критичные настройки безопасности

2. **Когда нужна гарантия активности сессии**:
   - После долгого бездействия
   - Перед важными операциями

3. **Когда используете данные пользователя напрямую**:
   - Если вы полагаетесь на email, имя и т.д. без дополнительной проверки

## Текущее решение

### В Server Components (чтение данных)

✅ **getSession()** - безопасно, так как:

- Все запросы к БД защищены RLS
- RLS проверяет токен при каждом запросе
- Если токен отозван, RLS заблокирует запросы

**Пример:**

```typescript
// app/(main)/dashboard/page.tsx
const {
  data: { session },
} = await supabase.auth.getSession();
const user = session?.user; // ✅ Безопасно с RLS

const { data: accounts } = await supabase
  .from("accounts")
  .select("*")
  .eq("user_id", user.id); // RLS проверяет токен здесь
```

### В Server Actions (модификация данных)

⚠️ **Рекомендуется getUser()** для критичных операций:

**Пример для критичной операции:**

```typescript
// Для операции удаления всех счетов - можно использовать getUser()
export async function resetAccounts() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "Unauthorized" };
  }

  // RLS также защитит эту операцию, но getUser() даст дополнительную гарантию
  await supabase.from("accounts").delete().eq("user_id", user.id);
}
```

## Компромисс: производительность vs безопасность

Если заменить `getSession()` на `getUser()` везде:

- **Потеря производительности**: ~100-150ms на каждую страницу
- **Улучшение безопасности**: Дополнительная проверка активности сессии на сервере

**Вывод**: В нашем случае `getSession()` безопасен благодаря RLS, и замена на `getUser()` даст минимальный выигрыш в безопасности при значительной потере производительности.

## Рекомендации

1. ✅ Оставить `getSession()` для всех Server Components (чтение данных)
2. ✅ Оставить `getSession()` для простых Server Actions (RLS защищает)
3. ⚠️ Использовать `getUser()` для критичных операций (платежи, удаление аккаунта)
4. ✅ RLS обеспечивает безопасность на уровне БД независимо от метода проверки

## Ссылки

- [Supabase Auth Sessions](https://supabase.com/docs/guides/auth/sessions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [getSession() Reference](https://supabase.com/docs/reference/javascript/auth-getsession)
- [getUser() Reference](https://supabase.com/docs/reference/javascript/auth-getuser)
