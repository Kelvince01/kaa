import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum PaymentMethod {
  MPESA = "mpesa",
  BANK_TRANSFER = "bank_transfer",
  CARD = "card",
  CHEQUE = "cheque",
  CASH = "cash",
}

// Payment status
export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  PARTIAL = "partial",
  PARTIALLY_REFUNDED = "partially_refunded",
}

// Payment types
export enum PaymentType {
  RENT = "rent",
  DEPOSIT = "deposit",
  UTILITIES = "utilities",
  PENALTY = "penalty",
  BOOKING_FEE = "booking_fee",
  MAINTENANCE = "maintenance",
  SERVICE_CHARGE = "service_charge",
  HOLDING_DEPOSIT = "holding_deposit",
  FEE = "fee",
}

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  RENT_PAYMENT = "rent_payment",
  DEPOSIT_PAYMENT = "deposit_payment",
  REFUND = "refund",
  COMMISSION = "commission",
  TRANSFER = "transfer",
}

export enum TransactionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REVERSED = "reversed",
}

export enum WalletStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  FROZEN = "frozen",
  CLOSED = "closed",
}

export interface IPayment extends BaseDocument {
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  paymentMethod: mongoose.Types.ObjectId;
  paymentIntentId: string;
  stripeChargeId?: string;
  description?: string;
  dueDate: Date;
  paidDate?: Date;
  metadata?: Record<string, any>;
  tenant: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  property?: mongoose.Types.ObjectId;
  contract?: mongoose.Types.ObjectId;
  receiptUrl?: string;
  refunded?: boolean;
  refundAmount?: number;
  refundId?: string;
  transactionId?: string;
  referenceNumber?: string; // Unique payment reference
  completedAt?: Date;
  paymentDetails?: any;
  notes?: string;
  failureReason?: string;

  // Late payment tracking
  latePayment: {
    isLate: boolean;
    daysLate: number;
    penaltyAmount: number;
    penaltyApplied: boolean;
  };

  // Reconciliation
  reconciliation: {
    reconciled: boolean;
    reconciledDate?: Date;
    reconciledBy?: mongoose.Types.ObjectId;
    discrepancy?: {
      expectedAmount: number;
      actualAmount: number;
      reason: string;
    };
  };

  // Automated reminders
  reminders: Array<{
    type: "sms" | "email" | "whatsapp" | "call";
    sentDate: Date;
    status: "sent" | "delivered" | "failed";
    response?: string;
  }>;

  // Partial payments
  partialPayments: Array<{
    amount: number;
    date: Date;
    method: string;
    reference: string;
    status: "completed" | "pending" | "failed";
  }>;

  // AI insights
  aiInsights: {
    paymentProbability: number;
    riskScore: number;
    recommendedAction: string;
    predictedPaymentDate?: Date;
  };
}

export enum PaymentRecurrenceFrequency {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually",
  WEEKLY = "weekly",
  DAILY = "daily",
}

export enum RecurringPaymentStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export interface IRecurringPayment extends BaseDocument {
  tenant: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  contract: mongoose.Types.ObjectId;

  // Payment details
  amount: number;
  currency: string;
  paymentType: string;
  description: string;

  // Recurrence settings
  frequency: PaymentRecurrenceFrequency;
  startDate: Date;
  endDate?: Date;
  nextPaymentDate: Date;
  dayOfMonth?: number; // For monthly payments (1-31)
  dayOfWeek?: number; // For weekly payments (0-6, Sunday = 0)

  // Status and tracking
  status: RecurringPaymentStatus;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  lastPaymentDate?: Date;
  lastPaymentStatus?: string;

  // Payment method
  paymentMethod: mongoose.Types.ObjectId;
  autoRetry: boolean;
  maxRetries: number;
  retryInterval: number; // hours

  // Notifications
  notifyBeforeDays: number;
  notifyOnFailure: boolean;
  notifyOnSuccess: boolean;

  // Grace period and late fees
  gracePeriodDays: number;
  lateFeeAmount: number;
  lateFeePercentage: number;
  applyLateFeeAfterDays: number;

  // Generated payments
  generatedPayments: mongoose.Types.ObjectId[];

  // Metadata
  metadata?: Record<string, any>;
  notes?: string;
}

export type PaymentFilters = {
  status?: string | undefined;
  limit?: string | undefined;
  search?: string | undefined;
  page?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  propertyId?: string | undefined;
  paymentType?: string | undefined;
  includeSubscriptions?: boolean | undefined;
};

export interface IMpesaTransaction extends BaseDocument {
  memberId: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;

  // M-Pesa callback data
  merchantRequestID: string;
  checkoutRequestID: string;
  resultCode: number;
  resultDesc: string;
  amount: number;
  mpesaReceiptNumber?: string;
  transactionDate?: Date;
  phoneNumber: string;

  // Processing status
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

export interface IPaymentMethod extends BaseDocument {
  memberId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "mpesa" | "bank_transfer" | "cash" | "cheque" | "card";
  provider: string;
  details: {
    // M-Pesa specific
    mpesaTransactionId?: string;
    mpesaReceiptNumber?: string;
    mpesaPhoneNumber?: string;

    // Bank transfer specific
    bankReference?: string;
    bankName?: string;
    accountNumber?: string;

    // Cheque specific
    chequeNumber?: string;
    bankDrawn?: string;

    // Card specific
    cardLast4?: string;
    cardType?: string;
    expMonth?: number;
    expYear?: number;
    holderName?: string;

    // Cash specific
    receivedBy?: string;
    receiptNumber?: string;
  };

  isDefault: boolean;
  isActive: boolean;
  stripePaymentMethodId?: string;
}

export type WalletBalance = {
  available: number; // KES available for use
  pending: number; // KES in pending transactions
  reserved: number; // KES reserved for scheduled payments
  total: number; // Total balance
};

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: {
    available: number;
    pending: number;
    reserved: number;
    total: number;
  };
  currency: string;
  status: WalletStatus;
  dailyLimit: number;
  monthlyLimit: number;
  metadata: {
    lastTransactionAt?: Date;
    totalDeposited: number;
    totalWithdrawn: number;
    totalSpent: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  reference: string;
  description: string;
  metadata: {
    mpesaReceiptNumber?: string;
    mpesaTransactionId?: string;
    propertyId?: mongoose.Types.ObjectId;
    bookingId?: mongoose.Types.ObjectId;
    applicationId?: mongoose.Types.ObjectId;
    phoneNumber?: string;
    recipientWalletId?: mongoose.Types.ObjectId;
  };
  failureReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduledPayment extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  amount: number;
  frequency: "monthly" | "weekly";
  nextPaymentDate: Date;
  isActive: boolean;
  autoTopUp: boolean; // Auto deposit if insufficient balance
}
