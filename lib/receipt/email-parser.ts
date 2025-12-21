/**
 * Сервис для извлечения вложений из EML файлов
 * Ищет чеки (PDF или изображения) во вложениях
 */

import type { ReceiptFile } from "./types";
import { getFileType } from "./ocr";

/**
 * Извлекает вложения из EML файла через API route
 * @param file - EML файл
 * @returns массив файлов-вложений
 */
async function extractAttachmentsFromEmailAPI(file: File): Promise<File[]> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/receipts/parse-email", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Не удалось обработать email файл");
    }

    const attachments: File[] = [];

    // Обрабатываем вложения
    if (data.attachments && Array.isArray(data.attachments)) {
      for (const attachment of data.attachments) {
        // Конвертируем base64 обратно в Blob
        const binaryString = atob(attachment.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], {
          type: attachment.contentType || "application/octet-stream",
        });

        const attachmentFile = new File([blob], attachment.fileName, {
          type: attachment.contentType || "application/octet-stream",
        });

        attachments.push(attachmentFile);
      }
    }

    // Если нет вложений, но есть чек в тексте письма, создаем текстовый файл
    if (attachments.length === 0 && data.hasReceiptInText && data.emailText) {
      const textBlob = new Blob([data.emailText], { type: "text/plain" });
      const textFile = new File([textBlob], "receipt-from-email.txt", {
        type: "text/plain",
      });
      attachments.push(textFile);
    }

    return attachments;
  } catch (error) {
    console.error("Ошибка при извлечении вложений через API:", error);
    throw error;
  }
}

/**
 * Извлекает чеки из EML файла
 * @param file - EML файл
 * @returns массив ReceiptFile с найденными чеками
 */
export async function extractReceiptsFromEmail(
  file: File
): Promise<ReceiptFile[]> {
  const fileType = getFileType(file);

  if (fileType === "eml") {
    const attachments = await extractAttachmentsFromEmailAPI(file);
    return attachments.map((attachment) => {
      // Для текстовых файлов используем тип "text", иначе определяем тип
      let type: "image" | "pdf" | "text";
      if (
        attachment.name.endsWith(".txt") ||
        attachment.type === "text/plain" ||
        attachment.name === "receipt-from-email.txt"
      ) {
        type = "text";
      } else {
        const detectedType = getFileType(attachment);
        type =
          detectedType === "image" || detectedType === "pdf"
            ? detectedType
            : "text";
      }

      const preview =
        type === "image" ? URL.createObjectURL(attachment) : undefined;

      return {
        file: attachment,
        type: type,
        preview,
      };
    });
  }

  return [];
}
