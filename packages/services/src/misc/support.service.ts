import crypto from "node:crypto";
import {
  CustomerHealth,
  Event,
  KnowledgeBase,
  Member,
  Subscription,
  Ticket,
  UsageRecord,
  User,
  UserRole,
} from "@kaa/models";
import type { IKnowledgeBase, ITicket } from "@kaa/models/types";
import { AppError, logger, NotFoundError } from "@kaa/utils";
import mongoose from "mongoose";

export type CreateTicketData = {
  memberId: string;
  userId: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  category:
    | "technical"
    | "billing"
    | "feature_request"
    | "bug_report"
    | "general";
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
};

export class SupportService {
  // private notificationService = new NotificationService();

  async createTicket(data: CreateTicketData): Promise<ITicket> {
    try {
      const ticketNumber = this.generateTicketNumber();

      const ticket = new Ticket({
        ...data,
        ticketNumber,
        messages: [
          {
            from: data.userId,
            fromType: "user",
            content: data.description,
            isInternal: false,
          },
        ],
      });

      await ticket.save();

      // Auto-assign based on category and priority
      await this.autoAssignTicket(ticket);

      // Send notification to support team
      await this.notifySupport(ticket);

      logger.info("Support ticket created", {
        ticketId: ticket._id,
        ticketNumber,
        priority: data.priority,
      });

      return ticket;
    } catch (error) {
      logger.error("Failed to create ticket", error);
      throw new AppError("Failed to create ticket");
    }
  }

  async addMessageToTicket(
    ticketId: string,
    fromUserId: string,
    content: string,
    isInternal = false
  ): Promise<void> {
    try {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        throw new NotFoundError("Ticket not found");
      }

      const user = await User.findById(fromUserId);
      //   const fromType = user?.role ? "agent" : "user"; // Simplified role check
      const userRole = await UserRole.findOne({
        userId: new mongoose.Types.ObjectId(fromUserId),
      }).populate("role");
      const fromType =
        (userRole?.roleId as any)?.name === "agent" ? "agent" : "user";

      ticket.messages.push({
        id: new mongoose.Types.ObjectId().toString(),
        from: new mongoose.Types.ObjectId(fromUserId),
        fromType,
        content,
        isInternal,
        createdAt: new Date(),
      });

      // Update status if customer responds
      if (fromType === "user" && ticket.status === "waiting_for_customer") {
        ticket.status = "open";
      }

      // Calculate response time for first agent response
      if (fromType === "agent" && !ticket.responseTime) {
        const firstMessage = ticket.messages[0];
        const responseTime =
          (Date.now() - (firstMessage?.createdAt as Date)?.getTime()) /
          (1000 * 60);
        ticket.responseTime = responseTime;
      }

      await ticket.save();

      // Send notification to relevant parties
      if (!isInternal) {
        await this.notifyTicketUpdate(ticket, fromUserId);
      }

      logger.info("Message added to ticket", { ticketId, fromType });
    } catch (error) {
      logger.error("Failed to add message to ticket", error);
      throw error;
    }
  }

  async updateTicketStatus(
    ticketId: string,
    status:
      | "open"
      | "in_progress"
      | "waiting_for_customer"
      | "resolved"
      | "closed",
    updatedBy: string
  ): Promise<void> {
    try {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        throw new NotFoundError("Ticket not found");
      }

      const oldStatus = ticket.status;
      ticket.status = status;

      // Calculate resolution time if resolved
      if (status === "resolved" && !ticket.resolutionTime) {
        const resolutionTime =
          (Date.now() - ticket.createdAt.getTime()) / (1000 * 60);
        ticket.resolutionTime = resolutionTime;
      }

      await ticket.save();

      logger.info("Ticket status updated", {
        ticketId,
        oldStatus,
        newStatus: status,
        updatedBy,
      });
    } catch (error) {
      logger.error("Failed to update ticket status", error);
      throw error;
    }
  }

  async searchKnowledgeBase(
    query: string,
    memberId?: string
  ): Promise<IKnowledgeBase[]> {
    try {
      const searchCriteria: any = {
        $text: { $search: query },
        isPublished: true,
        $or: [{ isPublic: true }, { memberId }],
      };

      const articles = await KnowledgeBase.find(searchCriteria)
        .sort({ score: { $meta: "textScore" } })
        .limit(10);

      // Increment view count
      const articleIds = articles.map((a) => a._id);
      await KnowledgeBase.updateMany(
        { _id: { $in: articleIds } },
        { $inc: { views: 1 } }
      );

      return articles;
    } catch (error) {
      logger.error("Failed to search knowledge base", error);
      throw new AppError("Failed to search knowledge base");
    }
  }

  async calculateCustomerHealth(memberId: string): Promise<void> {
    try {
      const member = await Member.findById(memberId);
      if (!member) return;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate usage factor (0-100)
      const apiCalls = await UsageRecord.countDocuments({
        memberId,
        type: "api_call",
        timestamp: { $gte: thirtyDaysAgo },
      });
      const usageFactor = Math.min((apiCalls / 1000) * 100, 100); // Normalize to 100

      // Calculate engagement factor
      const events = await Event.countDocuments({
        memberId,
        timestamp: { $gte: thirtyDaysAgo },
      });
      const engagementFactor = Math.min((events / 500) * 100, 100);

      // Calculate support factor (inverse of ticket count)
      const tickets = await Ticket.countDocuments({
        memberId,
        status: { $in: ["open", "in_progress"] },
      });
      const supportFactor = Math.max(100 - tickets * 10, 0);

      // Calculate billing factor
      const subscription = await Subscription.findOne({ memberId });
      const billingFactor = subscription?.status === "active" ? 100 : 0;

      // Calculate feature adoption factor
      const uniqueEventTypes = await Event.distinct("type", {
        memberId,
        timestamp: { $gte: thirtyDaysAgo },
      });
      const featureAdoptionFactor = Math.min(
        (uniqueEventTypes.length / 10) * 100,
        100
      );

      // Calculate overall health score
      const factors = {
        usage: usageFactor,
        engagement: engagementFactor,
        support: supportFactor,
        billing: billingFactor,
        feature_adoption: featureAdoptionFactor,
      };

      const healthScore =
        Object.values(factors).reduce((sum, factor) => sum + factor, 0) / 5;

      // Determine risk level
      let riskLevel: "low" | "medium" | "high" | "critical";
      if (healthScore >= 80) riskLevel = "low";
      else if (healthScore >= 60) riskLevel = "medium";
      else if (healthScore >= 40) riskLevel = "high";
      else riskLevel = "critical";

      // Calculate trends (simplified)
      const trends = {
        usage_trend: "stable" as const,
        engagement_trend: "stable" as const,
      };

      // Generate alerts
      const alerts: any[] = [];
      if (tickets > 3) {
        alerts.push({
          type: "high_support_volume",
          message: "Customer has multiple open support tickets",
          severity: "medium" as const,
          createdAt: new Date(),
        });
      }
      if (billingFactor === 0) {
        alerts.push({
          type: "billing_issue",
          message: "Customer subscription is not active",
          severity: "high" as const,
          createdAt: new Date(),
        });
      }

      // Update or create customer health record
      await CustomerHealth.findOneAndUpdate(
        { memberId },
        {
          healthScore,
          factors,
          riskLevel,
          lastActivity: now,
          trends,
          alerts,
          calculatedAt: now,
        },
        { upsert: true }
      );

      logger.info("Customer health calculated", {
        memberId,
        healthScore,
        riskLevel,
      });
    } catch (error) {
      logger.error("Failed to calculate customer health", error);
      throw new AppError("Failed to calculate customer health");
    }
  }

  async getCustomerHealthDashboard() {
    try {
      const [
        totalCustomers,
        healthyCustomers,
        atRiskCustomers,
        criticalCustomers,
        recentAlerts,
      ] = await Promise.all([
        CustomerHealth.countDocuments(),
        CustomerHealth.countDocuments({ riskLevel: "low" }),
        CustomerHealth.countDocuments({
          riskLevel: { $in: ["medium", "high"] },
        }),
        CustomerHealth.countDocuments({ riskLevel: "critical" }),
        CustomerHealth.find({ "alerts.0": { $exists: true } })
          .sort({ calculatedAt: -1 })
          .limit(10)
          .populate("memberId", "name"),
      ]);

      return {
        totalCustomers,
        healthyCustomers,
        atRiskCustomers,
        criticalCustomers,
        recentAlerts,
        healthDistribution: {
          healthy: healthyCustomers,
          atRisk: atRiskCustomers,
          critical: criticalCustomers,
        },
      };
    } catch (error) {
      logger.error("Failed to get customer health dashboard", error);
      throw new AppError("Failed to get customer health dashboard");
    }
  }

  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  private async autoAssignTicket(ticket: ITicket): Promise<void> {
    // Implementation for auto-assignment logic
    // Could be based on category, priority, agent availability, etc.
    await Promise.resolve();
    logger.debug("Auto-assignment logic would run here", {
      ticketId: ticket._id,
    });
  }

  private async notifySupport(ticket: ITicket): Promise<void> {
    // Send notification to support team
    await Promise.resolve();
    logger.info("Support team notification would be sent", {
      ticketId: ticket._id,
    });
  }

  private async notifyTicketUpdate(
    ticket: ITicket,
    fromUserId: string
  ): Promise<void> {
    // Send notification about ticket update
    await Promise.resolve();
    logger.info("Ticket update notification would be sent", {
      ticketId: ticket._id,
      fromUserId,
    });
  }
}

export const supportService = new SupportService();
