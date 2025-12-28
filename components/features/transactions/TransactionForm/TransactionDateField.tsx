"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CalendarIcon } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
import type { UseFormReturn } from "react-hook-form";
import type { TransactionFormValues } from "@/lib/validations/transactions";
import { TransactionService } from "@/lib/services/transactions";

interface TransactionDateFieldProps {
  form: UseFormReturn<TransactionFormValues>;
  initialDate?: Date;
}

/**
 * Компонент поля выбора даты транзакции
 */
export function TransactionDateField({
  form,
  initialDate,
}: TransactionDateFieldProps) {
  const t = useTranslations("transactions.form");
  const locale = useLocale();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Локаль для date-fns и react-day-picker
  const dateFnsLocale = locale === "ru" ? dateFnsRu : dateFnsEn;
  const dayPickerLocale = locale === "ru" ? dayPickerRu : undefined; // enUS is default

  const getDefaultDate = (): Date => {
    if (initialDate) {
      if (typeof initialDate === "string") {
        return new Date(initialDate);
      }
      if (initialDate instanceof Date) {
        return initialDate;
      }
    }
    return TransactionService.getDefaultDate();
  };

  return (
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
  );
}
