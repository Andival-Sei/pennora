"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/currency/formatter";

interface PhoneMockupProps {
  className?: string;
}

export function PhoneMockup({ className }: PhoneMockupProps) {
  const t = useTranslations("home.mockup");
  const locale = useLocale();

  // Выбираем валюту в зависимости от локали
  const currency = locale === "ru" ? "RUB" : "USD";

  // Суммы для моков (в рублях и долларах)
  const amounts =
    locale === "ru"
      ? {
          total: 125430,
          card: 85200,
          cash: 40230,
          income: 45000,
          expense: 28500,
        }
      : {
          total: 1500,
          card: 1000,
          cash: 500,
          income: 550,
          expense: 350,
        };

  return (
    <motion.div
      className={cn("relative z-20", className)}
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Floating animation */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotateX: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Phone frame - адаптирован под темы */}
        <div
          className="relative w-[280px] h-[560px] mx-auto rounded-[3rem] p-2 shadow-2xl"
          style={{
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Light theme frame */}
          <div className="dark:hidden absolute inset-0 rounded-[3rem] bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-200" />
          {/* Dark theme frame */}
          <div className="hidden dark:block absolute inset-0 rounded-[3rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />

          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 dark:bg-black rounded-b-2xl z-10" />

          {/* Screen */}
          <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-background">
            {/* Screen content - Dashboard mockup */}
            <div className="absolute inset-0 p-4 flex flex-col gap-3">
              {/* Status bar */}
              <div className="flex justify-between items-center text-muted-foreground text-xs">
                <span>9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-2 border border-current rounded-sm opacity-60" />
                  <div className="w-6 h-2 border border-current rounded-sm opacity-60" />
                </div>
              </div>

              {/* Header */}
              <div className="mt-2">
                <h2 className="text-lg font-bold text-foreground">
                  {t("title")}
                </h2>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                {/* Total Balance */}
                <div className="bg-card border border-border rounded-lg p-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-primary/10 rounded-full -mr-6 -mt-6" />
                  <div className="text-[10px] text-muted-foreground mb-1">
                    {t("balance.total")}
                  </div>
                  <div className="text-sm font-bold whitespace-nowrap">
                    {formatCurrency(amounts.total, currency)}
                  </div>
                  <Wallet className="h-3 w-3 text-primary absolute top-2 right-2" />
                </div>

                {/* Card Balance */}
                <div className="bg-card border border-border rounded-lg p-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-full -mr-6 -mt-6" />
                  <div className="text-[10px] text-muted-foreground mb-1">
                    {t("balance.card")}
                  </div>
                  <div className="text-sm font-bold whitespace-nowrap">
                    {formatCurrency(amounts.card, currency)}
                  </div>
                </div>

                {/* Cash Balance */}
                <div className="bg-card border border-border rounded-lg p-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full -mr-6 -mt-6" />
                  <div className="text-[10px] text-muted-foreground mb-1">
                    {t("balance.cash")}
                  </div>
                  <div className="text-sm font-bold whitespace-nowrap">
                    {formatCurrency(amounts.cash, currency)}
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Income */}
                <div className="bg-card border border-border rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground mb-1">
                    {t("statistics.income")}
                  </div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatCurrency(amounts.income, currency)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] text-muted-foreground">
                      +12%
                    </span>
                  </div>
                </div>

                {/* Expense */}
                <div className="bg-card border border-border rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground mb-1">
                    {t("statistics.expense")}
                  </div>
                  <div className="text-base font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                    {formatCurrency(amounts.expense, currency)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingDown className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
                    <span className="text-[9px] text-muted-foreground">
                      -5%
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mt-1 space-y-1.5">
                <div className="text-xs font-semibold text-foreground">
                  {t("recentTransactions")}
                </div>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-lg p-2 flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="h-2 bg-muted rounded w-20" />
                      <div className="h-1.5 bg-muted/60 rounded w-16" />
                    </div>
                    <div className="h-4 w-12 bg-emerald-500/20 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 dark:from-white/5 via-transparent to-transparent pointer-events-none rounded-[2.5rem]" />
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground/20 rounded-full" />
        </div>

        {/* Shadow with smooth fade - исправлена обрывающаяся тень */}
        <div
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 30%, rgba(0, 0, 0, 0.1) 50%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none dark:hidden"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.1) 30%, rgba(0, 0, 0, 0.05) 50%, transparent 70%)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
