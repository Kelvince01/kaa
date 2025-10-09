export type BankConfig = {
  bankCode: "EQUITY" | "KCB" | "NCBA" | "ABSA";
  environment: "sandbox" | "production";
  apiKey: string;
  apiSecret: string;
  baseURL: string;
  clientId?: string;
  clientSecret?: string;
  merchantId?: string;
  terminalId?: string;
  callbackUrl: string;
  timeout: number;
  retryAttempts: number;
  enabled: boolean;
  priority: number; // Lower number = higher priority
};

export type UnifiedPaymentRequest = {
  amount: number;
  currency: "KES" | "USD" | "EUR";
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  description: string;
  reference: string;
  metadata?: any;
  preferredBank?: string;
  paymentMethod: "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER" | "WALLET";
};

export type UnifiedPaymentResponse = {
  transactionId: string;
  bankTransactionId?: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount: number;
  currency: string;
  bank: string;
  paymentUrl?: string;
  qrCode?: string;
  instructions?: string;
  expiresAt?: Date;
  metadata?: any;
};

export type BankTransaction = {
  id: string;
  bankTransactionId: string;
  bank: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED";
  customerPhone: string;
  customerEmail?: string;
  description: string;
  reference: string;
  paymentMethod: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata?: any;
};

export type BankHealthStatus = {
  bank: string;
  isHealthy: boolean;
  responseTime: number;
  lastChecked: Date;
  errorCount: number;
  successRate: number;
};
