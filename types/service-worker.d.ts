/**
 * Расширение типов для Service Worker API
 * Добавляет поддержку Background Sync API
 */

interface ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
}

interface ServiceWorkerGlobalScope {
  registration: ServiceWorkerRegistration;
}
