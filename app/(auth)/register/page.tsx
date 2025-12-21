import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { RegisterPageClient } from "./register-page-client";

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
  const t = await getTranslations("auth");
  const locale = await getLocale();
  const baseUrl = getMetadataBase();

  const title = t("register.title");
  const description = t("register.subtitle");
  const keywords = [
    "регистрация",
    "создать аккаунт",
    "учёт бюджета",
    "личный бюджет",
    "финансы",
  ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: "/register",
      languages: {
        "ru-RU": "/ru/register",
        "en-US": "/en/register",
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl.toString()}/register`,
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

export default function RegisterPage() {
  return <RegisterPageClient />;
}
