import mongoose, { Schema } from "mongoose";
import type {
  ICustomerHealth,
  IKnowledgeBase,
  ITicket,
} from "./types/support.type";

const ticketSchema = new Schema<ITicket>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: [
        "open",
        "in_progress",
        "waiting_for_customer",
        "resolved",
        "closed",
      ],
      default: "open",
    },
    category: {
      type: String,
      enum: [
        "technical",
        "billing",
        "feature_request",
        "bug_report",
        "general",
      ],
      required: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    tags: [String],
    attachments: [
      {
        filename: String,
        url: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    messages: [
      {
        id: {
          type: String,
          default: () => new mongoose.Types.ObjectId().toString(),
        },
        from: { type: Schema.Types.ObjectId, ref: "User", required: true },
        fromType: { type: String, enum: ["user", "agent"], required: true },
        content: { type: String, required: true },
        isInternal: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolution: {
      resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      resolvedAt: Date,
      resolution: String,
      satisfactionRating: { type: Number, min: 1, max: 5 },
      feedback: String,
    },
    slaBreached: { type: Boolean, default: false },
    responseTime: Number, // in minutes
    resolutionTime: Number, // in minutes
  },
  {
    timestamps: true,
  }
);

// Indexes
ticketSchema.index({ memberId: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

export const Ticket = mongoose.model<ITicket>("Ticket", ticketSchema);

const knowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    tags: [String],
    isPublic: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

// Text search index
knowledgeBaseSchema.index({ title: "text", content: "text", tags: "text" });

export const KnowledgeBase = mongoose.model<IKnowledgeBase>(
  "KnowledgeBase",
  knowledgeBaseSchema
);

const customerHealthSchema = new Schema<ICustomerHealth>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      unique: true,
    },
    healthScore: { type: Number, required: true, min: 0, max: 100 },
    factors: {
      usage: { type: Number, required: true },
      engagement: { type: Number, required: true },
      support: { type: Number, required: true },
      billing: { type: Number, required: true },
      feature_adoption: { type: Number, required: true },
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    lastActivity: { type: Date, required: true },
    trends: {
      usage_trend: {
        type: String,
        enum: ["increasing", "stable", "decreasing"],
        required: true,
      },
      engagement_trend: {
        type: String,
        enum: ["increasing", "stable", "decreasing"],
        required: true,
      },
    },
    alerts: [
      {
        type: String,
        message: String,
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    calculatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const CustomerHealth = mongoose.model<ICustomerHealth>(
  "CustomerHealth",
  customerHealthSchema
);
