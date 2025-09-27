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
