"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DayPicker,
  useDayPicker,
  type MonthCaptionProps,
} from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Кастомный заголовок месяца со стрелками навигации рядом с названием
 */
function CustomMonthCaption({ calendarMonth }: MonthCaptionProps) {
  const { goToMonth } = useDayPicker();

  const handlePrevMonth = () => {
    const prevMonth = new Date(calendarMonth.date);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    goToMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(calendarMonth.date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    goToMonth(nextMonth);
  };

  const monthLabel = calendarMonth.date.toLocaleDateString("ru", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex justify-center items-center gap-1 h-9">
      <button
        type="button"
        onClick={handlePrevMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
        aria-label="Предыдущий месяц"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium min-w-[140px] text-center">
        {monthLabel}
      </span>
      <button
        type="button"
        onClick={handleNextMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
        aria-label="Следующий месяц"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Компонент календаря на базе react-day-picker v9
 * Используется для выбора даты в формах и попапах
 * Растягивается по ширине родительского контейнера
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 w-full", className)}
      classNames={{
        // Контейнеры месяцев - занимают всю ширину
        months: "flex flex-col w-full",
        month: "space-y-4 w-full",

        // Заголовок месяца - кастомизирован через компонент
        month_caption: "flex justify-center items-center h-9",
        caption_label: "text-sm font-medium",

        // Навигация - скрываем стандартную
        nav: "hidden",
        button_previous: "hidden",
        button_next: "hidden",

        // Таблица дней - занимает всю ширину
        month_grid: "w-full border-collapse",

        // Заголовки дней недели (пн, вт, ср...) - flex-1 для равного распределения
        weekdays: "flex w-full",
        weekday:
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center py-1",

        // Строки и ячейки с днями - flex-1 для равного распределения
        week: "flex w-full mt-2",
        day: "flex-1 aspect-square text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",

        // Кнопка дня - занимает весь размер ячейки
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-full p-0 font-normal aria-selected:opacity-100",
          "focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        ),

        // Модификаторы состояний дней
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        today: "bg-accent text-accent-foreground rounded-md",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",

        // Применяем пользовательские классы поверх
        ...classNames,
      }}
      components={{
        MonthCaption: CustomMonthCaption,
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
