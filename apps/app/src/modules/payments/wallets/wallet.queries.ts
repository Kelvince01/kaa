import { useQuery } from "@tanstack/react-query";
import * as walletService from "./wallet.service";
import type { TransactionHistoryParams } from "./wallet.type";

/**
 * Get wallet balance
 */
export const useWalletBalance = () =>
  useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: walletService.getWalletBalance,
  });

/**
 * Get transaction history with optional filters
 */
export const useTransactionHistory = (params: TransactionHistoryParams = {}) =>
  useQuery({
    queryKey: ["wallet", "transactions", params],
    queryFn: () => walletService.getTransactionHistory(params),
  });

/**
 * Get single transaction by ID
 */
export const useTransaction = (transactionId: string) =>
  useQuery({
    queryKey: ["wallet", "transactions", transactionId],
    queryFn: () => walletService.getTransaction(transactionId),
    enabled: !!transactionId,
  });
