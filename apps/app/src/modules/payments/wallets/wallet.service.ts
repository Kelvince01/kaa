import { httpClient } from "@/lib/axios";
import type {
  DepositInput,
  DepositResponse,
  PayRentInput,
  PayRentResponse,
  TransactionHistoryParams,
  TransactionHistoryResponse,
  TransferInput,
  TransferResponse,
  WalletApiResponse,
  WalletBalanceResponse,
  WithdrawalInput,
  WithdrawalResponse,
} from "./wallet.type";

/**
 * Get wallet balance
 */
export const getWalletBalance = async (): Promise<WalletBalanceResponse> => {
  const response = await httpClient.api.get("/payments/wallets/");
  return response.data;
};

/**
 * Deposit to wallet via M-Pesa
 */
export const depositToWallet = async (
  data: DepositInput
): Promise<WalletApiResponse<DepositResponse>> => {
  const response = await httpClient.api.post("/payments/wallets/deposit", data);
  return response.data;
};

/**
 * Withdraw from wallet to M-Pesa
 */
export const withdrawFromWallet = async (
  data: WithdrawalInput
): Promise<WalletApiResponse<WithdrawalResponse>> => {
  const response = await httpClient.api.post(
    "/payments/wallets/withdraw",
    data
  );
  return response.data;
};

/**
 * Pay rent from wallet
 */
export const payRentFromWallet = async (
  data: PayRentInput
): Promise<WalletApiResponse<PayRentResponse>> => {
  const response = await httpClient.api.post(
    "/payments/wallets/pay-rent",
    data
  );
  return response.data;
};

/**
 * Transfer funds to another wallet
 */
export const transferFunds = async (
  data: TransferInput
): Promise<WalletApiResponse<TransferResponse>> => {
  const response = await httpClient.api.post(
    "/payments/wallets/transfer",
    data
  );
  return response.data;
};

/**
 * Get transaction history
 */
export const getTransactionHistory = async (
  params: TransactionHistoryParams = {}
): Promise<TransactionHistoryResponse> => {
  const response = await httpClient.api.get("/payments/wallets/transactions", {
    params,
  });
  return response.data;
};

/**
 * Get transaction by ID
 */
export const getTransaction = async (
  transactionId: string
): Promise<WalletApiResponse<any>> => {
  const response = await httpClient.api.get(
    `/payments/wallets/transactions/${transactionId}`
  );
  return response.data;
};
