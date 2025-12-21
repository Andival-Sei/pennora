// Service Worker для PWA с использованием Workbox CDN
// Версия Workbox: 7.0.0

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js"
);

// Проверка доступности Workbox
if (workbox) {
  console.log("Workbox загружен успешно");

  // Precache статических ресурсов Next.js
  // self.__WB_MANIFEST будет заполнен автоматически при сборке
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

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

  // StaleWhileRevalidate для HTML страниц - мгновенная навигация + обновление в фоне
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "pages",
      plugins: [
        {
          cacheKeyWillBeUsed: async ({ request }) => {
            return request.url;
          },
        },
      ],
    })
  );

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

  // Активация Service Worker сразу после установки
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();
} else {
  console.error("Workbox не загружен");
}
