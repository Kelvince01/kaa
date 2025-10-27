import { MFASecret, User } from "@kaa/models";
import type { IUser } from "@kaa/models/types";
import { roleService } from "@kaa/services";
import { logger, redisClient } from "@kaa/utils";

type CacheConfig = {
  ttl: number;
  prefix: string;
};

class AuthCacheService {
  private readonly configs: Record<string, CacheConfig> = {
    user: { ttl: 600, prefix: "user:" }, // 10 minutes
    userProfile: { ttl: 1800, prefix: "user_profile:" }, // 30 minutes
    role: { ttl: 3600, prefix: "role:" }, // 1 hour
    mfa: { ttl: 300, prefix: "mfa:" }, // 5 minutes
    session: { ttl: 1800, prefix: "session:" }, // 30 minutes
    loginAttempts: { ttl: 900, prefix: "login_attempts:" }, // 15 minutes
  };

  // User caching
  async getUser(email: string): Promise<IUser | null> {
    const key = `${this.configs.user.prefix}${email.toLowerCase()}`;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        logger.debug("User cache hit", { email });
        return JSON.parse(cached);
      }

      const user = await User.findOne({ "contact.email": email.toLowerCase() })
        .select("+password")
        .lean();

      if (user) {
        await redisClient.setEx(
          key,
          this.configs.user.ttl,
          JSON.stringify(user)
        );
        logger.debug("User cached", { email });
      }

      return user as IUser | null;
    } catch (error) {
      logger.error("User cache error", { email, error });
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    const key = `${this.configs.userProfile.prefix}${userId}`;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      const user = await User.findById(userId).select("-password").lean();

      if (user) {
        await redisClient.setEx(
          key,
          this.configs.userProfile.ttl,
          JSON.stringify(user)
        );
      }

      return user;
    } catch (error) {
      logger.error("User profile cache error", { userId, error });
      return null;
    }
  }

  // Role caching
  async getRole(userId: string): Promise<any> {
    // const key = `${this.configs.role.prefix}${userId}`;

    try {
      // const cached = await redisClient.get(key);
      // if (cached) {
      //   return JSON.parse(cached);
      // }

      const role = await roleService.getUserRoleBy({ userId });
      // if (role?.roleId) {
      //   await redisClient.setEx(
      //     key,
      //     this.configs.role.ttl,
      //     JSON.stringify(role)
      //   );
      // }

      return role;
    } catch (error) {
      logger.error("Role cache error", { userId, error });
      return null;
    }
  }

  // MFA caching
  async getMFAStatus(userId: string): Promise<any> {
    const key = `${this.configs.mfa.prefix}${userId}`;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      const mfaSecret = await MFASecret.findOne({ userId }).lean();
      const mfaStatus = { isEnabled: !!mfaSecret?.isEnabled };

      await redisClient.setEx(
        key,
        this.configs.mfa.ttl,
        JSON.stringify(mfaStatus)
      );
      return mfaStatus;
    } catch (error) {
      logger.error("MFA cache error", { userId, error });
      return { isEnabled: false };
    }
  }

  // Session caching
  async getSession(sessionId: string): Promise<any> {
    const key = `${this.configs.session.prefix}${sessionId}`;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error("Session cache error", { sessionId, error });
      return null;
    }
  }

  async setSession(sessionId: string, sessionData: any): Promise<void> {
    const key = `${this.configs.session.prefix}${sessionId}`;

    try {
      await redisClient.setEx(
        key,
        this.configs.session.ttl,
        JSON.stringify(sessionData)
      );
    } catch (error) {
      logger.error("Session cache set error", { sessionId, error });
    }
  }

  // Login attempts tracking
  async getLoginAttempts(email: string, ip: string): Promise<number> {
    const key = `${this.configs.loginAttempts.prefix}${email}:${ip}`;

    try {
      const attempts = await redisClient.get(key);
      return attempts ? Number.parseInt(attempts, 10) : 0;
    } catch (error) {
      logger.error("Login attempts cache error", { email, ip, error });
      return 0;
    }
  }

  async incrementLoginAttempts(email: string, ip: string): Promise<number> {
    const key = `${this.configs.loginAttempts.prefix}${email}:${ip}`;

    try {
      const attempts = await redisClient.incr(key);
      await redisClient.expire(key, this.configs.loginAttempts.ttl);
      return attempts;
    } catch (error) {
      logger.error("Login attempts increment error", { email, ip, error });
      return 0;
    }
  }

  async resetLoginAttempts(email: string, ip: string): Promise<void> {
    const key = `${this.configs.loginAttempts.prefix}${email}:${ip}`;

    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error("Login attempts reset error", { email, ip, error });
    }
  }

  // Cache invalidation
  async invalidateUser(email: string): Promise<void> {
    const keys = [
      `${this.configs.user.prefix}${email.toLowerCase()}`,
      `${this.configs.userProfile.prefix}*`, // This would need pattern matching
    ];

    try {
      await Promise.all(keys.map((key) => redisClient.del(key)));
      logger.debug("User cache invalidated", { email });
    } catch (error) {
      logger.error("User cache invalidation error", { email, error });
    }
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    const key = `${this.configs.userProfile.prefix}${userId}`;

    try {
      await redisClient.del(key);
      logger.debug("User profile cache invalidated", { userId });
    } catch (error) {
      logger.error("User profile cache invalidation error", { userId, error });
    }
  }

  async invalidateRole(roleId: string): Promise<void> {
    const key = `${this.configs.role.prefix}${roleId}`;

    try {
      await redisClient.del(key);
      logger.debug("Role cache invalidated", { roleId });
    } catch (error) {
      logger.error("Role cache invalidation error", { roleId, error });
    }
  }

  async invalidateMFA(userId: string): Promise<void> {
    const key = `${this.configs.mfa.prefix}${userId}`;

    try {
      await redisClient.del(key);
      logger.debug("MFA cache invalidated", { userId });
    } catch (error) {
      logger.error("MFA cache invalidation error", { userId, error });
    }
  }

  // Cache warming
  async warmUserCache(email: string): Promise<void> {
    try {
      await this.getUser(email);
      logger.debug("User cache warmed", { email });
    } catch (error) {
      logger.error("User cache warming error", { email, error });
    }
  }

  async warmRoleCache(roleId: string): Promise<void> {
    try {
      await this.getRole(roleId);
      logger.debug("Role cache warmed", { roleId });
    } catch (error) {
      logger.error("Role cache warming error", { roleId, error });
    }
  }

  // Cache statistics
  async getCacheStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  }> {
    try {
      const info = await redisClient.info("stats");
      const lines = info.split("\r\n");
      const stats: Record<string, number> = {};

      for (const line of lines) {
        const [key, value] = line.split(":");
        if (key && value) {
          stats[key] = Number.parseInt(value, 10) || 0;
        }
      }

      const hits = stats.keyspace_hits || 0;
      const misses = stats.keyspace_misses || 0;
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      return {
        hits,
        misses,
        hitRate: Math.round(hitRate * 100) / 100,
        size: await redisClient.dbSize(),
      };
    } catch (error) {
      logger.error("Cache stats error", { error });
      return { hits: 0, misses: 0, hitRate: 0, size: 0 };
    }
  }

  // Cache health check
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    latency: number;
    memory: number;
  }> {
    const start = Date.now();

    try {
      await redisClient.ping();
      const latency = Date.now() - start;

      const info = await redisClient.info("memory");
      // biome-ignore lint/performance/useTopLevelRegex: false positive
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memory = memoryMatch ? Number.parseInt(memoryMatch[1], 10) : 0;

      let status: "healthy" | "degraded" | "unhealthy" = "healthy";

      if (latency > 100) status = "degraded";
      if (latency > 500 || memory > 100 * 1024 * 1024) status = "unhealthy"; // 100MB

      return { status, latency, memory };
    } catch (error) {
      logger.error("Cache health check error", { error });
      return { status: "unhealthy", latency: Date.now() - start, memory: 0 };
    }
  }
}

export const authCacheService = new AuthCacheService();
