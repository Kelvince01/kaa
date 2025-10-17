import type mongoose from "mongoose";
import type { Document } from "mongoose";

export interface ITicket extends Document {
  memberId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "open"
    | "in_progress"
    | "waiting_for_customer"
    | "resolved"
    | "closed";
  category:
    | "technical"
    | "billing"
    | "feature_request"
    | "bug_report"
    | "general";
  assignedTo?: mongoose.Types.ObjectId;
  tags: string[];
  attachments: Array<{
    filename: string;
    url: string;
    size: number;
    uploadedAt: Date;
  }>;
  messages: Array<{
    id: string;
    from: mongoose.Types.ObjectId;
    fromType: "user" | "agent";
    content: string;
    isInternal: boolean;
    createdAt: Date;
  }>;
  resolution?: {
    resolvedBy: mongoose.Types.ObjectId;
    resolvedAt: Date;
    resolution: string;
    satisfactionRating?: number;
    feedback?: string;
  };
  slaBreached: boolean;
  responseTime?: number;
  resolutionTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKnowledgeBase extends Document {
  memberId?: mongoose.Types.ObjectId; // null for global articles
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  isPublished: boolean;
  views: number;
  helpful: number;
  notHelpful: number;
  author: mongoose.Types.ObjectId;
  lastUpdatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerHealth extends Document {
  memberId: mongoose.Types.ObjectId;
  healthScore: number; // 0-100
  factors: {
    usage: number;
    engagement: number;
    support: number;
    billing: number;
    feature_adoption: number;
  };
  riskLevel: "low" | "medium" | "high" | "critical";
  lastActivity: Date;
  trends: {
    usage_trend: "increasing" | "stable" | "decreasing";
    engagement_trend: "increasing" | "stable" | "decreasing";
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: "low" | "medium" | "high";
    createdAt: Date;
  }>;
  calculatedAt: Date;
  createdAt: Date;
}
