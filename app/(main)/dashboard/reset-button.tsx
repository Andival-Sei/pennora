"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2, X } from "lucide-react";
import { resetAccounts } from "./actions";
import { queryKeys } from "@/lib/query/keys";
import { motion, AnimatePresence } from "framer-motion";

export function ResetButton() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    const result = await resetAccounts();
    if (result?.error) {
      setLoading(false);
      // TODO: Показать ошибку
      console.error("Ошибка при сбросе:", result.error);
      return;
    }

    // Очищаем кеш React Query для транзакций и статистики
    queryClient.removeQueries({
      queryKey: queryKeys.transactions.all,
    });
    queryClient.removeQueries({
      queryKey: queryKeys.statistics.all,
    });
    queryClient.removeQueries({
      queryKey: queryKeys.accounts.all,
    });

    // Обновляем страницу для применения изменений
    router.refresh();
    // Если успешно, произойдет редирект на онбординг
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">{t("reset.button")}</span>
      </Button>

      <AnimatePresence>
        {showConfirm && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !loading && setShowConfirm(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <RotateCcw className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t("reset.title")}
                    </h3>
                  </div>
                  {!loading && (
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <p className="text-muted-foreground mb-6">
                  {t("reset.description")}
                </p>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {tCommon("loading")}
                      </>
                    ) : (
                      t("reset.confirm")
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
