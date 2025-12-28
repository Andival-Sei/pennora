-- Миграция: Добавление недостающих индексов на внешние ключи
-- 
-- Эта миграция добавляет индексы на внешние ключи для улучшения производительности запросов.
-- Индексы создаются на полях, которые часто используются в JOIN и WHERE условиях.

-- Индекс для budget_members.invited_by
-- Улучшает производительность запросов, связанных с приглашениями в бюджеты
CREATE INDEX IF NOT EXISTS idx_budget_members_invited_by 
ON budget_members(invited_by);

-- Индекс для transactions.to_account_id
-- Улучшает производительность запросов по переводам между счетами
CREATE INDEX IF NOT EXISTS idx_transactions_to_account_id 
ON transactions(to_account_id);

-- Комментарии к индексам
COMMENT ON INDEX idx_budget_members_invited_by IS 
'Индекс для внешнего ключа invited_by в таблице budget_members. Улучшает производительность запросов по приглашениям.';

COMMENT ON INDEX idx_transactions_to_account_id IS 
'Индекс для внешнего ключа to_account_id в таблице transactions. Улучшает производительность запросов по переводам между счетами.';
