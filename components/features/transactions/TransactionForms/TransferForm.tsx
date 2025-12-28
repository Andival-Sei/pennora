"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import type { TransactionWithItems } from "@/lib/types/transaction";

import { BaseTransactionForm } from "./BaseTransactionForm";
import { TransactionAmountField } from "../TransactionForm/TransactionAmountField";
import { TransactionAccountFields } from "../TransactionForm/TransactionAccountFields";

interface TransferFormProps {
  editData?: TransactionWithItems;
  onSuccess?: () => void;
}

/**
 * Форма для перевода между счетами
 * Поля: Сумма, Счёт откуда, Счёт куда, Дата, Описание
 */
export function TransferForm({ editData, onSuccess }: TransferFormProps) {
  const tErrors = useTranslations("errors");
  const { addTransaction, updateTransaction } = useTransactions();

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
      type: "transfer",
      category_id: "__none__",
    };
  };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  });

  const accountId = useWatch({
    control: form.control,
    name: "account_id",
  });

  // Получаем доступные счета для перевода
  const availableToAccounts = useMemo(
    () => TransactionService.getAvailableToAccounts(accounts, accountId),
    [accounts, accountId]
  );

  // Устанавливаем тип как transfer при монтировании
  useEffect(() => {
    form.setValue("type", "transfer");
    form.setValue("category_id", "__none__");
  }, [form]);

  // Сбрасываем целевой счет, если он больше не доступен
  useEffect(() => {
    if (accountId) {
      const currentToAccountId = form.getValues("to_account_id");
      if (
        currentToAccountId &&
        !availableToAccounts.find((acc) => acc.id === currentToAccountId)
      ) {
        form.setValue("to_account_id", "");
      }
    }
  }, [accountId, availableToAccounts, form]);

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
          { ...values, type: "transfer", category_id: "__none__" },
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
      initialDate={editData?.date ? new Date(editData.date) : undefined}
    >
      <TransactionAmountField form={form} />

      <TransactionAccountFields
        form={form}
        accounts={accounts}
        loadingAccounts={loadingAccounts}
        transactionType="transfer"
      />
    </BaseTransactionForm>
  );
}
