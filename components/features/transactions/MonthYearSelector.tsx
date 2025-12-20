"use client";

import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ru as dateFnsRu, enUS as dateFnsEn } from "date-fns/locale";

interface MonthYearSelectorProps {
  value: { month: number; year: number };
  onChange: (value: { month: number; year: number }) => void;
  availableMonths?: Array<{ month: number; year: number }>;
  availableYears?: number[];
}

export function MonthYearSelector({
  value,
  onChange,
  availableMonths = [],
  availableYears = [] as unknown[],
}: MonthYearSelectorProps) {
  const locale = useLocale();
  const dateFnsLocale = locale === "ru" ? dateFnsRu : dateFnsEn;

  // Если доступных месяцев нет, не показываем селектор
  if (availableMonths.length === 0) {
    return null;
  }

  // Получаем уникальные годы из доступных месяцев
  const uniqueYears = Array.from(
    new Set(availableMonths.map((m) => m.year))
  ).sort((a, b) => b - a);

  // Получаем месяцы для выбранного года
  const monthsForSelectedYear = availableMonths
    .filter((m) => m.year === value.year)
    .map((m) => m.month)
    .sort((a, b) => b - a);

  // Если только один год, скрываем селектор года
  const showYearSelector = uniqueYears.length > 1;

  const handleMonthChange = (month: string) => {
    const selectedMonth = parseInt(month);
    // Находим месяц в контексте выбранного года
    const monthData = availableMonths.find(
      (m) => m.month === selectedMonth && m.year === value.year
    );
    if (monthData) {
      onChange({ month: selectedMonth, year: value.year });
    }
  };

  const handleYearChange = (year: string) => {
    const selectedYear = parseInt(year);
    // При смене года выбираем первый доступный месяц этого года
    const firstMonthForYear = availableMonths
      .filter((m) => m.year === selectedYear)
      .sort((a, b) => b.month - a.month)[0];
    if (firstMonthForYear) {
      onChange({
        month: firstMonthForYear.month,
        year: selectedYear,
      });
    }
  };

  // Форматируем месяц для отображения
  const getMonthName = (monthIndex: number) => {
    const date = new Date(2024, monthIndex, 1);
    return format(date, "LLLL", { locale: dateFnsLocale });
  };

  return (
    <div className="flex items-center gap-2">
      {monthsForSelectedYear.length > 1 && (
        <Select
          value={value.month.toString()}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              {getMonthName(value.month).charAt(0).toUpperCase() +
                getMonthName(value.month).slice(1)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {monthsForSelectedYear.map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {getMonthName(month).charAt(0).toUpperCase() +
                  getMonthName(month).slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showYearSelector && (
        <Select value={value.year.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue>{value.year}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {uniqueYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Если только один месяц и один год, показываем просто текст */}
      {monthsForSelectedYear.length === 1 && !showYearSelector && (
        <div className="text-sm font-medium">
          {getMonthName(value.month).charAt(0).toUpperCase() +
            getMonthName(value.month).slice(1)}{" "}
          {value.year}
        </div>
      )}
    </div>
  );
}
