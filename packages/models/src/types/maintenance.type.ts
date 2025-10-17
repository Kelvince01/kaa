import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum MaintenanceStatus {
  PENDING = "pending",
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum MaintenancePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  EMERGENCY = "emergency",
}

export enum MaintenanceType {
  PLUMBING = "plumbing",
  ELECTRICAL = "electrical",
  HEATING = "heating",
  APPLIANCE = "appliance",
  STRUCTURAL = "structural",
  PEST_CONTROL = "pest_control",
  CLEANING = "cleaning",
  GENERAL = "general",
  OTHER = "other",
}

export interface IMaintenanceUpdate extends BaseDocument {
  message: string;
  updatedBy: mongoose.Types.ObjectId;
  status?: MaintenanceStatus;
  scheduledDate?: Date;
  attachments?: Array<{
    url: string;
    fileName: string;
    fileType: string;
    size: number;
  }>;
}

export interface IMaintenance extends BaseDocument {
  property: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  statusUpdatedAt: Date;
  notificationSent: boolean;
  title: string;
  description: string;
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  updates: IMaintenanceUpdate[];
  attachments: Array<{
    url: string;
    fileName: string;
    fileType: string;
    size: number;
  }>;
  scheduledDate?: Date;
  completedDate?: Date;
  assignedContractor?: {
    name: string;
    phone?: string;
    email?: string;
    company?: string;
  };
  estimatedCost?: number;
  cost?: number;
  workOrderNumber?: string;
  paidBy?: "landlord" | "tenant";
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: "weekly" | "monthly" | "quarterly" | "yearly";
    interval: number;
    nextDate: Date;
  };
  notes?: string;
}
