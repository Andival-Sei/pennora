"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { setLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/request";

export function LocaleToggle() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      setLocale(newLocale);
    });
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-full border bg-background p-1",
        isPending && "opacity-50"
      )}
    >
      <button
        onClick={() => handleLocaleChange("ru")}
        disabled={isPending}
        className={cn(
          "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
          locale === "ru"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Русский"
      >
        RU
      </button>
      <button
        onClick={() => handleLocaleChange("en")}
        disabled={isPending}
        className={cn(
          "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
