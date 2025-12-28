/**
 * Пример использования тестовых файлов чеков
 *
 * Этот файл демонстрирует, как использовать утилиты для работы
 * с тестовыми чеками. Удалите этот файл или используйте его как шаблон
 * для создания реальных тестов.
 */

import {
  loadReceiptFixture,
  listReceiptFixtures,
  receiptFixtureExists,
} from "./receipt-test-utils";
import { processReceipt, createReceiptFile } from "@/lib/receipt/processor";

describe("Пример: Обработка тестовых чеков", () => {
  it("должен загрузить и обработать изображение чека", async () => {
    // Проверяем, существует ли файл
    const exists = await receiptFixtureExists("receipt-with-qr.jpg", "image");
    if (!exists) {
      console.warn(
        "Тестовый файл receipt-with-qr.jpg не найден. Добавьте его в __tests__/fixtures/receipts/images/"
      );
      return;
    }

    // Загружаем файл
    const file = await loadReceiptFixture("receipt-with-qr.jpg", "image");
    const receiptFile = createReceiptFile(file);

    // Обрабатываем чек
    const result = await processReceipt(receiptFile);

    // Проверяем результат
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.amount).toBeGreaterThan(0);
      expect(result.data?.date).toBeInstanceOf(Date);
    }
  }, 30000); // Увеличиваем таймаут для OCR

  it("должен загрузить и обработать PDF чек", async () => {
    const exists = await receiptFixtureExists("receipt.pdf", "pdf");
    if (!exists) {
      console.warn(
        "Тестовый файл receipt.pdf не найден. Добавьте его в __tests__/fixtures/receipts/pdf/"
      );
      return;
    }

    const file = await loadReceiptFixture("receipt.pdf", "pdf");
    const receiptFile = createReceiptFile(file);

    const result = await processReceipt(receiptFile);

    expect(result.success).toBe(true);
  }, 30000);

  it("должен получить список всех доступных тестовых файлов", async () => {
    const images = await listReceiptFixtures("image");
    const pdfs = await listReceiptFixtures("pdf");
    const emls = await listReceiptFixtures("eml");

    console.log("Доступные изображения:", images);
    console.log("Доступные PDF:", pdfs);
    console.log("Доступные EML:", emls);

    // Этот тест просто проверяет, что функция работает
    expect(Array.isArray(images)).toBe(true);
    expect(Array.isArray(pdfs)).toBe(true);
    expect(Array.isArray(emls)).toBe(true);
  });
});
