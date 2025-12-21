"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

/**
 * Компонент для отображения состояния загрузки
 */
export function LoadingState({
  message,
  className = "",
  fullScreen = false,
}: LoadingStateProps) {
  const t = useTranslations("common");
  const displayMessage = message || t("loading");

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{displayMessage}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center justify-center py-12 ${className}`}
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{displayMessage}</p>
      </div>
    </motion.div>
  );
}

/**
 * Компонент для отображения скелетона загрузки
 */
export function LoadingSkeleton({
  count = 1,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: i * 0.1 }}
          className="h-16 bg-muted animate-pulse rounded-lg"
        />
      ))}
    </div>
  );
}
