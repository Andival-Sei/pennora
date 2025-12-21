import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const t = await getTranslations("terms");
  const locale = await getLocale();
  const baseUrl = getMetadataBase();

  const title = t("title");
  const description = t("description");
  const keywords = [
    "условия использования",
    "пользовательское соглашение",
    "термины",
    "учёт бюджета",
    "финансы",
  ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: "/terms",
      languages: {
        "ru-RU": "/ru/terms",
        "en-US": "/en/terms",
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl.toString()}/terms`,
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

export default async function TermsPage() {
  const t = await getTranslations("terms");
  const tCommon = await getTranslations("common");

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tCommon("backToHome")}
          </Button>
        </Link>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            {t("title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            {t("lastUpdated")}
          </p>

          <div className="space-y-8 text-zinc-700 dark:text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.acceptance.title")}
              </h2>
              <p className="leading-relaxed">
                {t("sections.acceptance.content")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.serviceDescription.title")}
              </h2>
              <p className="leading-relaxed">
                {t("sections.serviceDescription.content")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.userAccount.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("sections.userAccount.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t("sections.userAccount.items.responsibility")}</li>
                <li>{t("sections.userAccount.items.security")}</li>
                <li>{t("sections.userAccount.items.notification")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.acceptableUse.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("sections.acceptableUse.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t("sections.acceptableUse.items.illegal")}</li>
                <li>{t("sections.acceptableUse.items.harm")}</li>
                <li>{t("sections.acceptableUse.items.violation")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.liability.title")}
              </h2>
              <p className="leading-relaxed">
                {t("sections.liability.content")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.changes.title")}
              </h2>
              <p className="leading-relaxed">{t("sections.changes.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.contact.title")}
              </h2>
              <p className="leading-relaxed">{t("sections.contact.content")}</p>
              <p className="mt-4">
                <strong className="text-zinc-900 dark:text-white">
                  Email:
                </strong>{" "}
                <a
                  href="mailto:support@pennora.app"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  support@pennora.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
