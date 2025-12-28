"use client";

import { useTranslations } from "next-intl";
import { useWatch } from "react-hook-form";
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
import { motion } from "framer-motion";
import type { UseFormReturn } from "react-hook-form";
import type { TransactionFormValues } from "@/lib/validations/transactions";
import { TransactionService } from "@/lib/services/transactions";
import type { Database } from "@/lib/db/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

interface TransactionAccountFieldsProps {
  form: UseFormReturn<TransactionFormValues>;
  accounts: Account[];
  loadingAccounts: boolean;
  transactionType: string;
}

/**
 * Компонент полей выбора счетов для транзакции
 */
export function TransactionAccountFields({
  form,
  accounts,
  loadingAccounts,
  transactionType,
}: TransactionAccountFieldsProps) {
  const t = useTranslations("transactions.form");

  const accountId = useWatch({
    control: form.control,
    name: "account_id",
  });

  const availableToAccounts = TransactionService.getAvailableToAccounts(
    accounts,
    accountId
  );

  return (
    <>
      <FormField
        control={form.control}
        name="account_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("account")}</FormLabel>
            {loadingAccounts ? (
              <div className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded opacity-50" />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // При изменении исходного счета сбрасываем целевой счет,
                    // так как он может быть недоступен для новой валюты
                    if (transactionType === "transfer") {
                      form.setValue("to_account_id", "");
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("accountPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {transactionType === "transfer" ? (
        <FormField
          control={form.control}
          name="to_account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("toAccount")}</FormLabel>
              {loadingAccounts ? (
                <div className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-4 bg-muted animate-pulse rounded opacity-50" />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={availableToAccounts.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availableToAccounts.length === 0
                              ? t("toAccountError")
                              : t("toAccountPlaceholder")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableToAccounts.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          {t("toAccountError")}
                        </div>
                      ) : (
                        availableToAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </>
  );
}
