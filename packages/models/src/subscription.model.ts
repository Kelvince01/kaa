import mongoose, { type Model, Schema } from "mongoose";
import type {
  IAppSubscription,
  IInvoice,
  ISubscription,
  ISubscriptionPlan,
  ITaxRate,
  IUsageBilling,
  IUsageRecord,
} from "./types/subscription.type";

const AppSubscriptionSchema: Schema<IAppSubscription> =
  new Schema<IAppSubscription>(
    {
      stripeSubscriptionId: {
        type: String,
        required: true,
        unique: true,
      },
      status: {
        type: String,
        required: true,
        enum: [
          "active",
          "past_due",
          "canceled",
          "incomplete",
          "incomplete_expired",
          "trialing",
          "unpaid",
        ],
        default: "active",
      },
      tenant: {
        type: Schema.Types.ObjectId,
        ref: "Tenant",
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
        required: true,
      },
      contract: {
        type: Schema.Types.ObjectId,
        ref: "Contract",
      },
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        required: true,
        default: "gbp",
      },
      interval: {
        type: String,
        required: true,
        enum: ["day", "week", "month", "year"],
        default: "month",
      },
      intervalCount: {
        type: Number,
        required: true,
        default: 1,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
      },
      nextBillingDate: {
        type: Date,
      },
      paymentMethod: {
        type: String,
      },
      metadata: {
        type: Map,
        of: Schema.Types.Mixed,
      },
      canceledAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

// Create indexes for faster queries
AppSubscriptionSchema.index({ tenant: 1 });
AppSubscriptionSchema.index({ landlord: 1 });
AppSubscriptionSchema.index({ property: 1 });
AppSubscriptionSchema.index({ status: 1 });
AppSubscriptionSchema.index({ nextBillingDate: 1 });

export const AppSubscription: Model<IAppSubscription> =
  mongoose.model<IAppSubscription>("AppSubscription", AppSubscriptionSchema);

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "suspended",
        "canceled",
        "trial",
        "past_due",
        "incomplete",
      ],
      required: true,
      default: "trial",
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
    canceledAt: {
      type: Date,
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: true,
    },
    billing: {
      amount: {
        type: Number,
        required: true,
        default: 0,
      },
      currency: {
        type: String,
        default: "usd",
      },
      interval: {
        type: String,
        enum: ["monthly", "yearly"],
        default: "monthly",
      },
      intervalCount: {
        type: Number,
        required: true,
        default: 1,
      },
      nextBillingDate: {
        type: Date,
        required: true,
      },
    },
    usage: {
      requests: {
        type: Number,
        default: 0,
      },
      storage: {
        type: Number,
        default: 0,
      },
      users: {
        type: Number,
        default: 0,
      },
      resetDate: {
        type: Date,
        default: () => {
          const date = new Date();
          date.setMonth(date.getMonth() + 1, 1); // First day of next month
          date.setHours(0, 0, 0, 0);
          return date;
        },
      },
    },
    quota: {
      requests: {
        type: Number,
        required: true,
      },
      storage: {
        type: Number,
        required: true,
      },
      users: {
        type: Number,
        required: true,
      },
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
subscriptionSchema.index({ userId: 1 }, { unique: true });
subscriptionSchema.index({ memberId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true });

// Virtual for days remaining
subscriptionSchema.virtual("daysRemaining").get(function (this: ISubscription) {
  const now = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for usage percentage
subscriptionSchema.virtual("usagePercentage").get(function (
  this: ISubscription
) {
  return {
    requests:
      this.quota.requests > 0
        ? (this.usage.requests / this.quota.requests) * 100
        : 0,
    storage:
      this.quota.storage > 0
        ? (this.usage.storage / this.quota.storage) * 100
        : 0,
    users:
      this.quota.users > 0 ? (this.usage.users / this.quota.users) * 100 : 0,
  };
});

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema
);

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      monthly: {
        type: Number,
        required: true,
      },
      yearly: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        required: true,
        default: "usd",
      },
      interval: {
        type: String,
        required: true,
        enum: ["monthly", "yearly"],
        default: "monthly",
      },
    },
    features: {
      type: [String],
      required: true,
    },
    quota: {
      requests: {
        type: Number,
        required: true,
      },
      storage: {
        type: Number,
        required: true,
      },
      users: {
        type: Number,
        required: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripePriceIds: {
      monthly: String,
      yearly: String,
    },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  "SubscriptionPlan",
  subscriptionPlanSchema
);

const usageRecordSchema = new Schema<IUsageRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "UserSubscription",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "requests",
        "storage",
        "users",
        "api_call",
        "storage",
        "bandwidth",
        "user_seat",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
usageRecordSchema.index({ userId: 1, type: 1, recordedAt: -1 });
usageRecordSchema.index({ subscriptionId: 1, recordedAt: -1 });

export const UsageRecord = mongoose.model<IUsageRecord>(
  "UsageRecord",
  usageRecordSchema
);

const invoiceSchema = new Schema<IInvoice>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "usd",
    },
    status: {
      type: String,
      enum: ["paid", "open", "void", "uncollectible"],
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    stripeInvoiceId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
invoiceSchema.index({ memberId: 1 });
invoiceSchema.index({ subscriptionId: 1 });

export const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);

const usageBillingSchema = new Schema<IUsageBilling>(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "UserSubscription",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    billingPeriod: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },
    usage: [
      {
        type: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        rate: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "usd",
    },
    status: {
      type: String,
      enum: ["pending", "processed", "paid", "failed"],
      default: "pending",
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
  },
  {
    timestamps: true,
  }
);

export const UsageBilling = mongoose.model<IUsageBilling>(
  "UsageBilling",
  usageBillingSchema
);

const taxRateSchema = new Schema<ITaxRate>(
  {
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
    },
    rate: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TaxRate = mongoose.model<ITaxRate>("TaxRate", taxRateSchema);
