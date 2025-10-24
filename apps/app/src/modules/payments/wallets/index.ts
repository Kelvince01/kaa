// Export all wallet module components, hooks, types, and utilities

export { DepositForm } from "./components/deposit-form";
export { PayRentForm } from "./components/pay-rent-form";
export { TransactionList } from "./components/transaction-list";
export { TransferForm } from "./components/transfer-form";
// Components
export { WalletBalanceCard } from "./components/wallet-balance-card";
export { WalletDashboard } from "./components/wallet-dashboard";
export { WithdrawalForm } from "./components/withdrawal-form";
// Hooks - Mutations
export {
  useDepositToWallet,
  usePayRentFromWallet,
  useTransferFunds,
  useWithdrawFromWallet,
} from "./wallet.mutations";
// Hooks - Queries
export {
  useTransaction,
  useTransactionHistory,
  useWalletBalance,
} from "./wallet.queries";
export type {
  DepositFormValues,
  PayRentFormValues,
  TransactionFilterFormValues,
  TransferFormValues,
  WithdrawalFormValues,
} from "./wallet.schema";

// Schemas
export {
  depositSchema,
  payRentSchema,
  transactionFilterSchema,
  transferSchema,
  withdrawalSchema,
} from "./wallet.schema";
// Services
export * from "./wallet.service";

// Types
export type {
  DepositInput,
  DepositResponse,
  PayRentInput,
  PayRentResponse,
  TransactionHistoryParams,
  TransactionHistoryResponse,
  TransactionMetadata,
  TransferInput,
  TransferResponse,
  Wallet,
  WalletApiResponse,
  WalletBalance,
  WalletBalanceResponse,
  WalletLimits,
  WalletMetadata,
  WalletTransaction,
  WithdrawalInput,
  WithdrawalResponse,
} from "./wallet.type";

// Re-export enums from types
export {
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from "./wallet.type";

// Utilities
export {
  calculateLimitPercentage,
  calculateTransactionFee,
  formatCurrency,
  formatDate,
  formatPhoneNumber,
  formatRelativeTime,
  formatTransactionAmount,
  generateTransactionReference,
  getTransactionColorClass,
  getTransactionPrefix,
  isValidKenyanPhone,
  parseToKenyanFormat,
  validateAmount,
} from "./wallet.utils";
