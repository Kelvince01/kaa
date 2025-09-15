import mongoose, { Schema } from "mongoose";
import type {
  IAlert,
  IHealthCheck,
  IIncident,
  IPerformanceMetric,
} from "./types/monitoring.type";

const alertSchema = new Schema<IAlert>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    name: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ["metric", "error", "security", "performance", "custom"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      required: true,
    },
    conditions: {
      metric: { type: String, required: true },
      operator: {
        type: String,
        enum: ["gt", "lt", "eq", "gte", "lte", "ne"],
        required: true,
      },
      threshold: { type: Number, required: true },
      timeWindow: { type: Number, required: true },
    },
    isEnabled: { type: Boolean, default: true },
    channels: [
      {
        type: {
          type: String,
          enum: ["email", "slack", "webhook", "sms"],
          required: true,
        },
        config: { type: Schema.Types.Mixed, required: true },
      },
    ],
    lastTriggered: Date,
    triggerCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const Alert = mongoose.model<IAlert>("Alert", alertSchema);

const incidentSchema = new Schema<IIncident>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["investigating", "identified", "monitoring", "resolved"],
      default: "investigating",
    },
    affectedServices: [String],
    timeline: [
      {
        timestamp: { type: Date, default: Date.now },
        status: String,
        message: String,
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
    postmortem: {
      summary: String,
      rootCause: String,
      actionItems: [
        {
          description: String,
          assignee: { type: Schema.Types.ObjectId, ref: "User" },
          dueDate: Date,
          completed: { type: Boolean, default: false },
        },
      ],
      createdBy: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: Date,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const Incident = mongoose.model<IIncident>("Incident", incidentSchema);

const performanceMetricSchema = new Schema<IPerformanceMetric>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    name: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    tags: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Time-series indexes
performanceMetricSchema.index({ name: 1, timestamp: -1 });
performanceMetricSchema.index({ memberId: 1, name: 1, timestamp: -1 });
performanceMetricSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 2_592_000 }
); // 30 days

export const PerformanceMetric = mongoose.model<IPerformanceMetric>(
  "PerformanceMetric",
  performanceMetricSchema
);

const healthCheckSchema = new Schema<IHealthCheck>(
  {
    service: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["healthy", "unhealthy", "degraded"],
      required: true,
    },
    responseTime: {
      type: Number,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const HealthCheck = mongoose.model<IHealthCheck>(
  "HealthCheck",
  healthCheckSchema
);
