import { isToday, isYesterday, format, parseISO } from "date-fns";
import { ru, enUS } from "date-fns/locale";

/**
 * Группирует массив объектов по дате.
 * Возвращает Map, где ключ - строка даты (Today, Yesterday, или dd MMMM yyyy).
 */
export function groupByDate<T extends { date: string }>(
  items: T[],
  locale: "ru" | "en" = "ru"
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  const dateLocale = locale === "ru" ? ru : enUS;

  for (const item of items) {
    const dateObj = parseISO(item.date);
    let key: string;

    if (isToday(dateObj)) {
      key = locale === "ru" ? "Сегодня" : "Today";
    } else if (isYesterday(dateObj)) {
      key = locale === "ru" ? "Вчера" : "Yesterday";
    } else {
      key = format(dateObj, "d MMMM yyyy", { locale: dateLocale });
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  return groups;
}

/**
 * Форматирует дату для отображения.
 */
export function formatDate(
  date: string | Date,
  formatStr: string = "dd.MM.yyyy",
  locale: "ru" | "en" = "ru"
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const dateLocale = locale === "ru" ? ru : enUS;
  return format(dateObj, formatStr, { locale: dateLocale });
}
