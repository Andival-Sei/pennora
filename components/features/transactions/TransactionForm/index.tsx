"use client";

import { useEffect, useMemo, useCallback, useRef } from "react";
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
import {
  getErrorMessage,
  formatErrorForLogging,
} from "@/lib/utils/errorHandler";
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

  // Проверяем, является ли это редактированием транзакции с ПОЗИЦИЯМИ (больше одной)
  // Если позиция одна - считаем это простой транзакцией
  const isEditingWithItems =
    TransactionService.isFullTransaction(initialData) &&
    "items" in initialData &&
    initialData.items &&
    initialData.items.length > 1;

  // Получаем начальные значения для формы через сервис
  // Оборачиваем в useCallback для стабильности ссылки и возможности использования в зависимостях
  const getInitialFormValues = useCallback((): TransactionFormValues => {
    const baseValues = TransactionService.getInitialFormValues(initialData);

    // Если это split transaction с одной позицией, преобразуем её в простую
    if (
      initialData &&
      "items" in initialData &&
      Array.isArray(initialData.items) &&
      initialData.items.length === 1
    ) {
      const item = initialData.items[0];
      return {
        ...baseValues,
        amount: Number(item.amount) || 0,
        // Если у позиции нет категории, используем __none__
        category_id: item.category_id || "__none__",
        description: item.description || baseValues.description,
        items: undefined,
      };
    }

    // Если есть items (> 1), добавляем их
    if (
      initialData &&
      "items" in initialData &&
      Array.isArray(initialData.items) &&
      initialData.items.length > 1
    ) {
      // Преобразуем items из TransactionWithItems в формат формы
      // Важно: category_id берём напрямую из item, т.к. он уже есть в данных
      const formItems = initialData.items.map((item, index) => ({
        // category_id может быть строкой UUID или null
        category_id: item.category_id ?? null,
        amount: Number(item.amount) || 0,
        description: item.description ?? null,
        sort_order: item.sort_order ?? index,
      }));

      // Если есть items, category_id транзакции должен быть null (категории только у позиций)
      return {
        ...baseValues,
        category_id: "__none__", // Устанавливаем в __none__ для корректной работы формы
        items: formItems,
      };
    }

    return baseValues;
  }, [initialData]);

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

  // Переинициализируем форму при изменении initialData (для редактирования)
  // Используем ref для отслеживания предыдущего ID, чтобы избежать лишних сбросов
  // при обновлении родительского компонента
  const lastTransactionIdRef = useRef<string | undefined>(
    TransactionService.isFullTransaction(initialData)
      ? (initialData as { id: string }).id
      : undefined
  );

  useEffect(() => {
    const currentId = TransactionService.isFullTransaction(initialData)
      ? (initialData as { id: string }).id
      : undefined;

    // Сбрасываем форму ТОЛЬКО если изменился ID транзакции (переключились на другую)
    if (currentId !== lastTransactionIdRef.current) {
      lastTransactionIdRef.current = currentId;
      const newValues = getInitialFormValues();
      form.reset(newValues);
    }
  }, [initialData, form, getInitialFormValues]);

  const isLoading = form.formState.isSubmitting;
  const transactionType = useWatch({
    control: form.control,
    name: "type",
  });
  const accountId = useWatch({
    control: form.control,
    name: "account_id",
  });
  const items = useWatch({
    control: form.control,
    name: "items",
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
      // Нормализуем category_id: пустые строки и "__none__" преобразуем в null
      const normalizeItemCategoryId = (
        categoryId: string | null | undefined
      ): string | null => {
        if (!categoryId || categoryId === "" || categoryId === "__none__") {
          return null;
        }
        return categoryId;
      };

      // Подготавливаем items для expense транзакций, фильтруем позиции без amount
      // Важно: даже если values.items пустой массив, мы должны обработать его,
      // чтобы корректно обрабатывать случай удаления всех позиций
      const items =
        values.type === "expense" && values.items
          ? values.items
              .filter(
                (item) =>
                  item.amount !== undefined &&
                  item.amount !== null &&
                  item.amount >= 0.01
              )
              .map((item, index) => ({
                category_id: normalizeItemCategoryId(item.category_id),
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
        // Исключаем items из transactionData, так как это не колонка таблицы transactions
        // items обрабатываются отдельно через updateTransactionWithItems
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { items: _items, ...transactionUpdate } = transactionData;
        // Нормализуем UUID поля (преобразуем пустые строки в null)
        const normalizedUpdate =
          TransactionService.normalizeTransactionUUIDs(transactionUpdate);

        // Определяем payload для items
        // Если была транзакция с позициями (initialData.items), всегда передаем массив,
        // чтобы гарантировать удаление старых позиций и создание новых
        let itemsPayload = items;
        const hadItemsInitially =
          "items" in initialData &&
          initialData.items &&
          initialData.items.length > 0;
        if (hadItemsInitially) {
          // Всегда передаем массив для редактирования транзакции, которая изначально имела позиции
          // Если items undefined (все позиции удалены или отфильтрованы), передаем пустой массив
          itemsPayload = items ?? [];
        }

        await updateTransaction(initialData.id, normalizedUpdate, itemsPayload);
      } else {
        await addTransaction(transactionData);
      }

      // Сбрасываем форму с пустыми значениями
      form.reset(getEmptyFormValues());
      onSuccess?.();
    } catch (error) {
      // Логируем ошибку с правильным форматированием
      console.error("Transaction form error:", error);
      const errorDetails = formatErrorForLogging(error);
      console.error("Error details:", JSON.stringify(errorDetails, null, 2));

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
        {/* При редактировании транзакции с позициями - скрываем поле суммы, т.к. сумма = сумма позиций */}
        {isEditingWithItems ? (
          // При редактировании с позициями - показываем сумму (блокируем) и счет
          <div className="grid grid-cols-2 gap-4">
            <TransactionAmountField form={form} disabled={true} />
            <TransactionAccountFields
              form={form}
              accounts={accounts}
              loadingAccounts={loadingAccounts}
              transactionType={transactionType}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* Показываем поле типа только при создании новой транзакции */}
              {!TransactionService.isFullTransaction(initialData) && (
                <TransactionTypeField
                  form={form}
                  accountsCount={accounts.length}
                />
              )}
              <TransactionAmountField form={form} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TransactionAccountFields
                form={form}
                accounts={accounts}
                loadingAccounts={loadingAccounts}
                transactionType={transactionType}
              />
              {/* Показываем поле категории только если нет позиций (категории только у позиций) */}
              {transactionType !== "transfer" &&
                (!items || items.length === 0) && (
                  <TransactionCategoryField
                    form={form}
                    categories={categories}
                    loadingCategories={loadingCategories}
                    transactionType={transactionType}
                  />
                )}
            </div>
          </>
        )}

        <TransactionDateField form={form} initialDate={getDefaultDate()} />

        <TransactionDescriptionField form={form} />

        {/* Секция позиций для расходов (split transaction) */}
        {/* Показываем секцию items только если:
            1. Это создание новой транзакции (можно добавить позиции)
            2. ИЛИ это редактирование УЖЕ split транзакции (isEditingWithItems)
            
            Если мы редактируем простую транзакцию (isEditingWithItems = false), 
            мы скрываем эту секцию, чтобы запретить добавление позиций */}
        <AnimatePresence mode="wait">
          {transactionType === "expense" &&
            (!initialData ||
              !TransactionService.isFullTransaction(initialData) ||
              isEditingWithItems) && (
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
