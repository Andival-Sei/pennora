// Service Worker для PWA с использованием Workbox CDN
// Версия Workbox: 7.0.0
// Поддержка офлайн-режима и Background Sync

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js"
);

// Проверка доступности Workbox
if (workbox) {
  console.log("Workbox загружен успешно");

  // Precache статических ресурсов Next.js
  // self.__WB_MANIFEST будет заполнен автоматически при сборке
  // Если манифест пуст (ручная реализация без webpack), кешируем критичные ресурсы вручную
  const precacheManifest = self.__WB_MANIFEST || [];

  // Если манифест пуст, добавляем критичные ресурсы вручную
  if (precacheManifest.length === 0) {
    precacheManifest.push(
      { url: "/offline", revision: null },
      { url: "/icons/icon-192x192.png", revision: null },
      { url: "/icons/icon-512x512.png", revision: null },
      { url: "/manifest.webmanifest", revision: null }
    );
  }

  workbox.precaching.precacheAndRoute(precacheManifest);

  // CacheFirst для изображений - быстрая загрузка из кеша
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.CacheFirst({
      cacheName: "images",
      plugins: [
        {
          cacheKeyWillBeUsed: async ({ request }) => {
            return request.url;
          },
          cacheWillUpdate: async ({ response }) => {
            return response.status === 200 ? response : null;
          },
        },
        {
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
          },
        },
      ],
    })
  );

  // CacheFirst для шрифтов
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "font",
    new workbox.strategies.CacheFirst({
      cacheName: "fonts",
      plugins: [
        {
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 год
          },
        },
      ],
    })
  );

  // NetworkFirst для API запросов Supabase - свежие данные с fallback кеш
  workbox.routing.registerRoute(
    ({ url }) => url.origin.includes("supabase.co"),
    new workbox.strategies.NetworkFirst({
      cacheName: "api-cache",
      networkTimeoutSeconds: 10,
      plugins: [
        {
          cacheKeyWillBeUsed: async ({ request }) => {
            // Кешируем только GET запросы
            if (request.method === "GET") {
              return request.url;
            }
            return null;
          },
          cacheWillUpdate: async ({ response }) => {
            // Кешируем только успешные ответы
            return response.status === 200 ? response : null;
          },
        },
        {
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 часа
          },
        },
      ],
    })
  );

  // NetworkFirst для HTML страниц - сначала сеть, потом кеш, потом offline страница
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: "pages",
      networkTimeoutSeconds: 3,
      plugins: [
        {
          cacheKeyWillBeUsed: async ({ request }) => {
            return request.url;
          },
          cacheWillUpdate: async ({ response }) => {
            // Кешируем только успешные ответы
            return response && response.status === 200 ? response : null;
          },
        },
      ],
    })
  );

  // Fallback для навигации - показываем offline страницу если нет сети и кеша
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.mode === "navigate") {
      // Пытаемся получить offline страницу из кеша
      const cache = await caches.open("pages");
      const cachedResponse = await cache.match("/offline");
      if (cachedResponse) {
        return cachedResponse;
      }
      // Если нет кеша, возвращаем простой HTML ответ
      return new Response(
        `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Офлайн режим - Pennora</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: #f5f5f5; 
              text-align: center; 
              padding: 20px;
            }
            .container { max-width: 400px; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Нет подключения к интернету</h1>
            <p>Проверьте подключение и попробуйте снова.</p>
            <button onclick="window.location.reload()">Обновить</button>
          </div>
        </body>
        </html>
        `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }
    return Response.error();
  });

  // StaleWhileRevalidate для статических ресурсов Next.js (_next/static)
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith("/_next/static"),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "next-static",
      plugins: [
        {
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 год
          },
        },
      ],
    })
  );

  // Background Sync для синхронизации данных при восстановлении сети
  // Регистрируем обработчик для синхронизации
  self.addEventListener("sync", (event) => {
    if (event.tag === "sync-data") {
      event.waitUntil(
        // Отправляем сообщение клиенту для запуска синхронизации
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SYNC_REQUEST",
              source: "service-worker",
            });
          });
        })
      );
    }
  });

  // Обработка сообщений от клиента
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
    if (event.data && event.data.type === "SYNC_NOW") {
      // Запрашиваем синхронизацию через Background Sync
      if ("sync" in self.registration) {
        self.registration.sync.register("sync-data").catch((err) => {
          console.error("Background Sync registration failed:", err);
        });
      }
    }
  });

  // Активация Service Worker сразу после установки
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();
} else {
  console.error("Workbox не загружен");
}
