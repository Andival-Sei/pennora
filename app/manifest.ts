import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pennora — Учёт бюджета",
    short_name: "Pennora",
    description: "Умный учёт личного и семейного бюджета",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    scope: "/",
    categories: ["finance", "productivity"],
    icons: [
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
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Добавить транзакцию",
        short_name: "Транзакция",
        description: "Быстро добавить новую транзакцию",
        url: "/dashboard/transactions?action=add",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
