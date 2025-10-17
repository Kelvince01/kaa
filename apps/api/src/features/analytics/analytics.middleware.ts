import { PropertyView, UserSession } from "@kaa/models";
import { logger } from "@kaa/utils";
import type { Context } from "elysia";
import mongoose from "mongoose";
import { analyticsService } from "./analytics.service";
import {
  createEventContext,
  extractTrackingMetadata,
  getCurrentPage,
  parseUserAgent,
} from "./analytics.utils";

/**
 * Analytics middleware for Elysia to automatically track user interactions
 */
export const analyticsMiddleware = {
  /**
   * Track page views and API calls
   */
  async beforeHandle(ctx: Context) {
    try {
      // Skip tracking for certain routes
      const skipRoutes = [
        "/health",
        "/metrics",
        "/favicon.ico",
        "/analytics",
        "/.well-known",
      ];

      const path = getCurrentPage(ctx);
      if (skipRoutes.some((route) => path.startsWith(route))) {
        return;
      }

      // Create event context
      const eventContext = createEventContext(ctx);

      // Skip if it's a bot
      if (eventContext.isBot) {
        return;
      }

      // Track page view for GET requests
      if (ctx.request.method === "GET") {
        await this.trackPageView(ctx, eventContext);
      }

      // Track API calls
      await this.trackAPICall(ctx, eventContext);

      // Update or create session
      await this.updateSession(ctx, eventContext);
    } catch (error) {
      // Log error but don't fail the request
      logger.error("Analytics middleware error:", error);
    }
  },

  /**
   * Track property views specifically
   */
  async trackPropertyView(ctx: Context, propertyId: string) {
    try {
      const eventContext = createEventContext(ctx);

      if (eventContext.isBot) return;

      const propertyView = {
        propertyId,
        sessionId: eventContext.sessionId,
        ipAddress: eventContext.ipAddress,
        userAgent: eventContext.userAgent,
        referrer: eventContext.referrer,
        deviceType: eventContext.deviceType,
        source: eventContext.source,
        location: {
          country: eventContext.location.country,
          city: eventContext.location.city,
        },
        timestamp: new Date(),
      };

      await PropertyView.create(propertyView);

      // Also track as analytics event
      await analyticsService.trackEvent({
        event: "property_view",
        sessionId: eventContext.sessionId,
        userId: (ctx as any).user?.id.toString(),
        timestamp: new Date(),
        metadata: {
          propertyId,
          source: eventContext.source,
          deviceType: eventContext.deviceType,
          referrer: eventContext.referrer,
        },
      });

      logger.info("Property view tracked", {
        propertyId,
        sessionId: eventContext.sessionId,
      });
    } catch (error) {
      logger.error("Error tracking property view:", error);
    }
  },

  /**
   * Track search queries
   */
  async trackSearch(ctx: Context, searchQuery: string, results: number) {
    try {
      const eventContext = createEventContext(ctx);

      if (eventContext.isBot) return;

      await analyticsService.trackEvent({
        event: "search_query",
        sessionId: eventContext.sessionId,
        userId: (ctx as any).user?.id.toString(),
        timestamp: new Date(),
        metadata: {
          query: searchQuery.substring(0, 100), // Limit query length
          resultsCount: results,
          source: eventContext.source,
          deviceType: eventContext.deviceType,
          page: getCurrentPage(ctx),
        },
      });

      logger.info("Search tracked", {
        query: searchQuery,
        results,
        sessionId: eventContext.sessionId,
      });
    } catch (error) {
      logger.error("Error tracking search:", error);
    }
  },

  /**
   * Track user interactions (clicks, form submissions, etc.)
   */
  async trackInteraction(
    ctx: Context,
    interactionType: string,
    targetElement?: string,
    value?: any
  ) {
    try {
      const eventContext = createEventContext(ctx);

      if (eventContext.isBot) return;

      await analyticsService.trackEvent({
        event: `interaction_${interactionType}`,
        sessionId: eventContext.sessionId,
        userId: (ctx as any).user?.id.toString(),
        timestamp: new Date(),
        metadata: {
          interactionType,
          targetElement,
          value: typeof value === "string" ? value.substring(0, 100) : value,
          page: getCurrentPage(ctx),
          deviceType: eventContext.deviceType,
        },
      });

      logger.debug("Interaction tracked", {
        type: interactionType,
        element: targetElement,
      });
    } catch (error) {
      logger.error("Error tracking interaction:", error);
    }
  },

  /**
   * Track conversion events (bookings, inquiries, etc.)
   */
  async trackConversion(
    ctx: Context,
    conversionType: string,
    value?: number,
    metadata?: Record<string, any>
  ) {
    try {
      const eventContext = createEventContext(ctx);

      await analyticsService.trackEvent({
        event: `conversion_${conversionType}`,
        sessionId: eventContext.sessionId,
        userId: (ctx as any).user?.id.toString(),
        timestamp: new Date(),
        metadata: {
          conversionType,
          value,
          page: getCurrentPage(ctx),
          source: eventContext.source,
          deviceType: eventContext.deviceType,
          ...metadata,
        },
      });

      // Update session with conversion event
      await UserSession.findOneAndUpdate(
        { sessionId: eventContext.sessionId },
        {
          $push: {
            conversionEvents: {
              event: conversionType,
              timestamp: new Date(),
              value,
            },
          },
        }
      );

      logger.info("Conversion tracked", {
        type: conversionType,
        value,
        sessionId: eventContext.sessionId,
      });
    } catch (error) {
      logger.error("Error tracking conversion:", error);
    }
  },

  /**
   * Private method to track page views
   */
  async trackPageView(ctx: Context, eventContext: any) {
    const page = getCurrentPage(ctx);
    const trackingMetadata = extractTrackingMetadata(ctx);

    await analyticsService.trackEvent({
      event: "page_view",
      sessionId: eventContext.sessionId,
      userId: (ctx as any).user?.id.toString(),
      timestamp: new Date(),
      metadata: {
        page,
        referrer: eventContext.referrer,
        source: eventContext.source,
        deviceType: eventContext.deviceType,
        ...trackingMetadata,
      },
    });
  },

  /**
   * Private method to track API calls
   */
  async trackAPICall(ctx: Context, eventContext: any) {
    const trackingMetadata = extractTrackingMetadata(ctx);

    await analyticsService.trackEvent({
      event: "api_call",
      sessionId: eventContext.sessionId,
      userId: (ctx as any).user?.id.toString(),
      timestamp: new Date(),
      metadata: {
        // method: ctx.request.method,
        endpoint: getCurrentPage(ctx),
        userAgent: eventContext.userAgent,
        ...trackingMetadata,
      },
    });
  },

  /**
   * Private method to update or create user session
   */
  async updateSession(ctx: Context, eventContext: any) {
    const { deviceType, browser, os } = parseUserAgent(eventContext.userAgent);
    const currentPage = getCurrentPage(ctx);

    // Try to find existing session
    let session = await UserSession.findOne({
      sessionId: eventContext.sessionId,
    });

    if (session) {
      // Update existing session
      const updates: any = {
        pageViews: session.pageViews + 1,
        exitPage: currentPage,
      };

      // Add to pages visited if not already present
      if (!session.engagement.pagesVisited.includes(currentPage)) {
        updates.$addToSet = {
          "engagement.pagesVisited": currentPage,
        };
      }

      // Update user if not set
      if (!session.userId && (ctx as any).user?.id) {
        updates.userId = new mongoose.Types.ObjectId((ctx as any).user.id);
      }

      await UserSession.findOneAndUpdate(
        { sessionId: eventContext.sessionId },
        updates
      );
    } else {
      // Create new session
      session = await UserSession.create({
        sessionId: eventContext.sessionId,
        userId: (ctx as any).user?.id
          ? new mongoose.Types.ObjectId((ctx as any).user.id)
          : undefined,
        startTime: new Date(),
        pageViews: 1,
        deviceInfo: {
          userAgent: eventContext.userAgent,
          deviceType,
          browser,
          os,
        },
        location: {
          ipAddress: eventContext.ipAddress,
          country: eventContext.location.country,
          city: eventContext.location.city,
        },
        referrer: eventContext.referrer,
        entryPage: currentPage,
        engagement: {
          totalScrollDepth: 0,
          totalTimeActive: 0,
          clicksCount: 0,
          pagesVisited: [currentPage],
        },
      });
    }

    return session;
  },

  /**
   * End session tracking
   */
  async endSession(sessionId: string) {
    try {
      await UserSession.findOneAndUpdate(
        { sessionId },
        {
          endTime: new Date(),
        }
      );

      logger.info("Session ended", { sessionId });
    } catch (error) {
      logger.error("Error ending session:", error);
    }
  },

  /**
   * Track form step progression
   */
  async trackFormStep(
    ctx: Context,
    formType: string,
    step: string,
    timeSpent?: number
  ) {
    try {
      const eventContext = createEventContext(ctx);

      // Track step event
      await analyticsService.trackEvent({
        event: "step_completed",
        step,
        sessionId: eventContext.sessionId,
        userId: (ctx as any).user?.id.toString(),
        timestamp: new Date(),
        metadata: {
          formType,
          timeSpent,
        },
      });

      // Update session form interactions
      await UserSession.findOneAndUpdate(
        { sessionId: eventContext.sessionId },
        {
          $set: {
            "formInteractions.formType": formType,
            "formInteractions.currentStep": step,
          },
          $addToSet: {
            "formInteractions.completedSteps": step,
          },
          $inc: {
            [`formInteractions.timePerStep.${step}`]: timeSpent || 0,
          },
        }
      );

      logger.info("Form step tracked", {
        formType,
        step,
        timeSpent,
        sessionId: eventContext.sessionId,
      });
    } catch (error) {
      logger.error("Error tracking form step:", error);
    }
  },

  /**
   * Track form field interactions
   */
  async trackFormField(
    ctx: Context,
    field: string,
    action: "focus" | "blur" | "change",
    value?: any
  ) {
    try {
      const eventContext = createEventContext(ctx);

      await analyticsService.trackEvent({
        event: "field_interaction",
        field,
        sessionId: eventContext.sessionId,
        userId: (ctx as any).user?.id.toString(),
        timestamp: new Date(),
        metadata: {
          action,
          value: typeof value === "string" ? value.substring(0, 50) : value,
        },
      });

      // Update session field interactions count
      await UserSession.findOneAndUpdate(
        { sessionId: eventContext.sessionId },
        {
          $inc: {
            [`formInteractions.fieldInteractions.${field}`]: 1,
          },
        }
      );
    } catch (error) {
      logger.error("Error tracking form field:", error);
    }
  },

  /**
   * Track form errors
   */
  async trackFormError(ctx: Context, field: string, error: string) {
    try {
      const eventContext = createEventContext(ctx);

      await analyticsService.trackEvent({
        event: "form_error",
        field,
        sessionId: eventContext.sessionId,
        userId: (ctx as any).user?.id.toString(),
        timestamp: new Date(),
        metadata: {
          error,
        },
      });

      // Add error to session
      await UserSession.findOneAndUpdate(
        { sessionId: eventContext.sessionId },
        {
          $push: {
            "formInteractions.errors": {
              field,
              error,
              timestamp: new Date(),
            },
          },
        }
      );

      logger.info("Form error tracked", {
        field,
        error,
        sessionId: eventContext.sessionId,
      });
    } catch (error) {
      logger.error("Error tracking form error:", error);
    }
  },
};

export default analyticsMiddleware;
