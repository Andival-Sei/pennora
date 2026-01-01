// @vitest-environment jsdom
/**
 * Тесты для хуков синхронизации
 * Покрывает: useSyncStatusVisible, useSync
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { SyncResult } from "@/lib/types/sync";

// Мокаем зависимости ДО импорта тестируемых модулей
const mockSetPendingOperations = vi.fn();
const mockSyncAll = vi.fn();
const mockGetStatus = vi.fn();
const mockIsOnline = vi.fn();

let mockStoreState = {
  isOnline: true,
  isSyncing: false,
  status: "idle" as const,
  lastSyncTime: null as string | null,
  lastSyncResult: null as SyncResult | null,
  pendingOperations: 0,
  setPendingOperations: mockSetPendingOperations,
};

vi.mock("@/lib/stores/syncStore", () => ({
  useSyncStore: vi.fn(() => mockStoreState),
}));

vi.mock("@/lib/sync/syncManager", () => ({
  syncManager: {
    syncAll: () => mockSyncAll(),
  },
}));

vi.mock("@/lib/sync/queueManager", () => ({
  queueManager: {
    getStatus: () => mockGetStatus(),
  },
}));

vi.mock("@/lib/utils/network", () => ({
  isOnline: () => mockIsOnline(),
}));

// Импортируем после моков
import { useSyncStatusVisible, useSync } from "@/lib/hooks/useSync";
import { useSyncStore } from "@/lib/stores/syncStore";

const mockedUseSyncStore = vi.mocked(useSyncStore);

describe("useSyncStatusVisible", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      isOnline: true,
      isSyncing: false,
      status: "idle",
      lastSyncTime: null,
      lastSyncResult: null,
      pendingOperations: 0,
      setPendingOperations: mockSetPendingOperations,
    };
    mockedUseSyncStore.mockReturnValue(mockStoreState);
  });

  it("возвращает false когда всё в порядке (онлайн, нет операций, не синхронизируется)", () => {
    const { result } = renderHook(() => useSyncStatusVisible());
    expect(result.current).toBe(false);
  });

  it("возвращает true когда офлайн", () => {
    mockStoreState.isOnline = false;
    mockedUseSyncStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useSyncStatusVisible());
    expect(result.current).toBe(true);
  });

  it("возвращает true когда есть ожидающие операции", () => {
    mockStoreState.pendingOperations = 5;
    mockedUseSyncStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useSyncStatusVisible());
    expect(result.current).toBe(true);
  });

  it("возвращает true когда идёт синхронизация", () => {
    mockStoreState.isSyncing = true;
    mockedUseSyncStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useSyncStatusVisible());
    expect(result.current).toBe(true);
  });

  it("возвращает true при комбинации условий", () => {
    mockStoreState.isOnline = false;
    mockStoreState.pendingOperations = 3;
    mockStoreState.isSyncing = true;
    mockedUseSyncStore.mockReturnValue(mockStoreState);

    const { result } = renderHook(() => useSyncStatusVisible());
    expect(result.current).toBe(true);
  });
});

describe("useSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockStoreState = {
      isOnline: true,
      isSyncing: false,
      status: "idle",
      lastSyncTime: null,
      lastSyncResult: null,
      pendingOperations: 0,
      setPendingOperations: mockSetPendingOperations,
    };
    mockedUseSyncStore.mockReturnValue(mockStoreState);

    mockGetStatus.mockResolvedValue({ pending: 0, failed: 0 });
    mockSyncAll.mockResolvedValue({
      success: 0,
      failed: 0,
      total: 0,
      errors: [],
    });
    mockIsOnline.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("начальное состояние", () => {
    it("возвращает данные из store", () => {
      mockStoreState.isOnline = true;
      mockStoreState.isSyncing = false;
      mockStoreState.status = "idle";
      mockStoreState.pendingOperations = 3;
      mockedUseSyncStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useSync());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.status).toBe("idle");
      expect(result.current.pendingOperations).toBe(3);
    });

    // TODO: Требуется исправить взаимодействие fake timers и waitFor
    it.skip("обновляет pendingOperations при монтировании", async () => {
      mockGetStatus.mockResolvedValue({ pending: 5, failed: 2 });

      renderHook(() => useSync());

      await waitFor(() => {
        expect(mockGetStatus).toHaveBeenCalled();
        expect(mockSetPendingOperations).toHaveBeenCalledWith(7); // 5 + 2
      });
    });
  });

  describe("периодическое обновление", () => {
    // TODO: Требуется исправить взаимодействие fake timers и waitFor
    it.skip("обновляет pendingOperations каждые 30 секунд", async () => {
      mockGetStatus.mockResolvedValue({ pending: 1, failed: 0 });

      renderHook(() => useSync());

      // Первый вызов при монтировании
      await waitFor(() => {
        expect(mockGetStatus).toHaveBeenCalledTimes(1);
      });

      // Через 30 секунд
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockGetStatus).toHaveBeenCalledTimes(2);
      });

      // Ещё через 30 секунд
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockGetStatus).toHaveBeenCalledTimes(3);
      });
    });

    // TODO: Требуется исправить взаимодействие fake timers и waitFor
    it.skip("очищает интервал при размонтировании", async () => {
      mockGetStatus.mockResolvedValue({ pending: 0, failed: 0 });

      const { unmount } = renderHook(() => useSync());

      await waitFor(() => {
        expect(mockGetStatus).toHaveBeenCalledTimes(1);
      });

      unmount();

      // После размонтирования интервал не должен вызываться
      await act(async () => {
        vi.advanceTimersByTime(60000);
      });

      // Должен остаться только один вызов
      expect(mockGetStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe("syncNow", () => {
    it("вызывает syncManager.syncAll() при наличии интернета", async () => {
      mockIsOnline.mockReturnValue(true);
      mockSyncAll.mockResolvedValue({
        success: 1,
        failed: 0,
        total: 1,
        errors: [],
      });

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockSyncAll).toHaveBeenCalled();
    });

    it("выбрасывает ошибку при отсутствии интернета", async () => {
      mockIsOnline.mockReturnValue(false);

      const { result } = renderHook(() => useSync());

      await expect(result.current.syncNow()).rejects.toThrow(
        "No internet connection"
      );
      expect(mockSyncAll).not.toHaveBeenCalled();
    });

    it("не вызывает синхронизацию если уже идёт", async () => {
      mockStoreState.isSyncing = true;
      mockedUseSyncStore.mockReturnValue(mockStoreState);
      mockIsOnline.mockReturnValue(true);

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockSyncAll).not.toHaveBeenCalled();
    });
  });

  describe("lastSyncTimeFormatted", () => {
    it("возвращает null если нет времени последней синхронизации", () => {
      mockStoreState.lastSyncTime = null;
      mockedUseSyncStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useSync());
      expect(result.current.lastSyncTimeFormatted).toBeNull();
    });

    it("вычисляет минуты, часы, дни корректно", () => {
      // 2 часа 30 минут назад
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000 - 30 * 60 * 1000
      );
      mockStoreState.lastSyncTime = twoHoursAgo.toISOString();
      mockedUseSyncStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useSync());
      const formatted = result.current.lastSyncTimeFormatted;

      expect(formatted).toBeDefined();
      expect(formatted!.hours).toBe(2);
      expect(formatted!.minutes).toBeGreaterThanOrEqual(150); // 2.5 часа = 150 минут
      expect(formatted!.days).toBe(0);
    });

    it("вычисляет дни для старой синхронизации", () => {
      // 3 дня назад
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      mockStoreState.lastSyncTime = threeDaysAgo.toISOString();
      mockedUseSyncStore.mockReturnValue(mockStoreState);

      const { result } = renderHook(() => useSync());
      const formatted = result.current.lastSyncTimeFormatted;

      expect(formatted).toBeDefined();
      expect(formatted!.days).toBe(3);
    });
  });

  describe("автоматическая синхронизация", () => {
    // TODO: Требуется исправить взаимодействие fake timers и waitFor
    it.skip("запускает синхронизацию при восстановлении сети с ожидающими операциями", async () => {
      // Начинаем офлайн
      mockStoreState.isOnline = false;
      mockStoreState.pendingOperations = 3;
      mockedUseSyncStore.mockReturnValue(mockStoreState);

      const { rerender } = renderHook(() => useSync());

      // Восстанавливаем сеть
      mockStoreState.isOnline = true;
      mockedUseSyncStore.mockReturnValue(mockStoreState);

      rerender();

      await waitFor(() => {
        expect(mockSyncAll).toHaveBeenCalled();
      });
    });

    it("не запускает синхронизацию без ожидающих операций", async () => {
      mockStoreState.isOnline = true;
      mockStoreState.pendingOperations = 0;
      mockedUseSyncStore.mockReturnValue(mockStoreState);

      renderHook(() => useSync());

      // Даём время на возможный вызов
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockSyncAll).not.toHaveBeenCalled();
    });

    it("не запускает синхронизацию если уже идёт", async () => {
      mockStoreState.isOnline = true;
      mockStoreState.pendingOperations = 3;
      mockStoreState.isSyncing = true;
      mockedUseSyncStore.mockReturnValue(mockStoreState);

      renderHook(() => useSync());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockSyncAll).not.toHaveBeenCalled();
    });
  });
});
