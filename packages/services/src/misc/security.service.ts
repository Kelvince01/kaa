import {
  ComplianceReport,
  DataRetentionPolicy,
  Event,
  SecurityEvent,
  User,
} from "@kaa/models";
import type { ISecurityEvent } from "@kaa/models/types";
import { AppError, logger } from "@kaa/utils";
import mongoose from "mongoose";

export type SecurityEventData = {
  memberId: string;
  userId?: string;
  type:
    | "login_attempt"
    | "password_change"
    | "mfa_enabled"
    | "suspicious_activity"
    | "data_export"
    | "permission_change";
  severity: "low" | "medium" | "high" | "critical";
  details: {
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: [number, number];
    };
    metadata?: Record<string, any>;
  };
};

export class SecurityService {
  async logSecurityEvent(data: SecurityEventData): Promise<void> {
    try {
      const event = new SecurityEvent(data);
      await event.save();

      // Auto-escalate critical events
      if (data.severity === "critical") {
        await this.escalateCriticalEvent(event);
      }

      logger.info("Security event logged", {
        type: data.type,
        severity: data.severity,
        memberId: data.memberId,
      });
    } catch (error) {
      logger.error("Failed to log security event", error);
      throw new AppError("Failed to log security event");
    }
  }

  async detectSuspiciousActivity(
    memberId: string,
    userId: string,
    ipAddress: string
  ): Promise<boolean> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check for multiple failed login attempts
      const failedLogins = await SecurityEvent.countDocuments({
        memberId,
        userId,
        type: "login_attempt",
        "details.metadata.success": false,
        createdAt: { $gte: oneHourAgo },
      });

      if (failedLogins >= 5) {
        await this.logSecurityEvent({
          memberId,
          userId,
          type: "suspicious_activity",
          severity: "high",
          details: {
            ipAddress,
            metadata: {
              reason: "Multiple failed login attempts",
              count: failedLogins,
            },
          },
        });
        return true;
      }

      // Check for login from new location
      const recentLogins = await SecurityEvent.find({
        memberId,
        userId,
        type: "login_attempt",
        "details.metadata.success": true,
        createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }, // 30 days
      }).limit(10);

      const currentLocation = await this.getLocationFromIP(ipAddress);
      const hasLoginFromSameCountry = recentLogins.some(
        (login) => login.details.location?.country === currentLocation?.country
      );

      if (!hasLoginFromSameCountry && recentLogins.length > 0) {
        await this.logSecurityEvent({
          memberId,
          userId,
          type: "suspicious_activity",
          severity: "medium",
          details: {
            ipAddress,
            location: currentLocation as {
              country?: string;
              city?: string;
              coordinates?: [number, number];
            },
            metadata: {
              reason: "Login from new location",
              previousCountries: recentLogins
                .map((l) => l.details.location?.country)
                .filter(Boolean),
            },
          },
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to detect suspicious activity", error);
      return false;
    }
  }

  async createDataRetentionPolicy(data: {
    memberId: string;
    dataType: "user_data" | "analytics" | "logs" | "files" | "backups";
    retentionPeriod: number;
    createdBy: string;
  }): Promise<void> {
    try {
      const policy = new DataRetentionPolicy(data);
      await policy.save();

      logger.info("Data retention policy created", {
        memberId: data.memberId,
        dataType: data.dataType,
        retentionPeriod: data.retentionPeriod,
      });
    } catch (error) {
      logger.error("Failed to create data retention policy", error);
      throw new AppError("Failed to create data retention policy");
    }
  }

  async executeDataRetention(): Promise<void> {
    try {
      const policies = await DataRetentionPolicy.find({ isActive: true });

      for (const policy of policies) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

        switch (policy.dataType) {
          case "analytics":
            await Event.deleteMany({
              memberId: policy.memberId,
              createdAt: { $lt: cutoffDate },
            });
            break;
          case "logs":
            await SecurityEvent.deleteMany({
              memberId: policy.memberId,
              createdAt: { $lt: cutoffDate },
            });
            break;
          // Add more data types as needed
          default:
            break;
        }

        policy.lastExecuted = new Date();
        await policy.save();

        logger.info("Data retention executed", {
          policyId: policy._id,
          dataType: policy.dataType,
          cutoffDate,
        });
      }
    } catch (error) {
      logger.error("Failed to execute data retention", error);
      throw new AppError("Failed to execute data retention");
    }
  }

  async generateComplianceReport(data: {
    memberId: string;
    type: "gdpr" | "ccpa" | "hipaa" | "sox" | "custom";
    generatedBy: string;
  }): Promise<string> {
    try {
      const report = new ComplianceReport({
        ...data,
        status: "generating",
      });
      await report.save();

      const reportId = (report._id as mongoose.Types.ObjectId).toString();

      // Generate report data asynchronously
      this.generateReportData(reportId);

      return reportId;
    } catch (error) {
      logger.error("Failed to generate compliance report", error);
      throw new AppError("Failed to generate compliance report");
    }
  }

  private async generateReportData(reportId: string): Promise<void> {
    try {
      const report = await ComplianceReport.findById(reportId);
      if (!report) return;

      const userCount = await User.countDocuments({
        memberId: report.memberId,
      });
      const securityEvents = await SecurityEvent.find({
        memberId: report.memberId,
      })
        .sort({ createdAt: -1 })
        .limit(100);

      const reportData = {
        userCount,
        dataProcessingActivities: [
          {
            purpose: "User authentication and authorization",
            dataTypes: ["email", "password_hash", "login_timestamps"],
            legalBasis: "Legitimate interest",
          },
          {
            purpose: "Analytics and service improvement",
            dataTypes: ["usage_data", "performance_metrics"],
            legalBasis: "Legitimate interest",
          },
        ],
        securityMeasures: [
          {
            measure: "Encryption at rest and in transit",
            implementation: "AES-256 encryption",
          },
          {
            measure: "Multi-factor authentication",
            implementation: "TOTP-based MFA",
          },
          {
            measure: "Access logging and monitoring",
            implementation: "Comprehensive audit trails",
          },
        ],
        dataBreaches: securityEvents
          .filter((event) => event.severity === "critical")
          .map((event) => ({
            date: event.createdAt,
            type: event.type,
            affected: "Under investigation",
            resolved: event.status === "resolved",
          })),
        userRequests: [], // Would be populated from actual user requests
      };

      report.reportData = reportData;
      report.status = "completed";
      report.completedAt = new Date();
      report.downloadUrl = `/compliance/reports/${reportId}/download`;
      await report.save();

      logger.info("Compliance report generated", {
        reportId,
        type: report.type,
      });
    } catch (error) {
      logger.error("Failed to generate report data", error);

      await ComplianceReport.findByIdAndUpdate(reportId, { status: "failed" });
    }
  }

  private async escalateCriticalEvent(event: ISecurityEvent): Promise<void> {
    // Implementation for escalating critical security events
    // Could send alerts, create tickets, etc.

    await Promise.resolve();
    logger.warn("Critical security event detected", {
      eventId: event._id,
      type: event.type,
    });
  }

  private async getLocationFromIP(
    _ipAddress: string
  ): Promise<{ country?: string; city?: string } | null> {
    // Implementation for IP geolocation
    // Could use services like MaxMind, IPStack, etc.
    return await Promise.resolve(null);
  }

  async getSecurityDashboard(memberId: string) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalEvents,
        criticalEvents,
        recentEvents,
        eventsByType,
        suspiciousActivities,
      ] = await Promise.all([
        SecurityEvent.countDocuments({ memberId }),
        SecurityEvent.countDocuments({
          memberId,
          severity: "critical",
          status: { $ne: "resolved" },
        }),
        SecurityEvent.find({ memberId })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("userId", "firstName lastName email"),
        SecurityEvent.aggregate([
          {
            $match: {
              memberId: new mongoose.Types.ObjectId(memberId),
              createdAt: { $gte: thirtyDaysAgo },
            },
          },
          { $group: { _id: "$type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        SecurityEvent.countDocuments({
          memberId,
          type: "suspicious_activity",
          createdAt: { $gte: thirtyDaysAgo },
        }),
      ]);

      return {
        totalEvents,
        criticalEvents,
        recentEvents,
        eventsByType,
        suspiciousActivities,
        summary: {
          status: criticalEvents > 0 ? "attention_required" : "secure",
          lastUpdated: now,
        },
      };
    } catch (error) {
      logger.error("Failed to get security dashboard", error);
      throw new AppError("Failed to get security dashboard");
    }
  }
}

export const securityService = new SecurityService();
