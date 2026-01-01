// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import type { SyncQueueItem } from "@/lib/db/indexeddb/models";
import type { SyncResult } from "@/lib/types/sync";

// Настраиваем моки БЕЗ top-level переменных в factory
vi.mock("@/lib/sync/queueManager", () => ({
  queueManager: {
    getAll: vi.fn(),
    getByTable: vi.fn(),
    remove: vi.fn(),
    markFailed: vi.fn(),
    getStatus: vi.fn(),
  },
}));

vi.mock("@/lib/db/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

vi.mock("@/lib/stores/syncStore", () => ({
  useSyncStore: {
    getState: vi.fn(() => ({
      isOnline: true,
      isSyncing: false,
      status: "idle",
      lastSyncTime: null,
      lastSyncResult: null,
      pendingOperations: 0,
      setOnline: vi.fn(),
      setSyncing: vi.fn(),
      setStatus: vi.fn(),
      setLastSyncTime: vi.fn(),
      setLastSyncResult: vi.fn(),
      setPendingOperations: vi.fn(),
    })),
  },
}));

vi.mock("@/lib/query/client", () => ({
  queryClient: {},
}));

vi.mock("@/lib/query/invalidation", () => ({
  invalidateAll: vi.fn(),
}));

vi.mock("@/lib/utils/logger", () => ({
  createModuleLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock("@/lib/utils/network", () => ({
  isNetworkError: vi.fn(() => false),
}));

// Импортируем после установки моков
import { SyncManager, syncManager } from "@/lib/sync/syncManager";
import { createClient } from "@/lib/db/supabase/client";
import { queueManager } from "@/lib/sync/queueManager";
import { useSyncStore } from "@/lib/stores/syncStore";
import { invalidateAll } from "@/lib/query/invalidation";
import { toast } from "sonner";
import { isNetworkError } from "@/lib/utils/network";
import { createModuleLogger } from "@/lib/utils/logger";

// Типизированные моки
const mockedQueueManager = vi.mocked(queueManager);
const mockedCreateClient = createClient as Mock;
const mockedInvalidateAll = vi.mocked(invalidateAll);
const mockedIsNetworkError = vi.mocked(isNetworkError);
const mockedGetState = useSyncStore.getState as Mock;

describe("SyncManager", () => {
  let manager: SyncManager;
  const mockTimestamp = 1704067200000;

  // Хелперы для доступа к store методам
  let mockStoreState: ReturnType<typeof useSyncStore.getState>;

  // Мок Supabase методы
  let mockInsert: Mock;
  let mockUpdate: Mock;
  let mockDelete: Mock;
  let mockEq: Mock;
  let mockFrom: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockTimestamp);

    // Настраиваем store mock
    mockStoreState = {
      isOnline: true,
      isSyncing: false,
      status: "idle",
      lastSyncTime: null,
      lastSyncResult: null,
      pendingOperations: 0,
      setOnline: vi.fn(),
      setSyncing: vi.fn(),
      setStatus: vi.fn(),
      setLastSyncTime: vi.fn(),
      setLastSyncResult: vi.fn(),
      setPendingOperations: vi.fn(),
    };
    mockedGetState.mockReturnValue(mockStoreState);

    // Настраиваем Supabase mock
    mockEq = vi.fn(() => Promise.resolve({ error: null }));
    mockInsert = vi.fn(() => Promise.resolve({ error: null }));
    mockUpdate = vi.fn(() => ({ eq: mockEq }));
    mockDelete = vi.fn(() => ({ eq: mockEq }));
    mockFrom = vi.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    }));
    mockedCreateClient.mockReturnValue({ from: mockFrom });

    // Настраиваем queueManager mock
    mockedQueueManager.getAll.mockResolvedValue([]);
    mockedQueueManager.getByTable.mockResolvedValue([]);
    mockedQueueManager.remove.mockResolvedValue(undefined);
    mockedQueueManager.markFailed.mockResolvedValue(undefined);
    mockedQueueManager.getStatus.mockResolvedValue({
      total: 0,
      pending: 0,
      failed: 0,
      lastSyncTime: null,
    });

    // Создаем новый экземпляр
    manager = new SyncManager();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("initialize", () => {
    it("не выполняется на сервере (window === undefined)", () => {
      const originalWindow = global.window;
      // @ts-expect-error - симулируем серверное окружение
      delete global.window;

      const serverManager = new SyncManager();
      serverManager.initialize();

      // Проверяем что setOnline не был вызван
      expect(mockStoreState.setOnline).not.toHaveBeenCalled();

      global.window = originalWindow;
    });

    it("добавляет listener для события online", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      manager.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "online",
        expect.any(Function)
      );
    });

    it("добавляет listener для события offline", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      manager.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "offline",
        expect.any(Function)
      );
    });

    it("устанавливает начальный статус онлайн", () => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.initialize();

      expect(mockStoreState.setOnline).toHaveBeenCalledWith(true);
    });

    it("устанавливает статус офлайн если нет сети", () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });

      manager.initialize();

      expect(mockStoreState.setOnline).toHaveBeenCalledWith(false);
    });

    it("запускает syncAll при инициализации если онлайн", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.initialize();

      // Ждем только микротасков, не трогая setInterval
      await Promise.resolve();
      await Promise.resolve();

      expect(mockStoreState.setSyncing).toHaveBeenCalled();
    });

    it("настраивает периодическую синхронизацию каждые 5 минут", () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      manager.initialize();

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000
      );
    });

    it("периодическая синхронизация вызывает syncAll если онлайн", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });

      manager.initialize();
      vi.clearAllMocks();

      // Перематываем на 5 минут вперед
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

      expect(mockStoreState.setSyncing).toHaveBeenCalled();
    });

    it("периодическая синхронизация не вызывается если офлайн", async () => {
      // Сначала устанавливаем офлайн
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });

      manager.initialize();
      vi.clearAllMocks();

      // Перематываем на 5 минут вперед
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

      // setSyncing не должен вызываться потому что мы офлайн
      expect(mockStoreState.setSyncing).not.toHaveBeenCalled();
    });
  });

  describe("syncAll", () => {
    it("возвращает текущий результат если синхронизация уже идет", async () => {
      const existingResult: SyncResult = {
        success: 5,
        failed: 1,
        total: 6,
        errors: [],
      };
      mockStoreState.lastSyncResult = existingResult;

      // Запускаем первую синхронизацию
      const firstPromise = manager.syncAll();

      // Запускаем вторую пока первая не завершилась
      const secondResult = await manager.syncAll();

      expect(secondResult).toEqual(existingResult);

      await firstPromise;
    });

    it("возвращает пустой результат если синхронизация идет и нет lastSyncResult", async () => {
      mockStoreState.lastSyncResult = null;

      // Запускаем первую синхронизацию
      const firstPromise = manager.syncAll();

      // Запускаем вторую пока первая не завершилась
      const secondResult = await manager.syncAll();

      expect(secondResult).toEqual({
        success: 0,
        failed: 0,
        total: 0,
        errors: [],
      });

      await firstPromise;
    });

    it('устанавливает статус "syncing" в начале', async () => {
      await manager.syncAll();

      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(true);
      expect(mockStoreState.setStatus).toHaveBeenCalledWith("syncing");
    });

    it('устанавливает статус "success" после успешной синхронизации', async () => {
      await manager.syncAll();

      expect(mockStoreState.setStatus).toHaveBeenCalledWith("success");
    });

    it("обновляет lastSyncTime после синхронизации", async () => {
      await manager.syncAll();

      expect(mockStoreState.setLastSyncTime).toHaveBeenCalledWith(
        mockTimestamp
      );
    });

    it("обновляет pendingOperations после синхронизации", async () => {
      mockedQueueManager.getStatus.mockResolvedValue({
        total: 5,
        pending: 3,
        failed: 2,
        lastSyncTime: null,
      });

      await manager.syncAll();

      expect(mockStoreState.setPendingOperations).toHaveBeenCalledWith(5);
    });

    it("показывает toast.success при успешной синхронизации", async () => {
      mockedQueueManager.getAll.mockResolvedValue([
        createMockItem({ id: "1", operation: "create" }),
      ]);

      await manager.syncAll();

      expect(toast.success).toHaveBeenCalledWith("Synced 1 operations");
    });

    it("не показывает toast если нечего синхронизировать", async () => {
      mockedQueueManager.getAll.mockResolvedValue([]);

      await manager.syncAll();

      expect(toast.success).not.toHaveBeenCalled();
    });

    it('устанавливает статус "error" при ошибке', async () => {
      mockedQueueManager.getAll.mockRejectedValue(new Error("DB error"));

      await manager.syncAll();

      expect(mockStoreState.setStatus).toHaveBeenCalledWith("error");
    });

    it("показывает toast.error при ошибке", async () => {
      mockedQueueManager.getAll.mockRejectedValue(new Error("DB error"));

      await manager.syncAll();

      expect(toast.error).toHaveBeenCalledWith("Sync error");
    });

    it("возвращает пустой результат для пустой очереди", async () => {
      mockedQueueManager.getAll.mockResolvedValue([]);

      const result = await manager.syncAll();

      expect(result).toEqual({
        success: 0,
        failed: 0,
        total: 0,
        errors: [],
      });
    });

    it("сбрасывает syncInProgress в finally", async () => {
      await manager.syncAll();

      expect(mockStoreState.setSyncing).toHaveBeenLastCalledWith(false);
    });

    it("сбрасывает syncing=false даже при ошибке", async () => {
      mockedQueueManager.getAll.mockRejectedValue(new Error("Error"));

      await manager.syncAll();

      expect(mockStoreState.setSyncing).toHaveBeenLastCalledWith(false);
    });
  });

  describe("syncTable", () => {
    it("синхронизирует только операции указанной таблицы", async () => {
      mockedQueueManager.getByTable.mockResolvedValue([
        createMockItem({ id: "1", table: "transactions", operation: "create" }),
      ]);

      await manager.syncTable("transactions");

      expect(mockedQueueManager.getByTable).toHaveBeenCalledWith(
        "transactions"
      );
    });

    it("возвращает результат синхронизации", async () => {
      mockedQueueManager.getByTable.mockResolvedValue([
        createMockItem({ id: "1", table: "accounts", operation: "create" }),
      ]);

      const result = await manager.syncTable("accounts");

      expect(result.total).toBe(1);
    });

    it("работает для всех типов таблиц", async () => {
      const tables = ["transactions", "categories", "accounts"] as const;

      for (const table of tables) {
        mockedQueueManager.getByTable.mockResolvedValue([
          createMockItem({ id: "1", table, operation: "create" }),
        ]);

        await manager.syncTable(table);

        expect(mockedQueueManager.getByTable).toHaveBeenCalledWith(table);
      }
    });
  });

  describe("processItems (через syncAll)", () => {
    it("обрабатывает операции батчами по 10", async () => {
      // Создаем 25 операций
      const items = Array.from({ length: 25 }, (_, i) =>
        createMockItem({ id: `item-${i}`, operation: "create" })
      );
      mockedQueueManager.getAll.mockResolvedValue(items);

      await manager.syncAll();

      // Должно быть 25 вызовов createClient (по одному на операцию)
      expect(mockedCreateClient).toHaveBeenCalledTimes(25);
    });

    it("удаляет успешные операции из очереди", async () => {
      mockedQueueManager.getAll.mockResolvedValue([
        createMockItem({ id: "success-1", operation: "create" }),
      ]);

      await manager.syncAll();

      expect(mockedQueueManager.remove).toHaveBeenCalledWith("success-1");
    });

    it("помечает неудачные операции как failed", async () => {
      const errorItem = createMockItem({
        id: "fail-1",
        operation: "create",
      });
      mockedQueueManager.getAll.mockResolvedValue([errorItem]);
      mockInsert.mockResolvedValueOnce({
        error: { message: "Insert failed" },
      });

      await manager.syncAll();

      expect(mockedQueueManager.markFailed).toHaveBeenCalledWith(
        "fail-1",
        expect.any(String)
      );
    });

    it("считает success и failed корректно", async () => {
      mockedQueueManager.getAll.mockResolvedValue([
        createMockItem({ id: "1", operation: "create" }),
        createMockItem({ id: "2", operation: "create" }),
        createMockItem({ id: "3", operation: "create" }),
      ]);

      // Первые две успешны, третья - ошибка
      mockInsert
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: { message: "Error" } });

      const result = await manager.syncAll();

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.total).toBe(3);
    });

    it("собирает ошибки в массив errors", async () => {
      mockedQueueManager.getAll.mockResolvedValue([
        createMockItem({ id: "fail-1", operation: "create" }),
      ]);
      mockInsert.mockResolvedValueOnce({
        error: { message: "Database error" },
      });

      const result = await manager.syncAll();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].operationId).toBe("fail-1");
    });

    it("инвалидирует кеш при success > 0", async () => {
      mockedQueueManager.getAll.mockResolvedValue([
        createMockItem({ id: "1", operation: "create" }),
      ]);

      await manager.syncAll();

      expect(mockedInvalidateAll).toHaveBeenCalled();
    });

    it("не инвалидирует кеш если success = 0", async () => {
      mockedQueueManager.getAll.mockResolvedValue([
        createMockItem({ id: "1", operation: "create" }),
      ]);
      mockInsert.mockResolvedValueOnce({ error: { message: "Error" } });

      await manager.syncAll();

      expect(mockedInvalidateAll).not.toHaveBeenCalled();
    });
  });

  describe("processItem operations", () => {
    describe("create operation", () => {
      it("вызывает supabase.from(table).insert(data)", async () => {
        const item = createMockItem({
          id: "1",
          table: "accounts",
          operation: "create",
          data: { name: "Test Account" },
        });
        mockedQueueManager.getAll.mockResolvedValue([item]);

        await manager.syncAll();

        expect(mockFrom).toHaveBeenCalledWith("accounts");
        expect(mockInsert).toHaveBeenCalledWith({ name: "Test Account" });
      });

      it("возвращает true при успехе", async () => {
        mockedQueueManager.getAll.mockResolvedValue([
          createMockItem({ id: "1", operation: "create" }),
        ]);

        const result = await manager.syncAll();

        expect(result.success).toBe(1);
      });

      it("бросает ошибку при неудаче", async () => {
        mockedQueueManager.getAll.mockResolvedValue([
          createMockItem({ id: "1", operation: "create" }),
        ]);
        mockInsert.mockResolvedValueOnce({
          error: { message: "Insert error" },
        });

        const result = await manager.syncAll();

        expect(result.failed).toBe(1);
      });
    });

    describe("update operation", () => {
      it("вызывает supabase.from(table).update(data).eq('id', record_id)", async () => {
        const item = createMockItem({
          id: "1",
          table: "accounts",
          operation: "update",
          record_id: "record-123",
          data: { name: "Updated" },
        });
        mockedQueueManager.getAll.mockResolvedValue([item]);

        await manager.syncAll();

        expect(mockFrom).toHaveBeenCalledWith("accounts");
        expect(mockUpdate).toHaveBeenCalledWith({ name: "Updated" });
        expect(mockEq).toHaveBeenCalledWith("id", "record-123");
      });

      it("бросает ошибку если record_id отсутствует", async () => {
        const item = createMockItem({
          id: "1",
          operation: "update",
          record_id: null,
        });
        mockedQueueManager.getAll.mockResolvedValue([item]);

        const result = await manager.syncAll();

        expect(result.failed).toBe(1);
        expect(result.errors[0].error).toContain("record_id is required");
      });

      it("бросает ошибку при неудаче Supabase", async () => {
        mockedQueueManager.getAll.mockResolvedValue([
          createMockItem({
            id: "1",
            operation: "update",
            record_id: "123",
          }),
        ]);
        mockEq.mockResolvedValueOnce({ error: { message: "Update failed" } });

        const result = await manager.syncAll();

        expect(result.failed).toBe(1);
      });
    });

    describe("delete operation", () => {
      it("вызывает supabase.from(table).delete().eq('id', record_id)", async () => {
        const item = createMockItem({
          id: "1",
          table: "transactions",
          operation: "delete",
          record_id: "record-456",
        });
        mockedQueueManager.getAll.mockResolvedValue([item]);

        await manager.syncAll();

        expect(mockFrom).toHaveBeenCalledWith("transactions");
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith("id", "record-456");
      });

      it("бросает ошибку если record_id отсутствует", async () => {
        const item = createMockItem({
          id: "1",
          operation: "delete",
          record_id: null,
        });
        mockedQueueManager.getAll.mockResolvedValue([item]);

        const result = await manager.syncAll();

        expect(result.failed).toBe(1);
        expect(result.errors[0].error).toContain("record_id is required");
      });

      it("бросает ошибку при неудаче Supabase", async () => {
        mockedQueueManager.getAll.mockResolvedValue([
          createMockItem({
            id: "1",
            operation: "delete",
            record_id: "123",
          }),
        ]);
        mockEq.mockResolvedValueOnce({ error: { message: "Delete failed" } });

        const result = await manager.syncAll();

        expect(result.failed).toBe(1);
      });
    });

    describe("unknown operation", () => {
      it("бросает ошибку для неизвестной операции", async () => {
        const item = createMockItem({ id: "1" });
        // @ts-expect-error - тестируем неизвестную операцию
        item.operation = "unknown";
        mockedQueueManager.getAll.mockResolvedValue([item]);

        const result = await manager.syncAll();

        expect(result.failed).toBe(1);
        expect(result.errors[0].error).toContain("Unknown operation");
      });
    });
  });

  describe("Online/Offline обработка", () => {
    it("обновляет isOnline в store при смене статуса на online", () => {
      manager.initialize();

      // Симулируем событие online
      const onlineEvent = new Event("online");
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(onlineEvent);

      expect(mockStoreState.setOnline).toHaveBeenCalledWith(true);
    });

    it("обновляет isOnline в store при смене статуса на offline", () => {
      manager.initialize();

      // Симулируем событие offline
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });
      const offlineEvent = new Event("offline");
      window.dispatchEvent(offlineEvent);

      expect(mockStoreState.setOnline).toHaveBeenCalledWith(false);
    });

    it("обрабатывает ошибку syncAll при инициализации без падения", () => {
      mockedQueueManager.getAll.mockRejectedValue(new Error("Network error"));

      // initialize не должен бросать ошибку даже если syncAll падает
      // потому что ошибка обрабатывается в catch блоке
      expect(() => manager.initialize()).not.toThrow();
    });
  });

  describe("Singleton экспорт", () => {
    it("экспортирует глобальный экземпляр syncManager", () => {
      expect(syncManager).toBeInstanceOf(SyncManager);
    });
  });

  describe("Error logging", () => {
    it("вызывает isNetworkError для классификации ошибок", async () => {
      const testError = new Error("Test error");
      mockedQueueManager.getAll.mockRejectedValue(testError);

      await manager.syncAll();

      expect(mockedIsNetworkError).toHaveBeenCalledWith(testError);
    });

    it("устанавливает статус error при ошибке синхронизации", async () => {
      mockedQueueManager.getAll.mockRejectedValue(
        new Error("Unexpected error")
      );

      await manager.syncAll();

      expect(mockStoreState.setStatus).toHaveBeenCalledWith("error");
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
