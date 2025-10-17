import {
  FeatureFlag,
  FeatureFlagEvaluation,
  Subscription,
  User,
} from "@kaa/models";
import { ConflictError, cacheService, logger, NotFoundError } from "@kaa/utils";

export const featureFlagService = {
  /**
   * Create feature flag
   */
  createFeatureFlag: async (data: {
    name: string;
    key: string;
    description?: string;
    isEnabled?: boolean;
    rolloutPercentage?: number;
    conditions?: any;
    variants?: any[];
  }) => {
    const existingFlag = await FeatureFlag.findOne({ key: data.key });

    if (existingFlag) {
      throw new ConflictError("Feature flag with this key already exists");
    }

    const flag = await FeatureFlag.create(data);

    // Clear cache
    cacheService.delete(`feature_flag:${data.key}`);

    return flag;
  },

  /**
   * Update feature flag
   */
  updateFeatureFlag: async (key: string, updates: any) => {
    const flag = await FeatureFlag.findOneAndUpdate({ key }, updates, {
      new: true,
    });

    if (!flag) {
      throw new NotFoundError("Feature flag not found");
    }

    // Clear cache
    cacheService.delete(`feature_flag:${key}`);

    return flag;
  },

  /**
   * Evaluate feature flag for user
   */
  evaluateFlag: async (
    flagKey: string,
    userId: string,
    memberId: string,
    context: Record<string, any> = {}
  ) => {
    // Try cache first
    const cacheKey = `flag_eval:${flagKey}:${userId}:${memberId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const flag = await getFeatureFlag(flagKey);

    if (!flag) {
      return { enabled: false, variant: null, value: null };
    }

    if (!flag.isEnabled) {
      return { enabled: false, variant: null, value: null };
    }

    // Get user and subscription data
    const [user, subscription] = await Promise.all([
      User.findById(userId),
      Subscription.findOne({ userId, tenantId: memberId }),
    ]);

    if (!user) {
      return { enabled: false, variant: null, value: null };
    }

    // Check conditions
    const enabled = await evaluateConditions(flag, user, subscription, context);

    if (!enabled) {
      return { enabled: false, variant: null, value: null };
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = hashString(`${flagKey}:${userId}`);
      const userPercentile = hash % 100;

      if (userPercentile >= flag.rolloutPercentage) {
        return { enabled: false, variant: null, value: null };
      }
    }

    // Determine variant
    let variant: string | null = null;
    let value = true;

    if (flag.variants && flag.variants.length > 0) {
      const hash = hashString(`${flagKey}:${userId}:variant`);
      const variantPercentile = hash % 100;

      let cumulativePercentage = 0;
      for (const v of flag.variants) {
        cumulativePercentage += v.percentage;
        if (variantPercentile < cumulativePercentage) {
          variant = v.name;
          value = v.value;
          break;
        }
      }
    }

    const result = { enabled: true, variant, value };

    // Cache result for 5 minutes
    cacheService.set(cacheKey, result, 300);

    // Log evaluation for analytics
    await FeatureFlagEvaluation.create({
      flagKey,
      userId,
      tenantId: memberId,
      enabled: true,
      variant,
      value,
    }).catch((error) => {
      logger.error("Failed to log feature flag evaluation", error);
    });

    return result;
  },

  /**
   * Get all feature flags
   */
  getAllFlags: async () => {
    const flags = await FeatureFlag.find().sort({ createdAt: -1 });
    return flags;
  },

  /**
   * Get feature flag by key
   */
  getFlag: async (key: string) => getFeatureFlag(key),

  /**
   * Delete feature flag
   */
  deleteFlag: async (key: string) => {
    const flag = await FeatureFlag.findOneAndDelete({ key });

    if (!flag) {
      throw new NotFoundError("Feature flag not found");
    }

    // Clear cache
    cacheService.delete(`feature_flag:${key}`);

    return { success: true };
  },

  /**
   * Get feature flag analytics
   */
  getFlagAnalytics: async (flagKey: string, query: any = {}) => {
    const { startDate, endDate } = query;

    const filter: any = { flagKey };

    if (startDate || endDate) {
      filter.evaluatedAt = {};
      if (startDate) filter.evaluatedAt.$gte = new Date(startDate);
      if (endDate) filter.evaluatedAt.$lte = new Date(endDate);
    }

    const [totalEvaluations, enabledEvaluations, variantStats] =
      await Promise.all([
        FeatureFlagEvaluation.countDocuments(filter),
        FeatureFlagEvaluation.countDocuments({ ...filter, enabled: true }),
        FeatureFlagEvaluation.aggregate([
          { $match: { ...filter, enabled: true } },
          { $group: { _id: "$variant", count: { $sum: 1 } } },
        ]),
      ]);

    return {
      totalEvaluations,
      enabledEvaluations,
      enabledPercentage:
        totalEvaluations > 0
          ? (enabledEvaluations / totalEvaluations) * 100
          : 0,
      variantDistribution: variantStats.reduce((acc, stat) => {
        acc[stat._id || "default"] = stat.count;
        return acc;
      }, {}),
    };
  },

  /**
   * Bulk evaluate flags for user
   */
  evaluateAllFlags: async (
    userId: string,
    tenantId: string,
    context: Record<string, any> = {}
  ) => {
    const flags = await FeatureFlag.find({ isEnabled: true });
    const results: Record<string, any> = {};

    await Promise.all(
      flags.map(async (flag) => {
        const result = await featureFlagService.evaluateFlag(
          flag.key,
          userId,
          tenantId,
          context
        );
        results[flag.key] = result;
      })
    );

    return results;
  },
};

/**
 * Get feature flag with caching
 */
async function getFeatureFlag(key: string) {
  const cacheKey = `feature_flag:${key}`;
  let flag = cacheService.get(cacheKey);

  if (!flag) {
    flag = await FeatureFlag.findOne({ key });
    if (flag) {
      cacheService.set(cacheKey, flag, 600); // Cache for 10 minutes
    }
  }

  return flag;
}

/**
 * Evaluate feature flag conditions
 */
function evaluateConditions(
  flag: any,
  user: any,
  subscription: any,
  context: Record<string, any>
): boolean {
  const conditions = flag.conditions;

  if (!conditions) return true;

  // Check user IDs
  if (
    conditions.userIds &&
    conditions.userIds.length > 0 &&
    !conditions.userIds.includes(user._id.toString())
  ) {
    return false;
  }

  // Check tenant IDs
  if (
    conditions.tenantIds &&
    conditions.tenantIds.length > 0 &&
    !conditions.tenantIds.includes(user.tenantId.toString())
  ) {
    return false;
  }

  // Check user roles
  if (
    conditions.roles &&
    conditions.roles.length > 0 &&
    !conditions.roles.includes(user.role)
  ) {
    return false;
  }

  // Check subscription plans
  if (
    conditions.plans &&
    conditions.plans.length > 0 &&
    !(subscription && conditions.plans.includes(subscription.plan))
  ) {
    return false;
  }

  // Check countries
  if (conditions.countries && conditions.countries.length > 0) {
    const userCountry = context.country || user.country;
    if (!(userCountry && conditions.countries.includes(userCountry))) {
      return false;
    }
  }

  return true;
}

/**
 * Simple hash function for consistent user bucketing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // biome-ignore lint/suspicious/noBitwiseOperators: ignore
    hash = (hash << 5) - hash + char;
    // biome-ignore lint/suspicious/noBitwiseOperators: ignore
    hash &= hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Feature flag middleware
export const featureFlagPlugin =
  (flagKey: string, defaultValue = false) =>
  async (context: any, next: any) => {
    const user = context.user;

    if (!user) {
      context.featureFlags = context.featureFlags || {};
      context.featureFlags[flagKey] = defaultValue;
      return await next();
    }

    try {
      const result = await featureFlagService.evaluateFlag(
        flagKey,
        user._id,
        user.tenantId,
        {
          ip: context.request.headers.get("x-forwarded-for"),
          userAgent: context.request.headers.get("user-agent"),
        }
      );

      context.featureFlags = context.featureFlags || {};
      context.featureFlags[flagKey] = result.enabled
        ? result.value
        : defaultValue;
    } catch (error) {
      logger.error(`Error evaluating feature flag ${flagKey}`, error);
      context.featureFlags = context.featureFlags || {};
      context.featureFlags[flagKey] = defaultValue;
    }

    return await next();
  };
