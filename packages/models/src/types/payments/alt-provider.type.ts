export type PaymentProvider = {
  id: string;
  name: string;
  type: AltPaymentType;
  status: AltProviderStatus;
  config: AltProviderConfig;
  limits: PaymentLimits;
  fees: FeeStructure;
};

export enum AltPaymentType {
  MOBILE_MONEY = "mobile_money",
  MOBILE_BANKING = "mobile_banking",
  USSD = "ussd",
  CARD = "card",
  BANK_TRANSFER = "bank_transfer",
  CRYPTO = "crypto",
}

export enum AltProviderStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  MAINTENANCE = "maintenance",
  SUSPENDED = "suspended",
}

export type AltProviderConfig = {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  merchantId: string;
  sandbox: boolean;
  timeout: number;
  retries: number;
  webhookUrl?: string;
};

export type PaymentLimits = {
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
  transactionLimit: number;
};

export type FeeStructure = {
  type: "fixed" | "percentage" | "tiered";
  value: number;
  minFee?: number;
  maxFee?: number;
  tiers?: Array<{
    min: number;
    max: number;
    fee: number;
  }>;
};

export type PaymentRequest = {
  id: string;
  providerId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  reference: string;
  description: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
  expiryTime?: Date;
};

export type PaymentResponse = {
  transactionId: string;
  status: AltPaymentStatus;
  message: string;
  reference?: string;
  ussdCode?: string;
  instructions?: string;
  expiryTime?: Date;
  fees?: number;
};

export enum AltPaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PROCESSING = "processing",
}

export type USSDSession = {
  sessionId: string;
  phoneNumber: string;
  currentStep: number;
  data: Record<string, any>;
  lastActivity: Date;
  status: "active" | "completed" | "expired";
};

export type USSDResponse = {
  sessionId: string;
  message: string;
  options?: string[];
  isEndSession: boolean;
};

// Kenya-specific constants
export const KENYA_NETWORKS = {
  SAFARICOM: {
    prefix: [
      "254701",
      "254702",
      "254703",
      "254704",
      "254705",
      "254706",
      "254707",
      "254708",
      "254709",
    ],
    name: "Safaricom",
  },
  AIRTEL: {
    prefix: [
      "254730",
      "254731",
      "254732",
      "254733",
      "254734",
      "254735",
      "254736",
      "254737",
      "254738",
      "254739",
      "254750",
      "254751",
      "254752",
      "254753",
      "254754",
      "254755",
      "254756",
    ],
    name: "Airtel Kenya",
  },
  TELKOM: {
    prefix: [
      "254770",
      "254771",
      "254772",
      "254773",
      "254774",
      "254775",
      "254776",
      "254777",
    ],
    name: "Telkom Kenya",
  },
  EQUITEL: { prefix: ["254763", "254764", "254765"], name: "Equitel" },
};

export const USSD_CODES = {
  AIRTEL_MONEY: "*334#",
  TKASH: "*406#",
  EQUITEL: "*247#",
  KCB_MOBILE: "*522#",
  EQUITY_MOBILE: "*247#",
  COOP_MOBILE: "*667#",
};
