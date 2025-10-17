import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum WorkOrderStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum WorkOrderPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  EMERGENCY = "emergency",
}

export enum WorkOrderType {
  MAINTENANCE_REQUEST = "maintenance_request",
  PREVENTIVE_MAINTENANCE = "preventive_maintenance",
  INSPECTION = "inspection",
  REPAIR = "repair",
  INSTALLATION = "installation",
  EMERGENCY = "emergency",
}

export interface IWorkOrderTimeEntry extends BaseDocument {
  startTime: Date;
  endTime?: Date;
  description: string;
  contractor: mongoose.Types.ObjectId;
  hourlyRate?: number;
  totalHours?: number;
  totalCost?: number;
}

export interface IWorkOrderMaterial extends BaseDocument {
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  partNumber?: string;
}

export interface IWorkOrderUpdate extends BaseDocument {
  message: string;
  updatedBy: mongoose.Types.ObjectId;
  status?: WorkOrderStatus;
  attachments?: Array<{
    url: string;
    fileName: string;
    fileType: string;
    size: number;
  }>;
}

export interface IWorkOrder extends BaseDocument {
  workOrderNumber: string;
  title: string;
  description: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;

  // Related entities
  property: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  maintenanceRequest?: mongoose.Types.ObjectId;
  assignedContractor?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;

  // Scheduling
  scheduledDate?: Date;
  estimatedDuration?: number; // in hours
  actualStartDate?: Date;
  actualEndDate?: Date;

  // Cost tracking
  estimatedCost?: number;
  laborCost?: number;
  materialCost?: number;
  totalCost?: number;

  // Time and materials
  timeEntries: IWorkOrderTimeEntry[];
  materials: IWorkOrderMaterial[];

  // Updates and communication
  updates: IWorkOrderUpdate[];

  // Completion details
  completionNotes?: string;
  completionPhotos?: Array<{
    url: string;
    fileName: string;
    description?: string;
  }>;

  // Quality assurance
  qualityCheckRequired: boolean;
  qualityCheckCompleted?: boolean;
  qualityCheckBy?: mongoose.Types.ObjectId;
  qualityCheckDate?: Date;
  qualityCheckNotes?: string;

  // Recurring work orders
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
    interval: number;
    nextDate?: Date;
    endDate?: Date;
  };

  // Additional fields
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
}
