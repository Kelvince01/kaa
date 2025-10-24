import type {
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from "@kaa/models/types";

// Wallet balance type
export type WalletBalance = {
  available: number;
  pending: number;
  reserved: number;
  total: number;
};

// Wallet metadata type
export type WalletMetadata = {
  lastTransactionAt?: string;
  totalDeposited: number;
  totalWithdrawn: number;
  totalSpent: number;
};

// Main wallet type
export type Wallet = {
  _id: string;
  userId: string;
  balance: WalletBalance;
  currency: string;
  status: WalletStatus;
  dailyLimit: number;
  monthlyLimit: number;
  metadata: WalletMetadata;
  createdAt: string;
  updatedAt: string;
};

// Wallet transaction metadata type
export type TransactionMetadata = {
  mpesaReceiptNumber?: string;
  mpesaTransactionId?: string;
  propertyId?: string;
  bookingId?: string;
  applicationId?: string;
  phoneNumber?: string;
  recipientWalletId?: string;
};

// Wallet transaction type
export type WalletTransaction = {
  _id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  reference: string;
  description: string;
  metadata: TransactionMetadata;
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// Wallet limits type
export type WalletLimits = {
  daily: number;
  monthly: number;
};

// Wallet balance response
export type WalletBalanceResponse = {
  balance: number;
  status: WalletStatus;
  limits: WalletLimits;
};

// Deposit input type
export type DepositInput = {
  amount: number;
  phoneNumber: string;
};

// Deposit response type
export type DepositResponse = {
  transactionId: string;
  reference: string;
  checkoutRequestId: string;
  message: string;
};

// Withdrawal input type
export type WithdrawalInput = {
  amount: number;
  phoneNumber: string;
};

// Withdrawal response type
export type WithdrawalResponse = {
  transactionId: string;
  reference: string;
  message: string;
};

// Pay rent input type
export type PayRentInput = {
  propertyId: string;
  applicationId: string;
  amount: number;
};

// Pay rent response type
export type PayRentResponse = {
  transactionId: string;
  reference: string;
  message: string;
};

// Transfer input type
export type TransferInput = {
  recipientPhone: string;
  amount: number;
};

// Transfer response type
export type TransferResponse = {
  transactionId: string;
  reference: string;
  message: string;
};

// Transaction history query params
export type TransactionHistoryParams = {
  page?: number;
  limit?: number;
  type?: TransactionType;
  status?: TransactionStatus;
};

// Transaction history response
export type TransactionHistoryResponse = {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

// Generic API response wrapper
export type WalletApiResponse<T> = {
  data?: T;
  status: "success" | "error";
  message?: string;
};

// Re-export enums from @kaa/models/types for convenience
export {
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from "@kaa/models/types";
