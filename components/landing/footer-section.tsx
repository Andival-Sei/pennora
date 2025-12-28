"use client";

import Link from "next/link";
import { Mail, Construction } from "lucide-react";
import { useTranslations } from "next-intl";

export function FooterSection() {
  const t = useTranslations("home.footer");
  const tCommon = useTranslations("common");

  return (
    <footer className="relative border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              {tCommon("appName")}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("description")}
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-zinc-900 dark:text-white font-semibold">
              {t("links.title")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                >
                  {t("links.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                >
                  {t("links.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/license"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                >
                  {t("links.license")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="text-zinc-900 dark:text-white font-semibold">
                {t("contact.title")}
              </h4>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                <Construction className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {t("contact.inDevelopment")}
                </span>
              </div>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              {t("contact.description")}
            </p>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{t("contact.email")}</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center text-zinc-600 dark:text-zinc-400">
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
