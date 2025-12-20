"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/providers";
import { setLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/request";
import type { CurrencyCode } from "@/lib/currency/rates";

type Theme = "light" | "dark" | "system";

interface UseUnsavedChangesProps {
  hasChanges: boolean;
  originalTheme: Theme;
  originalLocale: Locale;
  originalDisplayCurrency: CurrencyCode;
  currentTheme: Theme;
  currentLocale: Locale;
  currentDisplayCurrency: CurrencyCode;
  onReset: () => void;
}

/**
 * Хук для обработки несохранённых изменений при выходе со страницы
 */
export function useUnsavedChanges({
  hasChanges,
  originalTheme,
  originalLocale,
  originalDisplayCurrency,
  currentTheme,
  currentLocale,
  currentDisplayCurrency,
  onReset,
}: UseUnsavedChangesProps) {
  const pathname = usePathname();
  const { setTheme: setThemeProvider } = useTheme();

  useEffect(() => {
    // Обработчик перед уходом со страницы (закрытие вкладки/браузера)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  // Отслеживаем изменение пути - если уходим со страницы настроек, возвращаем настройки
  useEffect(() => {
    // Если уходим со страницы настроек приложения и есть несохранённые изменения
    if (!pathname?.includes("/dashboard/settings/app") && hasChanges) {
      // Возвращаем тему
      setThemeProvider(originalTheme);
      if (typeof window !== "undefined") {
        localStorage.setItem("pennora-theme", originalTheme);
      }
      
      // Возвращаем язык
      if (currentLocale !== originalLocale) {
        setLocale(originalLocale);
      }
      
      // Вызываем callback для сброса состояния
      onReset();
    }
  }, [
    pathname,
    hasChanges,
    originalTheme,
    originalLocale,
    currentLocale,
    setThemeProvider,
    onReset,
  ]);
}

