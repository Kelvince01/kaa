import {
  differenceInMonths,
  format,
  isThisWeek,
  isToday,
  isYesterday,
} from "date-fns";

/**
 * Formats a date into a relative time format using date-fns.
 *
 * @param date - The date to format. Can be a string, Date object, or null.
 * @returns A formatted string representing the relative time or the full date.
 */
export function dateShort(date?: string | null | Date): string {
  if (!date) return "-";

  const inputDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  if (isToday(inputDate)) {
    return `Today, ${format(inputDate, "H:mm")}`;
  }

  if (isYesterday(inputDate)) {
    return `Yesterday, ${format(inputDate, "H:mm")}`;
  }

  if (isThisWeek(inputDate)) {
    return `${format(inputDate, "EEEE")}, ${format(inputDate, "H:mm")}`; // e.g. "Monday, 14:30"
  }

  const monthsDiff = differenceInMonths(now, inputDate);

  if (monthsDiff <= 3) {
    return format(inputDate, "MMM d, H:mm"); // e.g. "Sep 20, 14:30"
  }

  return format(inputDate, "MMM d, yyyy"); // e.g. "Jun 15, 2021"
}
