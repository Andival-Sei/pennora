"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Страница для офлайн режима
 * Показывается когда пользователь пытается загрузить страницу без интернета
 * Должна быть клиентским компонентом для работы в офлайн режиме
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Нет подключения к интернету
          </h1>
          <p className="text-muted-foreground">
            Похоже, что вы не подключены к интернету. Проверьте подключение и
            попробуйте снова.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => {
              window.location.reload();
            }}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить страницу
          </Button>

          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/dashboard">Перейти на главную</Link>
          </Button>
        </div>

        <div className="pt-4 text-sm text-muted-foreground">
          <p>
            Приложение работает в офлайн-режиме. Ваши данные будут
            синхронизированы при восстановлении подключения.
          </p>
        </div>
      </div>
    </div>
  );
}
