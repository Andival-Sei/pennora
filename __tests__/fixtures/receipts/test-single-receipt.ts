/**
 * Скрипт для тестирования конкретного чека
 * Показывает все распознанные данные: позиции, суммы, категории
 */

import { loadReceiptFixture, listReceiptFixtures } from "./receipt-test-utils";
import { processEmailFile } from "@/lib/receipt/processor";
import { matchCategoryByDescription } from "@/lib/receipt/category-matcher";
import type { Category } from "@/lib/types/category";

// Мокируем категории для тестирования
const mockCategories: Category[] = [
  {
    id: "1",
    name: "Еда",
    type: "expense",
    icon: "🍔",
    color: "#FF6B6B",
    is_archived: false,
    is_system: false,
    parent_id: null,
    sort_order: 0,
    user_id: "test",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Рестораны",
    type: "expense",
    icon: "🍽️",
    color: "#4ECDC4",
    is_archived: false,
    is_system: false,
    parent_id: null,
    sort_order: 0,
    user_id: "test",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Транспорт",
    type: "expense",
    icon: "🚗",
    color: "#45B7D1",
    is_archived: false,
    is_system: false,
    parent_id: null,
    sort_order: 0,
    user_id: "test",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Развлечения",
    type: "expense",
    icon: "🎬",
    color: "#FFA07A",
    is_archived: false,
    is_system: false,
    parent_id: null,
    sort_order: 0,
    user_id: "test",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

async function testReceipt() {
  console.log("=".repeat(80));
  console.log("ТЕСТИРОВАНИЕ РАСПОЗНАВАНИЯ ЧЕКА");
  console.log("=".repeat(80));

  // Обрабатываем EML файл
  const emls = await listReceiptFixtures("eml");
  if (emls.length === 0) {
    console.error("Нет доступных EML файлов");
    return;
  }

  const emlName = emls[0];
  console.log(`\n📧 Обработка EML файла: ${emlName}\n`);

  const file = await loadReceiptFixture(emlName, "eml");

  const startTime = Date.now();
  const results = await processEmailFile(file, (progress, stage) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (progress % 25 === 0 || progress === 100) {
      console.log(`  [${elapsed}s] ${progress}% - ${stage}`);
    }
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️  Обработка заняла ${elapsed} секунд\n`);

  if (results.length === 0) {
    console.error("❌ Чеки не найдены в письме");
    return;
  }

  // Обрабатываем каждый найденный чек
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    console.log("=".repeat(80));
    console.log(`ЧЕК ${i + 1} из ${results.length}`);
    console.log("=".repeat(80));

    if (!result.success || !result.data) {
      console.error(`❌ Ошибка обработки: ${result.error}`);
      continue;
    }

    const data = result.data;

    // Основная информация
    console.log("\n📋 ОСНОВНАЯ ИНФОРМАЦИЯ:");
    console.log(`  💰 Сумма: ${data.amount.toFixed(2)} ₽`);
    console.log(`  📅 Дата: ${data.date.toLocaleString("ru-RU")}`);
    console.log(
      `  💳 Способ оплаты: ${
        data.paymentMethod === "cash"
          ? "Наличные"
          : data.paymentMethod === "card"
            ? "Карта"
            : "Не определен"
      }`
    );
    console.log(`  📝 Описание: ${data.description || "не указано"}`);

    // Определяем категорию для всего чека
    const suggestedCategoryId = data.description
      ? matchCategoryByDescription(data.description, mockCategories, "expense")
      : null;
    const suggestedCategory = suggestedCategoryId
      ? mockCategories.find((c) => c.id === suggestedCategoryId)
      : null;

    console.log(
      `  🏷️  Предложенная категория: ${
        suggestedCategory
          ? `${suggestedCategory.icon} ${suggestedCategory.name}`
          : "не определена"
      }`
    );

    // Позиции чека
    if (data.items && data.items.length > 0) {
      console.log(`\n🛒 ПОЗИЦИИ ЧЕКА (${data.items.length} шт.):`);
      console.log("-".repeat(80));

      let totalItemsSum = 0;

      data.items.forEach((item, index) => {
        // Определяем категорию для каждой позиции
        const itemCategoryId = matchCategoryByDescription(
          item.name,
          mockCategories,
          "expense"
        );
        const itemCategory = itemCategoryId
          ? mockCategories.find((c) => c.id === itemCategoryId)
          : null;

        totalItemsSum += item.price;

        console.log(`\n  ${index + 1}. ${item.name}`);
        console.log(`     💵 Цена: ${item.price.toFixed(2)} ₽`);
        console.log(
          `     🏷️  Категория: ${
            itemCategory
              ? `${itemCategory.icon} ${itemCategory.name}`
              : "не определена"
          }`
        );
      });

      console.log("-".repeat(80));
      console.log(`  📊 Сумма по позициям: ${totalItemsSum.toFixed(2)} ₽`);
      console.log(`  📊 Общая сумма чека: ${data.amount.toFixed(2)} ₽`);

      if (Math.abs(totalItemsSum - data.amount) > 0.01) {
        const diff = data.amount - totalItemsSum;
        console.log(
          `  ⚠️  Разница: ${diff > 0 ? "+" : ""}${diff.toFixed(2)} ₽ (возможно, скидки/налоги)`
        );
      }
    } else {
      console.log("\n⚠️  Позиции не распознаны");
    }

    // Дополнительная информация
    if (result.qrData) {
      console.log(`\n📱 QR-код: найден и обработан`);
    } else {
      console.log(`\n📱 QR-код: не найден (использован OCR)`);
    }

    if (result.rawText) {
      console.log(
        `\n📄 Распознанный текст (первые 300 символов):\n${result.rawText.substring(0, 300)}...`
      );
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("ТЕСТИРОВАНИЕ ЗАВЕРШЕНО");
  console.log("=".repeat(80));
}

// Запускаем тест
testReceipt().catch(console.error);
