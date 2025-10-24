/**
 * Wallet utility functions for formatting and calculations
 */

// Kenyan phone number regex (defined at top level for performance)
const KENYAN_PHONE_REGEX = /^254[17]\d{8}$/;

/**
 * Format a number as Kenyan Shillings (KES)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string or Date object to a readable format
 * @param date - The date to format
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return new Intl.DateTimeFormat("en-KE", defaultOptions).format(dateObj);
}

/**
 * Format date as relative time (e.g., "2 hours ago", "yesterday")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  if (diffInDays === 1) {
    return "yesterday";
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return formatDate(dateObj, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format phone number to Kenyan format
 * @param phoneNumber - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Check if it's a Kenyan number (254...)
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }

  // If it starts with 0, convert to 254 format
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    const withoutZero = cleaned.slice(1);
    return `+254 ${withoutZero.slice(0, 3)} ${withoutZero.slice(3, 6)} ${withoutZero.slice(6)}`;
  }

  return phoneNumber;
}

/**
 * Validate Kenyan phone number format
 * @param phoneNumber - Phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidKenyanPhone(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "");
  return KENYAN_PHONE_REGEX.test(cleaned);
}

/**
 * Calculate percentage of limit used
 * @param used - Amount used
 * @param limit - Total limit
 * @returns Percentage (0-100)
 */
export function calculateLimitPercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(Math.round((used / limit) * 100), 100);
}

/**
 * Get transaction reference prefix based on type
 * @param type - Transaction type
 * @returns Reference prefix
 */
export function getTransactionPrefix(type: string): string {
  switch (type.toLowerCase()) {
    case "deposit":
      return "DEP";
    case "withdrawal":
      return "WTH";
    case "transfer":
      return "TRF";
    case "rent_payment":
      return "RNT";
    case "deposit_payment":
      return "DPT";
    case "refund":
      return "RFD";
    case "commission":
      return "COM";
    default:
      return "TXN";
  }
}

/**
 * Generate a random transaction reference
 * @param prefix - Optional prefix
 * @returns Transaction reference
 */
export function generateTransactionReference(prefix?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const prefixStr = prefix || "TXN";
  return `${prefixStr}-${timestamp}-${random}`;
}

/**
 * Parse M-Pesa phone number to 254 format
 * @param phoneNumber - Phone number to parse
 * @returns Formatted phone number in 254 format
 */
export function parseToKenyanFormat(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, "");

  if (cleaned.startsWith("254")) {
    return cleaned;
  }

  if (cleaned.startsWith("0")) {
    return `254${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    return `254${cleaned}`;
  }

  return cleaned;
}

/**
 * Check if amount is within limits
 * @param amount - Amount to check
 * @param min - Minimum allowed
 * @param max - Maximum allowed
 * @returns Object with isValid flag and error message
 */
export function validateAmount(
  amount: number,
  min: number,
  max: number
): { isValid: boolean; error?: string } {
  if (amount < min) {
    return {
      isValid: false,
      error: `Amount must be at least ${formatCurrency(min)}`,
    };
  }

  if (amount > max) {
    return {
      isValid: false,
      error: `Amount cannot exceed ${formatCurrency(max)}`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate transaction fee (if applicable)
 * @param amount - Transaction amount
 * @param feePercentage - Fee percentage (default 0)
 * @returns Fee amount
 */
export function calculateTransactionFee(amount: number, feePercentage = 0) {
  return Math.round(amount * (feePercentage / 100));
}

/**
 * Get color class for transaction type
 * @param type - Transaction type
 * @returns Tailwind color class
 */
export function getTransactionColorClass(type: string) {
  switch (type.toLowerCase()) {
    case "deposit":
      return "text-green-600";
    case "withdrawal":
      return "text-orange-600";
    case "transfer":
      return "text-blue-600";
    case "rent_payment":
    case "deposit_payment":
      return "text-purple-600";
    case "refund":
      return "text-indigo-600";
    case "commission":
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Format transaction amount with sign
 * @param amount - Transaction amount
 * @param type - Transaction type
 * @returns Formatted amount with + or - sign
 */
export function formatTransactionAmount(amount: number, type: string): string {
  const sign =
    type.toLowerCase() === "deposit" || type.toLowerCase() === "refund"
      ? "+"
      : "-";
  return `${sign}${formatCurrency(Math.abs(amount))}`;
}
