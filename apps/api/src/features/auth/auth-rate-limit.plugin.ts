// import config from "@kaa/config/api";
import { redisClient } from "@kaa/utils";
import type Elysia from "elysia";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { logSecurityEvent } from "~/shared/utils/security-logger.util";

type ProgressiveRateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  message: string;
  severity: "low" | "medium" | "high";
  nextLevel?: ProgressiveRateLimitConfig;
};

class ProgressiveRateLimiter {
  private readonly limiters: Map<string, RateLimiterRedis> = new Map();
  private readonly configs: ProgressiveRateLimitConfig[];

  constructor(configs: ProgressiveRateLimitConfig[]) {
    this.configs = configs;
    this.initializeLimiters();
  }

  private initializeLimiters() {
    this.configs.forEach((config, index) => {
      const limiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: `progressive_auth_${index}`,
        points: config.maxRequests,
        duration: Math.floor(config.windowMs / 1000),
        blockDuration: Math.floor(config.windowMs / 1000),
      });
      this.limiters.set(`level_${index}`, limiter);
    });
  }

  async checkLimit(
    key: string,
    request: Request
  ): Promise<{
    allowed: boolean;
    level: number;
    retryAfter?: number;
    message: string;
  }> {
    for (let i = 0; i < this.configs.length; i++) {
      const config = this.configs[i];
      const limiter = this.limiters.get(`level_${i}`);

      if (!limiter) continue;

      try {
        const result = await limiter.consume(key);

        if (result.remainingPoints < 0) {
          // Rate limit exceeded at this level
          const retryAfter = Math.round(result.msBeforeNext / 1000) || 1;

          // Log security event
          await logSecurityEvent({
            type: "PROGRESSIVE_RATE_LIMIT",
            details: {
              endpoint: new URL(request.url).pathname,
              method: request.method,
              clientIP: this.getClientIP(request),
              level: i,
              attempts: config.maxRequests - result.remainingPoints,
              limit: config.maxRequests,
              windowMs: config.windowMs,
              retryAfter,
            },
            timestamp: new Date().toISOString(),
            severity: config.severity,
          });

          return {
            allowed: false,
            level: i,
            retryAfter,
            message: config.message,
          };
        }

        // If we reach here, this level passed
        if (i === this.configs.length - 1) {
          // All levels passed
          return {
            allowed: true,
            level: i,
            message: "Request allowed",
          };
        }
      } catch (error) {
        console.error(`Rate limiter error at level ${i}:`, error);
        // Continue to next level on error
      }
    }

    // Fallback: allow request
    return {
      allowed: true,
      level: 0,
      message: "Request allowed (fallback)",
    };
  }

  private getClientIP(request: Request): string {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      "unknown"
    );
  }
}

// Progressive rate limiting configuration
const progressiveConfigs: ProgressiveRateLimitConfig[] = [
  {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 attempts per minute
    message: "Too many login attempts. Please wait 1 minute.",
    severity: "medium",
  },
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 attempts per 15 minutes
    message: "Excessive login attempts detected. Please wait 15 minutes.",
    severity: "high",
  },
  {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 attempts per hour
    message:
      "Account temporarily locked due to suspicious activity. Please wait 1 hour.",
    severity: "high",
  },
];

const progressiveLimiter = new ProgressiveRateLimiter(progressiveConfigs);

// Enhanced rate limiting plugin
export const enhancedAuthRateLimitPlugin = (app: Elysia) => {
  return app.onBeforeHandle({ as: "global" }, async ({ request, set }) => {
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const email = (await request.json().catch(() => null)) as { email: string };
    const key = email?.email ? `${email.email}:${clientIP}` : clientIP;

    const result = await progressiveLimiter.checkLimit(key, request);

    if (!result.allowed) {
      set.status = 429;
      set.headers = {
        ...(set.headers as Record<string, string | number>),
        "Retry-After": result.retryAfter?.toString() || "60",
        "X-RateLimit-Level": result.level.toString(),
      };

      return {
        code: "RATE_LIMIT_EXCEEDED",
        message: result.message,
        details: {
          level: result.level,
          retryAfter: result.retryAfter,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Set rate limit headers for successful requests
    set.headers = {
      ...(set.headers as Record<string, string | number>),
      "X-RateLimit-Level": result.level.toString(),
      "X-RateLimit-Remaining": "OK",
    };
  });
};

// Adaptive rate limiting based on user behavior
export class AdaptiveRateLimiter {
  private readonly userBehaviorCache = new Map<
    string,
    {
      successfulLogins: number;
      failedLogins: number;
      lastLogin: Date;
      riskScore: number;
    }
  >();

  calculateRiskScore(email: string, ip: string): number {
    const key = `${email}:${ip}`;
    const behavior = this.userBehaviorCache.get(key);

    if (!behavior) return 0; // New user, low risk

    const now = new Date();
    const timeSinceLastLogin = now.getTime() - behavior.lastLogin.getTime();
    const totalAttempts = behavior.successfulLogins + behavior.failedLogins;
    const failureRate = behavior.failedLogins / totalAttempts;

    let riskScore = 0;

    // Recent activity increases risk
    if (timeSinceLastLogin < 5 * 60 * 1000) {
      // 5 minutes
      riskScore += 20;
    }

    // High failure rate increases risk
    if (failureRate > 0.5) {
      riskScore += 30;
    }

    // Multiple failed attempts increase risk
    if (behavior.failedLogins > 3) {
      riskScore += 25;
    }

    // Successful logins decrease risk
    if (behavior.successfulLogins > 5) {
      riskScore -= 15;
    }

    return Math.max(0, Math.min(100, riskScore));
  }

  updateBehavior(email: string, ip: string, success: boolean) {
    const key = `${email}:${ip}`;
    const behavior = this.userBehaviorCache.get(key) || {
      successfulLogins: 0,
      failedLogins: 0,
      lastLogin: new Date(),
      riskScore: 0,
    };

    if (success) {
      behavior.successfulLogins++;
    } else {
      behavior.failedLogins++;
    }

    behavior.lastLogin = new Date();
    behavior.riskScore = this.calculateRiskScore(email, ip);

    this.userBehaviorCache.set(key, behavior);

    // Clean up old entries (keep only last 1000)
    if (this.userBehaviorCache.size > 1000) {
      const entries = Array.from(this.userBehaviorCache.entries());
      entries.sort(
        (a, b) => b[1].lastLogin.getTime() - a[1].lastLogin.getTime()
      );
      this.userBehaviorCache.clear();
      for (const [key, value] of entries.slice(0, 1000)) {
        this.userBehaviorCache.set(key, value);
      }
    }
  }

  getAdaptiveLimits(
    email: string,
    ip: string
  ): {
    maxRequests: number;
    windowMs: number;
    message: string;
  } {
    const riskScore = this.calculateRiskScore(email, ip);

    if (riskScore > 70) {
      return {
        maxRequests: 3,
        windowMs: 15 * 60 * 1000, // 15 minutes
        message:
          "High-risk activity detected. Limited to 3 attempts per 15 minutes.",
      };
      // biome-ignore lint/style/noUselessElse: false positive
    } else if (riskScore > 40) {
      return {
        maxRequests: 5,
        windowMs: 5 * 60 * 1000, // 5 minutes
        message:
          "Suspicious activity detected. Limited to 5 attempts per 5 minutes.",
      };
      // biome-ignore lint/style/noUselessElse: false positive
    } else {
      return {
        maxRequests: 10,
        windowMs: 60 * 1000, // 1 minute
        message: "Normal rate limiting applied.",
      };
    }
  }
}

export const adaptiveRateLimiter = new AdaptiveRateLimiter();
