"use client";

import { useTranslations } from "next-intl";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { CascadingCategorySelect } from "@/components/features/categories/CascadingCategorySelect";
import type { UseFormReturn } from "react-hook-form";
import type { TransactionFormValues } from "@/lib/validations/transactions";
import type { Category } from "@/lib/types/category";

interface TransactionCategoryFieldProps {
  form: UseFormReturn<TransactionFormValues>;
  categories: Category[];
  loadingCategories: boolean;
  transactionType: string;
}

/**
 * Компонент поля выбора категории транзакции
 */
export function TransactionCategoryField({
  form,
  categories,
  loadingCategories,
  transactionType,
}: TransactionCategoryFieldProps) {
  const t = useTranslations("transactions.form");

  return (
    <FormField
      control={form.control}
      name="category_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("category")}</FormLabel>
          <FormControl>
            <CascadingCategorySelect
              categories={categories}
              value={
                field.value === "__none__" || !field.value ? null : field.value
              }
              onChange={(value) => field.onChange(value || "__none__")}
              type={
                transactionType === "income"
                  ? "income"
                  : transactionType === "expense"
                    ? "expense"
                    : undefined
              }
              placeholder={t("none")}
              allowIntermediate={true}
              isLoading={loadingCategories}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
