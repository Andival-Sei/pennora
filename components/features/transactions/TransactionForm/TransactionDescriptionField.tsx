"use client";

import { useTranslations } from "next-intl";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { UseFormReturn } from "react-hook-form";
import type { TransactionFormValues } from "@/lib/validations/transactions";

interface TransactionDescriptionFieldProps {
  form: UseFormReturn<TransactionFormValues>;
}

/**
 * Компонент поля ввода описания транзакции
 */
export function TransactionDescriptionField({
  form,
}: TransactionDescriptionFieldProps) {
  const t = useTranslations("transactions.form");

  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("description")}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              autoResize
              placeholder={t("descriptionPlaceholder")}
              rows={2}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
