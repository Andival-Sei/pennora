"use client";

import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TransactionDateField } from "../TransactionForm/TransactionDateField";
import { TransactionDescriptionField } from "../TransactionForm/TransactionDescriptionField";
import type { TransactionFormValues } from "@/lib/validations/transactions";

interface BaseTransactionFormProps {
  form: UseFormReturn<TransactionFormValues>;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  isEditing?: boolean;
  children: ReactNode;
  initialDate?: Date;
  showPrefilledBanner?: boolean;
}

/**
 * Базовый компонент формы транзакции
 * Содержит общие поля: дата, описание и кнопку отправки
 */
export function BaseTransactionForm({
  form,
  onSubmit,
  isEditing = false,
  children,
  initialDate,
  showPrefilledBanner = false,
}: BaseTransactionFormProps) {
  const t = useTranslations("transactions.form");
  const tReceipt = useTranslations("receipt");
  const isLoading = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* Баннер о предзаполненных данных */}
        {showPrefilledBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-muted rounded-lg text-sm"
          >
            <p className="font-medium mb-1">{tReceipt("prefilled.title")}</p>
            <p className="text-muted-foreground">
              {tReceipt("prefilled.description")}
            </p>
          </motion.div>
        )}

        {/* Специфичные поля для типа транзакции */}
        {children}

        {/* Общие поля */}
        <TransactionDateField
          form={form}
          initialDate={initialDate || new Date()}
        />

        <TransactionDescriptionField form={form} />

        {/* Ошибка формы */}
        {form.formState.errors.root && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Кнопка отправки */}
        <Button
          type="submit"
          disabled={isLoading || !form.formState.isValid}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t("update") : t("create")}
        </Button>
      </form>
    </Form>
  );
}
