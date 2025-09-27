import {
  ALIEN_ID_PATTERN,
  KENYAN_COUNTIES,
  KENYAN_PHONE_PATTERNS,
  NATIONAL_ID_PATTERN,
  PASSPORT_PATTERN,
} from "@kaa/constants";
import type { KenyanIdentification, KenyanPhone } from "@kaa/models/types";

/**
 * Validate Kenyan phone number
 */
export function validateKenyanPhone(phone: string): boolean {
  return KENYAN_PHONE_PATTERNS.FULL_PATTERN.test(phone);
}

/**
 * Format Kenyan phone number to international format
 */
export function formatKenyanPhone(phone: string): KenyanPhone | null {
  if (!validateKenyanPhone(phone)) {
    return null;
  }

  // Remove any spaces or special characters
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  let formattedPhone: string;

  if (cleanPhone.startsWith("+254")) {
    formattedPhone = cleanPhone;
  } else if (cleanPhone.startsWith("254")) {
    formattedPhone = `+${cleanPhone}`;
  } else if (cleanPhone.startsWith("0")) {
    formattedPhone = `+254${cleanPhone.substring(1)}`;
  } else {
    return null;
  }

  // Extract number without country code
  const number = formattedPhone.substring(4);

  return {
    countryCode: "+254",
    number,
    formatted: formattedPhone,
  };
}

/**
 * Get phone network provider
 */
export function getPhoneProvider(phone: string): string | null {
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  if (KENYAN_PHONE_PATTERNS.SAFARICOM.test(cleanPhone)) {
    return "Safaricom";
  }
  if (KENYAN_PHONE_PATTERNS.AIRTEL.test(cleanPhone)) {
    return "Airtel";
  }
  if (KENYAN_PHONE_PATTERNS.TELKOM.test(cleanPhone)) {
    return "Telkom";
  }

  return null;
}

/**
 * Validate Kenyan National ID
 */
export function validateNationalId(id: string): boolean {
  return NATIONAL_ID_PATTERN.test(id);
}

/**
 * Validate Kenyan Passport
 */
export function validatePassport(passport: string): boolean {
  return PASSPORT_PATTERN.test(passport);
}

/**
 * Validate Alien ID
 */
export function validateAlienId(id: string): boolean {
  return ALIEN_ID_PATTERN.test(id);
}

/**
 * Validate any Kenyan identification document
 */
export function validateKenyanId(
  type: string,
  number: string
): KenyanIdentification | null {
  let isValid = false;

  switch (type) {
    case "national_id":
      isValid = validateNationalId(number);
      break;
    case "passport":
      isValid = validatePassport(number);
      break;
    case "alien_id":
      isValid = validateAlienId(number);
      break;
    default:
      return null;
  }

  if (!isValid) {
    return null;
  }

  return {
    type: type as "national_id" | "passport" | "alien_id",
    number,
    verified: false,
  };
}

/**
 * Validate Kenyan county
 */
export function validateKenyanCounty(county: string): boolean {
  return KENYAN_COUNTIES.includes(county);
}

/**
 * Generate OTP code
 */
export function generateOTP(length = 6): string {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
}

/**
 * Format currency (KES)
 */
export function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if coordinates are within Kenya's bounds
 */
export function isWithinKenya(latitude: number, longitude: number): boolean {
  // Kenya's approximate bounds
  const KENYA_BOUNDS = {
    north: 5.019,
    south: -4.678,
    east: 41.899,
    west: 33.909,
  };

  return (
    latitude >= KENYA_BOUNDS.south &&
    latitude <= KENYA_BOUNDS.north &&
    longitude >= KENYA_BOUNDS.west &&
    longitude <= KENYA_BOUNDS.east
  );
}

/**
 * Get time in East Africa Time (EAT)
 */
export function getKenyanTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })
  );
}

/**
 * Check if it's business hours in Kenya
 */
export function isBusinessHours(): boolean {
  const now = getKenyanTime();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();

  // Monday to Friday: 8 AM - 5 PM
  if (day >= 1 && day <= 5) {
    return hour >= 8 && hour < 17;
  }

  // Saturday: 8 AM - 1 PM
  if (day === 6) {
    return hour >= 8 && hour < 13;
  }

  // Sunday: closed
  return false;
}

/**
 * Generate random Kenyan phone number for testing
 */
export function generateTestPhone(): string {
  const prefixes = [
    "701",
    "702",
    "703",
    "704",
    "705",
    "706",
    "707",
    "708",
    "709",
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `+254${prefix}${suffix}`;
}

/**
 * Generate random National ID for testing
 */
export function generateTestNationalId(): string {
  return Math.floor(Math.random() * 90_000_000 + 10_000_000).toString();
}

/**
 * Validate M-Pesa transaction code format
 */
export function validateMpesaCode(code: string): boolean {
  // biome-ignore lint/performance/useTopLevelRegex: ignore
  return /^[A-Z0-9]{10}$/.test(code);
}

/**
 * Extract phone number from M-Pesa callback
 */
export function extractPhoneFromMpesa(phone: string): string {
  // M-Pesa usually returns phone in format 254XXXXXXXXX
  if (phone.startsWith("254")) {
    return `+${phone}`;
  }
  return phone;
}

/**
 * Generate reference number for transactions
 */
export function generateTransactionRef(prefix = "TXN"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Validate email format (basic)
 */
export function validateEmail(email: string): boolean {
  // biome-ignore lint/performance/useTopLevelRegex: ignore
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Slugify text for URLs (Swahili and English friendly)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Check if a date is a Kenyan public holiday
 */
export function isPublicHoliday(date: Date): boolean {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const dateStr = `${month}-${day}`;

  const fixedHolidays = [
    "01-01", // New Year's Day
    "05-01", // Labour Day
    "06-01", // Madaraka Day
    "10-20", // Mashujaa Day
    "12-12", // Jamhuri Day
    "12-25", // Christmas Day
    "12-26", // Boxing Day
  ];

  return fixedHolidays.includes(dateStr);
}

/**
 * Get next business day (excluding weekends and public holidays)
 */
export function getNextBusinessDay(date: Date = new Date()): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  // If it's weekend, move to Monday
  if (nextDay.getDay() === 0) {
    // Sunday
    nextDay.setDate(nextDay.getDate() + 1);
  } else if (nextDay.getDay() === 6) {
    // Saturday
    nextDay.setDate(nextDay.getDate() + 2);
  }

  // If it's a public holiday, get next business day recursively
  if (isPublicHoliday(nextDay)) {
    return getNextBusinessDay(nextDay);
  }

  return nextDay;
}

export default {
  validateKenyanPhone,
  formatKenyanPhone,
  getPhoneProvider,
  validateNationalId,
  validatePassport,
  validateAlienId,
  validateKenyanId,
  validateKenyanCounty,
  generateOTP,
  formatKES,
  calculateDistance,
  isWithinKenya,
  getKenyanTime,
  isBusinessHours,
  generateTestPhone,
  generateTestNationalId,
  validateMpesaCode,
  extractPhoneFromMpesa,
  generateTransactionRef,
  validateEmail,
  slugify,
  isPublicHoliday,
  getNextBusinessDay,
};
