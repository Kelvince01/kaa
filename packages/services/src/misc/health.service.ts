import { Member } from "@kaa/models";
import { logger, redisClient } from "@kaa/utils";
import mongoose from "mongoose";

export type HealthStatus = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: "up" | "down";
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: "ok" | "warning" | "critical";
      usage: {
        used: number;
        total: number;
        percentage: number;
      };
    };
    disk: {
      status: "ok" | "warning" | "critical";
      usage?: {
        used: number;
        total: number;
        percentage: number;
      };
    };
  };
  metrics: {
    totalMembers: number;
    totalUsers: number;
    requestsPerMinute: number;
  };
};

export class HealthService {
  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();
    const checks = await this.runHealthChecks();
    const metrics = await this.getMetrics();

    // Determine overall status
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (checks.database.status === "down") {
      status = "unhealthy";
    }
    // } else if (checks.memory.status === "critical" || checks.disk.status === "critical") {
    // status = "unhealthy";
    // } else if (checks.memory.status === "warning" || checks.disk.status === "warning") {
    // status = "degraded";
    // }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: process.uptime(),
      checks,
      metrics,
    };
  }

  private async runHealthChecks() {
    const checks = {
      database: await this.checkDatabase(),
      memory: this.checkMemory(),
      disk: this.checkDisk(),
    };

    return checks;
  }

  private async checkDatabase() {
    try {
      const start = Date.now();
      await mongoose.connection.db?.admin().ping();
      const responseTime = Date.now() - start;

      return {
        status: "up" as const,
        responseTime,
      };
    } catch (error: any) {
      logger.error("Database health check failed", error);
      return {
        status: "down" as const,
        error: error.message,
      };
    }
  }

  private checkMemory() {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const percentage = (usedMemory / totalMemory) * 100;

    let status: "ok" | "warning" | "critical" = "ok";
    if (percentage > 90) {
      status = "critical";
    } else if (percentage > 75) {
      status = "warning";
    }

    return {
      status,
      usage: {
        used: usedMemory,
        total: totalMemory,
        percentage: Math.round(percentage),
      },
    };
  }

  private checkDisk() {
    // In a real implementation, you'd check actual disk usage
    // For now, we'll return a mock status
    return {
      status: "ok" as const,
      usage: {
        used: 0,
        total: 0,
        percentage: 0,
      },
    };
  }

  private async getMetrics() {
    try {
      const [totalMembers, totalUsers] = await Promise.all([
        Member.countDocuments(),
        // You'd need to import User model here
        // User.countDocuments(),
        0, // Placeholder
      ]);

      return {
        totalMembers,
        totalUsers,
        requestsPerMinute: 0, // You'd track this with a counter
      };
    } catch (error) {
      logger.error("Failed to get metrics", error);
      return {
        totalMembers: 0,
        totalUsers: 0,
        requestsPerMinute: 0,
      };
    }
  }
}

// Check Redis connection
export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    const pong = await redisClient.ping();
    await redisClient.quit();

    return pong === "PONG";
  } catch (error) {
    logger.error("Redis health check failed:", error);
    return false;
  }
};
