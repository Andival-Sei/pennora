"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  onDelete: () => void;
}

/**
 * Модальное окно подтверждения удаления аккаунта
 */
export function DeleteAccountModal({
  open,
  onClose,
  loading,
  error,
  onDelete,
}: DeleteAccountModalProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations();

  if (!open) return null;

  return (
    <AnimatePresence>
      <>
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => !loading && onClose()}
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
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold">
                  {t("account.deleteAccount.title")}
                </h3>
              </div>
              {!loading && (
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md mb-4"
                >
                  {tErrors(error)}
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-muted-foreground mb-6">
              {t("account.deleteAccount.description")}
            </p>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {tCommon("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {tCommon("loading")}
                  </>
                ) : (
                  t("account.deleteAccount.confirm")
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}
