import { NextRequest, NextResponse } from "next/server";
import EMLParser from "eml-parser";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не предоставлен" },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isEML = fileName.endsWith(".eml") || file.type === "message/rfc822";

    if (!isEML) {
      return NextResponse.json(
        { error: "Неподдерживаемый формат файла. Используйте EML." },
        { status: 400 }
      );
    }

    const attachments: Array<{
      fileName: string;
      contentType: string;
      content: string; // base64
    }> = [];

    let emailText: string | null = null;

    if (isEML) {
      // Конвертируем File в Stream для eml-parser
      const buffer = Buffer.from(await file.arrayBuffer());
      const stream = Readable.from(buffer);
      const parser = new EMLParser(stream);

      const parsed = await parser.parseEml({ ignoreEmbedded: true });

      // Извлекаем текст письма
      if (parsed.text) {
        emailText = parsed.text;
      } else if (parsed.textAsHtml) {
        // Удаляем HTML теги для получения чистого текста
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

      if (parsed.attachments && Array.isArray(parsed.attachments)) {
        for (const attachment of parsed.attachments) {
          if (attachment.content) {
            // attachment.content может быть Buffer или уже base64 строкой
            let contentBase64: string;

            if (Buffer.isBuffer(attachment.content)) {
              contentBase64 = attachment.content.toString("base64");
            } else if (typeof attachment.content === "string") {
              // Если уже base64, используем как есть
              contentBase64 = attachment.content;
            } else {
              // Пробуем конвертировать в Buffer
              contentBase64 = Buffer.from(attachment.content).toString(
                "base64"
              );
            }

            attachments.push({
              fileName:
                attachment.filename ||
                attachment.fileName ||
                `attachment-${Date.now()}`,
              contentType:
                attachment.contentType ||
                attachment.contentType ||
                "application/octet-stream",
              content: contentBase64,
            });
          }
        }
      }
    }

    // Фильтруем только чеки (PDF или изображения)
    const receiptAttachments = attachments.filter((att) => {
      const contentType = att.contentType.toLowerCase();
      const fileName = att.fileName.toLowerCase();
      return (
        contentType.includes("pdf") ||
        contentType.startsWith("image/") ||
        fileName.endsWith(".pdf") ||
        fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
    });

    // Проверяем, есть ли чек в тексте письма
    // Ищем ключевые слова, характерные для кассовых чеков
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
      const matchedKeywords = receiptKeywords.filter((keyword) =>
        lowerText.includes(keyword.toLowerCase())
      );
      hasReceiptInText = matchedKeywords.length > 0;

      // Логируем для отладки
      console.log("Receipt check:", {
        emailTextLength: emailText.length,
        emailTextPreview: emailText.substring(0, 500),
        hasReceiptInText,
        matchedKeywords,
      });
    } else {
      console.log("No emailText to check for receipt");
    }

    return NextResponse.json({
      success: true,
      attachments: receiptAttachments,
      total: receiptAttachments.length,
      emailText: hasReceiptInText ? emailText : null,
      hasReceiptInText,
    });
  } catch (error) {
    console.error("Ошибка при парсинге email файла:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при обработке email файла",
      },
      { status: 500 }
    );
  }
}
