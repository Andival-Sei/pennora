"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createReceiptFile, processReceipt } from "@/lib/receipt/processor";
import { useSmoothProgress } from "@/lib/hooks/useSmoothProgress";
import type { ReceiptProcessingResult } from "@/lib/receipt/types";

interface ReceiptCameraProps {
  onProcessed: (result: ReceiptProcessingResult) => void;
  onCancel?: () => void;
}

export function ReceiptCamera({ onProcessed, onCancel }: ReceiptCameraProps) {
  const t = useTranslations("receipt");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rawProgress, setRawProgress] = useState(0);
  const [rawProgressStage, setRawProgressStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Плавная интерполяция прогресса
  const { progress, stage: progressStage } = useSmoothProgress(
    rawProgress,
    rawProgressStage,
    { speed: 0.15, minSpeed: 0.3 }
  );

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      // Останавливаем предыдущий стрим, если он есть
      stopCamera();

      // Проверяем доступность API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(t("camera.errors.notSupported"));
        return;
      }

      // Определяем, является ли устройство мобильным
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
        (typeof window !== "undefined" && window.innerWidth < 768);

      // Пробуем получить список доступных камер
      let videoDevices: MediaDeviceInfo[] = [];
      try {
        // Пробуем получить список устройств (может не работать без предварительного разрешения)
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter(
          (device) => device.kind === "videoinput" && device.deviceId
        );

        // Если deviceId пустые, значит нужны разрешения - пробуем получить их через временный запрос
        if (videoDevices.length > 0 && videoDevices[0].deviceId === "") {
          try {
            const tempStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            tempStream.getTracks().forEach((track) => track.stop());
            // Повторно получаем список с deviceId
            const devicesWithIds =
              await navigator.mediaDevices.enumerateDevices();
            videoDevices = devicesWithIds.filter(
              (device) => device.kind === "videoinput" && device.deviceId
            );
          } catch {
            videoDevices = []; // Очищаем, если не получилось
          }
        }
      } catch {
        // Игнорируем ошибку перечисления устройств
      }

      // Список стратегий для доступа к камере
      const strategies: Array<MediaStreamConstraints> = [];

      // Если есть список камер, пробуем каждую по deviceId
      if (videoDevices.length > 0) {
        for (const device of videoDevices) {
          if (device.deviceId) {
            strategies.push({
              video: { deviceId: { exact: device.deviceId } },
            });
            strategies.push({ video: { deviceId: device.deviceId } }); // Без exact для более гибкого поиска
          }
        }
      }

      // Добавляем общие стратегии
      if (isMobile) {
        strategies.push(
          { video: { facingMode: "environment" } }, // Задняя камера на мобильных
          { video: { facingMode: "user" } }, // Передняя камера
          { video: true } // Любая доступная камера без ограничений
        );
      } else {
        strategies.push(
          { video: true }, // На ПК сначала пробуем универсальный вариант
          { video: { width: { ideal: 1280 }, height: { ideal: 720 } } } // С оптимальным разрешением
        );
      }

      let lastError: Error | null = null;

      // Пробуем каждую стратегию по очереди с небольшой задержкой между попытками
      for (let i = 0; i < strategies.length; i++) {
        const constraints = strategies[i];
        try {
          // Добавляем небольшую задержку между попытками (кроме первой)
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }

          const mediaStream =
            await navigator.mediaDevices.getUserMedia(constraints);
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            // Ждем, пока видео будет готово
            await new Promise<void>((resolve) => {
              if (videoRef.current) {
                const video = videoRef.current;
                const onLoaded = () => {
                  video.removeEventListener("loadedmetadata", onLoaded);
                  resolve();
                };
                video.addEventListener("loadedmetadata", onLoaded);
                // Таймаут на случай, если событие не сработает
                setTimeout(() => {
                  video.removeEventListener("loadedmetadata", onLoaded);
                  resolve();
                }, 3000);
              } else {
                resolve();
              }
            });
          }
          setError(null);
          return; // Успешно запустили камеру
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          lastError = error;
          // Продолжаем пробовать следующую стратегию
          continue;
        }
      }

      // Если все стратегии не сработали, обрабатываем ошибку
      throw lastError || new Error("Не удалось получить доступ к камере");
    } catch (err) {
      let errorMessage = t("camera.errors.accessDenied");

      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          errorMessage = t("camera.errors.permissionDenied");
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          errorMessage = t("camera.errors.noCamera");
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          errorMessage = t("camera.errors.notReadable");
        } else if (
          err.name === "OverconstrainedError" ||
          err.name === "ConstraintNotSatisfiedError"
        ) {
          errorMessage = t("camera.errors.notReadable");
        }
      }

      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Проверяем, что видео готово
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Подождите, пока камера загрузится");
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageDataUrl);
      stopCamera();
    } catch {
      setError("Не удалось сделать фото. Попробуйте еще раз.");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleProcess = async () => {
    if (!capturedImage || !canvasRef.current) return;

    setProcessing(true);
    setRawProgress(0);
    setRawProgressStage("");

    try {
      // Конвертируем data URL в File
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });

      const receiptFile = createReceiptFile(file);

      const result = await processReceipt(receiptFile, (progress, stage) => {
        setRawProgress(progress);
        setRawProgressStage(stage);
      });

      onProcessed(result);
    } catch (error) {
      onProcessed({
        success: false,
        error:
          error instanceof Error ? error.message : t("errors.processingFailed"),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    stopCamera();
    setCapturedImage(null);
    onCancel?.();
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setError(null);
              startCamera();
            }}
            variant="default"
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("actions.retry")}
          </Button>
          <Button onClick={handleCancel} variant="outline" className="flex-1">
            {t("actions.back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Скрытый canvas для обработки - должен быть всегда доступен */}
      <canvas ref={canvasRef} className="hidden" />

      {!capturedImage ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto rounded-lg"
          />
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              {t("actions.back")}
            </Button>
            <Button type="button" onClick={capturePhoto} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              {t("camera.capture")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Превью сфотографированного чека */}
          <div className="relative border border-border rounded-lg overflow-hidden">
            <Image
              src={capturedImage}
              alt="Сфотографированный чек"
              width={640}
              height={480}
              className="w-full h-auto max-h-64 object-contain"
              unoptimized
            />
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
              onClick={handleRetake}
              disabled={processing}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("camera.retake")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={processing}
              className="flex-1"
            >
              {t("actions.back")}
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
