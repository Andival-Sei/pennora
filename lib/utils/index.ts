import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Получает базовый URL приложения
 * - В браузере: использует window.location.origin (динамически определяет текущий домен)
 * - На сервере: использует переменные окружения (NEXT_PUBLIC_APP_URL, VERCEL_URL)
 *
 * Это гарантирует, что redirect URLs всегда указывают на правильный домен,
 * независимо от того, где выполняется код (клиент или сервер)
 */
export function getAppUrl(): string {
  // В браузере используем текущий origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // На сервере используем переменные окружения
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback для разработки
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://pennora.vercel.app";
}
