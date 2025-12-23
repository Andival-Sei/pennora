"use client";

import { useTranslations } from "next-intl";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { TransactionFormValues } from "@/lib/validations/transactions";

interface TransactionAmountFieldProps {
  form: UseFormReturn<TransactionFormValues>;
}

/**
 * Компонент поля ввода суммы транзакции
 */
export function TransactionAmountField({ form }: TransactionAmountFieldProps) {
  const t = useTranslations("transactions.form");

  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("amount")}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
              {...field}
              value={field.value || ""}
              onChange={(e) => {
                const value = e.target.value;
                field.onChange(value === "" ? 0 : parseFloat(value) || 0);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
