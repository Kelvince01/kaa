import { format } from "date-fns";

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("en-KE", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
  } catch (_err) {
    return "";
  }
}

export const formatTime = (dateString: string) => {
  return format(new Date(dateString), "hh:mm a");
};

export function formatCurrency(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a card brand name by capitalizing the first letter
 */
export const formatCardBrand = (brand: string): string => {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
};

/**
 * Format the last four digits of a card number
 */
export const formatLastFour = (last4: string): string => {
  return last4.slice(-4);
};

export function formatPhoneNumber(phone: string) {
  // Convert to international format
  if (phone.startsWith("0")) {
    return `+254${phone.slice(1)}`;
  }
  if (phone.startsWith("254")) {
    return `+${phone}`;
  }
  return phone;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
