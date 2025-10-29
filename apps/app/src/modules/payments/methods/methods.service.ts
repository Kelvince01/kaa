/** biome-ignore-all lint/performance/useTopLevelRegex: ignore */
import { httpClient } from "@/lib/axios";

// Base API endpoints
const METHODS_API = "/payment-methods";

// Payment methods service types
export type PaymentMethodResponse = {
  id: string;
  type: "mpesa" | "card" | "bank";
  isDefault: boolean;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePaymentMethodRequest = {
  type: "mpesa" | "card" | "bank";
  phoneNumber?: string;
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvc?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
};

// Payment methods services
export const getPaymentMethods = async (
  tenantId: string
): Promise<PaymentMethodResponse[]> => {
  const { data } = await httpClient.api.get(`${METHODS_API}/${tenantId}`);
  return data;
};

export const createPaymentMethod = async (
  tenantId: string,
  data: CreatePaymentMethodRequest
): Promise<PaymentMethodResponse> => {
  const { data: response } = await httpClient.api.post(
    `${METHODS_API}/${tenantId}`,
    data
  );
  return response;
};

export const deletePaymentMethod = async (
  tenantId: string,
  methodId: string
) => {
  const { data } = await httpClient.api.delete(
    `${METHODS_API}/${tenantId}/${methodId}`
  );
  return data;
};

export const setDefaultPaymentMethod = async (
  tenantId: string,
  methodId: string
): Promise<PaymentMethodResponse> => {
  const { data } = await httpClient.api.put(
    `${METHODS_API}/${tenantId}/${methodId}/default`
  );
  return data;
};

export const getPaymentMethod = async (
  tenantId: string,
  methodId: string
): Promise<PaymentMethodResponse> => {
  const { data } = await httpClient.api.get(
    `${METHODS_API}/${tenantId}/${methodId}`
  );
  return data;
};

// Utility functions
export const formatPaymentMethodName = (
  method: PaymentMethodResponse
): string => {
  switch (method.type) {
    case "mpesa":
      return `M-Pesa ${method.phoneNumber ? `(${maskPhoneNumber(method.phoneNumber)})` : ""}`;
    case "card":
      return `${method.brand || "Card"} ${method.lastFour ? `••••${method.lastFour}` : ""}`;
    case "bank":
      return `${method.bankName || "Bank"} ${method.accountNumber ? `••••${method.accountNumber.slice(-4)}` : ""}`;
    default:
      return method.type;
  }
};

export const getPaymentMethodIcon = (
  type: "mpesa" | "card" | "bank"
): string => {
  switch (type) {
    case "mpesa":
      return "/icons/mpesa.svg";
    case "card":
      return "/icons/card.svg";
    case "bank":
      return "/icons/bank.svg";
    default:
      return "/icons/payment.svg";
  }
};

export const maskPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.length < 4) return phoneNumber;
  const start = phoneNumber.slice(0, 3);
  const end = phoneNumber.slice(-3);
  return `${start}***${end}`;
};

export const maskCardNumber = (cardNumber: string): string => {
  if (cardNumber.length < 4) return cardNumber;
  return `••••••••••••${cardNumber.slice(-4)}`;
};

export const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length < 4) return accountNumber;
  return `••••••••${accountNumber.slice(-4)}`;
};

export const getCardBrandFromNumber = (cardNumber: string): string => {
  const number = cardNumber.replace(/\s/g, "");

  if (/^4/.test(number)) return "visa";
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return "mastercard";
  if (/^3[47]/.test(number)) return "amex";
  if (/^6/.test(number)) return "discover";
  if (/^3[0689]/.test(number)) return "diners";
  if (/^35/.test(number)) return "jcb";

  return "unknown";
};

export const validateCardNumber = (cardNumber: string): boolean => {
  const number = cardNumber.replace(/\s/g, "");

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = number.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(number.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const validateExpiryDate = (month: number, year: number): boolean => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return month >= 1 && month <= 12;
};

export const formatCardNumber = (cardNumber: string): string => {
  const number = cardNumber.replace(/\s/g, "");
  const brand = getCardBrandFromNumber(number);

  // Format based on card brand
  switch (brand) {
    case "amex":
      return number.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3");
    default:
      return number.replace(/(\d{4})(?=\d)/g, "$1 ");
  }
};

export const getPaymentMethodDisplayInfo = (method: PaymentMethodResponse) => {
  switch (method.type) {
    case "mpesa":
      return {
        title: "M-Pesa",
        subtitle: method.phoneNumber
          ? maskPhoneNumber(method.phoneNumber)
          : "Mobile Money",
        icon: getPaymentMethodIcon("mpesa"),
      };
    case "card":
      return {
        title: method.brand ? method.brand.toUpperCase() : "Card",
        subtitle: method.lastFour
          ? `••••${method.lastFour}`
          : "Credit/Debit Card",
        icon: getPaymentMethodIcon("card"),
        expiry:
          method.expiryMonth && method.expiryYear
            ? `${method.expiryMonth.toString().padStart(2, "0")}/${method.expiryYear}`
            : undefined,
      };
    case "bank":
      return {
        title: method.bankName || "Bank Transfer",
        subtitle: method.accountNumber
          ? maskAccountNumber(method.accountNumber)
          : "Bank Account",
        icon: getPaymentMethodIcon("bank"),
      };
    default:
      return {
        title: "Payment Method",
        subtitle: method.type,
        icon: getPaymentMethodIcon("card"),
      };
  }
};
