"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

/**
 * Loading состояние для TransactionWizard
 */
export function TransactionWizardLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Заголовок skeleton */}
      <div className="flex items-center gap-3">
        <LoadingSkeleton width="24px" height="24px" rounded="full" />
        <LoadingSkeleton width="200px" height="24px" />
      </div>

      {/* Контент skeleton */}
      <div className="space-y-4">
        <LoadingSkeleton width="100%" height="60px" />
        <LoadingSkeleton width="100%" height="60px" />
        <LoadingSkeleton width="100%" height="60px" />
      </div>

      {/* Spinner в центре для дополнительной индикации */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center py-8"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </motion.div>
    </div>
  );
}
