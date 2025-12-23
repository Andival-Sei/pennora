"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";

/**
 * Компонент навигации между разделами настроек
 */
export function SettingsNavigation() {
  const t = useTranslations("settings");

  return (
    <FadeIn delay={0.05}>
      <div className="flex gap-2 mb-6">
        <Link href="/dashboard/settings">
          <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
            {t("account.title")}
          </Button>
        </Link>
        <Link href="/dashboard/settings/app">
          <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
            {t("app.title")}
          </Button>
        </Link>
      </div>
    </FadeIn>
  );
}
