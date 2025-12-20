"use client";

import { create } from "zustand";
import type { SyncStatus, SyncResult } from "@/lib/types/sync";

interface SyncStore {
  // Состояние
  isOnline: boolean;
  isSyncing: boolean;
  status: SyncStatus;
  lastSyncTime: number | null;
  pendingOperations: number;
  lastSyncResult: SyncResult | null;

  // Действия
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setStatus: (status: SyncStatus) => void;
  setLastSyncTime: (time: number | null) => void;
  setPendingOperations: (count: number) => void;
  setLastSyncResult: (result: SyncResult | null) => void;
}

/**
 * Zustand store для управления состоянием синхронизации
 */
export const useSyncStore = create<SyncStore>((set) => ({
  // Начальное состояние
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  status: "idle",
  lastSyncTime: null,
  pendingOperations: 0,
  lastSyncResult: null,

  // Действия
  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setStatus: (status) => set({ status }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setPendingOperations: (count) => set({ pendingOperations: count }),
  setLastSyncResult: (result) => set({ lastSyncResult: result }),
}));
