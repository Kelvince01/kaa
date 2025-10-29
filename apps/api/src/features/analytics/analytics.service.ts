import {
  AnalyticsEvent,
  Booking,
  Payment,
  Property,
  PropertyView,
  UserSession,
} from "@kaa/models";

import { logger } from "@kaa/utils";
import mongoose from "mongoose";
import {
  estimateLocation,
  parseUserAgent,
  sanitizeEventData,
  shouldTrackEvent,
} from "./analytics.utils";

// Analytics event tracking model for service interface
type AnalyticsEventData = {
  event: string;
  step?: string;
  field?: string;
  value?: any;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
};

type FormAnalytics = {
  sessionId: string;
  startTime: Date;
  currentStep: string;
  timePerStep: Record<string, number>;
  fieldInteractions: Record<string, number>;
  errors: Array<{ field: string; error: string; timestamp: Date }>;
  completionRate: number;
  dropOffPoints: string[];
};

type UserBehavior = {
  averageTimePerStep: number;
  mostProblematicFields: Array<{ field: string; errorRate: number }>;
  commonDropOffPoints: string[];
  conversionFunnels: Record<string, number>;
  deviceType: "mobile" | "tablet" | "desktop";
  browserInfo: string;
};

type PropertyPerformanceMetrics = {
  propertyId: string;
  views: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  inquiries: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    responseRate: number;
  };
  engagement: {
    favorites: number;
    shares: number;
    contactAttempts: number;
    viewingRequests: number;
  };
  demographics: {
    viewerAge: Array<{ range: string; percentage: number }>;
    viewerType: Array<{ type: string; percentage: number }>;
    peakTimes: Array<{ time: string; views: number }>;
  };
  performance: {
    rank: number;
    totalProperties: number;
    category: string;
    score: number;
  };
};

type FinancialAnalytics = {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    monthlyData: Array<{ month: string; amount: number; count: number }>;
  };
  properties: {
    total: number;
    occupied: number;
    vacant: number;
    occupancyRate: number;
    averageRent: number;
    totalPotentialIncome: number;
  };
  trends: {
    revenueGrowth: number;
    occupancyTrend: "up" | "down" | "stable";
    demandTrend: "high" | "medium" | "low";
  };
};

/**
 * Analytics service for property tracking and metrics
 */
export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track analytics event
   */
  async trackEvent(event: AnalyticsEventData): Promise<void> {
    try {
      // Validate and sanitize the event data
      const sanitizedEvent = sanitizeEventData(event);

      // Check if event should be tracked
      if (!shouldTrackEvent(sanitizedEvent.event, sanitizedEvent.userAgent)) {
        return;
      }

      // Store in analytics collection for historical analysis
      await AnalyticsEvent.create({
        ...sanitizedEvent,
        timestamp: sanitizedEvent.timestamp || new Date(),
      });

      logger.info("Analytics event tracked", {
        event: sanitizedEvent.event,
        sessionId: sanitizedEvent.sessionId,
        userId: sanitizedEvent.userId,
        step: sanitizedEvent.step,
        field: sanitizedEvent.field,
      });
    } catch (error) {
      logger.error("Error tracking analytics event:", error);
    }
  }

  /**
   * Track property view with detailed analytics
   */
  async trackPropertyView(data: {
    propertyId: string;
    userId?: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    referrer?: string;
    source?: string;
    deviceType?: string;
    engagement?: {
      scrollDepth?: number;
      timeOnPage?: number;
      interactions?: string[];
      contactRequested?: boolean;
      favorited?: boolean;
      shared?: boolean;
    };
  }): Promise<void> {
    try {
      const { deviceType, browser, os } = parseUserAgent(data.userAgent);
      const location = estimateLocation(data.ipAddress);

      await PropertyView.create({
        propertyId: new mongoose.Types.ObjectId(data.propertyId),
        userId: data.userId
          ? new mongoose.Types.ObjectId(data.userId)
          : undefined,
        sessionId: data.sessionId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        referrer: data.referrer,
        deviceType: (data.deviceType as any) || deviceType,
        source: (data.source as any) || "direct",
        location,
        engagement: data.engagement || {},
        timestamp: new Date(),
      });

      // Also track as analytics event
      await this.trackEvent({
        event: "property_view",
        sessionId: data.sessionId,
        userId: data.userId,
        timestamp: new Date(),
        metadata: {
          propertyId: data.propertyId,
          source: data.source,
          deviceType,
          referrer: data.referrer,
          engagement: data.engagement,
        },
      });

      logger.info("Property view tracked", {
        propertyId: data.propertyId,
        sessionId: data.sessionId,
      });
    } catch (error) {
      logger.error("Error tracking property view:", error);
    }
  }

  /**
   * Get analytics summary for member dashboard
   */
  async getAnalyticsSummary(
    memberId: string,
    timeframe: "week" | "month" | "quarter" = "month"
  ) {
    try {
      const memberObjectId = new mongoose.Types.ObjectId(memberId);
      const now = new Date();

      let startDate: Date;
      switch (timeframe) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          startDate = new Date(
            now.getFullYear(),
            Math.floor(now.getMonth() / 3) * 3,
            1
          );
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get properties for this member
      const memberProperties = await Property.find(
        { memberId: memberObjectId },
        "_id"
      ).lean();
      const propertyIds = memberProperties.map((p) => p._id);

      // Get analytics summary
      const [totalViews, totalSessions, totalEvents] = await Promise.all([
        PropertyView.countDocuments({
          propertyId: { $in: propertyIds },
          timestamp: { $gte: startDate },
        }),
        UserSession.countDocuments({
          memberId: memberObjectId,
          startTime: { $gte: startDate },
        }),
        AnalyticsEvent.countDocuments({
          memberId: memberObjectId,
          timestamp: { $gte: startDate },
        }),
      ]);

      // Get top performing properties
      const topProperties = await PropertyView.aggregate([
        {
          $match: {
            propertyId: { $in: propertyIds },
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$propertyId",
            views: { $sum: 1 },
            uniqueViewers: { $addToSet: "$sessionId" },
          },
        },
        {
          $addFields: {
            uniqueViewersCount: { $size: "$uniqueViewers" },
          },
        },
        { $sort: { views: -1 } },
        { $limit: 5 },
      ]);

      return {
        summary: {
          totalViews,
          totalSessions,
          totalEvents,
          timeframe,
        },
        topProperties: topProperties.map((item) => ({
          propertyId: item._id.toString(),
          views: item.views,
          uniqueViewers: item.uniqueViewersCount,
        })),
      };
    } catch (error) {
      logger.error("Error getting analytics summary:", error);
      throw new Error("Failed to get analytics summary");
    }
  }

  /**
   * Get form analytics for a session
   */
  async getFormAnalytics(sessionId: string): Promise<FormAnalytics> {
    try {
      // Get session data
      const session = await UserSession.findOne({ sessionId });
      if (!session) {
        throw new Error("Session not found");
      }

      // Get all events for this session
      const events = await AnalyticsEvent.find({ sessionId })
        .sort({ timestamp: 1 })
        .lean();

      // Process events to build analytics
      const stepEvents = events.filter((e) => e.event.includes("step_"));
      const fieldEvents = events.filter((e) => e.event.includes("field_"));
      const errorEvents = events.filter((e) => e.event === "form_error");

      // Calculate time per step
      const timePerStep: Record<string, number> = {};
      const stepStartTimes: Record<string, Date> = {};

      for (const event of stepEvents) {
        if (event.event === "step_started" && event.step) {
          stepStartTimes[event.step] = new Date(event.timestamp);
        } else if (
          event.event === "step_completed" &&
          event.step &&
          event.metadata?.timeSpent
        ) {
          timePerStep[event.step] = event.metadata.timeSpent;
        }
      }

      // Count field interactions
      const fieldInteractions: Record<string, number> = {};
      for (const event of fieldEvents) {
        if (event.field) {
          fieldInteractions[event.field] =
            (fieldInteractions[event.field] || 0) + 1;
        }
      }

      // Process errors
      const errors = errorEvents.map((event) => ({
        field: event.field || "",
        error: event.metadata?.error || "",
        timestamp: new Date(event.timestamp),
      }));

      // Calculate completion rate and drop-off points
      const completedEvents = events.filter(
        (e) => e.event === "step_completed"
      );
      const totalSteps = 5; // Assuming 5 steps in property creation form
      const completionRate = completedEvents.length / totalSteps;

      const dropOffPoints: string[] = [];
      if (completionRate < 1) {
        const lastCompletedStep = completedEvents.at(-1)?.step;
        if (lastCompletedStep) {
          dropOffPoints.push(lastCompletedStep);
        }
      }

      const formAnalytics: FormAnalytics = {
        sessionId,
        startTime: session.startTime,
        currentStep: session.formInteractions?.currentStep || "general",
        timePerStep,
        fieldInteractions,
        errors,
        completionRate,
        dropOffPoints,
      };

      logger.info("Form analytics retrieved", {
        sessionId,
        eventsCount: events.length,
      });
      return formAnalytics;
    } catch (error) {
      logger.error("Error getting form analytics:", error);
      throw new Error("Failed to get form analytics");
    }
  }

  /**
   * Get user behavior patterns
   */
  async getUserBehavior(userId?: string): Promise<UserBehavior> {
    try {
      // Get recent sessions (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const filter: any = { startTime: { $gte: thirtyDaysAgo } };
      if (userId) {
        filter.userId = new mongoose.Types.ObjectId(userId);
      }

      const sessions = await UserSession.find(filter).lean();

      // Calculate average time per step
      let totalStepTime = 0;
      let stepCount = 0;
      const stepTimes: number[] = [];

      for (const session of sessions) {
        if (session.formInteractions?.timePerStep) {
          for (const time of Object.values(
            session.formInteractions.timePerStep
          )) {
            if (typeof time === "number") {
              totalStepTime += time;
              stepCount++;
              stepTimes.push(time);
            }
          }
        }
      }

      const averageTimePerStep =
        stepCount > 0 ? totalStepTime / stepCount : 165;

      // Get error events for problematic fields analysis
      const errorEvents = await AnalyticsEvent.find({
        event: "form_error",
        timestamp: { $gte: thirtyDaysAgo },
        ...(userId && { userId: new mongoose.Types.ObjectId(userId) }),
      }).lean();

      // Calculate field error rates
      const fieldErrors: Record<string, number> = {};
      const fieldTotal: Record<string, number> = {};

      const fieldEvents = await AnalyticsEvent.find({
        event: "field_interaction",
        timestamp: { $gte: thirtyDaysAgo },
        ...(userId && { userId: new mongoose.Types.ObjectId(userId) }),
      }).lean();

      // Count field interactions
      for (const event of fieldEvents) {
        if (event.field) {
          fieldTotal[event.field] = (fieldTotal[event.field] || 0) + 1;
        }
      }

      // Count field errors
      for (const event of errorEvents) {
        if (event.field) {
          fieldErrors[event.field] = (fieldErrors[event.field] || 0) + 1;
        }
      }

      // Calculate error rates
      const mostProblematicFields = Object.keys(fieldErrors)
        .map((field) => ({
          field,
          errorRate:
            fieldTotal[field] > 0 ? fieldErrors[field] / fieldTotal[field] : 0,
        }))
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 5);

      // Calculate drop-off points
      const dropOffCounts: Record<string, number> = {};
      for (const session of sessions) {
        if (session.formInteractions?.dropOffPoint) {
          const dropOff = session.formInteractions.dropOffPoint;
          dropOffCounts[dropOff] = (dropOffCounts[dropOff] || 0) + 1;
        }
      }

      const commonDropOffPoints = Object.keys(dropOffCounts)
        .sort((a, b) => dropOffCounts[b] - dropOffCounts[a])
        .slice(0, 5);

      // Calculate conversion funnels from step completion data
      const stepCompletions: Record<string, number> = {
        general: 0,
        media: 0,
        location: 0,
        details: 0,
        pricing: 0,
        completed: 0,
      };

      const totalSessions = sessions.length;
      for (const session of sessions) {
        if (session.formInteractions?.completedSteps) {
          for (const step of session.formInteractions.completedSteps) {
            if (stepCompletions[step] !== undefined) {
              stepCompletions[step]++;
            }
          }
        }
        if (session.formInteractions?.completed) {
          stepCompletions.completed++;
        }
      }

      // Convert to rates
      const conversionFunnels: Record<string, number> = {};
      for (const step of Object.keys(stepCompletions)) {
        conversionFunnels[step] =
          totalSessions > 0 ? stepCompletions[step] / totalSessions : 0;
      }

      // Determine most common device type and browser
      const deviceTypes: Record<string, number> = {};
      const browsers: Record<string, number> = {};

      for (const session of sessions) {
        const deviceType = session.deviceInfo.deviceType;
        const browser = session.deviceInfo.browser || "unknown";

        deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
        browsers[browser] = (browsers[browser] || 0) + 1;
      }

      const mostCommonDevice = Object.keys(deviceTypes).reduce(
        (a, b) => (deviceTypes[a] > deviceTypes[b] ? a : b),
        "desktop"
      ) as "mobile" | "tablet" | "desktop";

      const mostCommonBrowser = Object.keys(browsers).reduce(
        (a, b) => (browsers[a] > browsers[b] ? a : b),
        "unknown"
      );

      const behavior: UserBehavior = {
        averageTimePerStep,
        mostProblematicFields,
        commonDropOffPoints,
        conversionFunnels,
        deviceType: mostCommonDevice,
        browserInfo: mostCommonBrowser,
      };

      logger.info("User behavior retrieved", {
        userId,
        sessionsAnalyzed: sessions.length,
        avgTimePerStep: averageTimePerStep,
      });
      return behavior;
    } catch (error) {
      logger.error("Error getting user behavior:", error);
      throw new Error("Failed to get user behavior");
    }
  }

  /**
   * Get property performance metrics
   */
  async getPropertyPerformance(
    propertyId: string,
    memberId: string
  ): Promise<PropertyPerformanceMetrics> {
    try {
      // Get property
      const property = await Property.findOne({
        _id: propertyId,
        memberId: new mongoose.Types.ObjectId(memberId),
      });

      if (!property) {
        throw new Error("Property not found");
      }

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get real property views from PropertyView collection
      const [totalViews, weekViews, monthViews, lastMonthViews] =
        await Promise.all([
          PropertyView.countDocuments({ propertyId }),
          PropertyView.countDocuments({
            propertyId,
            timestamp: { $gte: weekAgo },
          }),
          PropertyView.countDocuments({
            propertyId,
            timestamp: { $gte: monthAgo },
          }),
          PropertyView.countDocuments({
            propertyId,
            timestamp: {
              $gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
              $lt: monthAgo,
            },
          }),
        ]);

      // Calculate trend
      const trend =
        lastMonthViews > 0
          ? ((monthViews - lastMonthViews) / lastMonthViews) * 100
          : 0;

      const views = {
        total: totalViews,
        thisWeek: weekViews,
        thisMonth: monthViews,
        trend,
      };

      // Get real booking/inquiry data
      const bookings = await Booking.find({ property: propertyId });
      const weekBookings = bookings.filter((b) => b.createdAt > weekAgo).length;
      const monthBookings = bookings.filter(
        (b) => b.createdAt > monthAgo
      ).length;

      // Calculate response rate from booking status
      const respondedBookings = bookings.filter((b) =>
        ["approved", "rejected", "cancelled"].includes(b.status)
      ).length;

      const inquiries = {
        total: bookings.length,
        thisWeek: weekBookings,
        thisMonth: monthBookings,
        responseRate:
          bookings.length > 0 ? (respondedBookings / bookings.length) * 100 : 0,
      };

      // Get real engagement data from PropertyView collection
      const engagementData = await PropertyView.aggregate([
        { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
        {
          $group: {
            _id: null,
            totalFavorites: {
              $sum: { $cond: ["$engagement.favorited", 1, 0] },
            },
            totalShares: { $sum: { $cond: ["$engagement.shared", 1, 0] } },
            totalContacts: {
              $sum: { $cond: ["$engagement.contactRequested", 1, 0] },
            },
            avgScrollDepth: { $avg: "$engagement.scrollDepth" },
          },
        },
      ]);

      const engagement = engagementData[0]
        ? {
            favorites: engagementData[0].totalFavorites || 0,
            shares: engagementData[0].totalShares || 0,
            contactAttempts: engagementData[0].totalContacts || 0,
            viewingRequests: Math.floor(engagementData[0].totalContacts * 0.6), // Estimate
          }
        : {
            favorites: 0,
            shares: 0,
            contactAttempts: 0,
            viewingRequests: 0,
          };

      // Get real demographics from PropertyView collection
      const deviceStats = await PropertyView.aggregate([
        { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
        {
          $group: {
            _id: "$deviceType",
            count: { $sum: 1 },
          },
        },
      ]);

      const hourlyViews = await PropertyView.aggregate([
        { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
        {
          $group: {
            _id: { $hour: "$timestamp" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 4 },
      ]);

      // Generate time ranges from hourly data
      const peakTimes = hourlyViews.map((item) => {
        const hour = item._id;
        let timeRange = "";
        if (hour >= 6 && hour < 9) timeRange = "6-9 AM";
        else if (hour >= 12 && hour < 14) timeRange = "12-2 PM";
        else if (hour >= 14 && hour < 16) timeRange = "2-4 PM";
        else if (hour >= 18 && hour < 21) timeRange = "6-9 PM";
        else timeRange = `${hour}:00-${hour + 1}:00`;

        return { time: timeRange, views: item.count };
      });

      // Mock age and viewer type data (would need user registration data)
      const demographics = {
        viewerAge: [
          { range: "25-34", percentage: 45 },
          { range: "35-44", percentage: 28 },
          { range: "18-24", percentage: 15 },
          { range: "45+", percentage: 12 },
        ],
        viewerType: [
          { type: "First-time renters", percentage: 38 },
          { type: "Upgrading", percentage: 32 },
          { type: "Relocating", percentage: 20 },
          { type: "Downsizing", percentage: 10 },
        ],
        peakTimes,
      };

      // Calculate performance ranking based on real data
      const allPropertiesWithViews = await Property.aggregate([
        {
          $match: {
            memberId: new mongoose.Types.ObjectId(memberId),
            "location.county": property.location.county,
          },
        },
        {
          $lookup: {
            from: "propertyviews",
            localField: "_id",
            foreignField: "propertyId",
            as: "viewsData",
          },
        },
        {
          $addFields: {
            totalViews: { $size: "$viewsData" },
          },
        },
        { $sort: { totalViews: -1 } },
      ]);

      const propertyRank =
        allPropertiesWithViews.findIndex(
          (p) => p._id.toString() === propertyId
        ) + 1;

      const performance = {
        rank: propertyRank || allPropertiesWithViews.length,
        totalProperties: allPropertiesWithViews.length,
        category: `${property.specifications?.bedrooms || 1}-bedroom ${property.type}s in ${property.location.county}`,
        score: Math.min(
          10,
          Math.max(
            1,
            (views.total / Math.max(views.total, 100)) * 5 + // View score
              (inquiries.responseRate / 100) * 3 + // Response score
              (engagement.contactAttempts / Math.max(views.total, 1)) * 100 * 2 // Conversion score
          )
        ),
      };

      const result: PropertyPerformanceMetrics = {
        propertyId,
        views,
        inquiries,
        engagement,
        demographics,
        performance,
      };

      logger.info("Property performance metrics calculated", {
        propertyId,
        totalViews: views.total,
        realViews: totalViews,
      });
      return result;
    } catch (error) {
      logger.error("Error getting property performance:", error);
      throw new Error("Failed to get property performance metrics");
    }
  }

  /**
   * Get financial analytics for a member
   */
  async getFinancialAnalytics(
    memberId: string,
    timeframe: "month" | "quarter" | "year" = "month"
  ): Promise<FinancialAnalytics> {
    try {
      const memberObjectId = new mongoose.Types.ObjectId(memberId);

      // Date range calculation
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case "quarter":
          startDate = new Date(
            now.getFullYear(),
            Math.floor(now.getMonth() / 3) * 3,
            1
          );
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get revenue data
      const revenueData = await Payment.aggregate([
        {
          $match: {
            memberId: memberObjectId,
            status: "completed",
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Get property data
      const properties = await Property.find({ memberId: memberObjectId });
      const totalProperties = properties.length;
      const occupiedProperties = await Booking.distinct("property", {
        memberId: memberObjectId,
        status: { $in: ["approved", "active"] },
      });

      const occupancyRate =
        totalProperties > 0
          ? (occupiedProperties.length / totalProperties) * 100
          : 0;
      const averageRent =
        properties.reduce((sum, p) => sum + (p.pricing?.rent || 0), 0) /
          totalProperties || 0;
      const totalPotentialIncome = properties.reduce(
        (sum, p) => sum + (p.pricing?.rent || 0),
        0
      );

      // Calculate current and previous period revenue
      const totalRevenue = revenueData.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const lastPeriodStart = new Date(
        startDate.getTime() - (now.getTime() - startDate.getTime())
      );

      const lastPeriodRevenue = await Payment.aggregate([
        {
          $match: {
            memberId: memberObjectId,
            status: "completed",
            createdAt: {
              $gte: lastPeriodStart,
              $lt: startDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]);

      const previousRevenue = lastPeriodRevenue[0]?.amount || 0;
      const revenueGrowth =
        previousRevenue > 0
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      // Format monthly data
      const monthlyData = revenueData.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        amount: item.amount,
        count: item.count,
      }));

      const result: FinancialAnalytics = {
        revenue: {
          total: totalRevenue,
          thisMonth:
            revenueData.find(
              (r) =>
                r._id.year === now.getFullYear() &&
                r._id.month === now.getMonth() + 1
            )?.amount || 0,
          lastMonth:
            revenueData.find((r) => {
              const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
              const lastYear =
                now.getMonth() === 0
                  ? now.getFullYear() - 1
                  : now.getFullYear();
              return r._id.year === lastYear && r._id.month === lastMonth;
            })?.amount || 0,
          growth: revenueGrowth,
          monthlyData,
        },
        properties: {
          total: totalProperties,
          occupied: occupiedProperties.length,
          vacant: totalProperties - occupiedProperties.length,
          occupancyRate,
          averageRent,
          totalPotentialIncome,
        },
        trends: {
          revenueGrowth,
          occupancyTrend:
            occupancyRate > 80 ? "up" : occupancyRate < 60 ? "down" : "stable",
          demandTrend:
            occupancyRate > 85 ? "high" : occupancyRate > 70 ? "medium" : "low",
        },
      };

      logger.info("Financial analytics calculated", {
        memberId,
        timeframe,
        totalRevenue,
        occupancyRate,
      });

      return result;
    } catch (error) {
      logger.error("Error getting financial analytics:", error);
      throw new Error("Failed to get financial analytics");
    }
  }

  /**
   * Get portfolio analytics for a member
   */
  async getPortfolioAnalytics(memberId: string): Promise<{
    overview: {
      totalProperties: number;
      totalValue: number;
      monthlyIncome: number;
      occupancyRate: number;
      averageRoi: number;
    };
    distribution: {
      byType: Array<{ type: string; count: number; value: number }>;
      byLocation: Array<{ county: string; count: number; avgRent: number }>;
      byStatus: Array<{ status: string; count: number; percentage: number }>;
    };
    performance: {
      topPerformers: Array<{
        propertyId: string;
        title: string;
        monthlyIncome: number;
        occupancyRate: number;
        roi: number;
      }>;
      underPerformers: Array<{
        propertyId: string;
        title: string;
        issues: string[];
        suggestions: string[];
      }>;
    };
  }> {
    try {
      const memberObjectId = new mongoose.Types.ObjectId(memberId);

      // Get all properties for the member
      const properties = await Property.find({ memberId: memberObjectId });

      // Calculate overview metrics
      const totalProperties = properties.length;
      const totalValue = properties.reduce((sum, p) => {
        const estimatedValue = (p.pricing?.rent || 0) * 200; // Rough value estimation
        return sum + estimatedValue;
      }, 0);

      const monthlyIncome = properties.reduce(
        (sum, p) => sum + (p.pricing?.rent || 0),
        0
      );

      // Get occupancy data
      const occupiedProperties = await Booking.distinct("property", {
        memberId: memberObjectId,
        status: { $in: ["approved", "active"] },
      });

      const occupancyRate =
        totalProperties > 0
          ? (occupiedProperties.length / totalProperties) * 100
          : 0;
      const averageRoi = ((monthlyIncome * 12) / totalValue) * 100 || 0;

      // Distribution by type
      const typeDistribution = await Property.aggregate([
        { $match: { memberId: memberObjectId } },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            avgRent: { $avg: "$pricing.rent" },
            totalValue: { $sum: { $multiply: ["$pricing.rent", 200] } },
          },
        },
      ]);

      // Distribution by location
      const locationDistribution = await Property.aggregate([
        { $match: { memberId: memberObjectId } },
        {
          $group: {
            _id: "$location.county",
            count: { $sum: 1 },
            avgRent: { $avg: "$pricing.rent" },
          },
        },
      ]);

      // Mock performance data (replace with real analytics)
      const topPerformers = properties.slice(0, 5).map((p) => ({
        propertyId: (p._id as mongoose.Types.ObjectId).toString(),
        title: p.title,
        monthlyIncome: p.pricing?.rent || 0,
        occupancyRate: Math.random() * 30 + 70, // 70-100%
        roi: Math.random() * 5 + 8, // 8-13%
      }));

      const underPerformers = properties.slice(-3).map((p) => ({
        propertyId: (p._id as mongoose.Types.ObjectId).toString(),
        title: p.title,
        issues: ["Low occupancy rate", "Below market pricing"],
        suggestions: [
          "Improve marketing",
          "Consider price adjustment",
          "Enhance amenities",
        ],
      }));

      const result = {
        overview: {
          totalProperties,
          totalValue,
          monthlyIncome,
          occupancyRate,
          averageRoi,
        },
        distribution: {
          byType: typeDistribution.map((item) => ({
            type: item._id,
            count: item.count,
            value: item.totalValue,
          })),
          byLocation: locationDistribution.map((item) => ({
            county: item._id,
            count: item.count,
            avgRent: item.avgRent,
          })),
          byStatus: [
            {
              status: "occupied",
              count: occupiedProperties.length,
              percentage: occupancyRate,
            },
            {
              status: "vacant",
              count: totalProperties - occupiedProperties.length,
              percentage: 100 - occupancyRate,
            },
          ],
        },
        performance: {
          topPerformers,
          underPerformers,
        },
      };

      logger.info("Portfolio analytics calculated", {
        memberId,
        totalProperties,
      });
      return result;
    } catch (error) {
      logger.error("Error getting portfolio analytics:", error);
      throw new Error("Failed to get portfolio analytics");
    }
  }

  /**
   * Get member analytics dashboard data
   */
  async getMemberDashboardAnalytics(memberId: string): Promise<{
    revenue: {
      thisMonth: number;
      lastMonth: number;
      growth: number;
      target: number;
    };
    properties: {
      total: number;
      occupied: number;
      occupancyRate: number;
    };
    bookings: {
      thisMonth: number;
      pending: number;
      conversionRate: number;
    };
    trends: {
      revenueChart: Array<{ month: string; amount: number }>;
      occupancyChart: Array<{ month: string; rate: number }>;
      bookingsChart: Array<{ month: string; count: number }>;
    };
  }> {
    try {
      const memberObjectId = new mongoose.Types.ObjectId(memberId);
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      // Revenue calculations
      const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
        Payment.aggregate([
          {
            $match: {
              memberId: memberObjectId,
              status: "completed",
              createdAt: { $gte: thisMonthStart },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
          {
            $match: {
              memberId: memberObjectId,
              status: "completed",
              createdAt: {
                $gte: lastMonthStart,
                $lt: thisMonthStart,
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

      const currentRevenue = thisMonthRevenue[0]?.total || 0;
      const previousRevenue = lastMonthRevenue[0]?.total || 0;
      const revenueGrowth =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      // Property metrics
      const totalProperties = await Property.countDocuments({
        memberId: memberObjectId,
      });
      const occupiedCount = await Booking.distinct("property", {
        memberId: memberObjectId,
        status: { $in: ["approved", "active"] },
      });

      // Booking metrics
      const thisMonthBookings = await Booking.countDocuments({
        memberId: memberObjectId,
        createdAt: { $gte: thisMonthStart },
      });

      const pendingBookings = await Booking.countDocuments({
        memberId: memberObjectId,
        status: "pending",
      });

      // Get trend data for charts
      const revenueChart = await Payment.aggregate([
        {
          $match: {
            memberId: memberObjectId,
            status: "completed",
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            amount: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const result = {
        revenue: {
          thisMonth: currentRevenue,
          lastMonth: previousRevenue,
          growth: revenueGrowth,
          target: previousRevenue * 1.1, // 10% growth target
        },
        properties: {
          total: totalProperties,
          occupied: occupiedCount.length,
          occupancyRate:
            totalProperties > 0
              ? (occupiedCount.length / totalProperties) * 100
              : 0,
        },
        bookings: {
          thisMonth: thisMonthBookings,
          pending: pendingBookings,
          conversionRate:
            thisMonthBookings > 0
              ? (occupiedCount.length / thisMonthBookings) * 100
              : 0,
        },
        trends: {
          revenueChart: revenueChart.map((item) => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
            amount: item.amount,
          })),
          occupancyChart: [], // Would calculate from historical data
          bookingsChart: [], // Would calculate from historical data
        },
      };

      logger.info("Member dashboard analytics calculated", {
        memberId,
        totalProperties,
      });
      return result;
    } catch (error) {
      logger.error("Error getting member dashboard analytics:", error);
      throw new Error("Failed to get member dashboard analytics");
    }
  }

  /**
   * Get comparative analytics for a property against market
   */
  async getComparativeAnalytics(
    propertyId: string,
    memberId: string
  ): Promise<{
    property: {
      rentAmount: number;
      views: number;
      inquiries: number;
      daysOnMarket: number;
    };
    market: {
      averageRent: number;
      averageViews: number;
      averageInquiries: number;
      averageDaysOnMarket: number;
    };
    comparison: {
      rentPerformance: number; // percentage above/below market
      viewsPerformance: number;
      inquiriesPerformance: number;
      marketingEfficiency: number;
    };
    recommendations: string[];
  }> {
    try {
      const property = await Property.findOne({
        _id: propertyId,
        memberId: new mongoose.Types.ObjectId(memberId),
      });

      if (!property) {
        throw new Error("Property not found");
      }

      // Get market comparables
      const marketProperties = await Property.find({
        "location.county": property.location.county,
        type: property.type,
        "specifications.bedrooms": property.specifications?.bedrooms,
        _id: { $ne: propertyId },
      }).limit(50);

      // Calculate market averages
      const marketAverages = {
        averageRent:
          marketProperties.reduce((sum, p) => sum + (p.pricing?.rent || 0), 0) /
            marketProperties.length || 0,
        averageViews:
          marketProperties.reduce((sum, p) => sum + (p.stats?.views || 0), 0) /
            marketProperties.length || 0,
        averageInquiries: 5, // Mock data - would get from booking stats
        averageDaysOnMarket: 30, // Mock data
      };

      // Property metrics
      const propertyMetrics = {
        rentAmount: property.pricing?.rent || 0,
        views: property.stats?.views || 0,
        inquiries: 3, // Mock data
        daysOnMarket: Math.floor(
          (Date.now() - property.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };

      // Calculate performance comparisons
      const comparison = {
        rentPerformance:
          marketAverages.averageRent > 0
            ? ((propertyMetrics.rentAmount - marketAverages.averageRent) /
                marketAverages.averageRent) *
              100
            : 0,
        viewsPerformance:
          marketAverages.averageViews > 0
            ? ((propertyMetrics.views - marketAverages.averageViews) /
                marketAverages.averageViews) *
              100
            : 0,
        inquiriesPerformance:
          marketAverages.averageInquiries > 0
            ? ((propertyMetrics.inquiries - marketAverages.averageInquiries) /
                marketAverages.averageInquiries) *
              100
            : 0,
        marketingEfficiency:
          (propertyMetrics.inquiries / Math.max(propertyMetrics.views, 1)) *
          100,
      };

      // Generate recommendations
      const recommendations: string[] = [];

      if (comparison.rentPerformance > 10) {
        recommendations.push(
          "Your price is above market average. Consider highlighting premium features."
        );
      } else if (comparison.rentPerformance < -10) {
        recommendations.push(
          "Your price is below market. You could potentially increase rent."
        );
      }

      if (comparison.viewsPerformance < -20) {
        recommendations.push(
          "Low view count. Improve photos and description to attract more viewers."
        );
      }

      if (comparison.marketingEfficiency < 5) {
        recommendations.push(
          "Low inquiry rate. Consider improving your listing quality and responsiveness."
        );
      }

      const result = {
        property: propertyMetrics,
        market: marketAverages,
        comparison,
        recommendations,
      };

      logger.info("Comparative analytics calculated", { propertyId, memberId });
      return result;
    } catch (error) {
      logger.error("Error getting comparative analytics:", error);
      throw new Error("Failed to get comparative analytics");
    }
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();
