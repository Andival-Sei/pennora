"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru as dateFnsRu, enUS as dateFnsEn } from "date-fns/locale";
import { ru as dayPickerRu } from "react-day-picker/locale/ru";
import { CalendarIcon } from "lucide-react";

import { useTransactions } from "@/lib/hooks/useTransactions";
import { useCategories } from "@/lib/hooks/useCategories";
import { Transaction, TransactionInsert } from "@/lib/types/transaction";
import { createClient } from "@/lib/db/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchAccounts } from "@/lib/query/queries/accounts";
import { CascadingCategorySelect } from "@/components/features/categories/CascadingCategorySelect";
import { motion } from "framer-motion";
import { getErrorMessage } from "@/lib/utils/errorHandler";

type FormValues = {
  amount: number;
  type: "income" | "expense" | "transfer";
  category_id?: string | "__none__";
  account_id: string;
  to_account_id?: string;
  date: Date;
  description?: string;
};

interface TransactionFormProps {
  initialData?:
    | Transaction
    | Partial<{
        amount: number;
        date: Date;
        description?: string;
        category_id?: string;
        account_id?: string;
        to_account_id?: string;
      }>;
  onSuccess?: () => void;
}

export function TransactionForm({
  initialData,
  onSuccess,
}: TransactionFormProps) {
  const t = useTranslations("transactions.form");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const { addTransaction, updateTransaction } = useTransactions();
  const { categories, loading: loadingCategories } = useCategories();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Создаем схему валидации с переводами внутри компонента
  const formSchema = z
    .object({
      amount: z
        .number()
        .min(0.01, tErrors("validation.transactions.amountMin")),
      type: z.enum(["income", "expense", "transfer"]),
      category_id: z.string().optional().or(z.literal("__none__")),
      account_id: z
        .string()
        .min(1, tErrors("validation.transactions.accountRequired")),
      to_account_id: z.string().optional(),
      date: z.date(),
      description: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.type === "transfer") {
          return (
            data.to_account_id &&
            data.to_account_id.length > 0 &&
            data.to_account_id !== data.account_id
          );
        }
        return true;
      },
      {
        message: tErrors("validation.transactions.toAccountDifferent"),
        path: ["to_account_id"],
      }
    );

  // Локаль для date-fns и react-day-picker
  const dateFnsLocale = locale === "ru" ? dateFnsRu : dateFnsEn;
  const dayPickerLocale = locale === "ru" ? dayPickerRu : undefined; // enUS is default

  // Используем React Query для загрузки аккаунтов
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: fetchAccounts,
    staleTime: 10 * 60 * 1000, // 10 минут - данные редко меняются
    gcTime: 30 * 60 * 1000, // 30 минут
  });

  // Создаем валидную дату по умолчанию (сегодняшняя дата, время установлено на начало дня)
  const getDefaultDate = () => {
    if (initialData && "date" in initialData && initialData.date) {
      if (typeof initialData.date === "string") {
        return new Date(initialData.date);
      }
      if (initialData.date instanceof Date) {
        return initialData.date;
      }
    }
    const today = new Date();
    // Устанавливаем время на начало дня для консистентности
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Определяем, является ли initialData полным Transaction или частичными данными
  const isFullTransaction = (data: typeof initialData): data is Transaction => {
    return data !== undefined && "id" in data && data.id !== undefined;
  };

  // Получаем начальные значения для формы
  const getInitialFormValues = (): FormValues => {
    const defaultDate = getDefaultDate();
    const isFull = isFullTransaction(initialData);

    return {
      amount: (isFull ? initialData.amount : initialData?.amount) || 0,
      type: (isFull ? initialData.type : undefined) || "expense",
      category_id: isFull
        ? initialData.category_id || "__none__"
        : initialData?.category_id || "__none__",
      account_id:
        (isFull ? initialData.account_id : initialData?.account_id) || "",
      to_account_id:
        (isFull ? initialData.to_account_id : initialData?.to_account_id) || "",
      date: defaultDate,
      description:
        (isFull ? initialData.description : initialData?.description) || "",
    };
  };

  // Получаем пустые значения для сброса формы
  const getEmptyFormValues = (): FormValues => {
    return {
      amount: 0,
      type: "expense",
      category_id: "__none__",
      account_id: "",
      to_account_id: "",
      date: getDefaultDate(),
      description: "",
    };
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialFormValues(),
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

  // Получаем валюту исходного счета
  const sourceAccount = accounts.find((acc) => acc.id === accountId);
  const sourceCurrency = sourceAccount?.currency;

  // Фильтруем счета для целевого счета:
  // 1. Исключаем исходный счет
  // 2. Показываем только счета с той же валютой (запрещаем переводы между разными валютами)
  const availableToAccounts = accounts.filter(
    (acc) => acc.id !== accountId && acc.currency === sourceCurrency
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
  }, [accountId, sourceCurrency, transactionType, availableToAccounts, form]);

  const onSubmit = async (values: FormValues) => {
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

      // Форматируем дату в формат YYYY-MM-DD (без времени, чтобы избежать проблем с часовыми поясами)
      // Используем локальную дату, а не UTC
      const transactionDate =
        values.date instanceof Date ? values.date : getDefaultDate();
      const year = transactionDate.getFullYear();
      const month = String(transactionDate.getMonth() + 1).padStart(2, "0");
      const day = String(transactionDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // Получаем валюту из выбранного счета
      const selectedAccount = accounts.find(
        (acc) => acc.id === values.account_id
      );
      const currency = selectedAccount?.currency || "RUB";

      const transactionData: TransactionInsert = {
        amount: values.amount,
        type: values.type,
        category_id:
          values.type === "transfer" ||
          values.category_id === "__none__" ||
          !values.category_id
            ? null
            : values.category_id,
        account_id: values.account_id,
        to_account_id:
          values.type === "transfer" ? values.to_account_id || null : null,
        date: dateString,
        description: values.description || null,
        currency,
        user_id: user.id,
      };

      // Проверяем, есть ли id в initialData (только полные Transaction объекты имеют id)
      if (isFullTransaction(initialData)) {
        await updateTransaction(initialData.id, transactionData);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="expense">
                      {t("types.expense")}
                    </SelectItem>
                    <SelectItem value="income">{t("types.income")}</SelectItem>
                    {accounts.length >= 2 && (
                      <SelectItem value="transfer">
                        {t("types.transfer")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("amount")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          ) : (
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <FormControl>
                    <CascadingCategorySelect
                      categories={categories}
                      value={
                        field.value === "__none__" || !field.value
                          ? null
                          : field.value
                      }
                      onChange={(value) => field.onChange(value || "__none__")}
                      type={
                        transactionType === "income"
                          ? "income"
                          : transactionType === "expense"
                            ? "expense"
                            : undefined
                      }
                      placeholder={t("none")}
                      allowIntermediate={true}
                      isLoading={loadingCategories}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("date")}</FormLabel>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value && field.value instanceof Date ? (
                        format(field.value, "PPP", { locale: dateFnsLocale })
                      ) : (
                        <span>{t("datePlaceholder")}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0"
                  align="start"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Calendar
                    mode="single"
                    selected={
                      field.value && field.value instanceof Date
                        ? field.value
                        : getDefaultDate()
                    }
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(date);
                        setCalendarOpen(false); // Закрываем календарь при выборе даты
                      }
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    locale={dayPickerLocale}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {form.formState.errors.root && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData && "id" in initialData ? t("update") : t("create")}
        </Button>
      </form>
    </Form>
  );
}
