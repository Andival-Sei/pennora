/**
 * Утилиты для работы с тестовыми файлами чеков
 */

import { readFile } from "fs/promises";
import path from "path";

/**
 * Базовый путь к папке с тестовыми чеками
 */
const FIXTURES_DIR = path.join(__dirname);

/**
 * Типы тестовых файлов
 */
export type ReceiptFixtureType = "image" | "pdf" | "eml";

/**
 * Загружает тестовый файл чека и возвращает его как File объект
 *
 * @param filename - имя файла (например, "receipt-with-qr.jpg")
 * @param type - тип файла (image, pdf, eml)
 * @returns File объект, готовый для использования в processReceipt
 *
 * @example
 * ```ts
 * const file = await loadReceiptFixture("receipt-with-qr.jpg", "image");
 * const receiptFile = createReceiptFile(file);
 * const result = await processReceipt(receiptFile);
 * ```
 */
export async function loadReceiptFixture(
  filename: string,
  type: ReceiptFixtureType
): Promise<File> {
  const subdir = type === "image" ? "images" : type === "pdf" ? "pdf" : "eml";
  const filePath = path.join(FIXTURES_DIR, subdir, filename);

  try {
    const buffer = await readFile(filePath);
    const mimeType = getMimeType(filename, type);
    return new File([buffer], filename, { type: mimeType });
  } catch (error) {
    throw new Error(
      `Не удалось загрузить тестовый файл: ${filePath}\n${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Получает MIME тип на основе расширения файла
 */
function getMimeType(filename: string, type: ReceiptFixtureType): string {
  const ext = path.extname(filename).toLowerCase();

  switch (type) {
    case "image":
      if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
      if (ext === ".png") return "image/png";
      if (ext === ".webp") return "image/webp";
      return "image/jpeg"; // По умолчанию

    case "pdf":
      return "application/pdf";

    case "eml":
      return "message/rfc822";

    default:
      return "application/octet-stream";
  }
}

/**
 * Получает список всех доступных тестовых файлов указанного типа
 *
 * @param type - тип файлов для поиска
 * @returns массив имён файлов
 *
 * @example
 * ```ts
 * const images = await listReceiptFixtures("image");
 * // ["receipt-with-qr.jpg", "receipt-without-qr.png", ...]
 * ```
 */
export async function listReceiptFixtures(
  type: ReceiptFixtureType
): Promise<string[]> {
  const subdir = type === "image" ? "images" : type === "pdf" ? "pdf" : "eml";
  const dirPath = path.join(FIXTURES_DIR, subdir);

  try {
    const { readdir } = await import("fs/promises");
    const files = await readdir(dirPath);
    // Фильтруем только файлы (не папки) и исключаем .gitkeep
    return files.filter(
      (file) => !file.startsWith(".") && !file.endsWith(".gitkeep")
    );
  } catch {
    // Если папка не существует или пуста, возвращаем пустой массив
    return [];
  }
}

/**
 * Проверяет, существует ли тестовый файл
 *
 * @param filename - имя файла
 * @param type - тип файла
 * @returns true, если файл существует
 */
export async function receiptFixtureExists(
  filename: string,
  type: ReceiptFixtureType
): Promise<boolean> {
  try {
    await loadReceiptFixture(filename, type);
    return true;
  } catch {
    return false;
  }
}
