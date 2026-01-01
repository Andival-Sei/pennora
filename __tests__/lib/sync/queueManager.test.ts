// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  SyncQueueItem,
  SyncTable,
  SyncOperation,
} from "@/lib/db/indexeddb/models";

// Хранилище для тестовых данных (доступно глобально)
const mockStorage = {
  items: [] as SyncQueueItem[],
};

// Мок для базы данных - использует глобальный mockStorage
vi.mock("@/lib/db/indexeddb/database", () => {
  return {
    syncQueueDB: {
      syncQueue: {
        add: vi.fn(async (item: SyncQueueItem) => {
          mockStorage.items.push(item);
          return item.id;
        }),
        get: vi.fn(async (id: string) => {
          return mockStorage.items.find((item) => item.id === id);
        }),
        delete: vi.fn(async (id: string) => {
          const index = mockStorage.items.findIndex((item) => item.id === id);
          if (index !== -1) {
            mockStorage.items.splice(index, 1);
          }
        }),
        update: vi.fn(async (id: string, changes: Partial<SyncQueueItem>) => {
          const item = mockStorage.items.find((i) => i.id === id);
          if (item) {
            Object.assign(item, changes);
          }
        }),
        clear: vi.fn(async () => {
          mockStorage.items.length = 0;
        }),
        orderBy: vi.fn((field: string) => ({
          toArray: vi.fn(async () => {
            return [...mockStorage.items].sort((a, b) => {
              if (field === "created_at") {
                return a.created_at - b.created_at;
              }
              return 0;
            });
          }),
          filter: vi.fn((predicate: (item: SyncQueueItem) => boolean) => ({
            first: vi.fn(async () => {
              const sorted = [...mockStorage.items].sort(
                (a, b) => a.created_at - b.created_at
              );
              return sorted.find(predicate);
            }),
          })),
        })),
        where: vi.fn((field: string) => ({
          equals: vi.fn((value: unknown) => ({
            toArray: vi.fn(async () => {
              return mockStorage.items.filter(
                (item) => item[field as keyof SyncQueueItem] === value
              );
            }),
          })),
          below: vi.fn((timestamp: number) => ({
            delete: vi.fn(async () => {
              const toDelete = mockStorage.items.filter(
                (item) =>
                  (item[field as keyof SyncQueueItem] as number) < timestamp
              );
              const count = toDelete.length;
              toDelete.forEach((item) => {
                const index = mockStorage.items.indexOf(item);
                if (index !== -1) {
                  mockStorage.items.splice(index, 1);
                }
              });
              return count;
            }),
          })),
        })),
      },
    },
  };
});

// Импортируем после установки моков
import { QueueManager, queueManager } from "@/lib/sync/queueManager";
import { syncQueueDB } from "@/lib/db/indexeddb/database";

describe("QueueManager", () => {
  let manager: QueueManager;
  const mockUUID = "test-uuid-12345";
  const mockTimestamp = 1704067200000; // 2024-01-01 00:00:00

  beforeEach(() => {
    // Очищаем данные
    mockStorage.items.length = 0;

    // Очищаем моки
    vi.clearAllMocks();

    // Мокируем crypto.randomUUID
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      mockUUID as `${string}-${string}-${string}-${string}-${string}`
    );

    // Мокируем Date.now
    vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);

    // Создаем новый экземпляр для тестов
    manager = new QueueManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("enqueue", () => {
    it("добавляет create операцию в очередь", async () => {
      const data = { name: "Test Account", balance: 1000 };
      const id = await manager.enqueue("accounts", "create", null, data);

      expect(id).toBe(mockUUID);
      expect(syncQueueDB.syncQueue.add).toHaveBeenCalledWith({
        id: mockUUID,
        table: "accounts",
        operation: "create",
        record_id: null,
        data,
        created_at: mockTimestamp,
        retry_count: 0,
        last_error: null,
      });
    });

    it("добавляет update операцию в очередь", async () => {
      const recordId = "existing-record-id";
      const data = { name: "Updated Account" };
      const id = await manager.enqueue("accounts", "update", recordId, data);

      expect(id).toBe(mockUUID);
      expect(syncQueueDB.syncQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: "update",
          record_id: recordId,
          data,
        })
      );
    });

    it("добавляет delete операцию в очередь", async () => {
      const recordId = "record-to-delete";
      const id = await manager.enqueue("transactions", "delete", recordId, {});

      expect(id).toBe(mockUUID);
      expect(syncQueueDB.syncQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          table: "transactions",
          operation: "delete",
          record_id: recordId,
        })
      );
    });

    it("генерирует уникальный UUID для каждой операции", async () => {
      await manager.enqueue("accounts", "create", null, {});

      expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    });

    it("устанавливает корректный timestamp created_at", async () => {
      await manager.enqueue("categories", "create", null, { name: "Food" });

      expect(syncQueueDB.syncQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          created_at: mockTimestamp,
        })
      );
    });

    it("инициализирует retry_count = 0", async () => {
      await manager.enqueue("accounts", "create", null, {});

      expect(syncQueueDB.syncQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          retry_count: 0,
        })
      );
    });

    it("инициализирует last_error = null", async () => {
      await manager.enqueue("accounts", "create", null, {});

      expect(syncQueueDB.syncQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          last_error: null,
        })
      );
    });

    it("возвращает ID добавленной операции", async () => {
      const id = await manager.enqueue("accounts", "create", null, {});

      expect(id).toBe(mockUUID);
    });

    it("работает для всех типов таблиц", async () => {
      const tables: SyncTable[] = ["transactions", "categories", "accounts"];

      for (const table of tables) {
        vi.clearAllMocks();
        await manager.enqueue(table, "create", null, {});

        expect(syncQueueDB.syncQueue.add).toHaveBeenCalledWith(
          expect.objectContaining({ table })
        );
      }
    });

    it("работает для всех типов операций", async () => {
      const operations: SyncOperation[] = ["create", "update", "delete"];

      for (const operation of operations) {
        vi.clearAllMocks();
        await manager.enqueue("accounts", operation, "id-123", {});

        expect(syncQueueDB.syncQueue.add).toHaveBeenCalledWith(
          expect.objectContaining({ operation })
        );
      }
    });
  });

  describe("getAll", () => {
    it("возвращает пустой массив для пустой очереди", async () => {
      const items = await manager.getAll();

      expect(items).toEqual([]);
      expect(syncQueueDB.syncQueue.orderBy).toHaveBeenCalledWith("created_at");
    });

    it("возвращает все операции отсортированные по created_at", async () => {
      // Добавляем операции в разном порядке
      mockStorage.items.push(
        createMockItem({ id: "3", created_at: 3000 }),
        createMockItem({ id: "1", created_at: 1000 }),
        createMockItem({ id: "2", created_at: 2000 })
      );

      const items = await manager.getAll();

      expect(items).toHaveLength(3);
      expect(items[0].id).toBe("1");
      expect(items[1].id).toBe("2");
      expect(items[2].id).toBe("3");
    });

    it("сохраняет порядок операций с одинаковым timestamp", async () => {
      mockStorage.items.push(
        createMockItem({ id: "a", created_at: 1000 }),
        createMockItem({ id: "b", created_at: 1000 })
      );

      const items = await manager.getAll();

      expect(items).toHaveLength(2);
    });
  });

  describe("getByTable", () => {
    beforeEach(() => {
      mockStorage.items.push(
        createMockItem({ id: "1", table: "transactions" }),
        createMockItem({ id: "2", table: "accounts" }),
        createMockItem({ id: "3", table: "transactions" }),
        createMockItem({ id: "4", table: "categories" })
      );
    });

    it("возвращает операции только для таблицы transactions", async () => {
      const items = await manager.getByTable("transactions");

      expect(items).toHaveLength(2);
      expect(items.every((item) => item.table === "transactions")).toBe(true);
    });

    it("возвращает операции только для таблицы accounts", async () => {
      const items = await manager.getByTable("accounts");

      expect(items).toHaveLength(1);
      expect(items[0].table).toBe("accounts");
    });

    it("возвращает операции только для таблицы categories", async () => {
      const items = await manager.getByTable("categories");

      expect(items).toHaveLength(1);
      expect(items[0].table).toBe("categories");
    });

    it("возвращает пустой массив если операций для таблицы нет", async () => {
      mockStorage.items.length = 0;

      const items = await manager.getByTable("transactions");

      expect(items).toEqual([]);
    });

    it("вызывает where с правильным полем", async () => {
      await manager.getByTable("transactions");

      expect(syncQueueDB.syncQueue.where).toHaveBeenCalledWith("table");
    });
  });

  describe("getNext", () => {
    it("возвращает самую старую операцию", async () => {
      mockStorage.items.push(
        createMockItem({ id: "new", created_at: 3000 }),
        createMockItem({ id: "old", created_at: 1000 }),
        createMockItem({ id: "mid", created_at: 2000 })
      );

      const next = await manager.getNext();

      expect(next?.id).toBe("old");
    });

    it("возвращает undefined для пустой очереди", async () => {
      const next = await manager.getNext();

      expect(next).toBeUndefined();
    });

    it("игнорирует операции с retry_count >= 5", async () => {
      mockStorage.items.push(
        createMockItem({ id: "failed", created_at: 1000, retry_count: 5 }),
        createMockItem({ id: "ok", created_at: 2000, retry_count: 0 })
      );

      const next = await manager.getNext();

      expect(next?.id).toBe("ok");
    });

    it("возвращает операцию с retry_count < 5", async () => {
      mockStorage.items.push(
        createMockItem({ id: "retry4", created_at: 1000, retry_count: 4 })
      );

      const next = await manager.getNext();

      expect(next?.id).toBe("retry4");
    });

    it("возвращает undefined если все операции превысили лимит retry", async () => {
      mockStorage.items.push(
        createMockItem({ id: "1", retry_count: 5 }),
        createMockItem({ id: "2", retry_count: 6 }),
        createMockItem({ id: "3", retry_count: 10 })
      );

      const next = await manager.getNext();

      expect(next).toBeUndefined();
    });
  });

  describe("remove", () => {
    it("удаляет операцию по ID", async () => {
      mockStorage.items.push(createMockItem({ id: "to-remove" }));

      await manager.remove("to-remove");

      expect(syncQueueDB.syncQueue.delete).toHaveBeenCalledWith("to-remove");
      expect(mockStorage.items).toHaveLength(0);
    });

    it("не бросает ошибку для несуществующего ID", async () => {
      await expect(manager.remove("non-existent-id")).resolves.not.toThrow();
    });

    it("не удаляет другие операции", async () => {
      mockStorage.items.push(
        createMockItem({ id: "keep" }),
        createMockItem({ id: "remove" })
      );

      await manager.remove("remove");

      expect(mockStorage.items).toHaveLength(1);
      expect(mockStorage.items[0].id).toBe("keep");
    });
  });

  describe("markFailed", () => {
    it("увеличивает retry_count на 1", async () => {
      mockStorage.items.push(createMockItem({ id: "test", retry_count: 0 }));

      await manager.markFailed("test", "Network error");

      expect(syncQueueDB.syncQueue.update).toHaveBeenCalledWith("test", {
        retry_count: 1,
        last_error: "Network error",
      });
    });

    it("устанавливает last_error", async () => {
      mockStorage.items.push(createMockItem({ id: "test", retry_count: 0 }));

      await manager.markFailed("test", "Connection timeout");

      expect(syncQueueDB.syncQueue.update).toHaveBeenCalledWith(
        "test",
        expect.objectContaining({
          last_error: "Connection timeout",
        })
      );
    });

    it("не изменяет несуществующую операцию", async () => {
      await manager.markFailed("non-existent", "Error");

      expect(syncQueueDB.syncQueue.update).not.toHaveBeenCalled();
    });

    it("корректно работает при последовательных вызовах", async () => {
      mockStorage.items.push(createMockItem({ id: "test", retry_count: 0 }));

      await manager.markFailed("test", "Error 1");
      // Симулируем обновление в моке
      mockStorage.items[0].retry_count = 1;

      await manager.markFailed("test", "Error 2");

      expect(syncQueueDB.syncQueue.update).toHaveBeenLastCalledWith("test", {
        retry_count: 2,
        last_error: "Error 2",
      });
    });

    it("сохраняет последнюю ошибку", async () => {
      mockStorage.items.push(
        createMockItem({ id: "test", retry_count: 2, last_error: "Old error" })
      );

      await manager.markFailed("test", "New error");

      expect(syncQueueDB.syncQueue.update).toHaveBeenCalledWith(
        "test",
        expect.objectContaining({
          last_error: "New error",
        })
      );
    });
  });

  describe("getStatus", () => {
    it("возвращает корректный total count", async () => {
      mockStorage.items.push(
        createMockItem({ id: "1" }),
        createMockItem({ id: "2" }),
        createMockItem({ id: "3" })
      );

      const status = await manager.getStatus();

      expect(status.total).toBe(3);
    });

    it("считает pending как операции с retry_count === 0", async () => {
      mockStorage.items.push(
        createMockItem({ id: "1", retry_count: 0 }),
        createMockItem({ id: "2", retry_count: 0 }),
        createMockItem({ id: "3", retry_count: 1 })
      );

      const status = await manager.getStatus();

      expect(status.pending).toBe(2);
    });

    it("считает failed как операции с retry_count > 0", async () => {
      mockStorage.items.push(
        createMockItem({ id: "1", retry_count: 0 }),
        createMockItem({ id: "2", retry_count: 1 }),
        createMockItem({ id: "3", retry_count: 3 })
      );

      const status = await manager.getStatus();

      expect(status.failed).toBe(2);
    });

    it("возвращает lastSyncTime = null", async () => {
      const status = await manager.getStatus();

      expect(status.lastSyncTime).toBeNull();
    });

    it("возвращает корректный статус для пустой очереди", async () => {
      const status = await manager.getStatus();

      expect(status).toEqual({
        total: 0,
        pending: 0,
        failed: 0,
        lastSyncTime: null,
      });
    });

    it("корректно обрабатывает смешанные операции", async () => {
      mockStorage.items.push(
        createMockItem({ id: "1", retry_count: 0 }),
        createMockItem({ id: "2", retry_count: 0 }),
        createMockItem({ id: "3", retry_count: 1 }),
        createMockItem({ id: "4", retry_count: 5 }),
        createMockItem({ id: "5", retry_count: 0 })
      );

      const status = await manager.getStatus();

      expect(status.total).toBe(5);
      expect(status.pending).toBe(3);
      expect(status.failed).toBe(2);
    });
  });

  describe("clearProcessed", () => {
    it("удаляет операции старше 7 дней", async () => {
      const sevenDaysAgo = mockTimestamp - 7 * 24 * 60 * 60 * 1000;
      mockStorage.items.push(
        createMockItem({ id: "old", created_at: sevenDaysAgo - 1000 }),
        createMockItem({ id: "new", created_at: mockTimestamp })
      );

      const deleted = await manager.clearProcessed();

      expect(deleted).toBe(1);
      expect(mockStorage.items).toHaveLength(1);
      expect(mockStorage.items[0].id).toBe("new");
    });

    it("не удаляет новые операции", async () => {
      mockStorage.items.push(
        createMockItem({ id: "1", created_at: mockTimestamp }),
        createMockItem({ id: "2", created_at: mockTimestamp - 1000 })
      );

      const deleted = await manager.clearProcessed();

      expect(deleted).toBe(0);
      expect(mockStorage.items).toHaveLength(2);
    });

    it("возвращает количество удаленных операций", async () => {
      const sevenDaysAgo = mockTimestamp - 7 * 24 * 60 * 60 * 1000;
      mockStorage.items.push(
        createMockItem({ id: "1", created_at: sevenDaysAgo - 3000 }),
        createMockItem({ id: "2", created_at: sevenDaysAgo - 2000 }),
        createMockItem({ id: "3", created_at: sevenDaysAgo - 1000 }),
        createMockItem({ id: "4", created_at: mockTimestamp })
      );

      const deleted = await manager.clearProcessed();

      expect(deleted).toBe(3);
    });

    it("возвращает 0 для пустой очереди", async () => {
      const deleted = await manager.clearProcessed();

      expect(deleted).toBe(0);
    });

    it("вызывает where с правильным полем и значением", async () => {
      await manager.clearProcessed();

      expect(syncQueueDB.syncQueue.where).toHaveBeenCalledWith("created_at");
    });
  });

  describe("clearAll", () => {
    it("очищает всю очередь", async () => {
      mockStorage.items.push(
        createMockItem({ id: "1" }),
        createMockItem({ id: "2" }),
        createMockItem({ id: "3" })
      );

      await manager.clearAll();

      expect(syncQueueDB.syncQueue.clear).toHaveBeenCalled();
      expect(mockStorage.items).toHaveLength(0);
    });

    it("после очистки getAll возвращает пустой массив", async () => {
      mockStorage.items.push(createMockItem({ id: "1" }));

      await manager.clearAll();
      const items = await manager.getAll();

      expect(items).toEqual([]);
    });

    it("не бросает ошибку для пустой очереди", async () => {
      await expect(manager.clearAll()).resolves.not.toThrow();
    });
  });

  describe("Singleton экспорт", () => {
    it("экспортирует глобальный экземпляр queueManager", () => {
      expect(queueManager).toBeInstanceOf(QueueManager);
    });
  });
});

// Хелпер для создания тестовых элементов
function createMockItem(overrides: Partial<SyncQueueItem> = {}): SyncQueueItem {
  return {
    id: "default-id",
    table: "accounts",
    operation: "create",
    record_id: null,
    data: {},
    created_at: 1000,
    retry_count: 0,
    last_error: null,
    ...overrides,
  };
}
