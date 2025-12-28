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
      : "https://pennora.vercel.app"
  );
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("license");
  const locale = await getLocale();
  const baseUrl = getMetadataBase();

  const title = t("title");
  const description = t("description");
  const keywords =
    locale === "ru"
      ? [
          "лицензия",
          "проприетарная лицензия",
          "все права защищены",
          "авторское право",
          "лицензирование",
        ]
      : [
          "license",
          "proprietary license",
          "all rights reserved",
          "copyright",
          "licensing",
        ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: "/license",
      languages: {
        "ru-RU": "/ru/license",
        "en-US": "/en/license",
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl.toString()}/license`,
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

export default async function LicensePage() {
  const t = await getTranslations("license");
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
                {t("sections.overview.title")}
              </h2>
              <p className="leading-relaxed">
                {t("sections.overview.content")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.licenseType.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("sections.licenseType.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t("sections.licenseType.items.use")}</li>
                <li>{t("sections.licenseType.items.modify")}</li>
                <li>{t("sections.licenseType.items.distribute")}</li>
                <li>{t("sections.licenseType.items.commercial")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.conditions.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("sections.conditions.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t("sections.conditions.items.copyright")}</li>
                <li>{t("sections.conditions.items.license")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.warranty.title")}
              </h2>
              <p className="leading-relaxed">
                {t("sections.warranty.content")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                {t("sections.fullText.title")}
              </h2>
              <div className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <pre className="text-sm whitespace-pre-wrap font-mono text-zinc-800 dark:text-zinc-200">
                  {t("sections.fullText.content")}
                </pre>
              </div>
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
