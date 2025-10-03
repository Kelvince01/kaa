import type {
  PlanComparison,
  PlanInterval,
  PlanType,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from "./subscriptions.type";

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);
}

/**
 * Format currency amount as integer (without decimals)
 */
export function formatCurrencyInteger(
  amount: number,
  currency = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

/**
 * Get price for specific interval
 */
export function getPlanPrice(
  plan: SubscriptionPlan,
  interval: PlanInterval
): number {
  return interval === "monthly" ? plan.price.monthly : plan.price.yearly;
}

/**
 * Calculate monthly price from yearly
 */
export function getMonthlyPrice(yearlyPrice: number): number {
  return Math.round(yearlyPrice / 12);
}

/**
 * Calculate annual savings
 */
export function getAnnualSavings(plan: SubscriptionPlan): number {
  const monthlyTotal = plan.price.monthly * 12;
  return monthlyTotal - plan.price.yearly;
}

/**
 * Calculate savings percentage
 */
export function getSavingsPercentage(plan: SubscriptionPlan): number {
  const monthlyTotal = plan.price.monthly * 12;
  const savings = getAnnualSavings(plan);
  return Math.round((savings / monthlyTotal) * 100);
}

/**
 * Check if plan is free
 */
export function isFreeplan(plan: SubscriptionPlan): boolean {
  return (
    plan.type === "free" ||
    (plan.price.monthly === 0 && plan.price.yearly === 0)
  );
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(planType: PlanType): string {
  const names: Record<PlanType, string> = {
    free: "Free",
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };
  return names[planType] || planType;
}

/**
 * Get subscription status display info
 */
export function getSubscriptionStatusInfo(status: SubscriptionStatus): {
  label: string;
  color: "success" | "warning" | "error" | "info";
  description: string;
} {
  switch (status) {
    case "active":
      return {
        label: "Active",
        color: "success",
        description:
          "Your subscription is active and all features are available.",
      };
    case "trialing":
      return {
        label: "Trial",
        color: "info",
        description: "You're currently in your free trial period.",
      };
    case "past_due":
      return {
        label: "Past Due",
        color: "warning",
        description: "Payment is overdue. Please update your payment method.",
      };
    case "canceled":
      return {
        label: "Canceled",
        color: "error",
        description: "Your subscription has been canceled.",
      };
    case "incomplete":
      return {
        label: "Incomplete",
        color: "warning",
        description: "Payment is required to complete your subscription.",
      };
    default:
      return {
        label: "Unknown",
        color: "error",
        description: "Unknown subscription status.",
      };
  }
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription?: Subscription): boolean {
  return (
    subscription?.status === "active" || subscription?.status === "trialing"
  );
}

/**
 * Check if subscription needs payment
 */
export function subscriptionNeedsPayment(subscription?: Subscription): boolean {
  return (
    subscription?.status === "past_due" || subscription?.status === "incomplete"
  );
}

/**
 * Get days until trial ends
 */
export function getDaysUntilTrialEnd(
  subscription?: Subscription
): number | null {
  if (!subscription?.trialEndsAt) return null;

  const trialEnd = new Date(subscription.trialEndsAt);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if trial is expiring soon (within 7 days)
 */
export function isTrialExpiringSoon(subscription?: Subscription): boolean {
  const daysLeft = getDaysUntilTrialEnd(subscription);
  return daysLeft !== null && daysLeft <= 7;
}

/**
 * Get next billing date
 */
export function getNextBillingDate(subscription?: Subscription): Date | null {
  if (!subscription?.endDate) return null;
  return new Date(subscription.endDate);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

/**
 * Format date as relative time
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

/**
 * Get plan by type
 */
export function getPlanByType(
  plans: SubscriptionPlan[],
  type: PlanType
): SubscriptionPlan | undefined {
  return plans.find((plan) => plan.type === type);
}

/**
 * Sort plans by price (ascending)
 */
export function sortPlansByPrice(
  plans: SubscriptionPlan[],
  interval: PlanInterval = "monthly"
): SubscriptionPlan[] {
  return [...plans].sort(
    (a, b) => getPlanPrice(a, interval) - getPlanPrice(b, interval)
  );
}

/**
 * Get recommended plan (usually the popular one or middle tier)
 */
export function getRecommendedPlan(
  plans: SubscriptionPlan[]
): SubscriptionPlan | undefined {
  // First try to find a plan marked as popular
  const popularPlan = plans.find((plan) => plan.isPopular);
  if (popularPlan) return popularPlan;

  // Otherwise return professional plan if available
  const professionalPlan = plans.find((plan) => plan.type === "professional");
  if (professionalPlan) return professionalPlan;

  // Fall back to starter plan
  return plans.find((plan) => plan.type === "starter");
}

/**
 * Check if plan has specific feature
 */
export function planHasFeature(
  plan: SubscriptionPlan,
  feature: string
): boolean {
  return plan.features.includes(feature);
}

/**
 * Get feature limit for plan
 */
export function getFeatureLimit(
  plan: SubscriptionPlan,
  feature: keyof SubscriptionPlan["limits"]
): number | undefined {
  return plan.limits[feature] as number | undefined;
}

/**
 * Compare two plans
 */
export function comparePlans(
  planA: SubscriptionPlan,
  planB: SubscriptionPlan,
  interval: PlanInterval = "monthly"
): number {
  const priceA = getPlanPrice(planA, interval);
  const priceB = getPlanPrice(planB, interval);

  if (priceA === priceB) {
    // If prices are equal, sort by plan hierarchy
    const hierarchy: PlanType[] = [
      "free",
      "starter",
      "professional",
      "enterprise",
    ];
    return hierarchy.indexOf(planA.type) - hierarchy.indexOf(planB.type);
  }

  return priceA - priceB;
}

/**
 * Generate plan comparison data
 */
export function generatePlanComparison(
  plans: SubscriptionPlan[]
): PlanComparison[] {
  const allFeatures = new Set<string>();

  // Collect all unique features
  for (const plan of plans) {
    for (const feature of plan.features) {
      allFeatures.add(feature);
    }
  }

  // Create comparison data
  return Array.from(allFeatures).map((feature) => {
    const comparison: PlanComparison = {
      feature,
      free: false,
      starter: false,
      professional: false,
      enterprise: false,
    };

    for (const plan of plans) {
      if (plan.features.includes(feature)) {
        comparison[plan.type as keyof PlanComparison] =
          true as unknown as string;
      }
    }

    return comparison;
  });
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercentage(used: number, limit?: number): number {
  if (!limit || limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Get usage status color
 */
export function getUsageStatusColor(
  percentage: number
): "success" | "warning" | "error" {
  if (percentage >= 90) return "error";
  if (percentage >= 75) return "warning";
  return "success";
}
