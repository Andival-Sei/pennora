"use client";

import { useTranslations } from "next-intl";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import type { TransactionFormValues } from "@/lib/validations/transactions";

interface TransactionTypeFieldProps {
  form: UseFormReturn<TransactionFormValues>;
  accountsCount: number;
}

/**
 * Компонент поля выбора типа транзакции
 */
export function TransactionTypeField({
  form,
  accountsCount,
}: TransactionTypeFieldProps) {
  const t = useTranslations("transactions.form");

  return (
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("type")}</FormLabel>
          <Select
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              // Сбрасываем категорию при изменении типа на transfer
              if (value === "transfer") {
                form.setValue("category_id", "__none__");
                // Сбрасываем целевой счет при смене типа
                form.setValue("to_account_id", "");
              } else {
                // Сбрасываем целевой счет при смене типа на не-transfer
                form.setValue("to_account_id", "");
              }
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="expense">{t("types.expense")}</SelectItem>
              <SelectItem value="income">{t("types.income")}</SelectItem>
              {accountsCount >= 2 && (
                <SelectItem value="transfer">{t("types.transfer")}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
