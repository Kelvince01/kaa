import { redisClient as redis } from "@kaa/utils";
import { Elysia } from "elysia";
import { ip } from "elysia-ip";

// Rate limiting configuration
type RateLimitConfig = {
  windowMs: number;
  max: number;
  keyGenerator?: (context: any) => string;
  skip?: (context: any) => boolean;
};

const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

// Role-based rate limits
const roleBasedLimits = {
  admin: { windowMs: 15 * 60 * 1000, max: 1000 },
  landlord: { windowMs: 15 * 60 * 1000, max: 500 },
  tenant: { windowMs: 15 * 60 * 1000, max: 200 },
  agent: { windowMs: 15 * 60 * 1000, max: 300 },
  guest: { windowMs: 15 * 60 * 1000, max: 50 },
};

// Rate limiting function
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const window = Math.floor(now / config.windowMs);
  const redisKey = `rate_limit:${key}:${window}`;

  try {
    const current = await redis.incr(redisKey);

    if (current === 1) {
      await redis.expire(redisKey, Math.ceil(config.windowMs / 1000));
    }

    const remaining = Math.max(0, config.max - current);
    const resetTime = (window + 1) * config.windowMs;

    return {
      allowed: current <= config.max,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open in case of Redis issues
    return {
      allowed: true,
      remaining: config.max,
      resetTime: now + config.windowMs,
    };
  }
}

// Rate limiting middleware
export const rateLimitPlugin = (config: Partial<RateLimitConfig> = {}) =>
  new Elysia({ name: "rate-limit" })
    .use(ip())
    .derive(
      ({
        ip: clientIp,
        headers,
        // user,
      }) => {
        const finalConfig = { ...defaultRateLimitConfig, ...config };

        const user = {
          role: "admin",
        };

        // Use role-based limits if user is authenticated
        if (
          user?.role &&
          roleBasedLimits[user.role as keyof typeof roleBasedLimits]
        ) {
          Object.assign(
            finalConfig,
            roleBasedLimits[user.role as keyof typeof roleBasedLimits]
          );
        }

        const key = finalConfig.keyGenerator
          ? finalConfig.keyGenerator({ ip: clientIp, headers, user })
          : clientIp;

        return { rateLimitKey: key, rateLimitConfig: finalConfig };
      }
    )
    .onBeforeHandle(async ({ rateLimitKey, rateLimitConfig, set }) => {
      if (rateLimitConfig.skip?.({ rateLimitKey })) {
        return;
      }

      const { allowed, remaining, resetTime } = await checkRateLimit(
        rateLimitKey,
        rateLimitConfig
      );

      set.headers["X-RateLimit-Limit"] = rateLimitConfig.max.toString();
      set.headers["X-RateLimit-Remaining"] = remaining.toString();
      set.headers["X-RateLimit-Reset"] = resetTime.toString();

      if (!allowed) {
        set.status = 429;
        throw new Error("Too Many Requests");
      }
    });
