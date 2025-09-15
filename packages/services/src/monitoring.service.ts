import config from "@kaa/config/api";
import {
  Alert,
  Event,
  HealthCheck,
  Incident,
  PerformanceMetric,
} from "@kaa/models";
import type {
  IAlert,
  IIncident as IEmailIncident,
  IIncident,
  IPerformanceMetric,
} from "@kaa/models/types";
import { AppError, logger, NotFoundError } from "@kaa/utils";
import mongoose, { type FilterQuery } from "mongoose";
// import { sendIncidentNotificationEmail } from "~/email/monitoring.emails";

export type CreateAlertData = {
  memberId?: string;
  name: string;
  description?: string;
  type: "metric" | "error" | "security" | "performance" | "custom";
  severity: "info" | "warning" | "error" | "critical";
  conditions: {
    metric: string;
    operator: "gt" | "lt" | "eq" | "gte" | "lte" | "ne";
    threshold: number;
    timeWindow: number;
  };
  channels: Array<{
    type: "email" | "slack" | "webhook" | "sms";
    config: Record<string, any>;
  }>;
  createdBy: string;
};

export type CreateIncidentData = {
  memberId?: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedServices: string[];
  createdBy: string;
};

export class MonitoringService {
  async createAlert(data: CreateAlertData): Promise<IAlert> {
    try {
      const alert = new Alert(data);
      await alert.save();

      logger.info("Alert created", {
        alertId: alert._id,
        name: data.name,
        severity: data.severity,
      });

      return alert;
    } catch (error) {
      logger.error("Failed to create alert", error);
      throw new AppError("Failed to create alert");
    }
  }

  async getAlerts(): Promise<IAlert[]> {
    try {
      const alerts = await Alert.find();
      return alerts;
    } catch (error) {
      logger.error("Failed to get alerts", error);
      throw new AppError("Failed to get alerts");
    }
  }

  async checkAlerts(): Promise<void> {
    try {
      const alerts = await Alert.find({ isEnabled: true });

      for (const alert of alerts) {
        const shouldTrigger = await this.evaluateAlert(alert);

        if (shouldTrigger) {
          await this.triggerAlert(alert);
        }
      }
    } catch (error) {
      logger.error("Failed to check alerts", error);
    }
  }

  async createIncident(data: CreateIncidentData): Promise<IIncident> {
    try {
      const incident = new Incident({
        ...data,
        timeline: [
          {
            timestamp: new Date(),
            status: "investigating",
            message: "Incident created",
            updatedBy: data.createdBy,
          },
        ],
      });

      await incident.save();

      // Auto-notify based on severity
      if (incident.severity === "critical" || incident.severity === "high") {
        await this.notifyIncident(incident);
      }

      logger.info("Incident created", {
        incidentId: incident._id,
        severity: data.severity,
      });

      return incident;
    } catch (error) {
      logger.error("Failed to create incident", error);
      throw new AppError("Failed to create incident");
    }
  }

  async getIncidents(): Promise<IIncident[]> {
    try {
      const incidents = await Incident.find();
      return incidents;
    } catch (error) {
      logger.error("Failed to get incidents", error);
      throw new AppError("Failed to get incidents");
    }
  }

  async updateIncidentStatus(
    incidentId: string,
    status: "investigating" | "identified" | "monitoring" | "resolved",
    message: string,
    updatedBy: string
  ): Promise<void> {
    try {
      const incident = await Incident.findById(incidentId);
      if (!incident) {
        throw new NotFoundError("Incident not found");
      }

      incident.status = status;
      incident.timeline.push({
        timestamp: new Date(),
        status,
        message,
        updatedBy: new mongoose.Types.ObjectId(updatedBy),
      });

      if (status === "resolved") {
        incident.resolvedAt = new Date();
      }

      await incident.save();

      logger.info("Incident status updated", {
        incidentId,
        status,
        updatedBy,
      });
    } catch (error) {
      logger.error("Failed to update incident status", error);
      throw error;
    }
  }

  async recordMetric(data: {
    memberId?: string;
    name: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
    timestamp?: Date;
  }): Promise<void> {
    try {
      const metric = new PerformanceMetric({
        ...data,
        timestamp: data.timestamp || new Date(),
      });

      await metric.save();

      // Check if this metric triggers any alerts
      await this.checkMetricAlerts(data.name, data.value, data.memberId);
    } catch (error) {
      logger.error("Failed to record metric", error);
      throw new AppError("Failed to record metric");
    }
  }

  async getSystemHealth(): Promise<any> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [
        activeIncidents,
        recentAlerts,
        errorRate,
        responseTime,
        systemLoad,
      ] = await Promise.all([
        Incident.countDocuments({ status: { $ne: "resolved" } }),
        Alert.countDocuments({ lastTriggered: { $gte: oneHourAgo } }),
        this.calculateErrorRate(oneHourAgo, now),
        this.getAverageResponseTime(oneHourAgo, now),
        this.getSystemLoad(),
      ]);

      const healthStatus = this.determineHealthStatus({
        activeIncidents,
        recentAlerts,
        errorRate,
        responseTime,
        systemLoad,
      });

      await this.recordHealthCheck("system", healthStatus, responseTime, {
        activeIncidents,
        recentAlerts,
        errorRate,
        responseTime,
        systemLoad,
      });

      return {
        status: healthStatus,
        timestamp: now,
        metrics: {
          activeIncidents,
          recentAlerts,
          errorRate,
          responseTime,
          systemLoad,
        },
        uptime: process.uptime(),
      };
    } catch (error) {
      logger.error("Failed to get system health", error);
      throw new AppError("Failed to get system health");
    }
  }

  /**
   * Record health check
   */
  async recordHealthCheck(
    service: string,
    status: string,
    responseTime: number,
    details: Record<string, any> = {}
  ) {
    try {
      await HealthCheck.create({
        service,
        status,
        responseTime,
        details,
      });
    } catch (error) {
      logger.error("Failed to record health check", error);
    }
  }

  /**
   * Get system health
   */
  async getSystemHealthV2(): Promise<any> {
    const services = ["database", "api", "cache", "storage"];
    const healthChecks = await Promise.all(
      services.map(async (service) => {
        const latest = await HealthCheck.findOne({ service }).sort({
          timestamp: -1,
        });
        return {
          service,
          status: latest?.status || "unknown",
          lastCheck: latest?.timestamp,
          responseTime: latest?.responseTime,
        };
      })
    );

    const overallStatus = healthChecks.every((hc) => hc.status === "healthy")
      ? "healthy"
      : healthChecks.some((hc) => hc.status === "unhealthy")
        ? "unhealthy"
        : "degraded";

    return {
      status: overallStatus,
      services: healthChecks,
      timestamp: new Date(),
    };
  }

  async getMetricHistory(query: {
    metricName: string;
    startDate: Date;
    endDate: Date;
    memberId?: string;
  }): Promise<any[]> {
    try {
      const { metricName, startDate, endDate, memberId } = query;
      const metricQuery: FilterQuery<IPerformanceMetric> = {
        name: metricName,
        timestamp: { $gte: startDate, $lte: endDate },
      };

      if (memberId) {
        metricQuery.memberId = memberId;
      }

      const metrics = await PerformanceMetric.find(metricQuery)
        .sort({ timestamp: 1 })
        .limit(1000);

      return metrics.map((m) => ({
        timestamp: m.timestamp,
        value: m.value,
        unit: m.unit,
        tags: m.tags,
      }));
    } catch (error) {
      logger.error("Failed to get metric history", error);
      throw new AppError("Failed to get metric history");
    }
  }

  async createPostmortem(
    incidentId: string,
    data: {
      summary: string;
      rootCause: string;
      actionItems: Array<{
        description: string;
        assignee: string;
        dueDate: Date;
      }>;
      createdBy: string;
    }
  ): Promise<void> {
    try {
      const incident = await Incident.findById(incidentId);
      if (!incident) {
        throw new NotFoundError("Incident not found");
      }

      incident.postmortem = {
        ...data,
        actionItems: data.actionItems.map((item) => ({
          ...item,
          assignee: new mongoose.Types.ObjectId(item.assignee),
          completed: false,
        })),
        createdBy: new mongoose.Types.ObjectId(data.createdBy),
        createdAt: new Date(),
      };

      await incident.save();

      logger.info("Postmortem created", { incidentId });
    } catch (error) {
      logger.error("Failed to create postmortem", error);
      throw error;
    }
  }

  private async evaluateAlert(alert: IAlert): Promise<boolean> {
    try {
      const { metric, operator, threshold, timeWindow } = alert.conditions;
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);

      // Get recent metric values
      const query: FilterQuery<IPerformanceMetric> = {
        name: metric,
        timestamp: { $gte: startTime },
      };

      if (alert.memberId) {
        query.memberId = alert.memberId;
      }

      const metrics = await PerformanceMetric.find(query);

      if (metrics.length === 0) return false;

      // Calculate aggregate value (average for now)
      const avgValue =
        metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;

      // Evaluate condition
      switch (operator) {
        case "gt":
          return avgValue > threshold;
        case "lt":
          return avgValue < threshold;
        case "gte":
          return avgValue >= threshold;
        case "lte":
          return avgValue <= threshold;
        case "eq":
          return avgValue === threshold;
        case "ne":
          return avgValue !== threshold;
        default:
          return false;
      }
    } catch (error) {
      logger.error("Failed to evaluate alert", error);
      return false;
    }
  }

  private async triggerAlert(alert: IAlert): Promise<void> {
    try {
      // Update alert trigger info
      alert.lastTriggered = new Date();
      alert.triggerCount += 1;
      await alert.save();

      // Send notifications through configured channels
      for (const channel of alert.channels) {
        await this.sendAlertNotification(alert, channel);
      }

      logger.warn("Alert triggered", {
        alertId: alert._id,
        name: alert.name,
        severity: alert.severity,
      });
    } catch (error) {
      logger.error("Failed to trigger alert", error);
    }
  }

  private async sendAlertNotification(
    alert: IAlert,
    channel: any
  ): Promise<void> {
    try {
      switch (channel.type) {
        case "email":
          // Send email notification
          break;
        case "slack":
          await this.sendSlackAlert(alert, channel.config);
          break;
        case "webhook":
          await this.sendWebhookAlert(alert, channel.config);
          break;
        case "sms":
          // Send SMS notification
          break;
        default:
          break;
      }
    } catch (error) {
      logger.error("Failed to send alert notification", error);
    }
  }

  private async sendSlackAlert(alert: IAlert, _config: any): Promise<void> {
    const { webhookUrl } = _config;

    const color = {
      info: "good",
      warning: "warning",
      error: "danger",
      critical: "danger",
    }[alert.severity];

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 Alert: ${alert.name}`,
        attachments: [
          {
            color,
            fields: [
              { title: "Severity", value: alert.severity, short: true },
              { title: "Type", value: alert.type, short: true },
              {
                title: "Description",
                value: alert.description || "No description",
                short: false,
              },
              {
                title: "Triggered",
                value: new Date().toISOString(),
                short: true,
              },
            ],
          },
        ],
      }),
    });
  }

  private async sendWebhookAlert(alert: IAlert, _config: any): Promise<void> {
    const { url, headers = {} } = _config;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        alert: {
          id: alert._id,
          name: alert.name,
          severity: alert.severity,
          type: alert.type,
          description: alert.description,
          triggeredAt: new Date().toISOString(),
        },
      }),
    });
  }

  private async checkMetricAlerts(
    metricName: string,
    value: number,
    memberId?: string
  ): Promise<void> {
    const query: any = {
      isEnabled: true,
      "conditions.metric": metricName,
    };

    if (memberId) {
      query.$or = [{ memberId }, { memberId: { $exists: false } }];
    }

    const alerts = await Alert.find(query);

    for (const alert of alerts) {
      const { operator, threshold } = alert.conditions;
      let shouldTrigger = false;

      switch (operator) {
        case "gt":
          shouldTrigger = value > threshold;
          break;
        case "lt":
          shouldTrigger = value < threshold;
          break;
        case "gte":
          shouldTrigger = value >= threshold;
          break;
        case "lte":
          shouldTrigger = value <= threshold;
          break;
        case "eq":
          shouldTrigger = value === threshold;
          break;
        case "ne":
          shouldTrigger = value !== threshold;
          break;
        default:
          break;
      }

      // biome-ignore lint/nursery/noUnnecessaryConditions: false positive
      if (shouldTrigger) {
        await this.triggerAlert(alert);
      }
    }
  }

  private async calculateErrorRate(
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const totalEvents = await Event.countDocuments({
      timestamp: { $gte: startTime, $lte: endTime },
    });

    const errorEvents = await Event.countDocuments({
      timestamp: { $gte: startTime, $lte: endTime },
      category: "error",
    });

    return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
  }

  private async getAverageResponseTime(
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const apiEvents = await Event.find({
      timestamp: { $gte: startTime, $lte: endTime },
      type: "api_request",
      "properties.responseTime": { $exists: true },
    });

    if (apiEvents.length === 0) return 0;

    const totalResponseTime = apiEvents.reduce(
      (sum: number, event: any) => sum + (event.properties.responseTime || 0),
      0
    );

    return totalResponseTime / apiEvents.length;
  }

  private getSystemLoad(): number {
    // Return system load average (1min, 5min, 15min) averages
    const loadavg = require("node:os").loadavg();
    return (loadavg[0] + loadavg[1] + loadavg[2]) / 3;
  }

  private determineHealthStatus(
    metrics: any
  ): "healthy" | "degraded" | "unhealthy" {
    if (metrics.activeIncidents > 0 || metrics.errorRate > 5) {
      return "unhealthy";
    }

    if (
      metrics.recentAlerts > 5 ||
      metrics.responseTime > 1000 ||
      metrics.systemLoad > 80
    ) {
      return "degraded";
    }

    return "healthy";
  }

  private async notifyIncident(incident: IIncident): Promise<void> {
    try {
      // Get stakeholders who should be notified (e.g., team members, admins)
      const stakeholders = [
        {
          email: "admin@example.com", // In a real app, this would come from user settings
          name: "Admin",
        },
      ];

      // Convert MongoDB document to plain object and ensure _id is a string
      const incidentId = (incident._id as mongoose.Types.ObjectId).toString();
      const incidentForEmail: IEmailIncident = {
        ...(incident.toObject ? incident.toObject() : incident),
        _id: incidentId,
        createdAt: incident.createdAt || new Date(),
        updatedAt: incident.updatedAt || new Date(),
      };

      // Send notifications to all stakeholders
      const notificationPromises = stakeholders.map(async (stakeholder) => {
        try {
          const dashboardUrl = `${config.clientUrl}/monitoring/incidents/${incidentId}`;

          //   await sendIncidentNotificationEmail({
          //     recipientEmail: stakeholder.email,
          //     recipientName: stakeholder.name,
          //     incident: incidentForEmail,
          //     dashboardUrl,
          //   });
          await Promise.resolve();

          logger.info("Incident notification sent", {
            incidentId,
            recipient: stakeholder.email,
          });
        } catch (error) {
          logger.error("Failed to send incident notification", {
            error,
            incidentId,
            recipient: stakeholder.email,
          });
        }
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      logger.error("Error in notifyIncident", {
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      // Don't throw the error to prevent breaking the main flow
    }
  }
}

export const monitoringService = new MonitoringService();
