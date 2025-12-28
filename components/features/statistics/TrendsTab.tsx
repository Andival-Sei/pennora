"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query/keys";
import { fetchPeriodStatistics } from "@/lib/query/queries/statistics";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import { formatCurrency } from "@/lib/currency/converter";
import type { CurrencyCode } from "@/lib/currency/rates";
import type { TrendPeriod } from "@/lib/types/statistics";
import { cn } from "@/lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
  displayCurrency: CurrencyCode;
}

function CustomTooltip({
  active,
  payload,
  label,
  displayCurrency,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((entry, index: number) => (
        <div
          key={index}
          className="flex items-center gap-2 text-sm"
          style={{ color: entry.color }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name}:</span>
          <span className="font-medium">
            {formatCurrency(entry.value as number, displayCurrency)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface TrendsTabProps {
  dateRange: { from: Date; to: Date };
  trendPeriod: TrendPeriod;
  onTrendPeriodChange: (period: TrendPeriod) => void;
  displayCurrency: CurrencyCode;
  t: {
    groupBy: string;
    byDay: string;
    byWeek: string;
    byMonth: string;
    income: string;
    expense: string;
  };
  chartT: {
    noData: string;
    total: string;
    percentage: string;
  };
}

export function TrendsTab({
  dateRange,
  trendPeriod,
  onTrendPeriodChange,
  displayCurrency,
  t,
  chartT,
}: TrendsTabProps) {
  const {
    data: periodData,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.statistics.byPeriod({
      from: format(dateRange.from, "yyyy-MM-dd"),
      to: format(dateRange.to, "yyyy-MM-dd"),
      groupBy: trendPeriod,
      displayCurrency,
    }),
    queryFn: () =>
      fetchPeriodStatistics({
        from: dateRange.from,
        to: dateRange.to,
        groupBy: trendPeriod,
        displayCurrency,
      }),
    staleTime: QUERY_STALE_TIME.TRANSACTIONS,
    gcTime: QUERY_GC_TIME.TRANSACTIONS,
  });

  const periodOptions: { value: TrendPeriod; label: string }[] = [
    { value: "day", label: t.byDay },
    { value: "week", label: t.byWeek },
    { value: "month", label: t.byMonth },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Ошибка загрузки данных
      </div>
    );
  }

  if (!periodData || periodData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <span className="text-muted-foreground">{chartT.noData}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Переключатель периода группировки */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t.groupBy}:</span>
        <div className="flex rounded-lg border bg-muted p-1">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                trendPeriod === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onTrendPeriodChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* График */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={periodData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-2))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-2))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/50"
                />
                <XAxis
                  dataKey="periodLabel"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                  }
                  className="fill-muted-foreground"
                />
                <Tooltip
                  content={(props) => (
                    <CustomTooltip
                      active={props.active}
                      payload={props.payload?.map((p) => ({
                        name: String(p.name || ""),
                        value: p.value as number,
                        color: p.color,
                      }))}
                      label={props.label as string}
                      displayCurrency={displayCurrency}
                    />
                  )}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "10px" }}
                  formatter={(value) => (
                    <span className="text-foreground text-sm">{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name={t.income || "Доходы"}
                  stroke="hsl(var(--chart-2))"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name={t.expense || "Расходы"}
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
