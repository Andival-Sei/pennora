"use client";

import { useTranslations } from "next-intl";
import { Receipt, ListChecks } from "lucide-react";
import { motion } from "framer-motion";

import type { ExpenseMode } from "./types";

interface ExpenseModeStepProps {
  onSelect: (mode: ExpenseMode) => void;
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
 * Шаг 2 (для расхода): Выбор режима расхода
 * Две карточки: Простая покупка / Чек с позициями
 */
export function ExpenseModeStep({ onSelect }: ExpenseModeStepProps) {
  const t = useTranslations("transactions");

  const modes = [
    {
      mode: "simple" as ExpenseMode,
      icon: Receipt,
      label: t("wizard.expenseMode.simple"),
      description: t("wizard.expenseMode.simpleDesc"),
      color: "text-amber-500",
      hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
      borderColor: "hover:border-amber-300 dark:hover:border-amber-700",
    },
    {
      mode: "detailed" as ExpenseMode,
      icon: ListChecks,
      label: t("wizard.expenseMode.detailed"),
      description: t("wizard.expenseMode.detailedDesc"),
      color: "text-violet-500",
      hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-950/30",
      borderColor: "hover:border-violet-300 dark:hover:border-violet-700",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4"
    >
      {modes.map(
        ({
          mode,
          icon: Icon,
          label,
          description,
          color,
          hoverBg,
          borderColor,
        }) => (
          <motion.button
            key={mode}
            variants={itemVariants}
            onClick={() => onSelect(mode)}
            className={`
              relative flex items-center gap-4 p-5 rounded-xl border-2 border-border
              bg-card text-left transition-all duration-200
              cursor-pointer ${hoverBg} ${borderColor}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
          </motion.button>
        )
      )}
    </motion.div>
  );
}
