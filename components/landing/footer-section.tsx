"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import { useTranslations } from "next-intl";

const socialLinks = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
] as const;

export function FooterSection() {
  const t = useTranslations("home.footer");
  const tCommon = useTranslations("common");

  return (
    <footer className="relative border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {tCommon("appName")}
            </h3>
            <p className="text-zinc-400">{t("description")}</p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Ссылки</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  {t("links.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  {t("links.terms")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Социальные сети</h4>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500/50 flex items-center justify-center text-zinc-400 hover:text-emerald-400 transition-all duration-300"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-zinc-400">
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
