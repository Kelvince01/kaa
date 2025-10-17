/**
 * Property Rate Limiting Configuration
 *
 * Defines rate limits for different property endpoints based on:
 * - User role
 * - Operation type
 * - Endpoint sensitivity
 */

export type PropertyRateLimitConfig = {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (context: any) => string;
  skip?: (context: any) => boolean;
};

// ==================== ROLE-BASED LIMITS ====================

export const propertyRoleLimits = {
  // Guest users (not authenticated)
  guest: {
    list: { windowMs: 60 * 1000, max: 20 }, // 20 requests per minute
    view: { windowMs: 60 * 1000, max: 30 }, // 30 views per minute
    search: { windowMs: 60 * 1000, max: 10 }, // 10 searches per minute
    nearby: { windowMs: 60 * 1000, max: 10 }, // 10 location searches per minute
  },

  // Tenant users
  tenant: {
    list: { windowMs: 60 * 1000, max: 50 },
    view: { windowMs: 60 * 1000, max: 100 },
    search: { windowMs: 60 * 1000, max: 30 },
    nearby: { windowMs: 60 * 1000, max: 20 },
    bookmark: { windowMs: 60 * 1000, max: 10 },
    inquire: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 inquiries per hour
  },

  // Landlord users
  landlord: {
    list: { windowMs: 60 * 1000, max: 100 },
    view: { windowMs: 60 * 1000, max: 200 },
    search: { windowMs: 60 * 1000, max: 50 },
    create: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 properties per hour
    update: { windowMs: 60 * 1000, max: 30 },
    delete: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 deletes per hour
    addImage: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 images per hour
    removeImage: { windowMs: 60 * 1000, max: 10 },
    updatePricing: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 price updates per hour
  },

  // Agent users
  agent: {
    list: { windowMs: 60 * 1000, max: 150 },
    view: { windowMs: 60 * 1000, max: 300 },
    search: { windowMs: 60 * 1000, max: 75 },
    create: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 properties per hour
    update: { windowMs: 60 * 1000, max: 50 },
    delete: { windowMs: 60 * 60 * 1000, max: 10 },
    addImage: { windowMs: 60 * 60 * 1000, max: 40 },
    removeImage: { windowMs: 60 * 1000, max: 20 },
  },

  // Admin/Moderator users
  admin: {
    list: { windowMs: 60 * 1000, max: 500 },
    view: { windowMs: 60 * 1000, max: 1000 },
    search: { windowMs: 60 * 1000, max: 200 },
    create: { windowMs: 60 * 1000, max: 50 },
    update: { windowMs: 60 * 1000, max: 100 },
    delete: { windowMs: 60 * 1000, max: 50 },
    moderate: { windowMs: 60 * 1000, max: 100 },
    bulkUpdate: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 bulk operations per hour
    analytics: { windowMs: 60 * 1000, max: 30 },
  },
};

// ==================== ENDPOINT-SPECIFIC LIMITS ====================

export const propertyEndpointLimits: Record<string, PropertyRateLimitConfig> = {
  // Public Endpoints
  "GET /properties": {
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many property list requests. Please try again later.",
    keyGenerator: (ctx) => ctx.ip || "anonymous",
  },

  "GET /properties/:id": {
    windowMs: 60 * 1000,
    max: 50,
    message: "Too many property view requests. Please try again later.",
    keyGenerator: (ctx) => ctx.ip || "anonymous",
  },

  "GET /properties/featured/list": {
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many featured property requests. Please try again later.",
  },

  "GET /properties/verified/list": {
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many verified property requests. Please try again later.",
  },

  "GET /properties/recent/list": {
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many recent property requests. Please try again later.",
  },

  "GET /properties/:id/similar": {
    windowMs: 60 * 1000,
    max: 15,
    message: "Too many similar property requests. Please try again later.",
    keyGenerator: (ctx) => `${ctx.ip}:${ctx.params.id}`,
  },

  "GET /properties/nearby/search": {
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many location-based searches. Please try again later.",
    keyGenerator: (ctx) =>
      `${ctx.ip}:${ctx.query.latitude}:${ctx.query.longitude}`,
  },

  // Authenticated Endpoints
  "POST /properties": {
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10,
    message: "Property creation limit reached. Please try again later.",
    keyGenerator: (ctx) => ctx.user?.id || ctx.ip,
  },

  "PATCH /properties/:id": {
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many property updates. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:${ctx.params.id}`,
  },

  "DELETE /properties/:id": {
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Property deletion limit reached. Please try again later.",
    keyGenerator: (ctx) => ctx.user?.id || ctx.ip,
  },

  "GET /properties/:id/can-publish": {
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many publish check requests. Please try again later.",
  },

  "GET /properties/:id/stats": {
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many stats requests. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:stats:${ctx.params.id}`,
  },

  "GET /properties/:id/pricing-insights": {
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 20,
    message: "Pricing insights request limit reached. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:pricing:${ctx.params.id}`,
  },

  "GET /properties/recommendations/for-me": {
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: "Recommendation request limit reached. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:recommendations`,
  },

  "PATCH /properties/:id/pricing": {
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Pricing update limit reached. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:pricing:${ctx.params.id}`,
  },

  "POST /properties/:id/images": {
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: "Image upload limit reached. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:images`,
  },

  "DELETE /properties/:id/images/:imageId": {
    windowMs: 60 * 1000,
    max: 10,
    message: "Image removal limit reached. Please try again later.",
  },

  "PATCH /properties/:id/availability": {
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: "Availability update limit reached. Please try again later.",
  },

  "POST /properties/:id/inquire": {
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Inquiry limit reached. Please try again in an hour.",
    keyGenerator: (ctx) => `${ctx.user?.id || ctx.ip}:inquire`,
  },

  "POST /properties/:id/bookmark": {
    windowMs: 60 * 1000,
    max: 10,
    message: "Bookmark limit reached. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:bookmark`,
  },

  // Admin/Moderator Endpoints
  "GET /properties/moderation/pending": {
    windowMs: 60 * 1000,
    max: 50,
    message: "Too many moderation queue requests. Please try again later.",
  },

  "POST /properties/:id/approve": {
    windowMs: 60 * 1000,
    max: 100,
    message: "Approval limit reached. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:approve`,
  },

  "POST /properties/:id/reject": {
    windowMs: 60 * 1000,
    max: 100,
    message: "Rejection limit reached. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:reject`,
  },

  "POST /properties/:id/flag": {
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: "Flag limit reached. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id || ctx.ip}:flag`,
  },

  "POST /properties/:id/verify": {
    windowMs: 60 * 1000,
    max: 50,
    message: "Verification limit reached. Please try again later.",
  },

  "POST /properties/:id/unverify": {
    windowMs: 60 * 1000,
    max: 50,
    message: "Unverification limit reached. Please try again later.",
  },

  "POST /properties/:id/feature": {
    windowMs: 60 * 1000,
    max: 30,
    message: "Feature limit reached. Please try again later.",
  },

  "POST /properties/:id/unfeature": {
    windowMs: 60 * 1000,
    max: 30,
    message: "Unfeature limit reached. Please try again later.",
  },

  "GET /properties/analytics/overview": {
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: "Analytics request limit reached. Please try again later.",
    keyGenerator: (ctx) => `${ctx.user?.id}:analytics`,
  },

  "PATCH /properties/bulk/status": {
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Bulk update limit reached. Please try again in an hour.",
    keyGenerator: (ctx) => `${ctx.user?.id}:bulk`,
  },

  "GET /properties/expiring/list": {
    windowMs: 60 * 1000,
    max: 20,
    message:
      "Expiring properties request limit reached. Please try again later.",
  },
};

// ==================== ADAPTIVE RATE LIMITING ====================

/**
 * Dynamic rate limit based on user behavior
 */
export const getAdaptiveLimit = (
  ctx: any,
  baseLimit: PropertyRateLimitConfig
): PropertyRateLimitConfig => {
  const user = ctx.user;

  if (!user) return baseLimit;

  // Increase limits for verified users
  if (user.verified) {
    return {
      ...baseLimit,
      max: Math.floor(baseLimit.max * 1.5),
    };
  }

  // Increase limits for premium users
  if (user.subscription?.tier === "premium") {
    return {
      ...baseLimit,
      max: Math.floor(baseLimit.max * 2),
    };
  }

  // Decrease limits for users with violations
  if (user.violations && user.violations > 0) {
    return {
      ...baseLimit,
      max: Math.floor(baseLimit.max * 0.5),
    };
  }

  return baseLimit;
};

// ==================== BYPASS CONDITIONS ====================

/**
 * Check if rate limiting should be bypassed
 */
export const shouldBypassPropertyRateLimit = (ctx: any): boolean => {
  // Bypass for admin users
  if (ctx.user?.role === "admin") return true;

  // Bypass for internal services
  if (ctx.headers["x-internal-service"] === "true") return true;

  // Bypass for whitelisted IPs
  const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(",") || [];
  if (whitelistedIPs.includes(ctx.ip)) return true;

  return false;
};

// ==================== CUSTOM MESSAGES ====================

export const propertyRateLimitMessages = {
  create: {
    title: "Property Creation Limit Reached",
    message:
      "You've reached the maximum number of properties you can create. Please upgrade your plan or try again later.",
    retryAfter: "1 hour",
  },
  search: {
    title: "Search Limit Reached",
    message:
      "You've made too many searches. Please wait a moment before searching again.",
    retryAfter: "1 minute",
  },
  inquire: {
    title: "Inquiry Limit Reached",
    message:
      "You've reached the maximum number of inquiries. Please try again in an hour.",
    retryAfter: "1 hour",
  },
  general: {
    title: "Rate Limit Exceeded",
    message:
      "You're making too many requests. Please slow down and try again later.",
    retryAfter: "Variable",
  },
};

// ==================== EXPORT ====================

export const propertyRateLimitConfig = {
  roleLimits: propertyRoleLimits,
  endpointLimits: propertyEndpointLimits,
  getAdaptiveLimit,
  shouldBypass: shouldBypassPropertyRateLimit,
  messages: propertyRateLimitMessages,
};
