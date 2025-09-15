import mongoose, { Schema } from "mongoose";
import {
  AuditActionType,
  AuditEntityType,
  AuditSeverity,
  AuditStatus,
  type IAuditLog,
  type IEvent,
  type ISecurityViolation,
} from "./types/audit.type";

const eventSchema = new Schema<IEvent>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: { type: String, required: true },
    category: {
      type: String,
      enum: ["user", "api", "billing", "system", "custom"],
      required: true,
    },
    action: { type: String, required: true },
    properties: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
eventSchema.index({ memberId: 1, timestamp: -1 });
eventSchema.index({ memberId: 1, type: 1, timestamp: -1 });
eventSchema.index({ userId: 1, timestamp: -1 });

export const Event = mongoose.model<IEvent>("Event", eventSchema);

const auditLogSchema = new Schema<IAuditLog>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      required: true,
      enum: Object.values(AuditActionType),
    },
    status: { type: String, required: true, enum: Object.values(AuditStatus) },
    resource: {
      type: String,
      required: true,
      enum: Object.values(AuditEntityType),
    },
    resourceId: String,
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    severity: {
      type: String,
      enum: Object.values(AuditSeverity),
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      sessionId: String,
      requestId: String,
      source: String,
      location: {
        country: String,
        region: String,
        city: String,
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: "2dsphere",
        },
      },
      deviceId: String,
      referenceId: String,
      tags: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
auditLogSchema.index({ memberId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }); // Most recent audits
auditLogSchema.index({ action: 1, timestamp: -1 }); // Action type history
auditLogSchema.index({ status: 1, severity: 1, timestamp: -1 }); // Critical events
auditLogSchema.index({ "metadata.sessionId": 1, timestamp: 1 }); // Session activity
auditLogSchema.index({ "metadata.requestId": 1 }); // Request correlation
auditLogSchema.index({ "metadata.tags": 1 }); // Tag-based queries

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export const securityViolationSchema = new Schema<ISecurityViolation>({
  ip: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  statusCode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const SecurityViolation = mongoose.model<ISecurityViolation>(
  "SecurityViolation",
  securityViolationSchema
);
