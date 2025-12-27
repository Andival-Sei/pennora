"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, X, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  useFormField,
} from "@/components/ui/form";
import { CascadingCategorySelect } from "@/components/features/categories/CascadingCategorySelect";
import type { Category } from "@/lib/types/category";
import type { TransactionFormValues } from "@/lib/validations/transactions";
import { formatCurrency } from "@/lib/currency/formatter";

interface TransactionItemsFieldProps {
  form: UseFormReturn<TransactionFormValues>;
  categories: Category[];
  loadingCategories: boolean;
  currency?: string;
}

/**
 * Компонент для плавного отображения сообщений об ошибках формы
 * Резервирует место для предотвращения сдвига layout
 */
function AnimatedFormMessage() {
  const { error, formMessageId } = useFormField();
  const message = error ? String(error?.message) : null;

  return (
    <div className="h-5 overflow-hidden">
      <AnimatePresence>
        {message ? (
          <motion.p
            key={formMessageId}
            id={formMessageId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-xs font-medium text-destructive leading-tight"
          >
            {message}
          </motion.p>
        ) : (
          <div className="h-5" aria-hidden="true" />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Компонент для управления позициями транзакции (split transaction)
 * Позволяет добавлять, удалять и редактировать позиции с разными категориями
 */
export function TransactionItemsField({
  form,
  categories,
  loadingCategories,
  currency = "RUB",
}: TransactionItemsFieldProps) {
  const t = useTranslations("transactions");

  // Используем useFieldArray для управления массивом items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Фильтруем категории только для расходов
  const expenseCategories = categories.filter((cat) => cat.type === "expense");

  // Добавить новую позицию
  const handleAddItem = useCallback(() => {
    append({
      category_id: null,
      amount: undefined as unknown as number,
      description: null,
      sort_order: fields.length,
    });
  }, [append, fields.length]);

  // Вычисляем общую сумму позиций
  const itemsTotal = fields.reduce((sum, _, index) => {
    const amount = form.watch(`items.${index}.amount`);
    return sum + (amount ?? 0);
  }, 0);

  // Обновляем общую сумму транзакции при изменении позиций
  const updateTotalAmount = useCallback(() => {
    if (fields.length > 0) {
      const total = fields.reduce((sum, _, index) => {
        const amount = form.getValues(`items.${index}.amount`);
        return sum + (amount ?? 0);
      }, 0);
      form.setValue("amount", total, { shouldValidate: true });
    }
  }, [fields, form]);

  // Если нет позиций, показываем кнопку добавления
  if (fields.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={handleAddItem}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("items.add")}
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок секции */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          {t("items.title")}
        </Label>
        <span className="text-sm text-muted-foreground">
          {t("items.total")}: {formatCurrency(itemsTotal, currency)}
        </span>
      </div>

      {/* Список позиций */}
      <AnimatePresence mode="popLayout" initial={false}>
        {fields.map((field, index) => {
          return (
            <motion.div
              key={field.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                height: 0,
                scale: 0.95,
                y: -10,
                marginBottom: 0,
                transition: { duration: 0.25, ease: "easeIn" },
              }}
              transition={{
                layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2, ease: "easeOut" },
                scale: { duration: 0.2, ease: "easeOut" },
                y: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
              }}
              className="overflow-hidden"
            >
              <Card className="border-border/50 shadow-sm transition-shadow duration-200 hover:shadow-md focus-within:shadow-md">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Номер позиции */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>

                    {/* Поля позиции */}
                    <div className="flex-1 space-y-4">
                      {/* Первый ряд: Описание и Сумма */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                        {/* Описание (название товара) */}
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field: descriptionField }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel
                                  htmlFor={`items.${index}.description`}
                                  className="text-xs font-medium"
                                >
                                  {t("items.description")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    id={`items.${index}.description`}
                                    aria-describedby={`items.${index}.description-description`}
                                    placeholder={t(
                                      "items.descriptionPlaceholder"
                                    )}
                                    className="h-9 transition-colors focus-visible:ring-2"
                                    value={descriptionField.value ?? ""}
                                    onChange={descriptionField.onChange}
                                    onBlur={descriptionField.onBlur}
                                    name={descriptionField.name}
                                    ref={descriptionField.ref}
                                  />
                                </FormControl>
                                <div
                                  id={`items.${index}.description-description`}
                                  className="sr-only"
                                >
                                  {t("items.description")}
                                </div>
                                <AnimatedFormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Сумма */}
                        <div className="sm:w-32">
                          <FormField
                            control={form.control}
                            name={`items.${index}.amount`}
                            render={({ field: amountField }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel
                                  htmlFor={`items.${index}.amount`}
                                  className="text-xs font-medium text-muted-foreground"
                                >
                                  {t("items.amount")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    id={`items.${index}.amount`}
                                    aria-describedby={`items.${index}.amount-description`}
                                    type="number"
                                    step="any"
                                    className="h-9 text-lg font-semibold transition-colors focus-visible:ring-2"
                                    value={amountField.value ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === "") {
                                        amountField.onChange(
                                          undefined as unknown as number
                                        );
                                      } else {
                                        const numValue = Number(value);
                                        if (!isNaN(numValue)) {
                                          amountField.onChange(numValue);
                                        } else {
                                          amountField.onChange(
                                            undefined as unknown as number
                                          );
                                        }
                                      }
                                      setTimeout(updateTotalAmount, 0);
                                    }}
                                    onBlur={amountField.onBlur}
                                    name={amountField.name}
                                    ref={amountField.ref}
                                    onInvalid={(e) => {
                                      e.preventDefault();
                                    }}
                                  />
                                </FormControl>
                                <div
                                  id={`items.${index}.amount-description`}
                                  className="sr-only"
                                >
                                  {t("items.amount")}
                                </div>
                                <AnimatedFormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Разделитель */}
                      <div className="border-t border-border/50" />

                      {/* Второй ряд: Категория */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.category_id`}
                        render={({ field: categoryField }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium">
                              {t("items.category")}
                            </FormLabel>
                            <FormControl>
                              <CascadingCategorySelect
                                categories={expenseCategories}
                                value={categoryField.value || null}
                                onChange={(value) => {
                                  categoryField.onChange(value);
                                }}
                                type="expense"
                                placeholder={t("form.none")}
                                allowIntermediate={true}
                                isLoading={loadingCategories}
                              />
                            </FormControl>
                            <AnimatedFormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Кнопка удаления */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive/20"
                      onClick={() => {
                        remove(index);
                        // Обновляем общую сумму после удаления
                        setTimeout(updateTotalAmount, 0);
                      }}
                      aria-label={`${t("items.remove")} ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">{t("items.remove")}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Кнопка добавления новой позиции */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={handleAddItem}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("items.add")}
        </Button>
      </motion.div>

      {/* Ошибка валидации */}
      {form.formState.errors.items && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive"
        >
          {form.formState.errors.items.message}
        </motion.p>
      )}
    </div>
  );
}
