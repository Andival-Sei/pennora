"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { clearAllCache } from "@/lib/query/clear";

interface LogoutButtonProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  children?: React.ReactNode;
}

/**
 * Кнопка выхода из аккаунта с очисткой кэша
 * Очищает все данные из React Query и IndexedDB перед выходом,
 * чтобы предотвратить показ данных предыдущего пользователя
 */
export function LogoutButton({
  className,
  variant = "destructive",
  children,
}: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    // Очищаем весь кэш перед выходом (синхронно для QueryClient)
    clearAllCache();

    // Вызываем серверный signOut после очистки кэша
    startTransition(() => {
      signOut();
    });
  }

  return (
    <Button
      type="button"
      onClick={handleLogout}
      variant={variant}
      className={className}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <LogOut className="h-4 w-4 mr-2 animate-spin" />
          {children || "Выход..."}
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          {children || "Выйти"}
        </>
      )}
    </Button>
  );
}
