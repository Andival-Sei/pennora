import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getTranslations("privacy");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const tCommon = await getTranslations("common");

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tCommon("backToHome")}
          </Button>
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-white mb-4">{t("title")}</h1>
          <p className="text-zinc-400 mb-8">{t("lastUpdated")}</p>

          <div className="space-y-8 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                {t("sections.overview.title")}
              </h2>
              <p className="leading-relaxed">
                {t("sections.overview.content")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                {t("sections.dataCollection.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("sections.dataCollection.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t("sections.dataCollection.items.email")}</li>
                <li>{t("sections.dataCollection.items.financial")}</li>
                <li>{t("sections.dataCollection.items.usage")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                {t("sections.dataUsage.title")}
              </h2>
              <p className="leading-relaxed">
                {t("sections.dataUsage.content")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                {t("sections.dataSecurity.title")}
              </h2>
              <p className="leading-relaxed">
                {t("sections.dataSecurity.content")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                {t("sections.userRights.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("sections.userRights.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t("sections.userRights.items.access")}</li>
                <li>{t("sections.userRights.items.correction")}</li>
                <li>{t("sections.userRights.items.deletion")}</li>
                <li>{t("sections.userRights.items.export")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                {t("sections.contact.title")}
              </h2>
              <p className="leading-relaxed">{t("sections.contact.content")}</p>
              <p className="mt-4">
                <strong className="text-white">Email:</strong>{" "}
                <a
                  href="mailto:support@pennora.app"
                  className="text-emerald-400 hover:text-emerald-300"
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
