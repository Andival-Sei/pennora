"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, Camera, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReceiptUploader } from "./ReceiptUploader";
import { ReceiptCamera } from "./ReceiptCamera";
import { TransactionForm } from "./TransactionForm";
import { useCategories } from "@/lib/hooks/useCategories";
import { matchCategoryByDescription } from "@/lib/receipt/category-matcher";
import type { ReceiptProcessingResult } from "@/lib/receipt/types";
import type { TransactionItemFormData } from "@/lib/types/transaction";

type InputMethod = "upload" | "camera" | "manual" | null;

// Тип для предзаполненных данных с поддержкой items
interface PrefilledData {
  amount: number;
  date: Date;
  description: string | null;
  categoryId?: string | null;
  items?: TransactionItemFormData[];
}

interface ReceiptInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReceiptInputDialog({
  open,
  onOpenChange,
  onSuccess,
}: ReceiptInputDialogProps) {
  const t = useTranslations("receipt");
  const { categories } = useCategories();
  const [inputMethod, setInputMethod] = useState<InputMethod>(null);
  const [prefilledData, setPrefilledData] = useState<PrefilledData | null>(
    null
  );

  const handleMethodSelect = (method: InputMethod) => {
    setInputMethod(method);
    setPrefilledData(null);
  };

  const handleReceiptProcessed = (result: ReceiptProcessingResult) => {
    if (result.success && result.data) {
      // Определяем категорию на основе описания
      const suggestedCategoryId = result.data.description
        ? matchCategoryByDescription(
            result.data.description,
            categories,
            "expense" // Чеки обычно это расходы
          )
        : null;

      // Если в чеке есть несколько позиций, создаём items
      let items: TransactionItemFormData[] | undefined;
      if (result.data.items && result.data.items.length > 0) {
        items = result.data.items.map((item, index) => {
          // Пытаемся определить категорию для каждой позиции
          const itemCategoryId = matchCategoryByDescription(
            item.name,
            categories,
            "expense"
          );

          return {
            category_id: itemCategoryId || null,
            amount: item.price,
            description: item.name,
            sort_order: index,
          };
        });
      }

      // Предзаполняем данные для формы
      setPrefilledData({
        amount: result.data.amount,
        date: result.data.date,
        description: result.data.description,
        categoryId: suggestedCategoryId || null,
        items: items && items.length > 0 ? items : undefined,
      });
      // Переключаемся на ручной ввод с предзаполненными данными
      setInputMethod("manual");
    } else {
      // Если обработка не удалась, предлагаем ручной ввод
      const errorMessage = result.error || t("errors.processingFailed");

      // Показываем ошибку через toast
      toast.error(errorMessage, {
        description: result.rawText ? t("errors.fallbackToManual") : undefined,
        duration: 5000,
      });

      // Переключаемся на ручной ввод
      setInputMethod("manual");
      setPrefilledData(null);
    }
  };

  const handleSuccess = () => {
    setInputMethod(null);
    setPrefilledData(null);
    onOpenChange(false);
    onSuccess?.();
  };

  const handleBack = () => {
    setInputMethod(null);
    setPrefilledData(null);
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Сбрасываем состояние при закрытии диалога
      setInputMethod(null);
      setPrefilledData(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <AnimatePresence mode="wait">
            <motion.div
              key={inputMethod || "null"}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <DialogTitle>
                {inputMethod === null
                  ? t("dialog.title")
                  : inputMethod === "upload"
                    ? t("dialog.uploadTitle")
                    : inputMethod === "camera"
                      ? t("dialog.cameraTitle")
                      : t("dialog.manualTitle")}
              </DialogTitle>
              <DialogDescription>
                {inputMethod === null
                  ? t("dialog.description")
                  : inputMethod === "upload"
                    ? t("dialog.uploadDescription")
                    : inputMethod === "camera"
                      ? t("dialog.cameraDescription")
                      : t("dialog.manualDescription")}
              </DialogDescription>
            </motion.div>
          </AnimatePresence>
        </DialogHeader>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {inputMethod === null ? (
              // Выбор метода ввода
              <motion.div
                key="method-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-3 p-6"
                  onClick={() => handleMethodSelect("upload")}
                >
                  <Upload className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">{t("methods.upload")}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("methods.uploadDescription")}
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col gap-3 p-6"
                  onClick={() => handleMethodSelect("camera")}
                >
                  <Camera className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">{t("methods.camera")}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("methods.cameraDescription")}
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col gap-3 p-6"
                  onClick={() => handleMethodSelect("manual")}
                >
                  <Keyboard className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">{t("methods.manual")}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("methods.manualDescription")}
                    </div>
                  </div>
                </Button>
              </motion.div>
            ) : inputMethod === "upload" ? (
              // Загрузка чека
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                <ReceiptUploader
                  onProcessed={handleReceiptProcessed}
                  onCancel={handleBack}
                />
              </motion.div>
            ) : inputMethod === "camera" ? (
              // Фотографирование чека
              <motion.div
                key="camera"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                <ReceiptCamera
                  onProcessed={handleReceiptProcessed}
                  onCancel={handleBack}
                />
              </motion.div>
            ) : (
              // Ручной ввод
              <motion.div
                key="manual"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                {prefilledData && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-3 bg-muted rounded-lg text-sm"
                  >
                    <p className="font-medium mb-1">{t("prefilled.title")}</p>
                    <p className="text-muted-foreground">
                      {t("prefilled.description")}
                    </p>
                  </motion.div>
                )}
                <TransactionForm
                  initialData={
                    prefilledData
                      ? {
                          amount: prefilledData.amount,
                          date: prefilledData.date,
                          description: prefilledData.description || undefined,
                          category_id: prefilledData.categoryId || undefined,
                          items: prefilledData.items,
                        }
                      : undefined
                  }
                  onSuccess={handleSuccess}
                />
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="w-full"
                >
                  {t("actions.back")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
