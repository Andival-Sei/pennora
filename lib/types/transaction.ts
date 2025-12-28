import { Database } from "@/lib/db/supabase/types";

// Базовые типы транзакций
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionInsert =
  Database["public"]["Tables"]["transactions"]["Insert"];
export type TransactionUpdate =
  Database["public"]["Tables"]["transactions"]["Update"];

// Типы для позиций транзакции (split transactions)
export type TransactionItem =
  Database["public"]["Tables"]["transaction_items"]["Row"];
export type TransactionItemInsert =
  Database["public"]["Tables"]["transaction_items"]["Insert"];
export type TransactionItemUpdate =
  Database["public"]["Tables"]["transaction_items"]["Update"];

// Позиция с категорией (для отображения в UI)
export type TransactionItemWithCategory = TransactionItem & {
  category: Database["public"]["Tables"]["categories"]["Row"] | null;
};

// Транзакция с категорией (для простых транзакций)
export type TransactionWithCategory = Transaction & {
  category: Database["public"]["Tables"]["categories"]["Row"] | null;
};

// Транзакция с позициями (для split transactions)
export type TransactionWithItems = TransactionWithCategory & {
  items: TransactionItemWithCategory[];
};

// Данные для создания позиции (без transaction_id, который добавляется после создания транзакции)
export type TransactionItemFormData = {
  category_id: string | null;
  amount: number;
  description?: string | null;
  sort_order?: number;
};

// Данные для создания транзакции с позициями
export type TransactionWithItemsInsert = TransactionInsert & {
  items?: TransactionItemFormData[];
};
