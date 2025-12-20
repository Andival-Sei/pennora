/**
 * Типы для очереди синхронизации операций
 */

export type SyncTable = "transactions" | "categories" | "accounts";
export type SyncOperation = "create" | "update" | "delete";

/**
 * Элемент очереди синхронизации
 */
export interface SyncQueueItem {
  /** Уникальный ID операции в очереди */
  id: string;
  /** Таблица, к которой относится операция */
  table: SyncTable;
  /** Тип операции */
  operation: SyncOperation;
  /** ID записи (null для операций create) */
  record_id: string | null;
  /** Данные операции (зависит от типа операции) */
  data: unknown;
  /** Timestamp создания операции */
  created_at: number;
  /** Количество попыток синхронизации */
  retry_count: number;
  /** Последняя ошибка (если была) */
  last_error: string | null;
}

/**
 * Статус очереди синхронизации
 */
export interface QueueStatus {
  /** Общее количество операций в очереди */
  total: number;
  /** Количество операций, ожидающих синхронизации */
  pending: number;
  /** Количество операций с ошибками */
  failed: number;
  /** Время последней успешной синхронизации */
  lastSyncTime: number | null;
}
