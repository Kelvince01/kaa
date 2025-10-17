import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";
import type { IDocument } from "./document.type";
import type { IMessage } from "./message.type";
import type { IProperty } from "./property.type";
import type { IUser } from "./user.type";

/**
 * Application status enum
 */
export enum ApplicationStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  IN_REVIEW = "in_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  WITHDRAWN = "withdrawn",
}

/**
 * Timeline event status enum
 */
export enum TimelineEventStatus {
  COMPLETED = "completed",
  IN_PROGRESS = "in_progress",
  WARNING = "warning",
  ERROR = "error",
}

/**
 * Application timeline event interface
 */
export type IApplicationTimelineEvent = {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  status: TimelineEventStatus;
  actor?: mongoose.Types.ObjectId | IUser;
};

/**
 * Application interface
 */
export interface IApplication extends BaseDocument {
  property: mongoose.Types.ObjectId | IProperty;
  tenant: mongoose.Types.ObjectId | IUser;
  status: ApplicationStatus;
  documents: Array<mongoose.Types.ObjectId | IDocument>;
  moveInDate: Date;
  offerAmount?: number;
  notes?: string;
  timeline: IApplicationTimelineEvent[];
  appliedAt: Date;
  messages?: Array<mongoose.Types.ObjectId | IMessage>;
  landlord?: mongoose.Types.ObjectId | IUser;
  rejectionReason?: string;
  approvedBy?: mongoose.Types.ObjectId | IUser;
  approvedAt?: Date;
  isExpired?: boolean;
  expiresAt?: Date;
}

/**
 * Application input for creation
 */
export type ApplicationCreateInput = {
  property: string;
  moveInDate: Date;
  offerAmount?: number;
  notes?: string;
  documents?: string[];
};

/**
 * Application input for update
 */
export type ApplicationUpdateInput = {
  status?: ApplicationStatus;
  moveInDate?: Date;
  offerAmount?: number;
  notes?: string;
  documents?: string[];
  rejectionReason?: string;
};
