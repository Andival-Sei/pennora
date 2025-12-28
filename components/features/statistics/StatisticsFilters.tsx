"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type PeriodPreset =
  | "thisMonth"
  | "lastMonth"
  | "last3Months"
  | "last6Months"
  | "thisYear"
  | "custom";

interface StatisticsFiltersProps {
  periodPreset: PeriodPreset;
  onPeriodChange: (preset: PeriodPreset) => void;
  customDateRange: { from: Date; to: Date };
  onCustomDateRangeChange: (range: { from: Date; to: Date }) => void;
  transactionType: "income" | "expense" | "all";
  onTransactionTypeChange: (type: "income" | "expense" | "all") => void;
  categoryLevel: "top" | "all" | "hierarchy";
  onCategoryLevelChange: (level: "top" | "all" | "hierarchy") => void;
  t: {
    period: string;
    thisMonth: string;
    lastMonth: string;
    last3Months: string;
    last6Months: string;
    thisYear: string;
    custom: string;
    type: string;
    income: string;
    expense: string;
    all: string;
    categoryLevel: string;
    topOnly: string;
    allCategories: string;
    hierarchy: string;
  };
}

export function StatisticsFiltersComponent({
  periodPreset,
  onPeriodChange,
  transactionType,
  onTransactionTypeChange,
  categoryLevel,
  onCategoryLevelChange,
  t,
}: StatisticsFiltersProps) {
  const periodOptions: { value: PeriodPreset; label: string }[] = [
    { value: "thisMonth", label: t.thisMonth },
    { value: "lastMonth", label: t.lastMonth },
    { value: "last3Months", label: t.last3Months },
    { value: "last6Months", label: t.last6Months },
    { value: "thisYear", label: t.thisYear },
  ];

  const typeOptions: { value: "income" | "expense" | "all"; label: string }[] =
    [
      { value: "expense", label: t.expense },
      { value: "income", label: t.income },
      { value: "all", label: t.all },
    ];

  const levelOptions: { value: "top" | "all" | "hierarchy"; label: string }[] =
    [
      { value: "top", label: t.topOnly },
      { value: "all", label: t.allCategories },
      { value: "hierarchy", label: t.hierarchy },
    ];

  return (
    <div className="flex flex-wrap gap-3">
      {/* Период */}
      <Select value={periodPreset} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-[180px]">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder={t.period} />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Тип транзакции */}
      <div className="flex rounded-lg border bg-muted p-1">
        {typeOptions.map((option) => (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              transactionType === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onTransactionTypeChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Уровень категорий */}
      <Select value={categoryLevel} onValueChange={onCategoryLevelChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t.categoryLevel} />
        </SelectTrigger>
        <SelectContent>
          {levelOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
