/**
 * Сервис для OCR обработки изображений и PDF
 */

import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

/**
 * Извлекает текст из изображения с помощью OCR
 * @param file - файл изображения
 * @param onProgress - callback для отслеживания прогресса
 * @returns извлеченный текст
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const worker = await createWorker("rus+eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && m.progress) {
          onProgress?.(m.progress);
        }
      },
    });

    const {
      data: { text },
    } = await worker.recognize(file);

    await worker.terminate();

    return text;
  } catch (error) {
    console.error("Ошибка при OCR обработке изображения:", error);
    throw new Error("Не удалось распознать текст из изображения");
  }
}

/**
 * Извлекает текст из PDF файла
 * @param file - PDF файл
 * @returns извлеченный текст
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Настраиваем worker для pdfjs-dist
    // Используем локальный worker из public папки (Next.js автоматически обслуживает файлы из public)
    if (
      typeof window !== "undefined" &&
      !pdfjsLib.GlobalWorkerOptions.workerSrc
    ) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true, // Используем системные шрифты для лучшей поддержки русского текста
    });
    const pdf = await loadingTask.promise;

    let fullText = "";

    // Извлекаем текст из всех страниц
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Объединяем текст из всех элементов страницы
      // items содержит объекты с полем 'str' (строка текста)
      const pageText = textContent.items
        .map((item) => {
          // Некоторые элементы могут иметь transform для позиционирования
          // но нам нужен только текст
          // Проверяем, что это TextItem с полем str
          if ("str" in item && typeof item.str === "string") {
            return item.str;
          }
          return "";
        })
        .filter((text: string) => text.trim().length > 0)
        .join(" ");

      if (pageText.trim()) {
        fullText += pageText + "\n";
      }
    }

    return fullText.trim();
  } catch (error) {
    console.error("Ошибка при извлечении текста из PDF:", error);
    throw new Error(
      error instanceof Error
        ? `Не удалось извлечь текст из PDF: ${error.message}`
        : "Не удалось извлечь текст из PDF"
    );
  }
}

/**
 * Определяет тип файла
 */
export function getFileType(file: File): "image" | "pdf" | "eml" {
  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  // Определяем по расширению, если MIME type не определен
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    return "pdf";
  }
  if (extension === "eml" || file.type === "message/rfc822") {
    return "eml";
  }

  return "image";
}

/**
 * Извлекает текст из файла (изображение или PDF)
 * @param file - файл
 * @param onProgress - callback для отслеживания прогресса (только для изображений)
 * @returns извлеченный текст
 */
export async function extractTextFromFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileType = getFileType(file);

  if (fileType === "pdf") {
    return extractTextFromPDF(file);
  } else {
    return extractTextFromImage(file, onProgress);
  }
}
