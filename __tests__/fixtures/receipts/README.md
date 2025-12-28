# Тестовые данные для чеков

Эта папка содержит тестовые чеки в различных форматах для проверки корректности работы системы обработки чеков.

## Структура

```
receipts/
├── images/              # Изображения чеков (JPEG, PNG, WebP)
├── pdf/                 # PDF файлы с чеками
├── eml/                 # EML файлы (email письма с чеками)
├── receipt-test-utils.ts # Утилиты для работы с тестовыми файлами
├── example.test.ts      # Примеры использования утилит
└── README.md            # Эта документация
```

## Использование

### Размещение файлов

Поместите тестовые чеки в соответствующие папки:

- **Изображения** → `images/`
  - Форматы: `.jpg`, `.jpeg`, `.png`, `.webp`
  - Примеры: фото чека с QR-кодом, отсканированный чек

- **PDF файлы** → `pdf/`
  - Форматы: `.pdf`
  - Примеры: PDF чеки из почты, отсканированные PDF

- **EML файлы** → `eml/`
  - Форматы: `.eml`
  - Примеры: сохраненные письма из почтового клиента с чеками

### Именование файлов

Рекомендуется использовать описательные имена:

```
images/
  ├── receipt-with-qr-code.jpg
  ├── receipt-without-qr.png
  ├── receipt-low-quality.jpg
  └── receipt-multiple-items.png

pdf/
  ├── receipt-single-page.pdf
  ├── receipt-multi-page.pdf
  └── receipt-from-email.pdf

eml/
  ├── receipt-from-mail.eml
  ├── receipt-multiple-attachments.eml
  └── receipt-in-text.eml
```

### Использование в тестах

#### С использованием утилит (рекомендуется)

Используйте готовые утилиты из `receipt-test-utils.ts`:

```typescript
import {
  loadReceiptFixture,
  listReceiptFixtures,
  receiptFixtureExists,
} from "@/__tests__/fixtures/receipts/receipt-test-utils";
import { processReceipt, createReceiptFile } from "@/lib/receipt/processor";

describe("Receipt processing", () => {
  it("should process image receipt with QR code", async () => {
    // Проверяем наличие файла
    const exists = await receiptFixtureExists("receipt-with-qr.jpg", "image");
    if (!exists) {
      console.warn("Тестовый файл не найден");
      return;
    }

    // Загружаем файл
    const file = await loadReceiptFixture("receipt-with-qr.jpg", "image");
    const receiptFile = createReceiptFile(file);

    // Обрабатываем
    const result = await processReceipt(receiptFile);

    expect(result.success).toBe(true);
    expect(result.data?.amount).toBeGreaterThan(0);
  }, 30000); // Увеличиваем таймаут для OCR

  it("should list all available fixtures", async () => {
    const images = await listReceiptFixtures("image");
    const pdfs = await listReceiptFixtures("pdf");

    console.log("Доступные изображения:", images);
    console.log("Доступные PDF:", pdfs);
  });
});
```

#### Без утилит (ручной способ)

Если нужно больше контроля:

```typescript
import { readFile } from "fs/promises";
import { processReceipt, createReceiptFile } from "@/lib/receipt/processor";
import path from "path";

describe("Receipt processing", () => {
  it("should process image receipt with QR code", async () => {
    const imagePath = path.join(
      __dirname,
      "../fixtures/receipts/images/receipt-with-qr-code.jpg"
    );
    const fileBuffer = await readFile(imagePath);
    const file = new File([fileBuffer], "receipt.jpg", { type: "image/jpeg" });
    const receiptFile = createReceiptFile(file);

    const result = await processReceipt(receiptFile);

    expect(result.success).toBe(true);
    expect(result.data?.amount).toBeGreaterThan(0);
  });
});
```

#### Примеры тестов

Смотрите файл `example.test.ts` для полных примеров использования утилит.

### Использование в ручной проверке

Для ручной проверки работы обработки чеков:

1. Загрузите файлы в соответствующие папки
2. Используйте компонент `ReceiptUploader` в приложении
3. Загрузите файл из папки `fixtures/receipts/`
4. Проверьте корректность распознавания данных

## Типы тестовых данных

### Рекомендуемые сценарии для тестирования

1. **Чеки с QR-кодом ФНС**
   - Проверка чтения QR-кода
   - Валидация данных из QR-кода

2. **Чеки без QR-кода**
   - Проверка OCR распознавания
   - Парсинг текста

3. **Чеки разного качества**
   - Высокое качество (четкий текст)
   - Низкое качество (размытый, плохо освещенный)
   - Проверка устойчивости OCR

4. **Чеки с разными форматами**
   - Разные магазины (разные форматы чеков)
   - Разные способы оплаты (наличные/карта)
   - Чеки с товарами и без

5. **EML файлы**
   - Письма с вложениями (PDF/изображения)
   - Письма с чеками в тексте
   - Письма с несколькими чеками

6. **PDF файлы**
   - Одностраничные PDF
   - Многостраничные PDF
   - PDF с текстовым слоем
   - Отсканированные PDF (требуют OCR)

## Примечания

- Файлы в этой папке используются только для тестирования
- Не добавляйте реальные персональные данные или чувствительную информацию
- При необходимости используйте `.gitignore` для исключения больших файлов
- Регулярно проверяйте актуальность тестовых данных при изменении логики обработки
