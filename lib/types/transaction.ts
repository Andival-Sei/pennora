import { Database } from "@/lib/db/supabase/types";

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionInsert =
  Database["public"]["Tables"]["transactions"]["Insert"];
export type TransactionUpdate =
  Database["public"]["Tables"]["transactions"]["Update"];

export type TransactionWithCategory = Transaction & {
  category: Database["public"]["Tables"]["categories"]["Row"] | null;
};
