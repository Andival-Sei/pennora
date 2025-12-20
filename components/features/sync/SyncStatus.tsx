"use client";

import { useState } from "react";
import { useSync } from "@/lib/hooks/useSync";
import { useTranslations } from "next-intl";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Компонент статуса синхронизации
 * Отображает текущее состояние синхронизации и позволяет запустить её вручную
 */
export function SyncStatus() {
  const [mounted] = useState(() => {
    if (typeof window !== "undefined") {
      return true;
    }
    return false;
  });
  const t = useTranslations("sync");
  const {
    isOnline,
    isSyncing,
    status,
    lastSyncTimeFormatted,
    pendingOperations,
    syncNow,
  } = useSync();

  const handleSync = async () => {
    try {
      await syncNow();
    } catch (error) {
      console.error("Error syncing:", error);
    }
  };

  // Не рендерим на сервере
  if (!mounted) {
    return null;
  }

  // Не показываем компонент, если нет ожидающих операций и мы онлайн
  if (isOnline && pendingOperations === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2",
        !isOnline && "border-orange-500/50 bg-orange-500/10",
        isSyncing && "border-blue-500/50 bg-blue-500/10",
        status === "success" && "border-green-500/50 bg-green-500/10",
        status === "error" && "border-red-500/50 bg-red-500/10"
      )}
    >
      {/* Иконка статуса */}
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <WifiOff className="h-4 w-4 text-orange-500" />
        ) : isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
        ) : status === "success" ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : status === "error" ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Wifi className="h-4 w-4 text-gray-500" />
        )}

        {/* Текст статуса */}
        <div className="text-sm">
          {!isOnline ? (
            <span className="text-orange-600 dark:text-orange-400">
              {t("offlineMode")}
            </span>
          ) : isSyncing ? (
            <span className="text-blue-600 dark:text-blue-400">
              {t("syncing")}
            </span>
          ) : pendingOperations > 0 ? (
            <span className="text-gray-600 dark:text-gray-400">
              {t("pendingOperations", { count: pendingOperations })}
            </span>
          ) : lastSyncTimeFormatted ? (
            <span className="text-gray-600 dark:text-gray-400">
              {lastSyncTimeFormatted.minutes < 1
                ? t("syncedJustNow")
                : lastSyncTimeFormatted.minutes < 60
                  ? t("syncedMinutesAgo", {
                      count: lastSyncTimeFormatted.minutes,
                    })
                  : lastSyncTimeFormatted.hours < 24
                    ? t("syncedHoursAgo", {
                        count: lastSyncTimeFormatted.hours,
                      })
                    : t("syncedDaysAgo", { count: lastSyncTimeFormatted.days })}
            </span>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              {t("readyToSync")}
            </span>
          )}
        </div>
      </div>

      {/* Кнопка синхронизации */}
      {isOnline && (pendingOperations > 0 || isSyncing) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="ml-auto h-7 px-2 text-xs"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              {t("syncing")}
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-3 w-3" />
              {t("syncNow")}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
