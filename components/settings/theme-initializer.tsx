"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/providers";
import { createClient } from "@/lib/supabase/client";

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
      if (!hasLoadedRef.current && profile?.theme && ["light", "dark", "system"].includes(profile.theme)) {
        if (profile.theme !== theme) {
          setTheme(profile.theme as "light" | "dark" | "system");
        }
        hasLoadedRef.current = true;
      }
    }

    loadAndSaveTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  return null;
}

