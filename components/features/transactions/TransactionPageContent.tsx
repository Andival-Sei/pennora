"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FadeIn } from "@/components/motion";
import { TransactionList } from "./TransactionList";
import { TransactionForm } from "./TransactionForm";
import { MonthYearSelector } from "./MonthYearSelector";
import { useTransactions } from "@/lib/hooks/useTransactions";

export function TransactionPageContent() {
  const t = useTranslations("transactions");
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0); // To force refresh list
  const { getAvailableMonthsAndYears } = useTransactions();
  const [availableMonths, setAvailableMonths] = useState<
    Array<{ month: number; year: number }>
  >([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [monthFilter, setMonthFilter] = useState<{
    month: number;
    year: number;
  } | null>(null);

  // Загружаем доступные месяцы/годы и устанавливаем начальный фильтр только при первой загрузке
  useEffect(() => {
    const loadAvailableMonthsAndYears = async () => {
      const { months, years } = await getAvailableMonthsAndYears();
      setAvailableMonths(months);
      setAvailableYears(years);

      // Устанавливаем фильтр на первый доступный месяц (самый свежий) только если фильтр еще не установлен
      if (!monthFilter) {
        if (months.length > 0) {
          setMonthFilter(months[0]);
        } else {
          // Если транзакций нет, используем текущий месяц/год
          const currentDate = new Date();
          setMonthFilter({
            month: currentDate.getMonth(),
            year: currentDate.getFullYear(),
          });
        }
      }
    };

    loadAvailableMonthsAndYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAvailableMonthsAndYears]); // Убрали key из зависимостей, чтобы не сбрасывать выбранный месяц

  if (!monthFilter) {
    return <div className="text-center py-4">{t("loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <FadeIn delay={0.1}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <MonthYearSelector
            value={monthFilter}
            onChange={(value) => {
              setMonthFilter(value);
              setKey((prev) => prev + 1); // Refresh list
            }}
            availableMonths={availableMonths}
            availableYears={availableYears}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("add")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createTitle")}</DialogTitle>
              </DialogHeader>
              <TransactionForm
                onSuccess={async () => {
                  setOpen(false);
                  // Обновляем доступные месяцы/годы после добавления транзакции
                  const { months, years } = await getAvailableMonthsAndYears();
                  setAvailableMonths(months);
                  setAvailableYears(years);
                  // Если добавлена транзакция в новый месяц/год, переключаемся на него
                  // Но только если текущий фильтр не соответствует ни одному доступному месяцу
                  if (months.length > 0) {
                    const currentFilterExists = months.some(
                      (m) =>
                        m.month === monthFilter?.month &&
                        m.year === monthFilter?.year
                    );
                    // Переключаемся на новый месяц только если текущий фильтр больше не существует
                    if (!currentFilterExists) {
                      setMonthFilter(months[0]);
                    }
                  }
                  setKey((prev) => prev + 1); // Refresh list
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <TransactionList key={key} monthFilter={monthFilter} />
      </FadeIn>
    </div>
  );
}
