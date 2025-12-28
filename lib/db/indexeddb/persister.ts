"use client";

import Dexie, { Table } from "dexie";

/**
 * База данных для кеша TanStack Query в IndexedDB
 */
class QueryCacheDB extends Dexie {
  cache!: Table<{ key: string; value: string }, string>;

  constructor() {
    super("PennoraQueryCache");
    this.version(1).stores({
      cache: "key",
    });
  }
}

const db = new QueryCacheDB();

/**
 * IndexedDB адаптер для TanStack Query persister
 * Реализует интерфейс AsyncStorage
 */
export const indexedDBStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const item = await db.cache.get(key);
      return item?.value ?? null;
    } catch (error) {
      console.error("Error reading from IndexedDB:", error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await db.cache.put({ key, value });
    } catch (error) {
      console.error("Error writing to IndexedDB:", error);
      throw error;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await db.cache.delete(key);
    } catch (error) {
      console.error("Error removing from IndexedDB:", error);
      throw error;
    }
  },
  /**
   * Очищает весь кэш из IndexedDB
   * Используется при выходе из аккаунта для удаления всех данных предыдущего пользователя
   */
  clear: async (): Promise<void> => {
    try {
      await db.cache.clear();
    } catch (error) {
      console.error("Error clearing IndexedDB cache:", error);
      throw error;
    }
  },
};
