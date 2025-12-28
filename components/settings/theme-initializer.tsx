"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/providers";
import { createClient } from "@/lib/db/supabase/client";

/**
 * Компонент для инициализации темы из настроек пользователя
 * Загружает тему из БД только один раз при первой загрузке
 * Также сохраняет текущую тему в БД при первом входе
 */
export function ThemeInitializer() {
  const { setTheme, mounted, theme } = useTheme();
  const hasLoadedRef = useRef(false);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    async function loadAndSaveTheme() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        hasLoadedRef.current = true;
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("theme")
        .eq("id", user.id)
        .single();

      // Если нет темы в БД, сохраняем текущую тему из localStorage
      if (!profile?.theme && !hasSavedRef.current) {
        const storedTheme = localStorage.getItem("pennora-theme");
        if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
          await supabase
            .from("profiles")
            .update({ theme: storedTheme })
            .eq("id", user.id);
          hasSavedRef.current = true;
        }
      }

      // Загружаем тему из БД только один раз при первой загрузке
      // НЕ перезаписываем тему, если пользователь уже выбрал другую
      if (!hasLoadedRef.current) {
        const storedTheme = localStorage.getItem("pennora-theme");
        const dbTheme = profile?.theme;

        // Если есть тема в БД и она валидна
        if (dbTheme && ["light", "dark", "system"].includes(dbTheme)) {
          // Применяем тему из БД только если:
          // 1. Нет темы в localStorage (первый запуск), или
          // 2. Тема в localStorage совпадает с темой в БД (синхронизация после сохранения)
          // НЕ применяем, если тема в localStorage отличается от БД (пользователь изменил, но не сохранил)
          if (!storedTheme || storedTheme === dbTheme) {
            if (theme !== dbTheme) {
              setTheme(dbTheme as "light" | "dark" | "system");
            }
          }
          // Если тема в localStorage отличается от БД, значит пользователь изменил её
          // и мы НЕ должны перезаписывать изменения пользователя
        } else if (!storedTheme) {
          // Если нет темы ни в БД, ни в localStorage, устанавливаем system
          if (theme !== "system") {
            setTheme("system");
          }
        }
        hasLoadedRef.current = true;
      }
    }

    loadAndSaveTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  return null;
}
