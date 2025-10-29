import { httpClient } from "@/lib/axios";

// Base API endpoints
const STRIPE_API = "/payments/stripe";

// Stripe service types
export type StripePaymentIntentRequest = {
  propertyId: string;
  paymentType: string;
  description?: string;
  contractId?: string;
  amount?: number;
};

export type StripePaymentIntentResponse = {
  clientSecret: string;
  amount: number;
  paymentIntentId: string;
  paymentId: string;
};

export type StripeSetupIntentRequest = {
  paymentMethodTypes?: string[];
};

export type StripeSetupIntentResponse = {
  clientSecret: string;
  setupIntentId: string;
};

export type StripePaymentMethodResponse = {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  created: number;
  customer: string;
};

export type StripeConfirmPaymentRequest = {
  paymentMethodId?: string;
};

export type StripeRefundRequest = {
  amount?: string;
  reason?: string;
};

// Stripe payment services
export const createStripePaymentIntent = async (
  data: StripePaymentIntentRequest
): Promise<StripePaymentIntentResponse> => {
  const { data: response } = await httpClient.api.post(
    `${STRIPE_API}/payment-intent`,
    data
  );
  return response.data;
};

export const createStripeSetupIntent = async (
  data: StripeSetupIntentRequest = {}
): Promise<StripeSetupIntentResponse> => {
  const { data: response } = await httpClient.api.post(
    `${STRIPE_API}/setup-intent`,
    data
  );
  return response.data;
};

export const getStripePaymentMethods = async (type = "card") => {
  const { data: response } = await httpClient.api.get(
    `${STRIPE_API}/payment-methods`,
    {
      params: { type },
    }
  );
  return response.data;
};

export const deleteStripePaymentMethod = async (paymentMethodId: string) => {
  const { data: response } = await httpClient.api.delete(
    `${STRIPE_API}/payment-methods/${paymentMethodId}`
  );
  return response.data;
};

export const confirmStripePaymentIntent = async (
  paymentIntentId: string,
  data: StripeConfirmPaymentRequest
) => {
  const { data: response } = await httpClient.api.post(
    `${STRIPE_API}/confirm/${paymentIntentId}`,
    data
  );
  return response.data;
};

export const cancelStripePaymentIntent = async (paymentIntentId: string) => {
  const { data: response } = await httpClient.api.post(
    `${STRIPE_API}/cancel/${paymentIntentId}`
  );
  return response.data;
};

export const getStripePaymentIntent = async (paymentIntentId: string) => {
  const { data: response } = await httpClient.api.get(
    `${STRIPE_API}/${paymentIntentId}`
  );
  return response.data;
};

export const createStripeRefund = async (
  paymentId: string,
  data: StripeRefundRequest
) => {
  const { data: response } = await httpClient.api.post(`${STRIPE_API}/refund`, {
    ...data,
    paymentId,
  });
  return response.data;
};

// Utility functions
export const formatStripeAmount = (
  amount: number,
  currency = "kes"
): string => {
  const formatted = (amount / 100).toFixed(2);
  const currencySymbol = getCurrencySymbol(currency);
  return `${currencySymbol}${formatted}`;
};

export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    kes: "KES ",
    usd: "$",
    eur: "€",
    gbp: "£",
  };
  return symbols[currency.toLowerCase()] || `${currency.toUpperCase()} `;
};

export const getStripeCardBrand = (brand: string): string => {
  const brands: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return brands[brand.toLowerCase()] || brand;
};

export const formatCardDisplay = (last4: string, brand: string): string =>
  `${getStripeCardBrand(brand)} ••••${last4}`;

export const getPaymentIntentStatus = (
  status: string
): {
  label: string;
  variant: "success" | "warning" | "error" | "info";
} => {
  switch (status) {
    case "succeeded":
      return { label: "Completed", variant: "success" };
    case "processing":
      return { label: "Processing", variant: "warning" };
    case "requires_payment_method":
      return { label: "Requires Payment Method", variant: "warning" };
    case "requires_confirmation":
      return { label: "Requires Confirmation", variant: "warning" };
    case "requires_action":
      return { label: "Requires Action", variant: "warning" };
    case "canceled":
      return { label: "Canceled", variant: "error" };
    case "requires_capture":
      return { label: "Requires Capture", variant: "info" };
    default:
      return { label: status, variant: "info" };
  }
};

// Constants
export const STRIPE_PAYMENT_METHOD_TYPES = [
  "card",
  "sepa_debit",
  "ideal",
  "sofort",
  "p24",
  "bancontact",
  "giropay",
  "eps",
] as const;

export const STRIPE_CARD_BRANDS = [
  "visa",
  "mastercard",
  "amex",
  "discover",
  "diners",
  "jcb",
  "unionpay",
] as const;
