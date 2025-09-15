import type mongoose from "mongoose";
import type { Document } from "mongoose";
import type { BaseDocument } from "./base.type";

export interface IAlert extends BaseDocument {
  memberId?: mongoose.Types.ObjectId; // null for system-wide alerts
  name: string;
  description?: string;
  type: "metric" | "error" | "security" | "performance" | "custom";
  severity: "info" | "warning" | "error" | "critical";
  conditions: {
    metric: string;
    operator: "gt" | "lt" | "eq" | "gte" | "lte" | "ne";
    threshold: number;
    timeWindow: number; // in minutes
  };
  isEnabled: boolean;
  channels: Array<{
    type: "email" | "slack" | "webhook" | "sms";
    config: Record<string, any>;
  }>;
  lastTriggered?: Date;
  triggerCount: number;
  createdBy: mongoose.Types.ObjectId;
}

export interface IIncident extends BaseDocument {
  memberId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  affectedServices: string[];
  timeline: Array<{
    timestamp: Date;
    status: string;
    message: string;
    updatedBy: mongoose.Types.ObjectId;
  }>;
  assignedTo?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  postmortem?: {
    summary: string;
    rootCause: string;
    actionItems: Array<{
      description: string;
      assignee: mongoose.Types.ObjectId;
      dueDate: Date;
      completed: boolean;
    }>;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  };
  createdBy: mongoose.Types.ObjectId;
}

export interface IPerformanceMetric extends Document {
  memberId?: mongoose.Types.ObjectId;
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: Date;
  createdAt: Date;
}

export interface IHealthCheck extends Document {
  service: string;
  status: string;
  responseTime: number;
  details: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}
