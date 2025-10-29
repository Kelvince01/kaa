import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import type { CreatePaymentMethodInput } from "./payment.schema";
import {
  createManualPayment,
  createPaymentMethod,
  createStripePaymentIntent,
  generateReceipt,
  getBookingPayments,
  getPaymentById,
  getPaymentHistory,
  getPaymentMethods,
  getPaymentStatistics,
  getPaymentStatus,
  getPayments,
  getUserPayments,
  initiateMpesaPayment,
  setDefaultPaymentMethod,
  verifyPayment,
} from "./payment.service";
import type { PaymentFilter } from "./payment.type";

// Query keys
export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "lists"] as const,
  list: (filters: Partial<PaymentFilter>) =>
    [...paymentKeys.lists(), { ...filters }] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  history: () => [...paymentKeys.all, "history"] as const,
  statistics: () => [...paymentKeys.all, "statistics"] as const,
  booking: (bookingId: string) =>
    [...paymentKeys.all, "booking", bookingId] as const,
  methods: (tenantId: string) =>
    [...paymentKeys.all, "methods", tenantId] as const,
};

// Get filtered payments
export const usePayments = (filters: PaymentFilter) => {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => getPayments(filters),
    staleTime: 30_000, // 30 seconds
  });
};

// Create manual payment
export const useCreateManualPayment = () =>
  useMutation({
    mutationFn: (data: {
      bookingId: string;
      amount: number;
      paymentMethod: string;
      transactionId: string;
      paymentDate?: Date;
    }) => createManualPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });

// Get payment history
export const usePaymentHistory = (params: {
  propertyId?: string;
  paymentType?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  includeSubscriptions?: boolean;
}) =>
  useQuery({
    queryKey: [...paymentKeys.history(), params],
    queryFn: () => getPaymentHistory(params),
    staleTime: 30_000,
  });

// Get user payments
export const useUserPayments = () =>
  useQuery({
    queryKey: paymentKeys.lists(),
    queryFn: getUserPayments,
    staleTime: 30_000,
  });

// Get payment by ID
export const usePayment = (id: string) =>
  useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => getPaymentById(id),
    enabled: !!id,
  });

// Get payment status
export const usePaymentStatus = (id: string) =>
  useQuery({
    queryKey: [...paymentKeys.detail(id), "status"],
    queryFn: () => getPaymentStatus(id),
    enabled: !!id,
  });

// Get booking payments
export const useBookingPayments = (bookingId: string) =>
  useQuery({
    queryKey: paymentKeys.booking(bookingId),
    queryFn: () => getBookingPayments(bookingId),
    enabled: !!bookingId,
  });

// Verify payment
export const useVerifyPayment = () =>
  useMutation({
    mutationFn: ({
      paymentId,
      data,
    }: {
      paymentId: string;
      data: { transactionId: string; notes: string };
    }) => verifyPayment(paymentId, data),
    onSuccess: (_, { paymentId }) => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(paymentId),
      });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });

// Generate receipt
export const useGenerateReceipt = () =>
  useMutation({
    mutationFn: ({
      paymentId,
      format = "pdf",
    }: {
      paymentId: string;
      format?: "pdf" | "json";
    }) => generateReceipt(paymentId, format),
  });

// Get payment statistics
export const usePaymentStatistics = (params: {
  propertyId?: string;
  timeframe?: "month" | "quarter" | "year" | "all";
}) => {
  return useQuery({
    queryKey: [...paymentKeys.statistics(), params],
    queryFn: () => getPaymentStatistics(params),
    staleTime: 60_000, // 1 minute
  });
};

// Get payment methods
export const usePaymentMethods = (tenantId: string) =>
  useQuery({
    queryKey: paymentKeys.methods(tenantId),
    queryFn: () => getPaymentMethods(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

// Create payment method
export const useCreatePaymentMethod = () =>
  useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreatePaymentMethodInput;
    }) => createPaymentMethod(tenantId, data),
    onSuccess: (_, { tenantId }) => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.methods(tenantId),
      });
    },
  });

// Set default payment method
export const useSetDefaultPaymentMethod = () =>
  useMutation({
    mutationFn: ({
      tenantId,
      paymentMethodId,
    }: {
      tenantId: string;
      paymentMethodId: string;
    }) => setDefaultPaymentMethod(tenantId, paymentMethodId),
    onSuccess: (_, { tenantId }) => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.methods(tenantId),
      });
    },
  });

// Initiate MPesa payment
export const useInitiateMpesaPayment = () =>
  useMutation({
    mutationFn: (data: {
      bookingId: string;
      phoneNumber: string;
      amount: number;
      paymentMethod: string;
      paymentType: string;
    }) => initiateMpesaPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });

// Create Stripe payment intent
export const useCreateStripePaymentIntent = () =>
  useMutation({
    mutationFn: ({
      tenantId,
      amount,
      currency,
    }: {
      tenantId: string;
      amount: number;
      currency: string;
    }) => createStripePaymentIntent(tenantId, amount, currency),
  });
