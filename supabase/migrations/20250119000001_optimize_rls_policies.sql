-- Миграция: Оптимизация RLS политик для улучшения производительности
-- 
-- Эта миграция оптимизирует все RLS политики, заменяя прямые вызовы auth.uid()
-- на (select auth.uid()) для кеширования результата на уровне запроса.
-- Это значительно улучшает производительность при работе с большими таблицами.
-- 
-- Подробнее: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- PROFILES
-- ============================================

-- Обновляем политику SELECT
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

-- Обновляем политику UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- ============================================
-- ACCOUNTS
-- ============================================

-- Обновляем политику SELECT
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
CREATE POLICY "Users can view own accounts" ON accounts
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- Обновляем политику INSERT
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
CREATE POLICY "Users can insert own accounts" ON accounts
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Обновляем политику UPDATE
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
CREATE POLICY "Users can update own accounts" ON accounts
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Обновляем политику DELETE
DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;
CREATE POLICY "Users can delete own accounts" ON accounts
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- ============================================
-- CATEGORIES
-- ============================================

-- Обновляем политику SELECT
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
CREATE POLICY "Users can view own categories" ON categories
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- Обновляем политику INSERT
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories" ON categories
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Обновляем политику UPDATE
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories" ON categories
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Обновляем политику DELETE
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories" ON categories
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- ============================================
-- TRANSACTIONS
-- ============================================

-- Обновляем политику SELECT
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- Обновляем политику INSERT
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Обновляем политику UPDATE
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions" ON transactions
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Обновляем политику DELETE
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions" ON transactions
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- ============================================
-- BUDGETS
-- ============================================

-- Обновляем политику SELECT
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
CREATE POLICY "Users can view own budgets" ON budgets
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- Обновляем политику INSERT
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
CREATE POLICY "Users can insert own budgets" ON budgets
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Обновляем политику UPDATE
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
CREATE POLICY "Users can update own budgets" ON budgets
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Обновляем политику DELETE
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
CREATE POLICY "Users can delete own budgets" ON budgets
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- ============================================
-- BUDGET_MEMBERS
-- ============================================

-- Обновляем политику SELECT
DROP POLICY IF EXISTS "Users can view budget memberships" ON budget_members;
CREATE POLICY "Users can view budget memberships" ON budget_members
FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = user_id 
  OR EXISTS (
    SELECT 1
    FROM budget_members bm
    WHERE bm.budget_id = budget_members.budget_id 
      AND bm.user_id = (select auth.uid())
  )
);

-- Обновляем политику INSERT
DROP POLICY IF EXISTS "Owners can insert members" ON budget_members;
CREATE POLICY "Owners can insert members" ON budget_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM budget_members bm
    WHERE bm.budget_id = budget_members.budget_id 
      AND bm.user_id = (select auth.uid())
      AND bm.role = 'owner'
  )
  OR (select auth.uid()) = user_id
);

-- Обновляем политику DELETE
DROP POLICY IF EXISTS "Owners can delete members" ON budget_members;
CREATE POLICY "Owners can delete members" ON budget_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM budget_members bm
    WHERE bm.budget_id = budget_members.budget_id 
      AND bm.user_id = (select auth.uid())
      AND bm.role = 'owner'
  )
);

-- Комментарий к миграции
COMMENT ON POLICY "Users can view own profile" ON profiles IS 
'Оптимизированная RLS политика с использованием (select auth.uid()) для кеширования результата';
