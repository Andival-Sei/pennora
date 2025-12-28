"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Интерфейс для события beforeinstallprompt
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Компонент промпта установки PWA
 * Показывает диалог для установки приложения на Windows и Android
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  // Проверяем установку приложения при инициализации
  const [isInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true
    );
  });
  // Проверяем, был ли промпт показан недавно при инициализации
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const promptShown = localStorage.getItem("pwa-install-prompt-shown");
    if (promptShown) {
      const lastShown = parseInt(promptShown, 10);
      const daysSinceShown = (Date.now() - lastShown) / (1000 * 60 * 60 * 24);
      // Показываем только если прошло больше 7 дней
      return daysSinceShown >= 7;
    }
    return true;
  });
  const t = useTranslations("pwa");

  useEffect(() => {
    // Если приложение уже установлено, не показываем промпт
    if (isInstalled) {
      return;
    }

    // Обработчик события beforeinstallprompt (Chrome, Edge, Samsung Internet)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Предотвращаем автоматическое отображение промпта
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsVisible(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      // Показываем промпт установки
      await deferredPrompt.prompt();

      // Ждем выбора пользователя
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("Пользователь принял установку");
        // После установки приложение перезагрузится в standalone режиме
        // поэтому просто скрываем промпт
        setIsVisible(false);
      } else {
        console.log("Пользователь отклонил установку");
      }

      // Очищаем промпт
      setDeferredPrompt(null);
      setIsVisible(false);

      // Сохраняем время показа промпта
      localStorage.setItem("pwa-install-prompt-shown", Date.now().toString());
    } catch (error) {
      console.error("Ошибка при установке:", error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDeferredPrompt(null);
    // Сохраняем время показа промпта
    localStorage.setItem("pwa-install-prompt-shown", Date.now().toString());
  };

  // Не показываем, если приложение уже установлено или промпт недоступен
  if (isInstalled || !isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <Dialog open={isVisible} onOpenChange={setIsVisible}>
          <DialogContent className="sm:max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  {t("installTitle")}
                </DialogTitle>
                <DialogDescription>{t("installDescription")}</DialogDescription>
              </DialogHeader>

              <div className="mt-4 flex flex-col gap-3">
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>{t("installBenefit1")}</li>
                  <li>{t("installBenefit2")}</li>
                  <li>{t("installBenefit3")}</li>
                </ul>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleInstall} className="flex-1" size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    {t("installButton")}
                  </Button>
                  <Button onClick={handleDismiss} variant="outline" size="lg">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
