-- Миграция: Удаление неиспользуемого индекса
-- 
-- Эта миграция удаляет индекс budget_members_budget_id_idx, который не используется
-- и может замедлять операции INSERT/UPDATE/DELETE без улучшения производительности запросов.

-- Удаляем неиспользуемый индекс
DROP INDEX IF EXISTS budget_members_budget_id_idx;

-- Комментарий
COMMENT ON INDEX IF EXISTS budget_members_budget_id_idx IS NULL;
