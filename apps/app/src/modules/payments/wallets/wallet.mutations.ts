import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import * as walletService from "./wallet.service";
import type {
  DepositInput,
  PayRentInput,
  TransferInput,
  WithdrawalInput,
} from "./wallet.type";

/**
 * Deposit to wallet via M-Pesa
 */
export const useDepositToWallet = () =>
  useMutation({
    mutationFn: (data: DepositInput) => walletService.depositToWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    },
  });

/**
 * Withdraw from wallet to M-Pesa
 */
export const useWithdrawFromWallet = () =>
  useMutation({
    mutationFn: (data: WithdrawalInput) =>
      walletService.withdrawFromWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    },
  });

/**
 * Pay rent from wallet
 */
export const usePayRentFromWallet = () =>
  useMutation({
    mutationFn: (data: PayRentInput) => walletService.payRentFromWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

/**
 * Transfer funds to another wallet
 */
export const useTransferFunds = () =>
  useMutation({
    mutationFn: (data: TransferInput) => walletService.transferFunds(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    },
  });
