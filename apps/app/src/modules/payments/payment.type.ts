export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";
export type PaymentType = "rent" | "deposit" | "fee" | "subscription";

export type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  interval?: "month" | "week" | "year";
  paymentMethod: string;
  transactionId?: string;
  description?: string;
  tenant: string;
  landlord: string;
  property?: string;
  booking?: string;
  contract?: string;
  receiptUrl?: string;
  refunded?: boolean;
  refundAmount?: number;
  refundId?: string;
  paymentDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  paymentDetails?: any;
  notes?: string;
};

// Payment method types
export type PaymentMethodType = "mpesa" | "card" | "bank";

export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  phoneNumber?: string;
};

// MPesa specific types
export type MpesaPayment = Payment & {
  phoneNumber: string;
  businessShortCode: string;
  mpesaReceiptNumber?: string;
};

// Stripe specific types
export type StripePayment = Payment & {
  paymentIntentId: string;
  paymentMethodId: string;
  customerId: string;
  stripeChargeId?: string;
};

// Filter types
export type PaymentFilter = {
  status?: PaymentStatus;
  paymentType?: PaymentType;
  propertyId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

// Statistics types
export type PaymentTypeStats = {
  count: number;
  amount: number;
  amountFormatted: string;
};

export type MonthlyStats = {
  month: string;
  count: number;
  amount: number;
  amountFormatted: string;
};

export type PaymentStatistics = {
  totalAmount: number;
  totalAmountFormatted: string;
  totalPayments: number;
  averageAmount: number;
  averageAmountFormatted: string;
  byType: Record<PaymentType, PaymentTypeStats>;
  byMonth: MonthlyStats[];
};

export type PaymentResponse = {
  data: {
    clientSecret: string;
    amount: number;
    paymentIntentId: string;
    paymentId: string;
  };
  status: "success" | "error";
  message: string;
};

export type PaymentHistoryResponse = {
  payments: Payment[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
};
