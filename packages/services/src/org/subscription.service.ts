import {
  AppSubscription,
  Member,
  Subscription,
  SubscriptionPlan,
  UsageRecord,
  User,
} from "@kaa/models";
import type { ISubscriptionPlan } from "@kaa/models/types";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  logger,
  NotFoundError,
  stripeClient,
} from "@kaa/utils";
import mongoose, { type Types } from "mongoose";

// Plan definitions
const plans = {
  free: {
    price: 0,
    features: ["Basic access", "Limited users", "Community support"],
  },
  starter: {
    price: 19.99,
    features: ["Everything in Free", "Up to 10 users", "Email support"],
  },
  professional: {
    price: 49.99,
    features: ["Everything in Starter", "Up to 50 users", "Priority support"],
  },
  enterprise: {
    price: 199.99,
    features: [
      "Everything in Professional",
      "Unlimited users",
      "Dedicated support",
    ],
  },
};

// Subscription plan definitions
const defaultPlans = {
  free: {
    name: "free",
    displayName: "Free",
    description: "Perfect for getting started",
    price: { monthly: 0, yearly: 0 },
    features: [
      "1,000 API requests/month",
      "100MB storage",
      "1 user",
      "Community support",
    ],
    quota: { requests: 1000, storage: 100, users: 1 },
  },
  basic: {
    name: "basic",
    displayName: "Basic",
    description: "Great for small teams",
    price: { monthly: 9.99, yearly: 99.99 },
    features: [
      "10,000 API requests/month",
      "1GB storage",
      "5 users",
      "Email support",
    ],
    quota: { requests: 10_000, storage: 1024, users: 5 },
  },
  premium: {
    name: "premium",
    displayName: "Premium",
    description: "Perfect for growing businesses",
    price: { monthly: 29.99, yearly: 299.99 },
    features: [
      "100,000 API requests/month",
      "10GB storage",
      "25 users",
      "Priority support",
    ],
    quota: { requests: 100_000, storage: 10_240, users: 25 },
  },
  enterprise: {
    name: "enterprise",
    displayName: "Enterprise",
    description: "For large organizations",
    price: { monthly: 99.99, yearly: 999.99 },
    features: [
      "Unlimited API requests",
      "100GB storage",
      "Unlimited users",
      "24/7 phone support",
    ],
    quota: { requests: -1, storage: 102_400, users: -1 }, // -1 means unlimited
  },
};

export const subscriptionService = {
  /**
   * Get all subscription plans
   */
  getPlans: async () => {
    let plans = await SubscriptionPlan.find({ isActive: true }).sort({
      "price.monthly": 1,
    });

    // If no plans exist, create default ones
    if (plans.length === 0) {
      plans = (await createDefaultPlans()) as any;
    }

    return plans;
  },

  /**
   * Get subscription for tenant
   */
  getSubscription: async (userId: string, memberId: string) => {
    let subscription = await Subscription.findOne({ memberId }).populate(
      "plan",
      "name"
    );

    // If no subscription exists, create a free trial
    if (!subscription) {
      // throw new NotFoundError("No subscription found for this tenant");
      subscription = await createDefaultSubscription(userId, memberId);
    }

    return {
      subscription,
      plan: plans[(subscription.plan as any).name as keyof typeof plans],
    };
  },

  /**
   * Get user's subscription
   */
  getAppSubscription: async (userId: string, memberId: string) => {
    const subscription = await AppSubscription.findOne({
      userId,
      memberId,
    }).populate("userId", "firstName lastName email");

    return subscription;
  },

  /**
   * Create or update user subscription
   */
  createSubscription: async (
    userId: string,
    memberId: string,
    data: {
      plan: string;
      interval: string;
      paymentMethodId?: string;
    }
  ) => {
    // Get plan details
    const plan = await SubscriptionPlan.findOne({
      name: data.plan,
      isActive: true,
    });
    if (!plan) {
      throw new NotFoundError("Subscription plan not found");
    }

    // Check if tenant exists
    const tenant = await Member.findById(memberId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    // Check if user exists
    const user = await User.findOne({ _id: userId, memberId });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ memberId });
    if (existingSubscription) {
      throw new ConflictError("Subscription already exists for this tenant");
    }

    // Calculate billing details
    const amount =
      data.interval === "yearly" ? plan.price.yearly : plan.price.monthly;
    const nextBillingDate = new Date();
    if (data.interval === "yearly") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    // Calculate end date
    const endDate = new Date(nextBillingDate);

    try {
      // Find existing subscription or create new one
      let subscription = await Subscription.findOne({ userId, memberId });

      if (subscription) {
        // Update existing subscription
        subscription.plan = mongoose.Types.ObjectId.createFromHexString(
          data.plan
        );
        subscription.status = "active";
        subscription.endDate = endDate;
        subscription.billing = {
          amount,
          currency: "usd",
          interval: data.interval,
          nextBillingDate,
          intervalCount: 1,
        };
        subscription.quota = plan.quota;
        subscription.autoRenew = true;
        subscription.canceledAt = null;

        await subscription.save();
      } else {
        // Create Stripe customer
        const customer = await stripeClient.customers.create({
          name: tenant.name,
          metadata: {
            memberId: memberId.toString(),
          },
        });

        // Set trial period (30 days for new subscriptions)
        const trialEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

        // Create Stripe subscription
        const stripeSubscription = await stripeClient.subscriptions.create({
          customer: customer.id,
          items: [
            {
              price: data.plan, // This would be a Stripe price ID in production
            },
          ],
          trial_end: trialEnd,
          metadata: {
            memberId: memberId.toString(),
          },
        });

        // Create new subscription
        subscription = await Subscription.create({
          userId,
          memberId,
          plan: data.plan,
          status: "active", // stripeSubscription.status
          // startDate: new Date(),
          // endDate,

          // startDate: new Date(stripeSubscription.current_period_start * 1000),
          // endDate: new Date(stripeSubscription.current_period_end * 1000),
          startDate: new Date(stripeSubscription.start_date * 1000),
          endDate: stripeSubscription?.ended_at
            ? new Date(stripeSubscription.ended_at * 1000)
            : undefined,
          trialEndsAt: new Date(trialEnd * 1000),
          stripeCustomerId: customer.id,
          stripeSubscriptionId: stripeSubscription.id,

          billing: {
            amount,
            currency: "usd",
            interval: data.interval,
            nextBillingDate,
          },
          quota: plan.quota,
          autoRenew: true,
        });
      }

      // Update tenant plan
      await Member.findByIdAndUpdate(memberId, { plan: data.plan });

      // Reset usage for new billing period
      await resetUsage((subscription._id as Types.ObjectId).toString());

      logger.info(`Subscription created/updated for user: ${userId}`);

      return {
        subscription,
        plan: plans[data.plan as keyof typeof plans],
      };
    } catch (error) {
      logger.error("Error creating subscription", error);
      throw new InternalServerError("Failed to create subscription");
    }
  },

  /**
   * Cancel user subscription
   */
  cancelSubscription: async (
    userId: string,
    memberId: string,
    immediate = false
  ) => {
    const subscription = await Subscription.findOne({ userId, memberId });

    if (!subscription) {
      throw new NotFoundError("No subscription found");
    }

    if (subscription.status === "canceled") {
      throw new BadRequestError("Subscription is already canceled");
    }

    try {
      // Cancel Stripe subscription
      await stripeClient.subscriptions.cancel(
        subscription.stripeSubscriptionId ?? "",
        {
          // cancel_at_period_end: true,
        }
      );

      if (immediate) {
        // Cancel immediately
        subscription.status = "canceled";
        subscription.canceledAt = new Date();
        subscription.endDate = new Date();
      } else {
        // Cancel at end of billing period
        subscription.autoRenew = false;
        subscription.canceledAt = new Date();
      }

      await subscription.save();

      // Update tenant plan to free
      await Member.findByIdAndUpdate(memberId, { plan: "free" });

      logger.info(`Subscription canceled for user: ${userId}`);

      return subscription;
    } catch (error) {
      logger.error("Error canceling subscription", error);
      throw new InternalServerError("Failed to cancel subscription");
    }
  },

  /**
   * Track usage
   */
  trackUsage: async (
    userId: string,
    memberId: string,
    type: "requests" | "storage" | "users",
    amount: number,
    metadata: Record<string, any> = {}
  ) => {
    try {
      const subscription = await Subscription.findOne({ userId, memberId });

      if (!subscription) {
        // Create default subscription if none exists
        await createDefaultSubscription(userId, memberId);
        return;
      }

      // Check if usage reset is needed
      const now = new Date();
      if (now >= subscription.usage.resetDate) {
        await resetUsage((subscription._id as Types.ObjectId).toString());
        // Reload subscription after reset
        // await subscription.reload();
      }

      // Check quota limits (skip if unlimited)
      const quota = subscription.quota[type];
      if (quota !== -1 && subscription.usage[type] + amount > quota) {
        throw new ForbiddenError(`${type} quota exceeded`);
      }

      // Update usage
      subscription.usage[type] += amount;
      await subscription.save();

      // Record usage for analytics
      await UsageRecord.create({
        userId,
        memberId,
        subscriptionId: subscription._id,
        type,
        amount,
        metadata,
      });

      return subscription.usage;
    } catch (error) {
      if (error instanceof Error && error.message.includes("quota exceeded")) {
        throw error;
      }
      logger.error("Error tracking usage", error);
      // Don't throw error for usage tracking to avoid breaking main functionality
      return null;
    }
  },

  /**
   * Get usage statistics
   */
  getUsageStats: async (userId: string, memberId: string, query: any = {}) => {
    const { startDate, endDate, type } = query;

    const subscription = await Subscription.findOne({ userId, memberId });

    if (!subscription) {
      throw new NotFoundError("No subscription found");
    }

    const filter: any = {
      userId,
      memberId,
      subscriptionId: subscription._id,
    };

    if (type) {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.recordedAt = {};
      if (startDate) filter.recordedAt.$gte = new Date(startDate);
      if (endDate) filter.recordedAt.$lte = new Date(endDate);
    }

    // Get usage records
    const usageRecords = await UsageRecord.find(filter)
      .sort({ recordedAt: -1 })
      .limit(100);

    // Get current usage and quota
    const currentUsage = subscription.usage;
    const quota = subscription.quota;
    const usagePercentage = {
      requests:
        quota.requests > 0 ? (currentUsage.requests / quota.requests) * 100 : 0,
      storage:
        quota.storage > 0 ? (currentUsage.storage / quota.storage) * 100 : 0,
      users: quota.users > 0 ? (currentUsage.users / quota.users) * 100 : 0,
    };

    return {
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (subscription.endDate.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        ),
      },
      usage: {
        current: currentUsage,
        quota,
        percentage: usagePercentage,
        resetDate: subscription.usage.resetDate,
      },
      history: usageRecords,
    };
  },

  /**
   * Upgrade/downgrade subscription
   */
  changeSubscription: async (
    userId: string,
    memberId: string,
    data: {
      plan: string;
      interval?: string;
    }
  ) => {
    const subscription = await Subscription.findOne({ userId, memberId });

    if (!subscription) {
      throw new NotFoundError("No subscription found");
    }

    // Get new plan details
    const newPlan = await SubscriptionPlan.findOne({
      name: data.plan,
      isActive: true,
    });
    if (!newPlan) {
      throw new NotFoundError("Subscription plan not found");
    }

    const oldPlan = subscription.plan;

    try {
      // Update Stripe subscription
      const stripeSubscription = await stripeClient.subscriptions.update(
        subscription.stripeSubscriptionId ?? "",
        {
          items: [
            {
              price: data.plan, // This would be a Stripe price ID in production
            },
          ],
          metadata: {
            memberId: memberId.toString(),
          },
        }
      );

      // Update subscription
      subscription.plan = mongoose.Types.ObjectId.createFromHexString(
        data.plan
      );
      // subscription.startDate = new Date(stripeSubscription.current_period_start * 1000);
      // subscription.endDate = new Date(stripeSubscription.current_period_end * 1000);
      subscription.startDate = new Date(stripeSubscription.start_date * 1000);
      subscription.endDate = new Date(
        (stripeSubscription?.ended_at as number) * 1000
      );
      subscription.quota = newPlan.quota;

      if (data.interval) {
        subscription.billing.interval = data.interval;
        subscription.billing.amount =
          data.interval === "yearly"
            ? newPlan.price.yearly
            : newPlan.price.monthly;
      }

      await subscription.save();

      // Update tenant plan
      await Member.findByIdAndUpdate(memberId, { plan: data.plan });

      // If downgrading, check if current usage exceeds new quota
      if (isDowngrade(oldPlan.toString(), newPlan.name)) {
        await handleDowngrade(subscription);
      }

      logger.info(
        `Subscription changed from ${oldPlan} to ${data.plan} for user: ${userId}`
      );

      return {
        subscription,
        plan: plans[data.plan as keyof typeof plans],
      };
    } catch (error) {
      logger.error("Error changing subscription", error);
      throw new InternalServerError("Failed to change subscription");
    }
  },

  /**
   * Process subscription renewals (for cron job)
   */
  processRenewals: async () => {
    const now = new Date();
    const subscriptions = await Subscription.find({
      status: "active",
      autoRenew: true,
      "billing.nextBillingDate": { $lte: now },
    });

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const subscription of subscriptions) {
      try {
        // Calculate next billing date
        const nextBillingDate = new Date(subscription.billing.nextBillingDate);
        if (subscription.billing.interval === "yearly") {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }

        // Update subscription
        subscription.billing.nextBillingDate = nextBillingDate;
        subscription.endDate = new Date(nextBillingDate);
        await subscription.save();

        // Reset usage for new billing period
        await resetUsage((subscription._id as Types.ObjectId).toString());

        results.processed++;
        logger.info(`Renewed subscription for user: ${subscription.userId}`);
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to renew subscription ${subscription._id}: ${(error as Error).message}`
        );
        logger.error(`Failed to renew subscription ${subscription._id}`, error);
      }
    }

    return results;
  },

  /**
   * Handle Stripe webhook
   */
  handleStripeWebhook: async (event: any) => {
    try {
      switch (event.type) {
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      logger.error("Error handling Stripe webhook", error);
      throw new InternalServerError("Failed to process webhook");
    }
  },
};

/**
 * Create default subscription plans
 */
async function createDefaultPlans() {
  const plans: ISubscriptionPlan[] = [];

  for (const [key, planData] of Object.entries(defaultPlans)) {
    const plan = await SubscriptionPlan.create({
      ...planData,
      isActive: true,
    });
    plans.push(plan);
  }

  logger.info("Created default subscription plans");
  return plans;
}

/**
 * Create default subscription for user
 */
async function createDefaultSubscription(userId: string, memberId: string) {
  const freePlan = await SubscriptionPlan.findOne({ name: "free" });

  if (!freePlan) {
    throw new InternalServerError("Free plan not found");
  }

  // Create 30-day trial
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const subscription = await Subscription.create({
    userId,
    memberId,
    plan: "free",
    status: "trial",
    startDate: new Date(),
    endDate,
    trialEndsAt: endDate,
    billing: {
      amount: 0,
      currency: "usd",
      interval: "monthly",
      nextBillingDate: endDate,
    },
    quota: freePlan.quota,
    autoRenew: false,
  });

  logger.info(`Created default subscription for user: ${userId}`);
  return subscription;
}

/**
 * Reset usage for new billing period
 */
async function resetUsage(subscriptionId: string) {
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1, 1);
  nextResetDate.setHours(0, 0, 0, 0);

  await Subscription.findByIdAndUpdate(subscriptionId, {
    "usage.requests": 0,
    "usage.storage": 0,
    "usage.users": 0,
    "usage.resetDate": nextResetDate,
  });
}

/**
 * Check if plan change is a downgrade
 */
function isDowngrade(oldPlan: string, newPlan: string): boolean {
  const planHierarchy = ["free", "basic", "premium", "enterprise"];
  const oldIndex = planHierarchy.indexOf(oldPlan);
  const newIndex = planHierarchy.indexOf(newPlan);
  return newIndex < oldIndex;
}

/**
 * Handle subscription downgrade
 */
function handleDowngrade(subscription: any) {
  const quota = subscription.quota;
  const usage = subscription.usage;

  // Check if current usage exceeds new quota
  const warnings: string[] = [];

  if (quota.requests !== -1 && usage.requests > quota.requests) {
    warnings.push(
      `API requests usage (${usage.requests}) exceeds new quota (${quota.requests})`
    );
  }

  if (quota.storage !== -1 && usage.storage > quota.storage) {
    warnings.push(
      `Storage usage (${usage.storage}MB) exceeds new quota (${quota.storage}MB)`
    );
  }

  if (quota.users !== -1 && usage.users > quota.users) {
    warnings.push(
      `User count (${usage.users}) exceeds new quota (${quota.users})`
    );
  }

  if (warnings.length > 0) {
    logger.warn(
      `Downgrade warnings for subscription ${subscription._id}:`,
      warnings
    );
    // In a real application, you might want to send an email notification
    // or temporarily suspend certain features until usage is reduced
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(stripeSubscription: any) {
  try {
    // Find subscription by Stripe subscription ID
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (!subscription) {
      logger.error("Subscription not found", {
        subscriptionId: stripeSubscription.id,
      });
      return;
    }

    // Update subscription status
    subscription.status = stripeSubscription.status;
    subscription.startDate = new Date(
      stripeSubscription.current_period_start * 1000
    );
    subscription.endDate = new Date(
      stripeSubscription.current_period_end * 1000
    );

    if (stripeSubscription.trial_end) {
      subscription.trialEndsAt = new Date(stripeSubscription.trial_end * 1000);
    }

    await subscription.save();

    logger.info(`Subscription updated: ${stripeSubscription.id}`);
  } catch (error) {
    logger.error("Error handling subscription updated event", error);
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(stripeSubscription: any) {
  try {
    // Find subscription by Stripe subscription ID
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (!subscription) {
      logger.error("Subscription not found", {
        subscriptionId: stripeSubscription.id,
      });
      return;
    }

    // Update subscription status
    subscription.status = "canceled";
    subscription.canceledAt = new Date();
    await subscription.save();

    // Update tenant plan to free
    await Member.findByIdAndUpdate(subscription.memberId, { plan: "free" });

    logger.info(`Subscription canceled: ${stripeSubscription.id}`);
  } catch (error) {
    logger.error("Error handling subscription deleted event", error);
  }
}
