"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { getErrorMessage } from "@/lib/utils/errorHandler";

interface ErrorStateProps {
  error?: Error | string | unknown;
  onRetry?: () => void;
  title?: string;
  description?: string;
  className?: string;
  showRetry?: boolean;
}

/**
 * Компонент для отображения состояния ошибки
 */
export function ErrorState({
  error,
  onRetry,
  title,
  description,
  className = "",
  showRetry = true,
}: ErrorStateProps) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");

  // Получаем сообщение об ошибке
  const getErrorDisplayMessage = () => {
    if (description) return description;
    if (typeof error === "string") return error;
    if (error) {
      return getErrorMessage(error, (key) => t(key));
    }
    return t("unknown");
  };

  const errorMessage = getErrorDisplayMessage();
  const displayTitle = title || t("unknown");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-lg border border-destructive/50 bg-destructive/10 p-6 ${className}`}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <AlertCircle className="h-12 w-12 text-destructive" />
        </motion.div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-destructive">
            {displayTitle}
          </h3>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>

        {showRetry && onRetry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.3 }}
          >
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {tCommon("retry")}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
