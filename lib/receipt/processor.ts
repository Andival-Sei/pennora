/**
 * Главный сервис для обработки чеков
 * Координирует весь процесс: OCR/PDF → QR → парсинг
 */

import type {
  ReceiptData,
  ReceiptProcessingResult,
  ReceiptFile,
} from "./types";
import { extractTextFromFile, getFileType } from "./ocr";
import { readQRCodeFromFile, parseFNSQRCode } from "./qr-reader";
import { parseReceiptText } from "./parser";
import { extractReceiptsFromEmail } from "./email-parser";
import { createModuleLogger } from "@/lib/utils/logger";

const logger = createModuleLogger("receipt");

/**
 * Обрабатывает чек из файла
 * @param file - файл чека (изображение или PDF)
 * @param onProgress - callback для отслеживания прогресса
 * @returns результат обработки
 */
export async function processReceipt(
  file: ReceiptFile,
  onProgress?: (progress: number, stage: string) => void
): Promise<ReceiptProcessingResult> {
  try {
    onProgress?.(0, "Начало обработки...");

    // Шаг 1: Пытаемся прочитать QR-код (только для изображений)
    let qrData: string | null = null;
    let fnsData: ReturnType<typeof parseFNSQRCode> = null;

    if (file.type === "image") {
      onProgress?.(10, "Чтение QR-кода...");
      try {
        qrData = await readQRCodeFromFile(file.file);
        if (qrData) {
          fnsData = parseFNSQRCode(qrData);
          onProgress?.(30, "QR-код найден, извлечение данных...");
        }
      } catch {
        // Продолжаем обработку без QR-кода
      }
    }

    // Шаг 2: Извлекаем текст из файла
    onProgress?.(qrData ? 40 : 20, "Извлечение текста...");
    let extractedText: string;

    try {
      extractedText = await extractTextFromFile(file.file, (progress) => {
        // Прогресс OCR: от 20% до 75% (или от 40% до 75% если был QR)
        // Оставляем место для финального парсинга (75% → 100%)
        const baseProgress = qrData ? 40 : 20;
        const ocrProgress = baseProgress + progress * 0.55; // 55% вместо 60% для более плавного перехода
        onProgress?.(ocrProgress, "Распознавание текста...");
      });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Не удалось извлечь текст из файла",
        rawText: undefined,
        qrData: qrData || undefined,
      };
    }

    // Шаг 3: Парсим данные из текста
    // Плавно переходим от OCR к парсингу
    onProgress?.(75, "Анализ данных...");
    const parsedData = parseReceiptText(extractedText);

    // Небольшая задержка для визуального эффекта перед завершением
    onProgress?.(90, "Формирование результата...");

    // Шаг 4: Объединяем данные из QR-кода и парсинга
    // Данные из QR-кода имеют приоритет, так как они более точные
    const receiptData: ReceiptData = {
      date: fnsData?.date
        ? new Date(fnsData.date)
        : parsedData.date || new Date(),
      amount: fnsData?.amount || parsedData.amount || 0,
      description: parsedData.description || null,
      merchant: parsedData.merchant || null,
      paymentMethod: parsedData.paymentMethod || null,
      items: parsedData.items,
    };

    // Валидация данных
    if (!receiptData.amount || receiptData.amount <= 0) {
      return {
        success: false,
        error: "Не удалось определить сумму чека",
        rawText: extractedText,
        qrData: qrData || undefined,
      };
    }

    if (!receiptData.date || isNaN(receiptData.date.getTime())) {
      receiptData.date = new Date();
    }

    // Небольшая задержка для плавного завершения
    await new Promise((resolve) => setTimeout(resolve, 200));
    onProgress?.(100, "Обработка завершена");

    return {
      success: true,
      data: receiptData,
      rawText: extractedText,
      qrData: qrData || undefined,
    };
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Произошла неизвестная ошибка при обработке чека",
    };
  }
}

/**
 * Создает объект ReceiptFile из File
 */
export function createReceiptFile(file: File): ReceiptFile {
  const type = getFileType(file);
  const preview = type === "image" ? URL.createObjectURL(file) : undefined;

  return {
    file,
    type,
    preview,
  };
}

/**
 * Обрабатывает EML файл, извлекая чеки из вложений или текста
 * @param file - EML файл
 * @param onProgress - callback для отслеживания прогресса
 * @returns массив результатов обработки найденных чеков
 */
export async function processEmailFile(
  file: File,
  onProgress?: (progress: number, stage: string) => void
): Promise<ReceiptProcessingResult[]> {
  try {
    onProgress?.(0, "Извлечение данных из письма...");

    const receiptFiles = await extractReceiptsFromEmail(file);

    if (receiptFiles.length === 0) {
      return [
        {
          success: false,
          error:
            "В письме не найдено вложений с чеками (PDF или изображения) и текста с чеком",
        },
      ];
    }

    onProgress?.(30, `Найдено ${receiptFiles.length} чеков, обработка...`);

    const results: ReceiptProcessingResult[] = [];

    for (let i = 0; i < receiptFiles.length; i++) {
      const receiptFile = receiptFiles[i];
      const progressBase = 30 + (i / receiptFiles.length) * 70;

      onProgress?.(
        progressBase,
        `Обработка чека ${i + 1} из ${receiptFiles.length}...`
      );

      // Если это текстовый файл (чек из текста письма), обрабатываем напрямую
      if (
        receiptFile.file.name.endsWith(".txt") ||
        receiptFile.file.type === "text/plain" ||
        receiptFile.file.name === "receipt-from-email.txt"
      ) {
        // Это текстовый файл с чеком, парсим напрямую
        const text = await receiptFile.file.text();
        const parsedData = parseReceiptText(text);

        const receiptData: ReceiptData = {
          date: parsedData.date || new Date(),
          amount: parsedData.amount || 0,
          description: parsedData.description || null,
          merchant: parsedData.merchant || null,
          paymentMethod: parsedData.paymentMethod || null,
          items: parsedData.items,
        };

        if (!receiptData.amount || receiptData.amount <= 0) {
          results.push({
            success: false,
            error: "Не удалось определить сумму чека из текста",
            rawText: text,
          });
        } else {
          results.push({
            success: true,
            data: receiptData,
            rawText: text,
          });
        }
      } else {
        // Обычная обработка (PDF или изображение)
        const result = await processReceipt(receiptFile, (progress, stage) => {
          const currentProgress =
            progressBase + (progress / receiptFiles.length) * 70;
          onProgress?.(currentProgress, stage);
        });

        results.push(result);
      }
    }

    onProgress?.(100, "Обработка завершена");

    return results;
  } catch (error) {
    logger.error(error);
    return [
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при обработке email файла",
      },
    ];
  }
}
