"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X, Package, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  useFormField,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { CascadingCategorySelect } from "@/components/features/categories/CascadingCategorySelect";
import { queryKeys } from "@/lib/query/keys";
import { fetchAccounts } from "@/lib/query/queries/accounts";
import { createClient } from "@/lib/db/supabase/client";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import {
  createTransactionFormSchema,
  type TransactionFormValues,
} from "@/lib/validations/transactions";
import { TransactionService } from "@/lib/services/transactions";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useCategories } from "@/lib/hooks/useCategories";
import { formatCurrency } from "@/lib/currency/formatter";
import type { TransactionWithItems } from "@/lib/types/transaction";

import { TransactionAccountFields } from "../TransactionForm/TransactionAccountFields";
import { TransactionDateField } from "../TransactionForm/TransactionDateField";
import { TransactionDescriptionField } from "../TransactionForm/TransactionDescriptionField";
import type { PrefilledData } from "../TransactionWizard/types";

interface ExpenseDetailedFormProps {
  prefilledData?: PrefilledData | null;
  editData?: TransactionWithItems;
  onSuccess?: () => void;
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
 * Форма для детального расхода (чек с позициями)
 * Поля: Позиции (сумма, категория, описание), Счёт, Дата, Описание
 * БЕЗ поля общей суммы - вычисляется автоматически
 */
export function ExpenseDetailedForm({
  prefilledData,
  editData,
  onSuccess,
}: ExpenseDetailedFormProps) {
  const t = useTranslations("transactions");
  const tErrors = useTranslations("errors");
  const tReceipt = useTranslations("receipt");
  const { addTransaction, updateTransaction } = useTransactions();
  const { categories, loading: loadingCategories } = useCategories();

  // Фильтруем только категории расходов
  const expenseCategories = useMemo(
    () => categories.filter((cat) => cat.type === "expense"),
    [categories]
  );

  const formSchema = createTransactionFormSchema(tErrors);

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: fetchAccounts,
    staleTime: QUERY_STALE_TIME.ACCOUNTS,
    gcTime: QUERY_GC_TIME.ACCOUNTS,
  });

  // Получить валюту выбранного счета
  const selectedAccountId =
    useForm<TransactionFormValues>().watch?.("account_id");
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const currency = selectedAccount?.currency || "RUB";

  // Инициализация формы
  const getInitialValues = (): TransactionFormValues => {
    if (editData) {
      const base = TransactionService.getInitialFormValues(editData);
      // Преобразуем items из editData
      // Важно: сохраняем category_id как есть (может быть null или UUID)
      const items =
        editData.items?.map((item, index) => ({
          category_id: item.category_id ?? null, // Используем ?? вместо || чтобы сохранить пустую строку как null
          amount: Number(item.amount) || 0,
          description: item.description ?? null,
          sort_order: item.sort_order ?? index,
        })) || [];

      return {
        ...base,
        items:
          items.length > 0
            ? items
            : [
                {
                  category_id: null,
                  amount: undefined as unknown as number,
                  description: null,
                  sort_order: 0,
                },
              ],
      };
    }

    const baseValues = TransactionService.getEmptyFormValues();

    // Если есть предзаполненные позиции
    if (prefilledData?.items && prefilledData.items.length > 0) {
      return {
        ...baseValues,
        type: "expense",
        amount: prefilledData.items.reduce((sum, item) => sum + item.amount, 0),
        date: prefilledData.date || new Date(),
        description: prefilledData.description || "",
        items: prefilledData.items.map((item, index) => ({
          category_id: item.category_id || null,
          amount: item.amount,
          description: item.description || null,
          sort_order: index,
        })),
      };
    }

    // По умолчанию создаем одну пустую позицию
    return {
      ...baseValues,
      type: "expense",
      amount: 0,
      date: prefilledData?.date || new Date(),
      description: prefilledData?.description || "",
      items: [
        {
          category_id: null,
          amount: undefined as unknown as number,
          description: null,
          sort_order: 0,
        },
      ],
    };
  };

  const initialValues = getInitialValues();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Переинициализируем форму при изменении editData
  useEffect(() => {
    if (editData) {
      const newValues = getInitialValues();
      form.reset(newValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData?.id]);

  const isLoading = form.formState.isSubmitting;

  // Устанавливаем тип как expense при монтировании и при редактировании
  useEffect(() => {
    form.setValue("type", "expense", { shouldValidate: false });
  }, [form]);

  // Вычисляем и обновляем общую сумму
  const updateTotalAmount = useCallback(() => {
    const items = form.getValues("items") || [];
    const total = items.reduce((sum, item) => sum + (item?.amount ?? 0), 0);
    form.setValue("amount", total, { shouldValidate: true });
  }, [form]);

  // Обновляем сумму при изменении позиций
  useEffect(() => {
    updateTotalAmount();
  }, [fields.length, updateTotalAmount]);

  // Текущая сумма для отображения
  const itemsTotal = fields.reduce((sum, _, index) => {
    const amount = form.watch(`items.${index}.amount`);
    return sum + (amount ?? 0);
  }, 0);

  const handleAddItem = useCallback(() => {
    append({
      category_id: null,
      amount: undefined as unknown as number,
      description: null,
      sort_order: fields.length,
    });
  }, [append, fields.length]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        const errorMsg = tErrors("mutations.unauthorized");
        toast.error(errorMsg);
        form.setError("root", { type: "manual", message: errorMsg });
        return;
      }

      // Подготавливаем items, фильтруем позиции без amount
      const items = values.items
        ?.filter((item) => item.amount !== undefined && item.amount >= 0.01)
        .map((item, index) => ({
          category_id: item.category_id ?? null,
          amount: item.amount!,
          description: item.description ?? null,
          sort_order: item.sort_order ?? index,
        }));

      const transactionData =
        TransactionService.prepareTransactionWithItemsData(
          { ...values, type: "expense" },
          accounts,
          user.id,
          items
        );

      if (editData) {
        // Исключаем items из transactionData, так как это не колонка таблицы transactions
        // items обрабатываются отдельно через updateTransactionWithItems
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { items: _items, ...transactionUpdate } = transactionData;
        // Нормализуем UUID поля (преобразуем пустые строки в null)
        const normalizedUpdate =
          TransactionService.normalizeTransactionUUIDs(transactionUpdate);
        await updateTransaction(editData.id, normalizedUpdate, items);
      } else {
        await addTransaction(transactionData);
      }

      form.reset(TransactionService.getEmptyFormValues());
      onSuccess?.();
    } catch (error) {
      console.error(error);
      const errorMessage = getErrorMessage(error, tErrors);
      form.setError("root", { type: "server", message: errorMessage });
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* Баннер о предзаполненных данных */}
        {prefilledData && (
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

        {/* Выбор счёта */}
        <TransactionAccountFields
          form={form}
          accounts={accounts}
          loadingAccounts={loadingAccounts}
          transactionType="expense"
        />

        {/* Секция позиций */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t("items.title")}
            </Label>
            <span className="text-sm font-medium">
              {t("items.total")}: {formatCurrency(itemsTotal, currency)}
            </span>
          </div>

          {/* Список позиций */}
          <AnimatePresence mode="popLayout">
            {fields.map((field, index) => (
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
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      {/* Номер позиции */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </div>

                      {/* Поля позиции */}
                      <div className="flex-1 space-y-3">
                        {/* Первый ряд: Описание и Сумма */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                          {/* Описание (название товара) */}
                          <div className="flex-1">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field: descriptionField }) => (
                                <FormItem className="space-y-1">
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
                                <FormItem className="space-y-1">
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
                                      value={
                                        amountField.value === undefined ||
                                        amountField.value === null
                                          ? ""
                                          : amountField.value
                                      }
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        // Разрешаем пустую строку для возможности полного удаления
                                        if (value === "" || value === "-") {
                                          amountField.onChange(
                                            undefined as unknown as number
                                          );
                                          // Обновляем сумму сразу, чтобы не было задержки
                                          setTimeout(updateTotalAmount, 0);
                                          return;
                                        }
                                        const numValue = Number(value);
                                        if (!isNaN(numValue) && numValue >= 0) {
                                          amountField.onChange(numValue);
                                          setTimeout(updateTotalAmount, 0);
                                        }
                                      }}
                                      onBlur={(e) => {
                                        // При потере фокуса, если поле пустое, оставляем undefined
                                        if (e.target.value === "") {
                                          amountField.onChange(
                                            undefined as unknown as number
                                          );
                                        }
                                        amountField.onBlur();
                                        updateTotalAmount();
                                      }}
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
                        <div className="border-t border-border/40" />

                        {/* Второй ряд: Категория */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.category_id`}
                          render={({ field: categoryField }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs font-medium">
                                {t("items.category")}
                              </FormLabel>
                              <FormControl>
                                <CascadingCategorySelect
                                  categories={expenseCategories}
                                  value={
                                    categoryField.value === null ||
                                    categoryField.value === undefined ||
                                    categoryField.value === ""
                                      ? null
                                      : categoryField.value
                                  }
                                  onChange={(value) => {
                                    categoryField.onChange(value ?? null);
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
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive/20"
                          onClick={() => {
                            remove(index);
                            setTimeout(updateTotalAmount, 0);
                          }}
                          aria-label={`${t("items.remove")} ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">{t("items.remove")}</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Кнопка добавления */}
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
        </div>

        {/* Дата */}
        <TransactionDateField
          form={form}
          initialDate={
            prefilledData?.date ||
            (editData?.date ? new Date(editData.date) : new Date())
          }
        />

        {/* Описание */}
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
          {editData ? t("form.update") : t("form.create")}
        </Button>
      </form>
    </Form>
  );
}
