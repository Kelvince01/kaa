// import { Elysia } from "elysia";
import { rateLimitConfig } from "~/config";

// import { ERROR_CODES, getErrorMessage } from "~/shared/constants/errors";

// In-memory store for rate limiting
// In production, use Redis for distributed rate limiting
class RateLimitStore {
  private readonly store = new Map<
    string,
    { count: number; resetTime: number }
  >();

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);

    // Clean expired entries
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key);
      // biome-ignore lint/nursery/noUselessUndefined: ignore
      return undefined;
    }

    return entry;
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value);
  }

  increment(
    key: string,
    windowMs: number
  ): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.get(key);

    if (!existing) {
      const entry = { count: 1, resetTime: now + windowMs };
      this.set(key, entry);
      return entry;
    }

    existing.count++;
    this.set(key, existing);
    return existing;
  }

  clear(): void {
    this.store.clear();
  }

  // Clean expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);

export type RateLimitOptions = {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (context: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
};

// export const rateLimitPlugin = new Elysia({ name: "rateLimit" }).macro(
//   ({ onBeforeHandle }) => ({
//     rateLimit(options: RateLimitOptions = {}) {
//       const {
//         windowMs = rateLimitConfig.windowMs,
//         maxRequests = rateLimitConfig.maxRequests,
//         keyGenerator = (context) => context.ip || "anonymous",
//         skipSuccessfulRequests = false,
//         skipFailedRequests = false,
//         message = getErrorMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED),
//         standardHeaders = true,
//         legacyHeaders = false,
//       } = options;

//       onBeforeHandle((context) => {
//         const { set, request } = context;
//         const key = keyGenerator(context);
//         const identifier = `rate_limit:${key}`;

//         // Check current rate limit status
//         const limit = rateLimitStore.increment(identifier, windowMs);
//         const remaining = Math.max(0, maxRequests - limit.count);
//         const resetTime = Math.ceil(limit.resetTime / 1000);

//         // Add headers
//         if (standardHeaders) {
//           set.headers = {
//             ...set.headers,
//             "RateLimit-Limit": maxRequests.toString(),
//             "RateLimit-Remaining": remaining.toString(),
//             "RateLimit-Reset": resetTime.toString(),
//           };
//         }

//         if (legacyHeaders) {
//           set.headers = {
//             ...set.headers,
//             "X-RateLimit-Limit": maxRequests.toString(),
//             "X-RateLimit-Remaining": remaining.toString(),
//             "X-RateLimit-Reset": resetTime.toString(),
//           };
//         }

//         // Check if limit exceeded
//         if (limit.count > maxRequests) {
//           set.status = 429;
//           set.headers = {
//             ...set.headers,
//             "Retry-After": Math.ceil(
//               (limit.resetTime - Date.now()) / 1000
//             ).toString(),
//           };

//           return {
//             success: false,
//             error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
//             message,
//             retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
//           };
//         }
//       });
//     },
//   })
// );

// Predefined rate limit configurations for different endpoints

export const rateLimitConfigs = {
  // Strict limits for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyGenerator: (context: any) => {
      const body = context.body;
      const email = body?.email || body?.phone;
      return email ? `auth:${email}` : context.ip;
    },
  },

  // Medium limits for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  },

  // Generous limits for search endpoints
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  },

  // Strict limits for file uploads
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 uploads per hour
  },

  // Very strict for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    keyGenerator: (context: any) => {
      const body = context.body;
      return `reset:${body?.email || context.ip}`;
    },
  },

  // Strict for OTP requests
  otp: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 OTP requests per hour
    keyGenerator: (context: any) => {
      const body = context.body;
      return `otp:${body?.phone || context.ip}`;
    },
  },

  // Medium for payment endpoints
  payment: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10, // 10 payment attempts per 10 minutes
    keyGenerator: (context: any) => {
      const user = context.user;
      return user ? `payment:${user.id}` : context.ip;
    },
  },
};

// IP-based rate limiting for different user types
export const createUserBasedRateLimit = (context: any) => {
  const user = context.user;

  if (!user) {
    // Anonymous users - stricter limits
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 30, // 30 requests per 15 minutes
      keyGenerator: () => context.ip,
    };
  }

  // Different limits based on user role
  switch (user.role) {
    case "admin":
    case "super_admin":
      return {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000, // High limit for admins
        keyGenerator: () => `user:${user.id}`,
      };

    case "agent":
      return {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 300, // Higher limit for agents
        keyGenerator: () => `user:${user.id}`,
      };

    default:
      return {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // Normal limit for regular users
        keyGenerator: () => `user:${user.id}`,
      };
  }
};

// Global rate limit for all endpoints
export const globalRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: rateLimitConfig.strictMax, // From config
  keyGenerator: (context: any) => context.ip,
  message: "Too many requests from this IP, please try again later.",
};

// Utility function to bypass rate limiting for certain conditions
export const shouldBypassRateLimit = (context: any): boolean => {
  const user = context.user;

  // Bypass for super admins
  if (user && user.role === "super_admin") {
    return true;
  }

  // Bypass for internal health checks (you can add specific IPs)
  const internalIPs = ["127.0.0.1", "::1"];
  if (internalIPs.includes(context.ip)) {
    return true;
  }

  return false;
};

// export default rateLimitPlugin;
