import type { IApiKey } from "@kaa/models/types";
import { apiKeyService } from "@kaa/services/api-keys";
import { Elysia } from "elysia";
import type mongoose from "mongoose";

// Extend Elysia context to include user from API key
export type ApiKeyUser = {
  id: string;
  memberId?: string;
  permissions: string[];
  apiKeyId: string;
};

/**
 * API Key Authentication Plugin
 *
 * Validates API keys from request headers and attaches user info to context
 * Supports API keys in:
 * - X-API-Key header
 * - Authorization: Bearer <key> header
 */
export const apiKeyPlugin = new Elysia({ name: "api-key-auth" })
  .derive(async ({ headers, set }) => {
    // Extract API key from headers
    let apiKey: string | null = null;

    // Check X-API-Key header first
    const xApiKey = headers["x-api-key"];
    if (xApiKey) {
      apiKey = xApiKey;
    }

    // Fallback to Authorization header (Bearer token)
    if (!apiKey) {
      const authHeader = headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        apiKey = authHeader.slice(7);
      }
    }

    // No API key provided
    if (!apiKey) {
      set.status = 401;
      throw new Error(
        "API key is required. Provide via X-API-Key or Authorization header."
      );
    }

    // Validate API key
    const validatedKey = await apiKeyService.validateApiKey(apiKey);

    if (!validatedKey) {
      set.status = 401;
      throw new Error("Invalid or expired API key");
    }

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(validatedKey);
    if (!rateLimitResult.allowed) {
      set.status = 429;
      set.headers["Retry-After"] = String(rateLimitResult.retryAfter);
      set.headers["X-RateLimit-Limit"] = String(
        validatedKey.rateLimit?.requests || 1000
      );
      set.headers["X-RateLimit-Remaining"] = String(rateLimitResult.remaining);
      set.headers["X-RateLimit-Reset"] = String(rateLimitResult.resetAt);
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`
      );
    }

    // Set rate limit headers
    set.headers["X-RateLimit-Limit"] = String(
      validatedKey.rateLimit?.requests || 1000
    );
    set.headers["X-RateLimit-Remaining"] = String(rateLimitResult.remaining);
    set.headers["X-RateLimit-Reset"] = String(rateLimitResult.resetAt);

    // Create user object from validated key
    const user: ApiKeyUser = {
      id: (validatedKey.userId as any)._id.toString(),
      memberId: validatedKey.memberId
        ? validatedKey.memberId.toString()
        : undefined,
      permissions: validatedKey.permissions || [],
      apiKeyId: (validatedKey._id as mongoose.Types.ObjectId).toString(),
    };

    return { user };
  })
  .as("scoped");

/**
 * Check if API key has exceeded rate limit
 */
async function checkRateLimit(apiKey: IApiKey): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  resetAt: number;
}> {
  const { redisConnection } = await import("@kaa/utils");

  const keyId = (apiKey._id as mongoose.Types.ObjectId).toString();
  const rateKey = `api_key:rate_limit:${keyId}`;

  const limit = apiKey.rateLimit?.requests || 1000;
  const window = apiKey.rateLimit?.window || 3600; // Default 1 hour

  // Increment request count
  const count = await redisConnection.incr(rateKey);

  // Set expiration on first request
  if (count === 1) {
    await redisConnection.expire(rateKey, window);
  }

  // Get TTL for retry-after calculation
  const ttl = await redisConnection.ttl(rateKey);
  const remaining = Math.max(0, limit - count);
  const retryAfter = ttl > 0 ? ttl : window;
  const resetAt = Math.floor(Date.now() / 1000) + retryAfter;

  return {
    allowed: count <= limit,
    remaining,
    retryAfter,
    resetAt,
  };
}

/**
 * Optional permissions check middleware
 * Use after apiKeyPlugin to enforce specific permissions
 *
 * @example
 * .use(apiKeyPlugin)
 * .use(requirePermissions(['ai:train', 'ai:predict']))
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return new Elysia({ name: "permissions-check" })
    .use(apiKeyPlugin)
    .derive(({ user, set }) => {
      const apiUser = user as ApiKeyUser;

      // Check if user has all required permissions
      const hasPermissions = requiredPermissions.every(
        (permission) =>
          apiUser.permissions.includes(permission) ||
          apiUser.permissions.includes("*")
      );

      if (!hasPermissions) {
        set.status = 403;
        throw new Error(
          `Missing required permissions: ${requiredPermissions.join(", ")}`
        );
      }

      return {};
    })
    .as("scoped");
};
