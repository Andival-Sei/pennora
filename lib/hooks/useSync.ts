"use client";

import { useEffect } from "react";
import { useSyncStore } from "@/lib/stores/syncStore";
import { syncManager } from "@/lib/sync/syncManager";
import { queueManager } from "@/lib/sync/queueManager";
import { isOnline } from "@/lib/utils/network";

/**
 * Хук для работы с синхронизацией данных
 * Предоставляет состояние синхронизации и методы для управления
 */
export function useSync() {
  const {
    isOnline: isOnlineState,
    isSyncing,
    status,
    lastSyncTime,
    pendingOperations,
    lastSyncResult,
    setPendingOperations,
  } = useSyncStore();

  // Обновляем количество ожидающих операций при монтировании и периодически
  useEffect(() => {
    const updatePendingCount = async () => {
      const queueStatus = await queueManager.getStatus();
      setPendingOperations(queueStatus.pending + queueStatus.failed);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 30000); // Каждые 30 секунд

    return () => clearInterval(interval);
  }, [setPendingOperations]);

  // Автоматическая синхронизация при восстановлении сети
  useEffect(() => {
    if (isOnlineState && pendingOperations > 0 && !isSyncing) {
      syncManager.syncAll().catch((err) => {
        console.error("Error during auto-sync:", err);
      });
    }
  }, [isOnlineState, pendingOperations, isSyncing]);

  /**
   * Запускает синхронизацию вручную
   */
  const syncNow = async () => {
    if (!isOnline()) {
      throw new Error("No internet connection");
    }
    if (isSyncing) {
      return; // Уже идет синхронизация
    }
    return syncManager.syncAll();
  };

  /**
   * Форматирует время последней синхронизации
   * Возвращает объект с числовыми значениями для использования в переводах
   */
  const formatLastSyncTime = (): {
    minutes: number;
    hours: number;
    days: number;
  } | null => {
    if (!lastSyncTime) return null;
    const date = new Date(lastSyncTime);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return { minutes, hours, days };
  };

  return {
    isOnline: isOnlineState,
    isSyncing,
    status,
    lastSyncTime,
    lastSyncTimeFormatted: formatLastSyncTime(),
    pendingOperations,
    lastSyncResult,
    syncNow,
  };
}
