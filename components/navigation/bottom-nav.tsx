"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Home,
  Receipt,
  FolderTree,
  Settings,
  CreditCard,
  BarChart3,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    icon: Home,
    translationKey: "dashboard",
  },
  {
    href: "/dashboard/accounts",
    icon: CreditCard,
    translationKey: "accounts",
  },
  {
    href: "/dashboard/transactions",
    icon: Receipt,
    translationKey: "transactions",
  },
  {
    href: "/dashboard/statistics",
    icon: BarChart3,
    translationKey: "statistics",
  },
  {
    href: "/dashboard/categories",
    icon: FolderTree,
    translationKey: "categories",
  },
  {
    href: "/dashboard/settings/app",
    icon: Settings,
    translationKey: "settings",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Для главной страницы (/dashboard) проверяем точное совпадение
          // Для остальных - точное совпадение или начало пути
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 flex-1 h-full",
                "transition-all duration-300 ease-out",
                "group"
              )}
            >
              {/* Активный фон с закруглением (pill shape) */}
              <div
                className={cn(
                  "absolute inset-x-2 inset-y-2 rounded-full",
                  "transition-all duration-300 ease-out",
                  isActive
                    ? "bg-primary/10 scale-100 opacity-100"
                    : "bg-transparent scale-95 opacity-0 group-hover:bg-accent/30 group-hover:scale-100 group-hover:opacity-100"
                )}
              />

              {/* Иконка */}
              <div className="relative z-10">
                <Icon
                  className={cn(
                    "h-6 w-6 transition-all duration-300 ease-out",
                    isActive
                      ? "text-primary scale-110"
                      : "text-muted-foreground group-hover:text-foreground group-hover:scale-105"
                  )}
                />
              </div>

              {/* Текст */}
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-300 ease-out relative z-10 hidden sm:block",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {t(item.translationKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
