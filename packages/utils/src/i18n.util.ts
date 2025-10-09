export const SUPPORTED_LOCALES = ["en", "sw"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

/**
 * Format currency for API responses
 */
export function formatCurrency(
  amount: number,
  currency = "KES",
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const localeMap: Record<SupportedLocale, string> = {
    en: "en-KE",
    sw: "sw-KE",
  };

  try {
    return new Intl.NumberFormat(localeMap[locale], {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/**
 * Format date for API responses
 */
export function formatDate(
  date: Date | string,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const localeMap: Record<SupportedLocale, string> = {
    en: "en-KE",
    sw: "sw-KE",
  };

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(localeMap[locale], defaultOptions).format(
      dateObj
    );
  } catch {
    return dateObj.toLocaleDateString();
  }
}
