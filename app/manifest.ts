import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pennora — Учёт бюджета",
    short_name: "Pennora",
    description: "Умный учёт личного и семейного бюджета с офлайн-режимом",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    scope: "/",
    categories: ["finance", "productivity"],
    lang: "ru",
    dir: "ltr",
    // Иконки для различных платформ
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Ярлыки для быстрого доступа
    shortcuts: [
      {
        name: "Добавить транзакцию",
        short_name: "Транзакция",
        description: "Быстро добавить новую транзакцию",
        url: "/dashboard/transactions?action=add",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Дашборд",
        short_name: "Дашборд",
        description: "Главная страница с статистикой",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
    // Поддержка установки на Windows и Android
    // Windows требует screenshots для Microsoft Store
    // Android автоматически использует иконки и описание
    prefer_related_applications: false,
  };
}
