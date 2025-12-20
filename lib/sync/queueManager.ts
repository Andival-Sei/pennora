"use client";

import { syncQueueDB } from "@/lib/db/indexeddb/database";
import type {
  SyncQueueItem,
  SyncTable,
  SyncOperation,
  QueueStatus,
} from "@/lib/db/indexeddb/models";

/**
 * Менеджер очереди синхронизации
 * Управляет операциями, которые нужно синхронизировать с Supabase
 */
export class QueueManager {
  /**
   * Добавляет операцию в очередь синхронизации
   */
  async enqueue(
    table: SyncTable,
    operation: SyncOperation,
    recordId: string | null,
    data: unknown
  ): Promise<string> {
    const queueItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      table,
      operation,
      record_id: recordId,
      data,
      created_at: Date.now(),
      retry_count: 0,
      last_error: null,
    };

    await syncQueueDB.syncQueue.add(queueItem);
    return queueItem.id;
  }

  /**
   * Получает все операции из очереди
   */
  async getAll(): Promise<SyncQueueItem[]> {
    return syncQueueDB.syncQueue.orderBy("created_at").toArray();
  }

  /**
   * Получает операции для конкретной таблицы
   */
  async getByTable(table: SyncTable): Promise<SyncQueueItem[]> {
    return syncQueueDB.syncQueue.where("table").equals(table).toArray();
  }

  /**
   * Получает следующую операцию для обработки (самую старую)
   */
  async getNext(): Promise<SyncQueueItem | undefined> {
    return syncQueueDB.syncQueue
      .orderBy("created_at")
      .filter((item) => item.retry_count < 5) // Максимум 5 попыток
      .first();
  }

  /**
   * Удаляет операцию из очереди после успешной синхронизации
   */
  async remove(id: string): Promise<void> {
    await syncQueueDB.syncQueue.delete(id);
  }

  /**
   * Обновляет счетчик попыток и ошибку при неудачной синхронизации
   */
  async markFailed(id: string, error: string): Promise<void> {
    const item = await syncQueueDB.syncQueue.get(id);
    if (item) {
      await syncQueueDB.syncQueue.update(id, {
        retry_count: item.retry_count + 1,
        last_error: error,
      });
    }
  }

  /**
   * Получает статус очереди
   */
  async getStatus(): Promise<QueueStatus> {
    const all = await this.getAll();
    const pending = all.filter((item) => item.retry_count === 0);
    const failed = all.filter((item) => item.retry_count > 0);

    return {
      total: all.length,
      pending: pending.length,
      failed: failed.length,
      lastSyncTime: null, // Будет обновляться в SyncManager
    };
  }

  /**
   * Очищает все обработанные операции (для очистки старых записей)
   */
  async clearProcessed(): Promise<number> {
    // Удаляем операции старше 7 дней
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const deleted = await syncQueueDB.syncQueue
      .where("created_at")
      .below(sevenDaysAgo)
      .delete();
    return deleted;
  }

  /**
   * Очищает все операции из очереди (для тестирования)
   */
  async clearAll(): Promise<void> {
    await syncQueueDB.syncQueue.clear();
  }
}

/**
 * Глобальный экземпляр менеджера очереди
 */
export const queueManager = new QueueManager();
