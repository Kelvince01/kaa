export type PlanInterval = "monthly" | "yearly";
export type PlanType = "free" | "starter" | "professional" | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";
export type InvoiceStatus = "paid" | "open" | "void" | "uncollectible";

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  type: PlanType;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
    interval: PlanInterval;
  };
  features: string[];
  limits: {
    users?: number;
    storage?: number; // in GB
    apiCalls?: number;
    customFeatures?: Record<string, number>;
  };
  isPopular?: boolean;
  trialDays?: number;
  stripePriceId?: {
    monthly?: string;
    yearly?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type Subscription = {
  id: string;
  memberId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  trialEndsAt?: string;
  canceledAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  memberId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  paidAt?: string;
  stripeInvoiceId?: string;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethod = {
  id: string;
  type: string;
  provider: string;
  details: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    holderName?: string;
  };
  isDefault: boolean;
  isActive: boolean;
  stripePaymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
};

export type UsageRecord = {
  id: string;
  memberId: string;
  userId?: string;
  type: "api_call" | "storage" | "bandwidth" | "user_seat";
  amount: number;
  metadata?: Record<string, any>;
  timestamp: string;
  createdAt: string;
};

// Request/Response types
export type GetPlansResponse = {
  status: "success" | "error";
  plans?: SubscriptionPlan[];
  message?: string;
  error?: string;
};

export type GetSubscriptionResponse = {
  status: "success" | "error";
  subscription?: Subscription;
  message?: string;
  error?: string;
};

export type CreateSubscriptionRequest = {
  plan: PlanType;
  interval: PlanInterval;
  paymentMethodId?: string;
  trialDays?: number;
  couponCode?: string;
};

export type CreateSubscriptionResponse = {
  status: "success" | "error";
  subscription?: Subscription;
  clientSecret?: string; // For Stripe payment confirmation
  message?: string;
  error?: string;
};

export type UpdateSubscriptionRequest = {
  plan?: PlanType;
  interval?: PlanInterval;
  quantity?: number;
};

export type UpdateSubscriptionResponse = {
  status: "success" | "error";
  subscription?: Subscription;
  invoice?: Invoice;
  message?: string;
  error?: string;
};

export type GetInvoicesResponse = {
  status: "success" | "error";
  invoices?: Invoice[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
};

export type GetPaymentMethodsResponse = {
  status: "success" | "error";
  paymentMethods?: PaymentMethod[];
  message?: string;
  error?: string;
};

export type AddPaymentMethodRequest = {
  stripePaymentMethodId: string;
  setAsDefault?: boolean;
};

export type AddPaymentMethodResponse = {
  status: "success" | "error";
  paymentMethod?: PaymentMethod;
  message?: string;
  error?: string;
};

export type GetUsageResponse = {
  status: "success" | "error";
  usage?: {
    current: UsageRecord[];
    summary: {
      apiCalls: number;
      storage: number;
      bandwidth: number;
      users: number;
    };
    limits: {
      apiCalls?: number;
      storage?: number;
      bandwidth?: number;
      users?: number;
    };
  };
  message?: string;
  error?: string;
};

// UI types
export type PlanFeature = {
  name: string;
  included: boolean;
  limit?: number | string;
  description?: string;
};

export type PlanComparison = {
  feature: string;
  free: string | boolean | number;
  starter: string | boolean | number;
  professional: string | boolean | number;
  enterprise: string | boolean | number;
};
