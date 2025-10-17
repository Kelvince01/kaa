import mongoose, { Schema } from "mongoose";
import type { IConsentRecord, IDataRequest } from "./types/gdpr.type";

const dataRequestSchema = new Schema<IDataRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    type: {
      type: String,
      enum: ["export", "delete", "rectification"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    data: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

dataRequestSchema.index({ userId: 1 });
dataRequestSchema.index({ tenantId: 1 });
dataRequestSchema.index({ status: 1 });

export const DataRequest = mongoose.model<IDataRequest>(
  "DataRequest",
  dataRequestSchema
);

const consentRecordSchema = new Schema<IConsentRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    consentType: {
      type: String,
      required: true,
    },
    granted: {
      type: Boolean,
      required: true,
    },
    grantedAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

consentRecordSchema.index({ userId: 1, consentType: 1 });

export const ConsentRecord = mongoose.model<IConsentRecord>(
  "ConsentRecord",
  consentRecordSchema
);
