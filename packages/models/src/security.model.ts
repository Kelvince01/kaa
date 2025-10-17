import mongoose, { Schema } from "mongoose";
import type {
  IComplianceReport,
  IDataRetentionPolicy,
  ISecurityEvent,
} from "./types/security.type";

const securityEventSchema = new Schema<ISecurityEvent>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "login_attempt",
        "logout",
        "email_change",
        "phone_change",
        "failed_login",
        "account_locked",
        "password_change",
        "mfa_enabled",
        // "data_breach_attempt",
        // "fraud_attempt",
        // "malware_detected",
        // "phishing_attempt",
        // "api_abuse",
        // "rate_limit_exceeded",
        // "unauthorized_access",
        // "privilege_escalation",
        // "data_exfiltration",
        "suspicious_activity",
        "data_export",
        "permission_change",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    details: {
      ipAddress: String,
      userAgent: String,
      location: {
        country: String,
        city: String,
        coordinates: [Number],
      },
      description: String,
      metadata: { type: Schema.Types.Mixed },
    },
    status: {
      type: String,
      enum: ["detected", "investigating", "resolved", "false_positive"],
      default: "detected",
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for security monitoring
securityEventSchema.index({ memberId: 1, type: 1, createdAt: -1 });
securityEventSchema.index({ severity: 1, status: 1 });
securityEventSchema.index({ "details.ipAddress": 1 });

export const SecurityEvent = mongoose.model<ISecurityEvent>(
  "SecurityEvent",
  securityEventSchema
);

const dataRetentionPolicySchema = new Schema<IDataRetentionPolicy>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    dataType: {
      type: String,
      enum: ["user_data", "analytics", "logs", "files", "backups"],
      required: true,
    },
    retentionPeriod: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    lastExecuted: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const DataRetentionPolicy = mongoose.model<IDataRetentionPolicy>(
  "DataRetentionPolicy",
  dataRetentionPolicySchema
);

const complianceReportSchema = new Schema<IComplianceReport>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    type: {
      type: String,
      enum: ["gdpr", "ccpa", "hipaa", "sox", "custom"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "generating", "completed", "failed"],
      default: "pending",
    },
    reportData: {
      userCount: Number,
      dataProcessingActivities: [{ type: Schema.Types.Mixed }],
      securityMeasures: [{ type: Schema.Types.Mixed }],
      dataBreaches: [{ type: Schema.Types.Mixed }],
      userRequests: [{ type: Schema.Types.Mixed }],
    },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    completedAt: Date,
    downloadUrl: String,
  },
  {
    timestamps: true,
  }
);

export const ComplianceReport = mongoose.model<IComplianceReport>(
  "ComplianceReport",
  complianceReportSchema
);
