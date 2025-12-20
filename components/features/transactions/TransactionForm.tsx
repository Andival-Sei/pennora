"use client";

import { useState } from "react";
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

const formSchema = z.object({
  amount: z.number().min(0.01, "Сумма должна быть больше 0"),
  type: z.enum(["income", "expense", "transfer"]),
  category_id: z.string().optional().or(z.literal("__none__")),
  account_id: z.string().min(1, "Выберите счет"),
  date: z.date(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  initialData?: Transaction;
  onSuccess?: () => void;
}

export function TransactionForm({
  initialData,
  onSuccess,
}: TransactionFormProps) {
  const t = useTranslations("transactions.form");
  const locale = useLocale();
  const { addTransaction, updateTransaction } = useTransactions();
  const { categories, loading: loadingCategories } = useCategories();
  const [calendarOpen, setCalendarOpen] = useState(false);

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
    if (initialData?.date) {
      return new Date(initialData.date);
    }
    const today = new Date();
    // Устанавливаем время на начало дня для консистентности
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initialData?.amount || 0,
      type: initialData?.type || "expense",
      category_id: initialData?.category_id
        ? initialData.category_id
        : "__none__",
      account_id: initialData?.account_id || "",
      date: getDefaultDate(),
      description: initialData?.description || "",
    },
  });

  const isLoading = form.formState.isSubmitting;
  const transactionType = useWatch({
    control: form.control,
    name: "type",
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Пользователь не авторизован");
        return;
      }

      // Убеждаемся, что дата валидна
      const transactionDate =
        values.date && values.date instanceof Date
          ? values.date
          : getDefaultDate();

      // Получаем валюту из выбранного счета
      const selectedAccount = accounts.find(
        (acc) => acc.id === values.account_id
      );
      const currency = selectedAccount?.currency || "RUB";

      const transactionData: TransactionInsert = {
        amount: values.amount,
        type: values.type,
        category_id:
          values.category_id === "__none__" || !values.category_id
            ? null
            : values.category_id,
        account_id: values.account_id,
        date: transactionDate.toISOString(),
        description: values.description || null,
        currency,
        user_id: user.id,
      };

      if (initialData) {
        await updateTransaction(initialData.id, transactionData);
      } else {
        await addTransaction(transactionData);
      }

      // Сбрасываем форму с валидными значениями по умолчанию
      form.reset({
        amount: 0,
        type: "expense",
        category_id: "__none__",
        account_id: "",
        date: getDefaultDate(),
        description: "",
      });
      onSuccess?.();
    } catch (error) {
      console.error(error);
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
                    <SelectItem value="transfer">
                      {t("types.transfer")}
                    </SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

          {transactionType !== "transfer" && (
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? t("update") : t("create")}
        </Button>
      </form>
    </Form>
  );
}
