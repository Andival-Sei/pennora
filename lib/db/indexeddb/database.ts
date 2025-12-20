"use client";

import Dexie, { Table } from "dexie";
import type { SyncQueueItem } from "./models";

/**
 * База данных Dexie для очереди синхронизации
 * Хранит несинхронизированные операции для последующей отправки в Supabase
 */
class SyncQueueDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("PennoraSyncQueue");
    this.version(1).stores({
      // Индексы для быстрого поиска:
      // - id: первичный ключ
      // - created_at: для сортировки по времени
      // - table, operation: для фильтрации по типу операции
      syncQueue: "id, created_at, table, operation, [table+operation]",
    });
  }
}

/**
 * Экземпляр базы данных для очереди синхронизации
 */
export const syncQueueDB = new SyncQueueDatabase();
