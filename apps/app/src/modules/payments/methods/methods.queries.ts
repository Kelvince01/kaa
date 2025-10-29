import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type CreatePaymentMethodRequest,
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from "./methods.service";

// Get payment methods for a tenant
export const usePaymentMethods = (tenantId: string) => {
  return useQuery({
    queryKey: ["payment-methods", tenantId],
    queryFn: () => getPaymentMethods(tenantId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get a specific payment method
export const usePaymentMethod = (tenantId: string, methodId: string) => {
  return useQuery({
    queryKey: ["payment-method", tenantId, methodId],
    queryFn: () => getPaymentMethod(tenantId, methodId),
    enabled: !!tenantId && !!methodId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create a new payment method
export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreatePaymentMethodRequest;
    }) => createPaymentMethod(tenantId, data),
    onSuccess: (_, { tenantId }) => {
      // Invalidate and refetch payment methods
      queryClient.invalidateQueries({
        queryKey: ["payment-methods", tenantId],
      });
      queryClient.invalidateQueries({ queryKey: ["stripe-payment-methods"] });
    },
  });
};

// Delete a payment method
export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      methodId,
    }: {
      tenantId: string;
      methodId: string;
    }) => deletePaymentMethod(tenantId, methodId),
    onSuccess: (_, { tenantId }) => {
      // Invalidate and refetch payment methods
      queryClient.invalidateQueries({
        queryKey: ["payment-methods", tenantId],
      });
      queryClient.invalidateQueries({ queryKey: ["stripe-payment-methods"] });
    },
  });
};

// Set default payment method
export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      methodId,
    }: {
      tenantId: string;
      methodId: string;
    }) => setDefaultPaymentMethod(tenantId, methodId),
    onSuccess: (_, { tenantId }) => {
      // Invalidate and refetch payment methods
      queryClient.invalidateQueries({
        queryKey: ["payment-methods", tenantId],
      });
    },
  });
};
