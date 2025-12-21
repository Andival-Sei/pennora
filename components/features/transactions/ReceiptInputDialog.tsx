"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, Camera, Keyboard } from "lucide-react";
import { toast } from "sonner";
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

type InputMethod = "upload" | "camera" | "manual" | null;

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
  const [prefilledData, setPrefilledData] = useState<{
    amount: number;
    date: Date;
    description: string | null;
    categoryId?: string | null;
  } | null>(null);

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

      // Предзаполняем данные для формы
      setPrefilledData({
        amount: result.data.amount,
        date: result.data.date,
        description: result.data.description,
        categoryId: suggestedCategoryId || null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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
        </DialogHeader>

        <div className="mt-4">
          {inputMethod === null ? (
            // Выбор метода ввода
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
          ) : inputMethod === "upload" ? (
            // Загрузка чека
            <div className="space-y-4">
              <ReceiptUploader
                onProcessed={handleReceiptProcessed}
                onCancel={handleBack}
              />
            </div>
          ) : inputMethod === "camera" ? (
            // Фотографирование чека
            <div className="space-y-4">
              <ReceiptCamera
                onProcessed={handleReceiptProcessed}
                onCancel={handleBack}
              />
            </div>
          ) : (
            // Ручной ввод
            <div className="space-y-4">
              {prefilledData && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">{t("prefilled.title")}</p>
                  <p className="text-muted-foreground">
                    {t("prefilled.description")}
                  </p>
                </div>
              )}
              <TransactionForm
                initialData={
                  prefilledData
                    ? {
                        amount: prefilledData.amount,
                        date: prefilledData.date,
                        description: prefilledData.description || undefined,
                        category_id: prefilledData.categoryId || undefined,
                      }
                    : undefined
                }
                onSuccess={handleSuccess}
              />
              <Button variant="outline" onClick={handleBack} className="w-full">
                {t("actions.back")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
