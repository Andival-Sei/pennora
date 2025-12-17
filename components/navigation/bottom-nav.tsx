"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Home, Receipt, FolderTree, Wallet, Settings } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    icon: Home,
    translationKey: "dashboard",
  },
  {
    href: "/dashboard/transactions",
    icon: Receipt,
    translationKey: "transactions",
  },
  {
    href: "/dashboard/categories",
    icon: FolderTree,
    translationKey: "categories",
  },
  {
    href: "/dashboard/budgets",
    icon: Wallet,
    translationKey: "budgets",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    translationKey: "settings",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-around px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                "hover:bg-accent/50 active:bg-accent",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium hidden sm:block">
                {t(item.translationKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
