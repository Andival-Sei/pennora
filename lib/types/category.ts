import { Database } from "@/lib/db/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];

export type CategoryInsert =
  Database["public"]["Tables"]["categories"]["Insert"];

export type CategoryUpdate =
  Database["public"]["Tables"]["categories"]["Update"];

export type CategoryType = Database["public"]["Enums"]["category_type"];

export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[];
};

export type CategoryTree = {
  income: CategoryWithChildren[];
  expense: CategoryWithChildren[];
};
