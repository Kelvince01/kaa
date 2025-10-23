/**
 * Property Inspection Types
 *
 * This module provides type definitions for property inspection management
 * including inspection scheduling, tracking, and reporting.
 */

/**
 * Inspection status enumeration
 */
export enum InspectionStatus {
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  RESCHEDULED = "rescheduled",
}

/**
 * Inspection type enumeration
 */
export enum InspectionType {
  ROUTINE = "routine",
  MOVE_IN = "move_in",
  MOVE_OUT = "move_out",
  MAINTENANCE = "maintenance",
  SAFETY = "safety",
}

/**
 * Inspection attachment interface
 */
export type InspectionAttachment = {
  fileName: string;
  fileType: string;
  url: string;
  uploadedAt: string;
  description?: string;
  size?: number;
};

/**
 * Main property inspection interface
 */
export type PropertyInspection = {
  _id: string;
  property: string;
  scheduledDate: string;
  actualDate?: string;
  inspector: string;
  tenant?: string;
  type: InspectionType;
  status: InspectionStatus;
  notes?: string;
  findings?: string;
  recommendations?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  createdBy: string;
  updatedBy?: string;
  notificationSent: boolean;
  tenantConfirmed: boolean;
  attachments?: InspectionAttachment[];
  conditionReportId?: string;
  createdAt: string;
  updatedAt: string;

  // Additional fields for frontend
  propertyTitle?: string;
  tenantName?: string;
  inspectorName?: string;
  duration?: number; // in minutes
  checklist?: InspectionChecklistItem[];
};

/**
 * Inspection checklist item interface
 */
export type InspectionChecklistItem = {
  _id?: string;
  category: string;
  item: string;
  status: "good" | "fair" | "poor" | "needs_attention" | "not_applicable";
  notes?: string;
  photos?: string[];
  priority?: "low" | "medium" | "high";
};

/**
 * Inspection creation input
 */
export type CreateInspectionInput = {
  propertyId: string;
  scheduledDate: string;
  inspectorId: string;
  tenantId?: string;
  type: InspectionType;
  notes?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  notifyTenant?: boolean;
  checklist?: Omit<InspectionChecklistItem, "_id">[];
};

/**
 * Inspection update input
 */
export type UpdateInspectionInput = {
  scheduledDate?: string;
  actualDate?: string;
  inspectorId?: string;
  tenantId?: string;
  type?: InspectionType;
  status?: InspectionStatus;
  notes?: string;
  findings?: string;
  recommendations?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  notificationSent?: boolean;
  tenantConfirmed?: boolean;
  checklist?: InspectionChecklistItem[];
};

/**
 * Inspection completion input
 */
export type CompleteInspectionInput = {
  actualDate: string;
  findings: string;
  recommendations?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  checklist: InspectionChecklistItem[];
  attachments?: File[];
};

/**
 * Inspection reschedule input
 */
export type RescheduleInspectionInput = {
  newScheduledDate: string;
  reason: string;
  notifyParticipants?: boolean;
};

/**
 * Inspection query parameters
 */
export type InspectionQueryParams = {
  property?: string;
  inspector?: string;
  tenant?: string;
  type?: InspectionType;
  status?: InspectionStatus;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  followUpRequired?: boolean;
  search?: string;
  sortBy?: "scheduledDate" | "createdAt" | "updatedAt" | "status" | "type";
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
};

/**
 * Inspection filters
 */
export type InspectionFilters = {
  status?: InspectionStatus[];
  type?: InspectionType[];
  propertyIds?: string[];
  inspectorIds?: string[];
  tenantIds?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
    field: "scheduledDate" | "actualDate" | "createdAt";
  };
  followUpRequired?: boolean;
  overdue?: boolean;
  upcomingDays?: number;
};

/**
 * Inspection statistics
 */
export type InspectionStats = {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  overdue: number;
  upcoming: number;
  completionRate: number;
  averageDuration: number;
  followUpsRequired: number;
};

/**
 * Inspection calendar event
 */
export type InspectionCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status: InspectionStatus;
  type: InspectionType;
  propertyAddress: string;
  inspectorName: string;
  tenantName?: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    inspection: PropertyInspection;
  };
};

/**
 * Inspection template
 */
export type InspectionTemplate = {
  _id: string;
  name: string;
  description?: string;
  type: InspectionType;
  checklist: Omit<
    InspectionChecklistItem,
    "_id" | "status" | "notes" | "photos"
  >[];
  estimatedDuration: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Inspection report
 */
export type InspectionReport = {
  _id: string;
  inspection: string;
  generatedAt: string;
  reportType: "summary" | "detailed" | "checklist";
  content: {
    summary?: string;
    findings: string;
    recommendations: string;
    checklist: InspectionChecklistItem[];
    photos: string[];
    signature?: {
      inspector: string;
      tenant?: string;
      landlord?: string;
    };
  };
  pdfUrl?: string;
};

/**
 * Pagination interface
 */
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/**
 * Base API response interface
 */
export type ApiResponse<T> = {
  status: "success" | "error";
  message?: string;
  data?: T;
};

/**
 * Inspection API responses
 */
export interface InspectionResponse extends ApiResponse<PropertyInspection> {
  inspection?: PropertyInspection;
}

export interface InspectionListResponse
  extends ApiResponse<PropertyInspection[]> {
  inspections?: PropertyInspection[];
  items?: PropertyInspection[];
  pagination: Pagination;
}

export interface InspectionStatsResponse extends ApiResponse<InspectionStats> {
  stats?: InspectionStats;
}

export interface InspectionTemplatesResponse
  extends ApiResponse<InspectionTemplate[]> {
  templates?: InspectionTemplate[];
}

export interface InspectionReportResponse
  extends ApiResponse<InspectionReport> {
  report?: InspectionReport;
}

/**
 * Inspector availability
 */
export type InspectorAvailability = {
  inspectorId: string;
  inspectorName: string;
  availableSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
  }>;
  booked: Array<{
    date: string;
    startTime: string;
    endTime: string;
    inspectionId: string;
  }>;
};

/**
 * Bulk inspection operations
 */
export type BulkInspectionOperation = {
  inspectionIds: string[];
  operation:
    | "reschedule"
    | "cancel"
    | "assign_inspector"
    | "send_notifications";
  data?: {
    newDate?: string;
    inspectorId?: string;
    reason?: string;
  };
};

/**
 * Inspection notification settings
 */
export type InspectionNotificationSettings = {
  enabled: boolean;
  reminderDays: number[];
  sendToTenant: boolean;
  sendToLandlord: boolean;
  sendToInspector: boolean;
  channels: ("email" | "sms" | "push")[];
};

/**
 * Inspection recurrence pattern
 */
export type InspectionRecurrence = {
  frequency: "monthly" | "quarterly" | "semi_annually" | "annually";
  interval: number;
  endDate?: string;
  maxOccurrences?: number;
  nextDueDate?: string;
};

/**
 * Recurring inspection template
 */
export type RecurringInspection = {
  _id: string;
  name: string;
  propertyId: string;
  inspectorId: string;
  type: InspectionType;
  recurrence: InspectionRecurrence;
  template: InspectionTemplate;
  isActive: boolean;
  lastGenerated?: string;
  nextDue: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
