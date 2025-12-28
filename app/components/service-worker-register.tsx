"use client";

import { useEffect } from "react";

/**
 * Компонент регистрации Service Worker
 * Поддерживает работу в dev и production режимах
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Проверка поддержки Service Worker
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        // Регистрируем Service Worker
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Обработка обновлений Service Worker
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Новый Service Worker установлен, но старый еще активен
                console.log("Доступно обновление Service Worker");
                // Можно показать уведомление пользователю
                if (
                  "Notification" in window &&
                  Notification.permission === "granted"
                ) {
                  new Notification("Доступно обновление", {
                    body: "Перезагрузите страницу для применения обновлений",
                    icon: "/icons/icon-192x192.png",
                    tag: "sw-update",
                  });
                }
              }
            });
          }
        });

        // Обработка контролирующего Service Worker
        if (reg.waiting) {
          console.log("Service Worker ожидает активации");
          // Можно предложить пользователю обновить страницу
        }

        if (reg.active) {
          console.log("Service Worker активен");
        }

        // Периодическая проверка обновлений (каждые 60 секунд)
        setInterval(() => {
          reg.update().catch((err) => {
            console.error("Ошибка проверки обновлений SW:", err);
          });
        }, 60000);
      } catch (error) {
        console.error("Ошибка регистрации Service Worker:", error);
      }
    };

    // Регистрация после загрузки страницы
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }

    // Обработка сообщений от Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SYNC_REQUEST") {
        // Service Worker запрашивает синхронизацию
        // Отправляем событие для запуска синхронизации
        window.dispatchEvent(new CustomEvent("sw-sync-request"));
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}
