import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkAccountBalance,
  initiateB2BPayment,
  initiateB2CPayment,
  initiateMpesaPayment,
  type MpesaB2BRequest,
  type MpesaB2CRequest,
  type MpesaPaymentRequest,
  type MpesaReversalRequest,
  type MpesaTransactionQuery,
  type MpesaVerificationRequest,
  queryTransactionStatus,
  registerMpesaUrls,
  reverseTransaction,
  verifyMpesaPayment,
} from "./mpesa.service";

// Payment initiation
export const useInitiateMpesaPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MpesaPaymentRequest) => initiateMpesaPayment(data),
    onSuccess: () => {
      // Invalidate and refetch payment related queries
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    },
  });
};

// Payment verification
export const useVerifyMpesaPayment = () =>
  useMutation({
    mutationFn: (data: MpesaVerificationRequest) => verifyMpesaPayment(data),
  });

// B2C Payments
export const useInitiateB2CPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MpesaB2CRequest) => initiateB2CPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["mpesa-balance"] });
    },
  });
};

// B2B Payments
export const useInitiateB2BPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MpesaB2BRequest) => initiateB2BPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["mpesa-balance"] });
    },
  });
};

// Transaction reversal
export const useReverseTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MpesaReversalRequest) => reverseTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["mpesa-balance"] });
    },
  });
};

// Account balance check
export const useMpesaAccountBalance = () => {
  return useQuery({
    queryKey: ["mpesa-balance"],
    queryFn: checkAccountBalance,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

// Transaction status query
export const useQueryTransactionStatus = () =>
  useMutation({
    mutationFn: (data: MpesaTransactionQuery) => queryTransactionStatus(data),
  });

// URL registration
export const useRegisterMpesaUrls = () =>
  useMutation({
    mutationFn: registerMpesaUrls,
  });

// Polling hook for payment status
export const usePollPaymentStatus = (
  checkoutRequestID: string,
  enabled = false
) => {
  return useQuery({
    queryKey: ["mpesa-payment-status", checkoutRequestID],
    queryFn: () => verifyMpesaPayment({ checkoutRequestID }),
    enabled: enabled && !!checkoutRequestID,
    refetchInterval: (data: any) => {
      // Stop polling if payment is completed or failed
      if (data.data?.status === "completed" || data.data?.status === "failed") {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
    retry: 3,
  });
};
