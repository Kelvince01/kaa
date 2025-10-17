import mongoose, { Schema } from "mongoose";
import {
  type IMpesaTransaction,
  type IPayment,
  type IPaymentMethod,
  type IRecurringPayment,
  type IWallet,
  type IWalletTransaction,
  PaymentRecurrenceFrequency,
  PaymentStatus,
  RecurringPaymentStatus,
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from "./types/payment.type";

const PaymentSchema: Schema<IPayment> = new Schema<IPayment>(
  {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "KES",
    },
    status: {
      type: String,
      required: true,
      enum: [
        PaymentStatus.PENDING,
        PaymentStatus.PROCESSING,
        PaymentStatus.COMPLETED,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
        PaymentStatus.REFUNDED,
        PaymentStatus.PARTIALLY_REFUNDED,
      ],
      default: PaymentStatus.PENDING,
    },
    type: {
      type: String,
      required: true,
      enum: ["rent", "deposit", "holding_deposit", "fee", "other"],
    },
    dueDate: { type: Date, required: true },
    paidDate: Date,
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeChargeId: {
      type: String,
    },
    description: {
      type: String,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "Landlord",
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    contract: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
    },
    receiptUrl: {
      type: String,
    },
    refunded: {
      type: Boolean,
      default: false,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundId: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    referenceNumber: {
      type: String,
      unique: true,
    },
    completedAt: {
      type: Date,
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    notes: {
      type: String,
    },
    failureReason: {
      type: String,
    },
    latePayment: {
      isLate: { type: Boolean, default: false },
      daysLate: { type: Number, default: 0 },
      penaltyAmount: { type: Number, default: 0 },
      penaltyApplied: { type: Boolean, default: false },
    },

    reconciliation: {
      reconciled: { type: Boolean, default: false },
      reconciledDate: Date,
      reconciledBy: { type: Schema.Types.ObjectId, ref: "User" },
      discrepancy: {
        expectedAmount: Number,
        actualAmount: Number,
        reason: String,
      },
    },

    reminders: [
      {
        type: { type: String, enum: ["sms", "email", "whatsapp", "call"] },
        sentDate: { type: Date, required: true },
        status: { type: String, enum: ["sent", "delivered", "failed"] },
        response: String,
      },
    ],

    partialPayments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, required: true },
        method: { type: String, required: true },
        reference: { type: String, required: true },
        status: { type: String, enum: ["completed", "pending", "failed"] },
      },
    ],

    aiInsights: {
      paymentProbability: { type: Number, default: 0 },
      riskScore: { type: Number, default: 0 },
      recommendedAction: { type: String, default: "" },
      predictedPaymentDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
PaymentSchema.index({ tenant: 1, createdAt: -1 });
PaymentSchema.index({ landlord: 1, createdAt: -1 });
PaymentSchema.index({ property: 1, createdAt: -1 });
// PaymentSchema.index({ paymentIntentId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentType: 1 });

const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);

const RecurringPaymentSchema = new Schema<IRecurringPayment>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    contract: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },

    // Payment details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "KES",
    },
    paymentType: {
      type: String,
      enum: ["rent", "utilities", "service_charge", "maintenance"],
      default: "rent",
    },
    description: {
      type: String,
      required: true,
    },

    // Recurrence settings
    frequency: {
      type: String,
      enum: Object.values(PaymentRecurrenceFrequency),
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    nextPaymentDate: {
      type: Date,
      required: true,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
    },

    // Status and tracking
    status: {
      type: String,
      enum: Object.values(RecurringPaymentStatus),
      default: RecurringPaymentStatus.ACTIVE,
    },
    totalPayments: {
      type: Number,
      default: 0,
    },
    successfulPayments: {
      type: Number,
      default: 0,
    },
    failedPayments: {
      type: Number,
      default: 0,
    },
    lastPaymentDate: Date,
    lastPaymentStatus: String,

    // Payment method
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: true,
    },
    autoRetry: {
      type: Boolean,
      default: true,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    retryInterval: {
      type: Number,
      default: 24, // hours
    },

    // Notifications
    notifyBeforeDays: {
      type: Number,
      default: 3,
    },
    notifyOnFailure: {
      type: Boolean,
      default: true,
    },
    notifyOnSuccess: {
      type: Boolean,
      default: true,
    },

    // Grace period and late fees
    gracePeriodDays: {
      type: Number,
      default: 5,
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
    },
    lateFeePercentage: {
      type: Number,
      default: 0,
    },
    applyLateFeeAfterDays: {
      type: Number,
      default: 7,
    },

    // Generated payments
    generatedPayments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],

    // Metadata
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
RecurringPaymentSchema.index({ tenant: 1, status: 1 });
RecurringPaymentSchema.index({ landlord: 1, status: 1 });
RecurringPaymentSchema.index({ property: 1, status: 1 });
RecurringPaymentSchema.index({ nextPaymentDate: 1, status: 1 });
RecurringPaymentSchema.index({ status: 1, nextPaymentDate: 1 });

export const RecurringPayment = mongoose.model<IRecurringPayment>(
  "RecurringPayment",
  RecurringPaymentSchema
);

const mpesaTransactionSchema = new Schema<IMpesaTransaction>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },

    merchantRequestID: { type: String, required: true },
    checkoutRequestID: { type: String, required: true },
    resultCode: { type: Number, required: true },
    resultDesc: { type: String, required: true },
    amount: { type: Number, required: true },
    mpesaReceiptNumber: String,
    transactionDate: Date,
    phoneNumber: { type: String, required: true },

    processed: { type: Boolean, default: false },
    processedAt: Date,
    error: String,
  },
  { timestamps: true }
);

mpesaTransactionSchema.index({ checkoutRequestID: 1 }, { unique: true });
mpesaTransactionSchema.index({ mpesaReceiptNumber: 1 });
mpesaTransactionSchema.index({ processed: 1 });

const MpesaTransaction = mongoose.model<IMpesaTransaction>(
  "MpesaTransaction",
  mpesaTransactionSchema
);

const PaymentMethodSchema: Schema<IPaymentMethod> = new Schema<IPaymentMethod>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["card", "bank_account", "mpesa", "cash", "cheque", "paypal"],
    },
    provider: {
      type: String,
      enum: ["stripe", "paypal", "flutterwave", "mpesa", "bank_transfer"],
    },
    details: {
      mpesaTransactionId: String,
      mpesaReceiptNumber: String,
      mpesaPhoneNumber: String,

      bankReference: String,
      bankName: String,
      accountNumber: String,
      chequeNumber: String,
      bankDrawn: String,

      cardLast4: String,
      cardType: String,
      expMonth: {
        type: Number,
        required() {
          return this.type === "card";
        },
      },
      expYear: {
        type: Number,
        required() {
          return this.type === "card";
        },
      },
      holderName: {
        type: String,
        required() {
          return this.type === "card";
        },
      },

      receivedBy: String,
      receiptNumber: String,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    stripePaymentMethodId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one default payment method
PaymentMethodSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.model("PaymentMethod").updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const PaymentMethod = mongoose.model<IPaymentMethod>(
  "PaymentMethod",
  PaymentMethodSchema
);

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      available: { type: Number, default: 0, min: 0 },
      pending: { type: Number, default: 0, min: 0 },
      reserved: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
    },
    currency: {
      type: String,
      default: "KES",
      enum: ["KES"],
    },
    status: {
      type: String,
      enum: Object.values(WalletStatus),
      default: WalletStatus.ACTIVE,
    },
    dailyLimit: {
      type: Number,
      default: 500_000, // KES 500,000
    },
    monthlyLimit: {
      type: Number,
      default: 5_000_000, // KES 5,000,000
    },
    metadata: {
      lastTransactionAt: Date,
      totalDeposited: { type: Number, default: 0 },
      totalWithdrawn: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for queries
WalletSchema.index({ userId: 1, status: 1 });
WalletSchema.index({ "balance.available": 1 });

const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      mpesaReceiptNumber: String,
      mpesaTransactionId: String,
      propertyId: Schema.Types.ObjectId,
      bookingId: Schema.Types.ObjectId,
      applicationId: Schema.Types.ObjectId,
      phoneNumber: String,
      recipientWalletId: Schema.Types.ObjectId,
    },
    failureReason: String,
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ walletId: 1, status: 1 });
WalletTransactionSchema.index({ type: 1, status: 1 });
WalletTransactionSchema.index({ "metadata.mpesaReceiptNumber": 1 });

const WalletTransaction = mongoose.model<IWalletTransaction>(
  "WalletTransaction",
  WalletTransactionSchema
);

export { Payment, MpesaTransaction, PaymentMethod, Wallet, WalletTransaction };
