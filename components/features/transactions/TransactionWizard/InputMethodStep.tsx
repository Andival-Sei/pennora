"use client";

import { useTranslations } from "next-intl";
import { Upload, Camera, Keyboard } from "lucide-react";
import { motion } from "framer-motion";

import type { InputMethod } from "./types";

interface InputMethodStepProps {
  onSelect: (method: InputMethod) => void;
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
 * Шаг выбора способа ввода
 * Три карточки: Загрузить чек / Сфотографировать / Ввести вручную
 */
export function InputMethodStep({ onSelect }: InputMethodStepProps) {
  const t = useTranslations("receipt");

  const methods = [
    {
      method: "upload" as InputMethod,
      icon: Upload,
      label: t("methods.upload"),
      description: t("methods.uploadDescription"),
      color: "text-sky-500",
      hoverBg: "hover:bg-sky-50 dark:hover:bg-sky-950/30",
      borderColor: "hover:border-sky-300 dark:hover:border-sky-700",
    },
    {
      method: "camera" as InputMethod,
      icon: Camera,
      label: t("methods.camera"),
      description: t("methods.cameraDescription"),
      color: "text-pink-500",
      hoverBg: "hover:bg-pink-50 dark:hover:bg-pink-950/30",
      borderColor: "hover:border-pink-300 dark:hover:border-pink-700",
    },
    {
      method: "manual" as InputMethod,
      icon: Keyboard,
      label: t("methods.manual"),
      description: t("methods.manualDescription"),
      color: "text-slate-500",
      hoverBg: "hover:bg-slate-50 dark:hover:bg-slate-950/30",
      borderColor: "hover:border-slate-300 dark:hover:border-slate-700",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4"
    >
      {methods.map(
        ({
          method,
          icon: Icon,
          label,
          description,
          color,
          hoverBg,
          borderColor,
        }) => (
          <motion.button
            key={method}
            variants={itemVariants}
            onClick={() => onSelect(method)}
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
