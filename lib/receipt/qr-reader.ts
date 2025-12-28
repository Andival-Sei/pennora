/**
 * Сервис для чтения QR-кодов из изображений
 */

import jsQR from "jsqr";

/**
 * Читает QR-код из изображения
 * @param imageData - ImageData из canvas
 * @returns данные из QR-кода или null
 */
export async function readQRCode(imageData: ImageData): Promise<string | null> {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    return code?.data || null;
  } catch (error) {
    console.error("Ошибка при чтении QR-кода:", error);
    return null;
  }
}

/**
 * Читает QR-код из File (изображение)
 * @param file - файл изображения
 * @returns данные из QR-кода или null
 */
export async function readQRCodeFromFile(file: File): Promise<string | null> {
  // Проверяем, работаем ли мы в Node.js окружении
  const isNode = typeof window === "undefined";

  if (isNode) {
    // Используем node-canvas для Node.js окружения
    try {
      // Динамический импорт для работы в Node.js
      const { createCanvas, loadImage } = await import("canvas");
      const buffer = Buffer.from(await file.arrayBuffer());
      const img = await loadImage(buffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Приводим к стандартному типу ImageData для браузера
      return await readQRCode(imageData as ImageData);
    } catch (error) {
      // Если canvas недоступен (не установлен или не скомпилирован),
      // просто возвращаем null - OCR продолжит работу без QR-кода
      console.log(
        "QR-код не может быть прочитан (canvas недоступен), продолжаем с OCR:",
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  // Браузерное окружение
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(null);
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      readQRCode(imageData).then(resolve);
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Парсит данные из QR-кода ФНС
 * QR-код ФНС содержит данные в формате строки с разделителями
 * @param qrData - строка данных из QR-кода
 * @returns объект с распарсенными данными или null
 */
export function parseFNSQRCode(qrData: string): {
  date?: string;
  amount?: number;
  inn?: string;
  fn?: string;
  fd?: string;
  fp?: string;
} | null {
  try {
    // QR-код ФНС обычно содержит данные в формате:
    // t=YYYYMMDDTHHmm&s=сумма&fn=номер_ФН&i=номер_ФД&fp=ФП&n=тип_операции
    // или просто строку с разделителями

    const params: Record<string, string> = {};
    const parts = qrData.split("&");

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    }

    // Извлекаем дату из формата t=YYYYMMDDTHHmm
    let date: string | undefined;
    if (params.t) {
      const dateStr = params.t;
      // Формат: YYYYMMDDTHHmm -> YYYY-MM-DD HH:mm
      if (dateStr.length >= 13) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const hour = dateStr.substring(9, 11);
        const minute = dateStr.substring(11, 13);
        date = `${year}-${month}-${day} ${hour}:${minute}`;
      }
    }

    // Извлекаем сумму
    const amount = params.s ? parseFloat(params.s) : undefined;

    return {
      date,
      amount,
      inn: params.inn,
      fn: params.fn,
      fd: params.i,
      fp: params.fp,
    };
  } catch (error) {
    console.error("Ошибка при парсинге QR-кода ФНС:", error);
    return null;
  }
}
