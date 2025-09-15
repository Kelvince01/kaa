import { AuditLog, Event } from "@kaa/models";
import {
  type AuditActionType,
  type AuditEntityType,
  AuditSeverity,
  type AuditStatus,
  type IAuditLog,
  type IEvent,
} from "@kaa/models/types";
import { AppError, logger } from "@kaa/utils";
// import type { Context } from "elysia";
import mongoose, { type FilterQuery } from "mongoose";

export type TrackEventData = {
  memberId?: string;
  userId?: string;
  type: string;
  category: "user" | "api" | "billing" | "system" | "custom";
  action: string;
  properties?: Record<string, any>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AuditLogData = {
  memberId?: string;
  userId: string;
  action: AuditActionType;
  status: AuditStatus;
  resource: AuditEntityType;
  resourceId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  description?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
};

export class AuditService {
  /**
   * Track event
   */
  async trackEvent(data: TrackEventData): Promise<IEvent | null> {
    try {
      const event = await Event.create({
        memberId: data.memberId ? data.memberId : null,
        userId: data.userId,
        type: data.type,
        category: data.category,
        action: data.action,
        properties: data.properties || {},
        sessionId: data.sessionId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      return event;
    } catch (error) {
      // Log error but don't fail the request
      console.error("Error tracking event:", error);
      return null;
    }
  }

  /**
   * Audit log
   */
  async auditLog(data: AuditLogData): Promise<IAuditLog | null> {
    try {
      const auditLog = await AuditLog.create({
        memberId: data.memberId,
        userId: data.userId,
        action: data.action,
        status: data.status,
        resource: data.resource,
        resourceId: data.resourceId,
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        severity: data.severity,
        description: data.description,
        details: data.details,
        metadata: data.metadata,
      });

      // Log high severity events to the application logs as well
      if (
        data.severity === AuditSeverity.CRITICAL ||
        data.severity === AuditSeverity.HIGH
      ) {
        const logLevel =
          data.severity === AuditSeverity.CRITICAL ? "error" : "warn";
        logger.log({
          level: logLevel,
          message: `[AUDIT] ${data.description}`,
          extra: {
            auditId: (auditLog._id as mongoose.Types.ObjectId).toString(),
            actionType: data.action,
            entityType: data.resource,
            entityId: data.resourceId?.toString() || "N/A",
            status: data.status,
          },
        });
      }

      return auditLog;
    } catch (error) {
      // Log the error but don't throw - audit logging should not disrupt normal operations
      logger.error(`Error creating audit log: ${(error as Error).message}`, {
        extra: {
          error,
          actionType: data.action,
          entityType: data.resource,
          description: data.description,
        },
      });
      return null;
    }
  }

  /**
   * Log an audit event from a request
   */
  async logFromRequest(
    // ctx: Context,
    user: {
      memberId: string;
      id: string;
      role: mongoose.Types.ObjectId;
      username: string;
      isVerified: boolean;
      email: string;
      phone?: string;
      avatar?: string;
      createdAt: Date;
      updatedAt: Date;
    },
    {
      actionType,
      entityType,
      entityId,
      status,
      severity,
      description,
      details = {},
      metadata = {},
    }: {
      actionType: AuditActionType;
      entityType: AuditEntityType;
      entityId: string;
      status: AuditStatus;
      severity: AuditSeverity;
      description: string;
      details?: Record<string, any>;
      metadata?: Record<string, any>;
    }
  ) {
    const userId = user.id;
    // const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    // const userAgent = req.headers["user-agent"] || "unknown";
    // const sessionId = req.session?.id;
    // const requestId = req.headers["x-request-id"] as string;

    // Enhance metadata with request-specific information
    const enhancedMetadata = {
      ...metadata,
      // sessionId,
      // requestId,
      // source: analyticsService.determineSource(userAgent),
      // location: await analyticsService.getLocationFromIp(ipAddress),
    };

    return await this.auditLog({
      memberId: user.memberId.toString(),
      userId,
      action: actionType,
      resource: entityType,
      resourceId: entityId,
      status,
      severity,
      description,
      details,
      // ipAddress,
      // userAgent,
      metadata: enhancedMetadata,
    });
  }

  /**
   * Get events for tenant
   */
  async getEvents(memberId: string, query: any = {}) {
    const {
      page = 1,
      limit = 50,
      userId,
      eventType,
      resource,
      startDate,
      endDate,
    } = query;

    const filter: any = { memberId };

    // Add filters
    if (userId) filter.userId = userId;
    if (eventType) filter.eventType = eventType;
    if (resource) filter.resource = resource;

    // Add date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const events = await Event.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments(filter);

    return {
      events,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get event stats for tenant
   */
  async getEventStats(memberId: string, query: any = {}) {
    const { startDate, endDate, groupBy = "day" } = query;

    const filter: any = { memberId };

    // Add date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Define time grouping format
    let dateFormat: any;
    switch (groupBy) {
      case "hour":
        dateFormat = {
          $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" },
        };
        break;
      case "day":
        dateFormat = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
        break;
      case "week":
        dateFormat = {
          $dateToString: { format: "%G-W%V", date: "$createdAt" },
        };
        break;
      case "month":
        dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      default:
        dateFormat = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
    }

    // Aggregate events by time and type
    const stats = await Event.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: dateFormat,
            eventType: "$eventType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          events: {
            $push: {
              type: "$_id.eventType",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return stats;
  }

  async getEventStatsV2(memberId: string, startDate: Date, endDate: Date) {
    try {
      const stats = await Event.aggregate([
        {
          $match: {
            memberId: new mongoose.Types.ObjectId(memberId),
            timestamp: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              type: "$type",
              action: "$action",
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: { type: "$_id.type", action: "$_id.action" },
            totalCount: { $sum: "$count" },
            dailyStats: {
              $push: {
                date: "$_id.date",
                count: "$count",
              },
            },
          },
        },
      ]);

      return stats;
    } catch (error) {
      logger.error("Failed to get event stats", error);
      throw new AppError("Failed to get event stats");
    }
  }

  /**
   * Get user activity
   */
  async getUserActivityV2(memberId: string, userId: string, query: any = {}) {
    const { page = 1, limit = 20 } = query;

    const filter = { memberId, userId };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const events = await Event.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments(filter);

    return {
      events,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserActivity(memberId: string, userId?: string, limit = 50) {
    try {
      const match: any = { memberId: new mongoose.Types.ObjectId(memberId) };
      if (userId) {
        match.userId = new mongoose.Types.ObjectId(userId);
      }

      const activities = await Event.find(match)
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("userId", "firstName lastName email");

      return activities;
    } catch (error) {
      logger.error("Failed to get user activity", error);
      throw new AppError("Failed to get user activity");
    }
  }

  async getAuditLogs(
    memberId: string,
    filters: FilterQuery<IAuditLog> = {},
    limit = 100
  ): Promise<{
    auditLogs: IAuditLog[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      nextPage: number | null;
      prevPage: number | null;
    };
  }> {
    try {
      const match: FilterQuery<IAuditLog> = {
        memberId: new mongoose.Types.ObjectId(memberId),
      };

      if (filters.userId) {
        match.userId = new mongoose.Types.ObjectId(filters.userId);
      }
      if (filters.resource) {
        match.resource = filters.resource;
      }
      if (filters.action) {
        match.action = filters.action;
      }
      if (filters.startDate && filters.endDate) {
        match.timestamp = { $gte: filters.startDate, $lte: filters.endDate };
      }
      if (filters.status) {
        match.status = filters.status;
      }
      if (filters.severity) {
        match.severity = filters.severity;
      }
      if (filters.description) {
        match.description = filters.description;
      }
      if (filters.details) {
        match.details = filters.details;
      }
      if (filters.metadata) {
        match.metadata = filters.metadata;
      }

      // Calculate pagination
      const pageNum = Number.parseInt(filters.page as string, 10);
      const skip = (pageNum - 1) * limit;

      const [auditLogs, total] = await Promise.all([
        AuditLog.find(match)
          .sort({ timestamp: -1 })
          .limit(limit)
          .skip(skip)
          .populate("userId", "firstName lastName email")
          .lean(),
        AuditLog.countDocuments(match),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;
      const nextPage = hasNextPage ? pageNum + 1 : null;
      const prevPage = hasPrevPage ? pageNum - 1 : null;

      return {
        auditLogs: auditLogs as IAuditLog[],
        pagination: {
          total,
          page: pageNum,
          limit,
          pages: totalPages,
          hasNextPage,
          hasPrevPage,
          nextPage,
          prevPage,
        },
      };
    } catch (error) {
      logger.error("Failed to get audit logs", error);
      throw new AppError("Failed to get audit logs");
    }
  }

  async getDashboardMetrics(memberId: string) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalEvents,
        eventsLast30Days,
        eventsLast7Days,
        topEvents,
        dailyActivity,
      ] = await Promise.all([
        Event.countDocuments({
          memberId: new mongoose.Types.ObjectId(memberId),
        }),
        Event.countDocuments({
          memberId: new mongoose.Types.ObjectId(memberId),
          timestamp: { $gte: thirtyDaysAgo },
        }),
        Event.countDocuments({
          memberId: new mongoose.Types.ObjectId(memberId),
          timestamp: { $gte: sevenDaysAgo },
        }),
        Event.aggregate([
          { $match: { memberId: new mongoose.Types.ObjectId(memberId) } },
          { $group: { _id: "$type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Event.aggregate([
          {
            $match: {
              memberId: new mongoose.Types.ObjectId(memberId),
              timestamp: { $gte: sevenDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      return {
        totalEvents,
        eventsLast30Days,
        eventsLast7Days,
        topEvents,
        dailyActivity,
      };
    } catch (error) {
      logger.error("Failed to get dashboard metrics", error);
      throw new AppError("Failed to get dashboard metrics");
    }
  }

  /**
   * Determine the source of a request based on user agent
   */
  determineSource(userAgent: string): string {
    const lowerUA = userAgent.toLowerCase();
    if (
      lowerUA.includes("mobile") ||
      lowerUA.includes("android") ||
      lowerUA.includes("iphone") ||
      lowerUA.includes("ipad")
    ) {
      return "mobile";
    }
    if (
      lowerUA.includes("postman") ||
      lowerUA.includes("insomnia") ||
      lowerUA.includes("curl") ||
      lowerUA.includes("wget")
    ) {
      return "api";
    }
    return "web";
  }

  /**
   * Get location information from IP address
   * Note: In a production environment, this would use a geolocation service
   */
  async getLocationFromIp(ipAddress: string): Promise<Record<string, any>> {
    // This is a placeholder. In a real implementation, you would use a geolocation service
    // such as MaxMind GeoIP, ipstack, or similar.
    return await Promise.resolve({ ipAddress });
  }
}

export const auditService = new AuditService();
