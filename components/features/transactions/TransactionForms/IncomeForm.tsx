"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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
import type { TransactionWithItems } from "@/lib/types/transaction";

import { BaseTransactionForm } from "./BaseTransactionForm";
import { TransactionAmountField } from "../TransactionForm/TransactionAmountField";
import { TransactionAccountFields } from "../TransactionForm/TransactionAccountFields";
import { TransactionCategoryField } from "../TransactionForm/TransactionCategoryField";
import type { PrefilledData } from "../TransactionWizard/types";

interface IncomeFormProps {
  prefilledData?: PrefilledData | null;
  editData?: TransactionWithItems;
  onSuccess?: () => void;
}

/**
 * Форма для доходов
 * Поля: Сумма, Счёт, Категория (доходные), Дата, Описание
 */
export function IncomeForm({
  prefilledData,
  editData,
  onSuccess,
}: IncomeFormProps) {
  const tErrors = useTranslations("errors");
  const { addTransaction, updateTransaction } = useTransactions();
  const { categories, loading: loadingCategories } = useCategories();

  // Фильтруем только категории доходов
  const incomeCategories = useMemo(
    () => categories.filter((cat) => cat.type === "income"),
    [categories]
  );

  const formSchema = createTransactionFormSchema(tErrors);

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: fetchAccounts,
    staleTime: QUERY_STALE_TIME.ACCOUNTS,
    gcTime: QUERY_GC_TIME.ACCOUNTS,
  });

  // Инициализация формы
  const getInitialValues = (): TransactionFormValues => {
    if (editData) {
      return TransactionService.getInitialFormValues(editData);
    }

    const baseValues = TransactionService.getEmptyFormValues();

    return {
      ...baseValues,
      type: "income",
      amount: prefilledData?.amount || 0,
      date: prefilledData?.date || new Date(),
      description: prefilledData?.description || "",
      category_id: prefilledData?.categoryId || "__none__",
    };
  };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  });

  // Устанавливаем тип как income при монтировании
  useEffect(() => {
    form.setValue("type", "income");
  }, [form]);

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

      const transactionData =
        TransactionService.prepareTransactionWithItemsData(
          { ...values, type: "income" },
          accounts,
          user.id,
          undefined
        );

      if (editData) {
        await updateTransaction(editData.id, transactionData, undefined);
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
    <BaseTransactionForm
      form={form}
      onSubmit={onSubmit}
      isEditing={!!editData}
      initialDate={
        editData?.date
          ? new Date(editData.date)
          : prefilledData?.date
            ? prefilledData.date
            : undefined
      }
      showPrefilledBanner={!!prefilledData}
    >
      <div className="grid grid-cols-2 gap-4">
        <TransactionAmountField form={form} />
        <TransactionAccountFields
          form={form}
          accounts={accounts}
          loadingAccounts={loadingAccounts}
          transactionType="income"
        />
      </div>

      <TransactionCategoryField
        form={form}
        categories={incomeCategories}
        loadingCategories={loadingCategories}
        transactionType="income"
      />
    </BaseTransactionForm>
  );
}
