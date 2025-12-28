"use client";

import { createClient } from "@/lib/db/supabase/client";
import { queueManager } from "./queueManager";
import { useSyncStore } from "@/lib/stores/syncStore";
import { queryClient } from "@/lib/query/client";
import { invalidateAll } from "@/lib/query/invalidation";
import type { SyncQueueItem, SyncTable } from "@/lib/db/indexeddb/models";
import type { SyncResult } from "@/lib/types/sync";
import { toast } from "sonner";

/**
 * Менеджер синхронизации данных
 * Обрабатывает очередь операций и синхронизирует их с Supabase
 */
export class SyncManager {
  private syncInProgress = false;

  /**
   * Инициализация менеджера синхронизации
   * Настраивает слушатели событий сети
   */
  initialize(): void {
    if (typeof window === "undefined") return;

    // Обновляем статус онлайн/офлайн
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      useSyncStore.getState().setOnline(isOnline);

      // Автоматически запускаем синхронизацию при восстановлении сети
      if (isOnline) {
        this.syncAll().catch((err) => {
          console.error("Error during auto-sync:", err);
        });
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Проверяем начальный статус
    updateOnlineStatus();

    // Периодическая синхронизация (каждые 5 минут, если онлайн)
    setInterval(
      () => {
        if (navigator.onLine && !this.syncInProgress) {
          this.syncAll().catch((err) => {
            console.error("Error during periodic sync:", err);
          });
        }
      },
      5 * 60 * 1000
    ); // 5 минут
  }

  /**
   * Синхронизирует все операции из очереди
   */
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      // Уже идет синхронизация
      const currentResult = useSyncStore.getState().lastSyncResult;
      return currentResult || { success: 0, failed: 0, total: 0, errors: [] };
    }

    this.syncInProgress = true;
    useSyncStore.getState().setSyncing(true);
    useSyncStore.getState().setStatus("syncing");

    try {
      const result = await this.processQueue();
      useSyncStore.getState().setStatus("success");
      useSyncStore.getState().setLastSyncTime(Date.now());
      useSyncStore.getState().setLastSyncResult(result);

      // Обновляем количество ожидающих операций
      const status = await queueManager.getStatus();
      useSyncStore
        .getState()
        .setPendingOperations(status.pending + status.failed);

      if (result.success > 0) {
        toast.success(`Synced ${result.success} operations`);
      }

      return result;
    } catch (error) {
      console.error("Error during sync:", error);
      useSyncStore.getState().setStatus("error");
      toast.error("Sync error");
      return {
        success: 0,
        failed: 0,
        total: 0,
        errors: [{ operationId: "", error: String(error) }],
      };
    } finally {
      this.syncInProgress = false;
      useSyncStore.getState().setSyncing(false);
    }
  }

  /**
   * Синхронизирует операции для конкретной таблицы
   */
  async syncTable(table: SyncTable): Promise<SyncResult> {
    const items = await queueManager.getByTable(table);
    return this.processItems(items);
  }

  /**
   * Обрабатывает очередь операций
   */
  private async processQueue(): Promise<SyncResult> {
    const items = await queueManager.getAll();
    if (items.length === 0) {
      return { success: 0, failed: 0, total: 0, errors: [] };
    }

    return this.processItems(items);
  }

  /**
   * Обрабатывает список операций
   */
  private async processItems(items: SyncQueueItem[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: 0,
      failed: 0,
      total: items.length,
      errors: [],
    };

    // Обрабатываем операции батчами по 10 для производительности
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((item) => this.processItem(item))
      );

      batchResults.forEach((settled, index) => {
        const item = batch[index];
        if (settled.status === "fulfilled" && settled.value) {
          result.success++;
          queueManager.remove(item.id).catch(console.error);
        } else {
          result.failed++;
          const error =
            settled.status === "rejected"
              ? settled.reason?.message || String(settled.reason)
              : "Unknown error";
          result.errors.push({ operationId: item.id, error });
          queueManager.markFailed(item.id, error).catch(console.error);
        }
      });
    }

    // Инвалидируем кеш после успешной синхронизации
    if (result.success > 0) {
      this.invalidateCache();
    }

    return result;
  }

  /**
   * Обрабатывает одну операцию
   * Примечание: создаем клиент здесь, так как он нужен для каждой операции
   * @supabase/ssr использует синглтон внутри, поэтому это эффективно
   */
  private async processItem(item: SyncQueueItem): Promise<boolean> {
    const supabase = createClient();

    try {
      switch (item.operation) {
        case "create":
          await this.handleCreate(supabase, item);
          break;
        case "update":
          await this.handleUpdate(supabase, item);
          break;
        case "delete":
          await this.handleDelete(supabase, item);
          break;
        default:
          throw new Error(`Unknown operation: ${item.operation}`);
      }
      return true;
    } catch (error) {
      console.error(
        `Error processing ${item.operation} for ${item.table}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Обрабатывает операцию создания
   */
  private async handleCreate(
    supabase: ReturnType<typeof createClient>,
    item: SyncQueueItem
  ): Promise<void> {
    const { error } = await supabase
      .from(item.table)
      .insert(item.data as Record<string, unknown>);

    if (error) {
      throw error;
    }
  }

  /**
   * Обрабатывает операцию обновления
   */
  private async handleUpdate(
    supabase: ReturnType<typeof createClient>,
    item: SyncQueueItem
  ): Promise<void> {
    if (!item.record_id) {
      throw new Error("record_id is required for update operation");
    }

    const { error } = await supabase
      .from(item.table)
      .update(item.data as Record<string, unknown>)
      .eq("id", item.record_id);

    if (error) {
      throw error;
    }
  }

  /**
   * Обрабатывает операцию удаления
   */
  private async handleDelete(
    supabase: ReturnType<typeof createClient>,
    item: SyncQueueItem
  ): Promise<void> {
    if (!item.record_id) {
      throw new Error("record_id is required for delete operation");
    }

    const { error } = await supabase
      .from(item.table)
      .delete()
      .eq("id", item.record_id);

    if (error) {
      throw error;
    }
  }

  /**
   * Инвалидирует кеш TanStack Query после синхронизации
   * Инвалидирует все связанные кеши, так как синхронизация может затрагивать
   * любые данные (транзакции, категории, счета, статистику)
   */
  private invalidateCache(): void {
    invalidateAll(queryClient);
  }
}

/**
 * Глобальный экземпляр менеджера синхронизации
 */
export const syncManager = new SyncManager();
