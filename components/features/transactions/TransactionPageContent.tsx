"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";
import { TransactionList } from "./TransactionList";
import { MonthYearSelector } from "./MonthYearSelector";
import { TransactionWizardLoading } from "./TransactionWizardLoading";

// Lazy load TransactionWizard для уменьшения initial bundle size
const TransactionWizard = dynamic(
  () =>
    import("./TransactionWizard").then((mod) => ({
      default: mod.TransactionWizard,
    })),
  {
    ssr: false,
    loading: () => <TransactionWizardLoading />,
  }
);
import { queryKeys } from "@/lib/query/keys";
import { fetchAvailableMonthsAndYears } from "@/lib/query/queries/transactions";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";

export function TransactionPageContent() {
  const t = useTranslations("transactions");
  const [open, setOpen] = useState(false);
  // Исправление проблемы гидратации: используем useEffect для установки mounted
  // Это предотвращает несоответствие гидратации, так как Dialog рендерится только на клиенте
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Используем React Query для загрузки доступных месяцев/лет
  const { data: availableData } = useQuery({
    queryKey: queryKeys.transactions.availableMonths(),
    queryFn: fetchAvailableMonthsAndYears,
    staleTime: QUERY_STALE_TIME.AVAILABLE_MONTHS,
    gcTime: QUERY_GC_TIME.AVAILABLE_MONTHS,
  });

  const availableMonths = useMemo(
    () => availableData?.months || [],
    [availableData?.months]
  );
  const availableYears = availableData?.years || [];

  // Вычисляем начальное значение месяца - всегда используем текущий месяц/год
  const initialMonthFilter = useMemo(() => {
    const currentDate = new Date();
    return {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    };
  }, []);

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
        <div className="flex items-center flex-wrap gap-4">
          <MonthYearSelector
            value={monthFilter}
            onChange={(value) => {
              setMonthFilter(value);
              // React Query автоматически обновит список транзакций
            }}
            availableMonths={availableMonths}
            availableYears={availableYears}
          />
          {mounted ? (
            <>
              <Button className="ml-auto" onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("add")}
              </Button>
              <TransactionWizard
                open={open}
                onOpenChange={setOpen}
                onSuccess={() => {
                  setOpen(false);
                  // React Query автоматически обновит доступные месяцы/годы и список транзакций
                  // после успешной мутации через инвалидацию кеша
                }}
              />
            </>
          ) : (
            <Button disabled className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t("add")}
            </Button>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <TransactionList monthFilter={monthFilter} />
      </FadeIn>
    </div>
  );
}
