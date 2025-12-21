"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createReceiptFile,
  processReceipt,
  processEmailFile,
} from "@/lib/receipt/processor";
import { getFileType } from "@/lib/receipt/ocr";
import { useSmoothProgress } from "@/lib/hooks/useSmoothProgress";
import type { ReceiptFile, ReceiptProcessingResult } from "@/lib/receipt/types";

interface ReceiptUploaderProps {
  onProcessed: (result: ReceiptProcessingResult) => void;
  onCancel?: () => void;
}

export function ReceiptUploader({
  onProcessed,
  onCancel,
}: ReceiptUploaderProps) {
  const t = useTranslations("receipt");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptFile, setReceiptFile] = useState<ReceiptFile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rawProgress, setRawProgress] = useState(0);
  const [rawProgressStage, setRawProgressStage] = useState<string>("");

  // Плавная интерполяция прогресса
  const { progress, stage: progressStage } = useSmoothProgress(
    rawProgress,
    rawProgressStage,
    { speed: 0.15, minSpeed: 0.3 }
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    const fileType = getFileType(file);
    const isImage = fileType === "image";
    const isPDF = fileType === "pdf";
    const isEmail = fileType === "eml";

    if (!isImage && !isPDF && !isEmail) {
      toast.error(t("errors.invalidFileType"));
      return;
    }

    // Для email файлов обрабатываем отдельно
    if (isEmail) {
      setReceiptFile({
        file,
        type: fileType,
        preview: undefined,
      });
      return;
    }

    const receipt = createReceiptFile(file);
    setReceiptFile(receipt);
  };

  const handleProcess = async () => {
    if (!receiptFile) return;

    setProcessing(true);
    setRawProgress(0);
    setRawProgressStage("");

    try {
      // Если это email файл (EML), обрабатываем его отдельно
      if (receiptFile.type === "eml") {
        const results = await processEmailFile(
          receiptFile.file,
          (progress, stage) => {
            setRawProgress(progress);
            setRawProgressStage(stage);
          }
        );

        // Если найдено несколько чеков, обрабатываем первый успешный
        const successResult = results.find((r) => r.success);
        if (successResult) {
          onProcessed(successResult);
        } else if (results.length > 0) {
          // Если все не удались, показываем первую ошибку
          onProcessed(results[0]);
        } else {
          onProcessed({
            success: false,
            error: t("errors.noReceiptsFound"),
          });
        }
      } else {
        // Обычная обработка чека
        const result = await processReceipt(receiptFile, (progress, stage) => {
          setRawProgress(progress);
          setRawProgressStage(stage);
        });

        onProcessed(result);
      }
    } catch (error) {
      console.error("Ошибка при обработке чека:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : t("errors.processingFailed");
      onProcessed({
        success: false,
        error: errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = () => {
    if (receiptFile?.preview) {
      URL.revokeObjectURL(receiptFile.preview);
    }
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    handleRemove();
    onCancel?.();
  };

  return (
    <div className="space-y-4">
      {!receiptFile ? (
        <>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.eml"
              onChange={handleFileSelect}
              className="hidden"
              id="receipt-upload"
            />
            <label
              htmlFor="receipt-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="p-4 rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{t("upload.title")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("upload.description")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("upload.emailFormats")}
                </p>
              </div>
              <Button type="button" variant="outline" asChild>
                <span>{t("upload.selectFile")}</span>
              </Button>
            </label>
          </div>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              {t("actions.back")}
            </Button>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* Превью файла */}
          <div className="relative border border-border rounded-lg overflow-hidden">
            {receiptFile.type === "image" && receiptFile.preview ? (
              <Image
                src={receiptFile.preview}
                alt="Превью чека"
                width={640}
                height={480}
                className="w-full h-auto max-h-64 object-contain"
                unoptimized
              />
            ) : (
              <div className="p-8 flex flex-col items-center justify-center gap-2 bg-muted">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {receiptFile.file.name}
                </p>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={processing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Прогресс обработки */}
          {processing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progressStage}</span>
                <span className="text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={processing}
              className="flex-1"
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleProcess}
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("actions.processing")}
                </>
              ) : (
                t("actions.process")
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
