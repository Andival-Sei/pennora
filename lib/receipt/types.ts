/**
 * Типы данных для работы с чеками
 */

export interface ReceiptData {
  date: Date;
  amount: number;
  description: string | null;
  merchant: string | null; // Название продавца/магазина
  paymentMethod: "cash" | "card" | null;
  items?: Array<{ name: string; price: number }>;
  suggestedCategoryId?: string | null; // Предложенная категория
}

export interface ReceiptProcessingResult {
  success: boolean;
  data?: ReceiptData;
  error?: string;
  rawText?: string; // для отладки
  qrData?: string; // данные из QR-кода, если найден
}

export type ReceiptFileType = "image" | "pdf" | "eml" | "text";

export interface ReceiptFile {
  file: File;
  type: ReceiptFileType;
  preview?: string; // data URL для превью
}

// Для внутреннего использования - тип файла чека (не email)
export type ReceiptContentType = "image" | "pdf" | "text";
