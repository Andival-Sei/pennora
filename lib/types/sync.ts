/**
 * Типы для синхронизации данных
 */

/**
 * Статус синхронизации
 */
export type SyncStatus = "idle" | "syncing" | "success" | "error";

/**
 * Результат синхронизации
 */
export interface SyncResult {
  /** Количество успешно синхронизированных операций */
  success: number;
  /** Количество операций с ошибками */
  failed: number;
  /** Общее количество обработанных операций */
  total: number;
  /** Ошибки (если были) */
  errors: Array<{ operationId: string; error: string }>;
}
