"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchAccounts } from "@/lib/query/queries/accounts";
import { createClient } from "@/lib/db/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import {
  createTransactionFormSchema,
  type TransactionFormValues,
} from "@/lib/validations/transactions";
import { TransactionService } from "@/lib/services/transactions";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useCategories } from "@/lib/hooks/useCategories";
import type {
  TransactionItemFormData,
  TransactionWithItems,
} from "@/lib/types/transaction";
import { TransactionTypeField } from "./TransactionTypeField";
import { TransactionAmountField } from "./TransactionAmountField";
import { TransactionAccountFields } from "./TransactionAccountFields";
import { TransactionCategoryField } from "./TransactionCategoryField";
import { TransactionDateField } from "./TransactionDateField";
import { TransactionDescriptionField } from "./TransactionDescriptionField";
import { TransactionItemsField } from "./TransactionItemsField";

// Расширенный тип для initialData с поддержкой items
type InitialDataWithItems =
  | TransactionWithItems
  | Partial<{
      amount: number;
      date: Date;
      description?: string;
      category_id?: string;
      account_id?: string;
      to_account_id?: string;
      items?: TransactionItemFormData[];
    }>;

interface TransactionFormProps {
  initialData?: InitialDataWithItems;
  onSuccess?: () => void;
}

/**
 * Компонент формы создания/редактирования транзакции
 */
export function TransactionForm({
  initialData,
  onSuccess,
}: TransactionFormProps) {
  const t = useTranslations("transactions.form");
  const tErrors = useTranslations("errors");
  const { addTransaction, updateTransaction } = useTransactions();
  const { categories, loading: loadingCategories } = useCategories();

  // Создаем схему валидации с переводами через фабрику
  const formSchema = createTransactionFormSchema(tErrors);

  // Используем React Query для загрузки аккаунтов
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: fetchAccounts,
    staleTime: QUERY_STALE_TIME.ACCOUNTS,
    gcTime: QUERY_GC_TIME.ACCOUNTS,
  });

  // Получаем начальные значения для формы через сервис
  const getInitialFormValues = (): TransactionFormValues => {
    const baseValues = TransactionService.getInitialFormValues(initialData);

    // Если есть items в initialData, добавляем их
    if (initialData && "items" in initialData && initialData.items) {
      // Преобразуем items из TransactionWithItems в формат формы
      const formItems = Array.isArray(initialData.items)
        ? initialData.items.map((item, index) => ({
            category_id: item.category_id || null,
            amount: item.amount || 0,
            description: item.description || null,
            sort_order: item.sort_order ?? index,
          }))
        : [];

      return {
        ...baseValues,
        items: formItems.length > 0 ? formItems : undefined,
      };
    }

    return baseValues;
  };

  // Получаем пустые значения для сброса формы через сервис
  const getEmptyFormValues = (): TransactionFormValues => {
    return {
      ...TransactionService.getEmptyFormValues(),
      items: undefined,
    };
  };

  // Получаем валидную дату по умолчанию через сервис
  const getDefaultDate = (): Date => {
    if (initialData && "date" in initialData && initialData.date) {
      if (typeof initialData.date === "string") {
        return new Date(initialData.date);
      }
      if (initialData.date instanceof Date) {
        return initialData.date;
      }
    }
    return TransactionService.getDefaultDate();
  };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialFormValues(),
    mode: "onChange",
  });

  const isLoading = form.formState.isSubmitting;
  const transactionType = useWatch({
    control: form.control,
    name: "type",
  });
  const accountId = useWatch({
    control: form.control,
    name: "account_id",
  });

  // Получаем доступные счета для перевода через сервис (мемоизируем)
  const availableToAccounts = useMemo(
    () => TransactionService.getAvailableToAccounts(accounts, accountId),
    [accounts, accountId]
  );

  // Сбрасываем целевой счет, если он больше не доступен (например, изменилась валюта исходного счета)
  useEffect(() => {
    if (transactionType === "transfer" && accountId) {
      const currentToAccountId = form.getValues("to_account_id");
      if (
        currentToAccountId &&
        !availableToAccounts.find((acc) => acc.id === currentToAccountId)
      ) {
        form.setValue("to_account_id", "");
      }
    }
  }, [accountId, transactionType, availableToAccounts, form]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      // Получаем пользователя
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        const errorMsg = tErrors("mutations.unauthorized");
        toast.error(errorMsg);
        form.setError("root", {
          type: "manual",
          message: errorMsg,
        });
        return;
      }

      // Подготавливаем items для expense транзакций, фильтруем позиции без amount
      const items =
        values.type === "expense" && values.items && values.items.length > 0
          ? values.items
              .filter(
                (item) => item.amount !== undefined && item.amount >= 0.01
              )
              .map((item, index) => ({
                category_id: item.category_id ?? null,
                amount: item.amount!,
                description: item.description ?? null,
                sort_order: item.sort_order ?? index,
              }))
          : undefined;

      // Преобразуем данные формы в TransactionInsert через сервис
      const transactionData =
        TransactionService.prepareTransactionWithItemsData(
          values,
          accounts,
          user.id,
          items
        );

      // Проверяем, есть ли id в initialData (только полные Transaction объекты имеют id)
      if (TransactionService.isFullTransaction(initialData)) {
        await updateTransaction(initialData.id, transactionData, items);
      } else {
        await addTransaction(transactionData);
      }

      // Сбрасываем форму с пустыми значениями
      form.reset(getEmptyFormValues());
      onSuccess?.();
    } catch (error) {
      console.error(error);

      // Обрабатываем ошибки валидации с сервера
      const errorMessage = getErrorMessage(error, tErrors);

      // Пытаемся определить, какое поле вызвало ошибку
      if (error instanceof Error) {
        const errorLower = error.message.toLowerCase();

        // Проверяем на специфичные ошибки полей
        if (errorLower.includes("amount") || errorLower.includes("сумма")) {
          form.setError("amount", {
            type: "server",
            message: errorMessage,
          });
        } else if (
          errorLower.includes("account") ||
          errorLower.includes("счет")
        ) {
          form.setError("account_id", {
            type: "server",
            message: errorMessage,
          });
        } else if (
          errorLower.includes("to_account") ||
          errorLower.includes("целевой")
        ) {
          form.setError("to_account_id", {
            type: "server",
            message: errorMessage,
          });
        } else {
          // Общая ошибка
          form.setError("root", {
            type: "server",
            message: errorMessage,
          });
          toast.error(errorMessage);
        }
      } else {
        form.setError("root", {
          type: "server",
          message: errorMessage,
        });
        toast.error(errorMessage);
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="grid grid-cols-2 gap-4">
          <TransactionTypeField form={form} accountsCount={accounts.length} />
          <TransactionAmountField form={form} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TransactionAccountFields
            form={form}
            accounts={accounts}
            loadingAccounts={loadingAccounts}
            transactionType={transactionType}
          />
          {transactionType !== "transfer" && (
            <TransactionCategoryField
              form={form}
              categories={categories}
              loadingCategories={loadingCategories}
              transactionType={transactionType}
            />
          )}
        </div>

        <TransactionDateField form={form} initialDate={getDefaultDate()} />

        <TransactionDescriptionField form={form} />

        {/* Секция позиций для расходов (split transaction) */}
        <AnimatePresence mode="wait">
          {transactionType === "expense" && (
            <motion.div
              key="items-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TransactionItemsField
                form={form}
                categories={categories}
                loadingCategories={loadingCategories}
                currency={
                  accounts.find((a) => a.id === accountId)?.currency || "RUB"
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {form.formState.errors.root && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !form.formState.isValid}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData && "id" in initialData ? t("update") : t("create")}
        </Button>
      </form>
    </Form>
  );
}
