import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export type IAppSubscription = BaseDocument & {
  stripeSubscriptionId: string;
  status: string;
  tenant: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  contract?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  paymentMethod?: string;
  metadata?: Record<string, any>;
  canceledAt?: Date;
};

export type ISubscription = BaseDocument & {
  userId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  status: string;
  startDate: Date;
  endDate: Date;
  trialEndsAt: Date | null;
  canceledAt: Date | null;
  autoRenew: boolean;
  paymentMethod: mongoose.Types.ObjectId;
  billing: {
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
    nextBillingDate: Date;
  };
  usage: {
    requests: number;
    storage: number;
    users: number;
    resetDate: Date;
  };
  quota: {
    requests: number;
    storage: number;
    users: number;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  metadata?: Record<string, any>;
};

export type ISubscriptionPlan = BaseDocument & {
  name: string;
  displayName: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
    interval: string;
  };
  features: string[];
  quota: {
    requests: number;
    storage: number;
    users: number;
  };
  isActive: boolean;
  stripePriceIds: {
    monthly?: string;
    yearly?: string;
  };
};

export type IUsageRecord = BaseDocument & {
  userId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  type: "api_call" | "storage" | "bandwidth" | "user_seat";
  amount: number;
  metadata: Record<string, any>;
  timestamp: Date;
  recordedAt: Date;
};

type IInvoiceLineItem = {
  description: string;
  amount: number;
  quantity: number;
  proration?: boolean;
};

type IPaymentMethodInfo = {
  type: "mpesa" | "airtel" | "card" | "bank";
  provider: string;
  identifier: string; // phone number or card token
  verified: boolean;
  default: boolean;
};

type IPaymentAttempt = {
  id: string;
  amount: number;
  method: IPaymentMethodInfo;
  status: "pending" | "succeeded" | "failed";
  failureReason?: string;
  attemptedAt: Date;
  completedAt?: Date;
  transactionId?: string;
};

export type IInvoice = BaseDocument & {
  memberId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  number: string;
  amount: number;
  currency: string;
  status: "draft" | "pending" | "paid" | "failed" | "voided";
  invoiceDate: Date;
  dueDate: Date;
  paidAt: Date | null;
  stripeInvoiceId: string;
  items: IInvoiceLineItem[];
  paymentAttempts: IPaymentAttempt[];
  downloadUrl?: string;
};

export type IUsageBilling = BaseDocument & {
  subscriptionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  usage: {
    type: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  totalAmount: number;
  currency: string;
  status: string;
  invoiceId?: mongoose.Types.ObjectId;
};

export type ITaxRate = Document & {
  country: string;
  state?: string;
  rate: number;
  isActive: boolean;
};
