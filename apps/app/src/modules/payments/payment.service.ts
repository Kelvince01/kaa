import { httpClient } from "@/lib/axios";
import type { CreatePaymentMethodInput } from "./payment.schema";
import type {
  Payment,
  PaymentFilter,
  PaymentMethod,
  PaymentStatistics,
} from "./payment.type";

// Base API endpoints
const PAYMENT_API = "/payments";
const PAYMENT_METHODS_API = "/payment-methods";

// Base payment services
export const getPayments = async (filters: PaymentFilter) => {
  const { data } = await httpClient.api.get(PAYMENT_API, { params: filters });
  return data;
};

export const createManualPayment = async (paymentData: {
  bookingId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paymentDate?: Date;
}): Promise<Payment> => {
  const { data } = await httpClient.api.post(
    `${PAYMENT_API}/manual`,
    paymentData
  );
  return data;
};

export const getPaymentHistory = async (params: {
  propertyId?: string;
  paymentType?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  includeSubscriptions?: boolean;
}) => {
  const { data } = await httpClient.api.get(`${PAYMENT_API}/history`, {
    params,
  });
  return data;
};

export const getUserPayments = async () => {
  const { data } = await httpClient.api.get(`${PAYMENT_API}/user`);
  return data;
};

export const getPaymentById = async (id: string): Promise<Payment> => {
  const { data } = await httpClient.api.get(`${PAYMENT_API}/${id}`);
  return data;
};

export const getPaymentStatus = async (id: string) => {
  const { data } = await httpClient.api.get(`${PAYMENT_API}/${id}/status`);
  return data;
};

export const getBookingPayments = async (bookingId: string) => {
  const { data } = await httpClient.api.get(
    `${PAYMENT_API}/booking/${bookingId}`
  );
  return data;
};

export const verifyPayment = async (
  paymentId: string,
  verificationData: {
    transactionId: string;
    notes: string;
  }
): Promise<Payment> => {
  const { data } = await httpClient.api.patch(
    `${PAYMENT_API}/${paymentId}/verify`,
    verificationData
  );
  return data;
};

export const generateReceipt = async (
  paymentId: string,
  format: "pdf" | "json" = "pdf"
) => {
  const { data } = await httpClient.api.get(
    `${PAYMENT_API}/generate/${paymentId}/receipt`,
    {
      params: { format },
      responseType: format === "pdf" ? "blob" : "json",
    }
  );
  return data;
};

export const getPaymentStatistics = async (params: {
  propertyId?: string;
  timeframe?: "month" | "quarter" | "year" | "all";
}): Promise<PaymentStatistics> => {
  const { data } = await httpClient.api.get(`${PAYMENT_API}/statistics`, {
    params,
  });
  return data;
};

// Payment methods services
export const getPaymentMethods = async (
  tenantId: string
): Promise<PaymentMethod[]> => {
  const { data } = await httpClient.api.get(
    `${PAYMENT_METHODS_API}/${tenantId}`
  );
  return data;
};

export const createPaymentMethod = async (
  tenantId: string,
  data: CreatePaymentMethodInput
): Promise<PaymentMethod> => {
  const { data: response } = await httpClient.api.post(
    `${PAYMENT_METHODS_API}/${tenantId}`,
    data
  );
  return response;
};

export const setDefaultPaymentMethod = async (
  tenantId: string,
  paymentMethodId: string
): Promise<PaymentMethod> => {
  const { data } = await httpClient.api.put(
    `${PAYMENT_METHODS_API}/${tenantId}/${paymentMethodId}/default`
  );
  return data;
};

// MPesa specific services
export const initiateMpesaPayment = async (data: {
  bookingId: string;
  phoneNumber: string;
  amount: number;
  paymentMethod: string;
  paymentType: string;
}): Promise<{
  payment: Payment;
  mpesaResponse: any;
}> => {
  const { data: response } = await httpClient.api.post(
    `${PAYMENT_API}/mpesa/initiate`,
    data
  );
  return response;
};

// Stripe specific services
export const createStripePaymentIntent = async (
  tenantId: string,
  amount: number,
  currency: string
): Promise<{ clientSecret: string }> => {
  const { data } = await httpClient.api.post(
    `${PAYMENT_API}/${tenantId}/stripe/intent`,
    {
      amount,
      currency,
    }
  );
  return data;
};
