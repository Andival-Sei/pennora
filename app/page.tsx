import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { HomePageClient } from "./components/home-page-client";

// Базовый URL для метаданных
const getMetadataBase = (): URL => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return new URL(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL(
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://pennora.app"
  );
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const baseUrl = getMetadataBase();

  const title = t("title");
  const description = t("subtitle");
  const keywords = [
    "учёт бюджета",
    "личный бюджет",
    "семейный бюджет",
    "финансы",
    "доходы и расходы",
    "учёт финансов",
    "бюджет приложение",
    "PWA",
    "офлайн режим",
    "мультивалютность",
  ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: "/",
      languages: {
        "ru-RU": "/ru",
        "en-US": "/en",
      },
    },
    openGraph: {
      title,
      description,
      url: baseUrl.toString(),
      siteName: "Pennora",
      locale: locale === "ru" ? "ru_RU" : "en_US",
      alternateLocale: locale === "ru" ? ["en_US"] : ["ru_RU"],
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default function Home() {
  return <HomePageClient />;
}
