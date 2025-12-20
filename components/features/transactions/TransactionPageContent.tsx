"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
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
import { queryKeys } from "@/lib/query/keys";
import { fetchAvailableMonthsAndYears } from "@/lib/query/queries/transactions";

export function TransactionPageContent() {
  const t = useTranslations("transactions");
  const [open, setOpen] = useState(false);

  // Используем React Query для загрузки доступных месяцев/лет
  const { data: availableData } = useQuery({
    queryKey: queryKeys.transactions.availableMonths(),
    queryFn: fetchAvailableMonthsAndYears,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 30 * 60 * 1000, // 30 минут
  });

  const availableMonths = useMemo(
    () => availableData?.months || [],
    [availableData?.months]
  );
  const availableYears = availableData?.years || [];

  // Вычисляем начальное значение месяца
  const initialMonthFilter = useMemo(() => {
    if (availableMonths.length > 0) {
      return availableMonths[0];
    }
    // Если транзакций нет, используем текущий месяц/год
    const currentDate = new Date();
    return {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    };
  }, [availableMonths]);

  const [monthFilter, setMonthFilter] = useState<{
    month: number;
    year: number;
  } | null>(initialMonthFilter);

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
              // React Query автоматически обновит список транзакций
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
                onSuccess={() => {
                  setOpen(false);
                  // React Query автоматически обновит доступные месяцы/годы и список транзакций
                  // после успешной мутации через инвалидацию кеша
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <TransactionList monthFilter={monthFilter} />
      </FadeIn>
    </div>
  );
}
