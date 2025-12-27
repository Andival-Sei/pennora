"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { WizardState } from "./types";
import { canGoBack } from "./types";

interface WizardHeaderProps {
  state: WizardState;
  title: string;
  onBack: () => void;
}

/**
 * Заголовок wizard с кнопкой "Назад"
 */
export function WizardHeader({ state, title, onBack }: WizardHeaderProps) {
  const t = useTranslations("common");
  const showBack = canGoBack(state);

  return (
    <div className="space-y-4">
      {/* Верхняя часть: кнопка назад */}
      {showBack && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </Button>
        </motion.div>
      )}

      {/* Заголовок */}
      <motion.h2
        key={title}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-semibold text-center"
      >
        {title}
      </motion.h2>
    </div>
  );
}
