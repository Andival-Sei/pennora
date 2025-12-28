/**
 * Серверный модуль для парсинга EML файлов
 * Используется только на сервере (API routes, тесты)
 * НЕ должен импортироваться в клиентском коде
 *
 * ВАЖНО: Этот файл импортируется только динамически в Node.js окружении
 */

/**
 * Извлекает вложения из EML файла напрямую (без API)
 * Используется ТОЛЬКО в Node.js окружении (тесты, сервер)
 * @param file - EML файл
 * @returns массив файлов-вложений
 */
export async function extractAttachmentsFromEmailDirect(
  file: File
): Promise<File[]> {
  try {
    // Динамический импорт для работы в Node.js окружении
    const emlParserModule = await import("eml-parser");
    const EMLParser = emlParserModule.default;
    const streamModule = await import("stream");
    const { Readable } = streamModule;

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);
    const parser = new EMLParser(stream);

    const parsed = await parser.parseEml({ ignoreEmbedded: true });

    const attachments: File[] = [];
    let emailText: string | null = null;

    // Извлекаем текст письма
    if (parsed.text) {
      emailText = parsed.text;
    } else if (parsed.textAsHtml) {
      emailText = parsed.textAsHtml
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    } else if (parsed.html) {
      emailText = parsed.html
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    }

    // Обрабатываем вложения
    if (parsed.attachments && Array.isArray(parsed.attachments)) {
      for (const attachment of parsed.attachments) {
        if (attachment.content) {
          let contentBuffer: Buffer;

          if (Buffer.isBuffer(attachment.content)) {
            contentBuffer = attachment.content;
          } else if (typeof attachment.content === "string") {
            contentBuffer = Buffer.from(attachment.content, "base64");
          } else {
            contentBuffer = Buffer.from(attachment.content);
          }

          const contentType =
            attachment.contentType || "application/octet-stream";
          const fileName =
            attachment.filename ||
            attachment.fileName ||
            `attachment-${Date.now()}`;

          // Фильтруем только чеки (PDF или изображения)
          const isReceipt =
            contentType.includes("pdf") ||
            contentType.startsWith("image/") ||
            fileName.toLowerCase().endsWith(".pdf") ||
            fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i);

          if (isReceipt) {
            // Конвертируем Buffer в Uint8Array для Blob
            const uint8Array = new Uint8Array(contentBuffer);
            const blob = new Blob([uint8Array], { type: contentType });
            const attachmentFile = new File([blob], fileName, {
              type: contentType,
            });
            attachments.push(attachmentFile);
          }
        }
      }
    }

    // Проверяем, есть ли чек в тексте письма
    const receiptKeywords = [
      "кассовый чек",
      "чек",
      "итого",
      "сумма по чеку",
      "фн",
      "фд",
      "фпд",
      "инн",
      "ндс",
      "общая стоимость",
      "наличными",
      "безналичными",
      "спасибо за покупку",
      "receipt",
      "total",
      "amount",
    ];

    let hasReceiptInText = false;
    if (emailText) {
      const lowerText = emailText.toLowerCase();
      hasReceiptInText = receiptKeywords.some((keyword) =>
        lowerText.includes(keyword.toLowerCase())
      );
    }

    // Если нет вложений, но есть чек в тексте письма, создаем текстовый файл
    if (attachments.length === 0 && hasReceiptInText && emailText) {
      const textBlob = new Blob([emailText], { type: "text/plain" });
      const textFile = new File([textBlob], "receipt-from-email.txt", {
        type: "text/plain",
      });
      attachments.push(textFile);
    }

    return attachments;
  } catch (error) {
    console.error("Ошибка при прямом извлечении вложений:", error);
    throw error;
  }
}
