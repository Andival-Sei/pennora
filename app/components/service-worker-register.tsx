"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Проверка поддержки Service Worker
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
              updateViaCache: "none",
            }
          );

          // Обработка обновлений Service Worker
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Новый Service Worker установлен, но старый еще активен
                  // Можно показать уведомление пользователю о доступном обновлении
                  console.log("Доступно обновление Service Worker");
                }
              });
            }
          });

          // Обработка контролирующего Service Worker
          if (registration.waiting) {
            // Service Worker ждет активации
            console.log("Service Worker ожидает активации");
          }

          if (registration.active) {
            console.log("Service Worker активен");
          }
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
    }
  }, []);

  return null;
}
