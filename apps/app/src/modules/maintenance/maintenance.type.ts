// Maintenance status
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

export type MaintenanceUpdate = {
  _id?: string;
  message: string;
  updatedBy:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
      };
  status?: MaintenanceStatus;
  scheduledDate?: string;
  attachments?: Array<{
    url: string;
    fileName: string;
    fileType: string;
    size: number;
  }>;
};

export type Maintenance = {
  _id: string;
  property: string | any;
  tenant: string | any;
  landlord: string | any;
  statusUpdatedAt: string;
  notificationSent: boolean;
  title: string;
  description: string;
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  updates: MaintenanceUpdate[];
  attachments: Array<{
    url: string;
    fileName: string;
    fileType: string;
    size: number;
  }>;
  scheduledDate?: string;
  completedDate?: string;
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
    nextDate: string;
  };
  notes?: string;
};

export type MaintenanceCreateInput = {
  property: string;
  title: string;
  description: string;
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  attachments?: Array<{
    url: string;
    fileName: string;
    fileType: string;
    size: number;
  }>;
  scheduledDate?: string;
  isRecurring?: boolean;
  recurrencePattern?: {
    frequency: "weekly" | "monthly" | "quarterly" | "yearly";
    interval: number;
    nextDate: string;
  };
  notes?: string;
};

export type MaintenanceUpdateInput = {
  status?: MaintenanceStatus;
  scheduledDate?: string;
  completedDate?: string;
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
  notes?: string;
};

export type MaintenanceListResponse = {
  items: Maintenance[];
  pagination: {
    pages: number;
    total: number;
    page: number;
    limit: number;
  };
  status: "success" | "error";
  message?: string;
};

export type MaintenanceListByUserResponse = {
  data: Maintenance[];
  status: "success" | "error";
  message?: string;
};

export type MaintenanceResponse = {
  data: Maintenance;
  status: "success" | "error";
  message?: string;
};
