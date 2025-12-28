"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, ShoppingCart, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";

import type { TransactionType } from "./types";

interface TransactionTypeStepProps {
  onSelect: (type: TransactionType) => void;
  accountsCount: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

/**
 * Шаг 1: Выбор типа транзакции
 * Три карточки: Доход, Расход, Перевод
 */
export function TransactionTypeStep({
  onSelect,
  accountsCount,
}: TransactionTypeStepProps) {
  const t = useTranslations("transactions");

  const types = [
    {
      type: "income" as TransactionType,
      icon: TrendingUp,
      label: t("wizard.types.income"),
      description: t("wizard.types.incomeDesc"),
      color: "text-emerald-500",
      hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
      borderColor: "hover:border-emerald-300 dark:hover:border-emerald-700",
    },
    {
      type: "expense" as TransactionType,
      icon: ShoppingCart,
      label: t("wizard.types.expense"),
      description: t("wizard.types.expenseDesc"),
      color: "text-rose-500",
      hoverBg: "hover:bg-rose-50 dark:hover:bg-rose-950/30",
      borderColor: "hover:border-rose-300 dark:hover:border-rose-700",
    },
    {
      type: "transfer" as TransactionType,
      icon: ArrowRightLeft,
      label: t("wizard.types.transfer"),
      description: t("wizard.types.transferDesc"),
      color: "text-blue-500",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
      borderColor: "hover:border-blue-300 dark:hover:border-blue-700",
      disabled: accountsCount < 2,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4"
    >
      {types.map(
        ({
          type,
          icon: Icon,
          label,
          description,
          color,
          hoverBg,
          borderColor,
          disabled,
        }) => (
          <motion.button
            key={type}
            variants={itemVariants}
            onClick={() => !disabled && onSelect(type)}
            disabled={disabled}
            className={`
              relative flex items-center gap-4 p-5 rounded-xl border-2 border-border
              bg-card text-left transition-all duration-200
              ${disabled ? "opacity-50 cursor-not-allowed" : `cursor-pointer ${hoverBg} ${borderColor}`}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            `}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted ${color}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{label}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            </div>
            {disabled && (
              <span className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {t("wizard.needsTwoAccounts")}
              </span>
            )}
          </motion.button>
        )
      )}
    </motion.div>
  );
}
