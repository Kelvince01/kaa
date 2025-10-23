/**
 * Work Orders Types
 *
 * This module provides type definitions for work order management
 * including creation, tracking, scheduling, and completion of maintenance work.
 */

/**
 * Work order status enumeration
 */
export enum WorkOrderStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

/**
 * Work order priority enumeration
 */
export enum WorkOrderPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  EMERGENCY = "emergency",
}

/**
 * Work order type enumeration
 */
export enum WorkOrderType {
  MAINTENANCE_REQUEST = "maintenance_request",
  PREVENTIVE_MAINTENANCE = "preventive_maintenance",
  INSPECTION = "inspection",
  REPAIR = "repair",
  INSTALLATION = "installation",
  EMERGENCY = "emergency",
}

/**
 * Work order time entry interface
 */
export type WorkOrderTimeEntry = {
  _id: string;
  startTime: string;
  endTime?: string;
  description: string;
  contractor: string;
  hourlyRate?: number;
  totalHours?: number;
  totalCost?: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Work order material interface
 */
export type WorkOrderMaterial = {
  _id: string;
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  partNumber?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Work order update interface
 */
export type WorkOrderUpdate = {
  _id: string;
  message: string;
  updatedBy: string;
  status?: WorkOrderStatus;
  attachments?: WorkOrderAttachment[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Work order attachment interface
 */
export type WorkOrderAttachment = {
  url: string;
  fileName: string;
  fileType: string;
  size: number;
  description?: string;
  uploadedAt: string;
  uploadedBy?: string;
};

/**
 * Recurrence pattern interface
 */
export type RecurrencePattern = {
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  interval: number;
  nextDate?: string;
  endDate?: string;
  maxOccurrences?: number;
};

/**
 * Quality check interface
 */
export type QualityCheck = {
  required: boolean;
  completed?: boolean;
  completedBy?: string;
  completedDate?: string;
  notes?: string;
  rating?: number;
  checklist?: Array<{
    item: string;
    checked: boolean;
    notes?: string;
  }>;
};

/**
 * Main work order interface
 */
export type WorkOrder = {
  _id: string;
  workOrderNumber: string;
  title: string;
  description: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;

  // Related entities
  property: string;
  unit?: string;
  maintenanceRequest?: string;
  assignedContractor?: string;
  createdBy: string;

  // Scheduling
  scheduledDate?: string;
  estimatedDuration?: number; // in hours
  actualStartDate?: string;
  actualEndDate?: string;

  // Cost tracking
  estimatedCost?: number;
  laborCost?: number;
  materialCost?: number;
  totalCost?: number;

  // Time and materials
  timeEntries: WorkOrderTimeEntry[];
  materials: WorkOrderMaterial[];

  // Updates and communication
  updates: WorkOrderUpdate[];

  // Completion details
  completionNotes?: string;
  completionPhotos?: WorkOrderAttachment[];

  // Quality assurance
  qualityCheck?: QualityCheck;

  // Recurring work orders
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  parentWorkOrder?: string;
  childWorkOrders?: string[];

  // Additional fields
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
  urgentContact?: {
    name: string;
    phone: string;
    email?: string;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Additional frontend fields
  propertyTitle?: string;
  propertyAddress?: string;
  contractorName?: string;
  requestorName?: string;
  isOverdue?: boolean;
  daysOverdue?: number;
};

/**
 * Work order creation input
 */
export type CreateWorkOrderInput = {
  title: string;
  description: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  propertyId: string;
  unitId?: string;
  maintenanceRequestId?: string;
  assignedContractorId?: string;
  scheduledDate?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  tags?: string[];
  notes?: string;
  urgentContact?: {
    name: string;
    phone: string;
    email?: string;
  };
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  qualityCheckRequired?: boolean;
};

/**
 * Work order update input
 */
export type UpdateWorkOrderInput = {
  title?: string;
  description?: string;
  type?: WorkOrderType;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  assignedContractorId?: string;
  scheduledDate?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  actualStartDate?: string;
  actualEndDate?: string;
  completionNotes?: string;
  tags?: string[];
  notes?: string;
  urgentContact?: {
    name: string;
    phone: string;
    email?: string;
  };
  qualityCheck?: Partial<QualityCheck>;
};

/**
 * Work order assignment input
 */
export type AssignWorkOrderInput = {
  contractorId: string;
  scheduledDate?: string;
  estimatedDuration?: number;
  notes?: string;
  notifyContractor?: boolean;
};

/**
 * Work order completion input
 */
export type CompleteWorkOrderInput = {
  completionNotes: string;
  actualEndDate?: string;
  timeEntries?: Omit<WorkOrderTimeEntry, "_id" | "createdAt" | "updatedAt">[];
  materials?: Omit<WorkOrderMaterial, "_id" | "createdAt" | "updatedAt">[];
  attachments?: File[];
  qualityCheck?: Partial<QualityCheck>;
};

/**
 * Add time entry input
 */
export type AddTimeEntryInput = {
  startTime: string;
  endTime?: string;
  description: string;
  contractorId: string;
  hourlyRate?: number;
};

/**
 * Add material input
 */
export type AddMaterialInput = {
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
  partNumber?: string;
};

/**
 * Add update input
 */
export type AddUpdateInput = {
  message: string;
  status?: WorkOrderStatus;
  attachments?: File[];
};

/**
 * Work order query parameters
 */
export type WorkOrderQueryParams = {
  property?: string;
  unit?: string;
  contractor?: string;
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  type?: WorkOrderType;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  search?: string;
  tags?: string[];
  overdue?: boolean;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "scheduledDate"
    | "priority"
    | "status"
    | "workOrderNumber";
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
};

/**
 * Work order filters
 */
export type WorkOrderFilters = {
  status?: WorkOrderStatus[];
  priority?: WorkOrderPriority[];
  type?: WorkOrderType[];
  propertyIds?: string[];
  unitIds?: string[];
  contractorIds?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
    field: "scheduledDate" | "createdAt" | "actualStartDate" | "actualEndDate";
  };
  costRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  overdue?: boolean;
  unassigned?: boolean;
  qualityCheckRequired?: boolean;
};

/**
 * Work order statistics
 */
export type WorkOrderStats = {
  total: number;
  draft: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  unassigned: number;

  // Priority breakdown
  emergency: number;
  high: number;
  medium: number;
  low: number;

  // Cost statistics
  totalCost: number;
  averageCost: number;
  laborCostTotal: number;
  materialCostTotal: number;

  // Performance metrics
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  qualityCheckPassRate: number;

  // Upcoming work
  dueToday: number;
  dueThisWeek: number;
  dueThisMonth: number;
};

/**
 * Work order calendar event
 */
export type WorkOrderCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  propertyAddress: string;
  contractorName?: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    workOrder: WorkOrder;
  };
};

/**
 * Bulk work order operation
 */
export type BulkWorkOrderOperation = {
  workOrderIds: string[];
  operation:
    | "assign"
    | "reschedule"
    | "cancel"
    | "change_priority"
    | "change_status"
    | "add_tags"
    | "remove_tags";
  data?: {
    contractorId?: string;
    newDate?: string;
    priority?: WorkOrderPriority;
    status?: WorkOrderStatus;
    tags?: string[];
    reason?: string;
  };
};

/**
 * Work order template
 */
export type WorkOrderTemplate = {
  _id: string;
  name: string;
  description?: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  estimatedDuration?: number;
  estimatedCost?: number;
  instructions: string;
  checklist?: Array<{
    item: string;
    required: boolean;
    category?: string;
  }>;
  requiredMaterials?: Array<{
    name: string;
    quantity: number;
    estimatedCost: number;
  }>;
  tags?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Recurring work order schedule
 */
export type RecurringWorkOrder = {
  _id: string;
  name: string;
  description?: string;
  template: WorkOrderTemplate;
  propertyId: string;
  unitId?: string;
  contractorId?: string;
  recurrencePattern: RecurrencePattern;
  isActive: boolean;
  lastGenerated?: string;
  nextDue: string;
  generatedCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Work order cost breakdown
 */
export type WorkOrderCostBreakdown = {
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  overheadCost: number;
  totalCost: number;
  costByCategory: Record<string, number>;
  timeSpent: number;
  efficiency: number;
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
 * Work order API responses
 */
export interface WorkOrderResponse extends ApiResponse<WorkOrder> {
  workOrder?: WorkOrder;
}

export interface WorkOrderListResponse extends ApiResponse<WorkOrder[]> {
  workOrders?: WorkOrder[];
  items?: WorkOrder[];
  pagination: Pagination;
}

export interface WorkOrderStatsResponse extends ApiResponse<WorkOrderStats> {
  stats?: WorkOrderStats;
}

export interface WorkOrderTemplatesResponse
  extends ApiResponse<WorkOrderTemplate[]> {
  templates?: WorkOrderTemplate[];
}

export interface RecurringWorkOrdersResponse
  extends ApiResponse<RecurringWorkOrder[]> {
  recurringWorkOrders?: RecurringWorkOrder[];
}

export interface WorkOrderCostBreakdownResponse
  extends ApiResponse<WorkOrderCostBreakdown> {
  costBreakdown?: WorkOrderCostBreakdown;
}

/**
 * Work order notification settings
 */
export type WorkOrderNotificationSettings = {
  enableAssignmentNotifications: boolean;
  enableStatusChangeNotifications: boolean;
  enableOverdueNotifications: boolean;
  enableCompletionNotifications: boolean;
  reminderDays: number[];
  notificationChannels: ("email" | "sms" | "push")[];
  contractorNotifications: boolean;
  tenantNotifications: boolean;
};

/**
 * Contractor availability
 */
export type ContractorAvailability = {
  contractorId: string;
  contractorName: string;
  specialties: string[];
  hourlyRate?: number;
  availableSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
  }>;
  bookedSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    workOrderId: string;
    workOrderTitle: string;
  }>;
  rating: number;
  totalJobs: number;
  onTimePercentage: number;
};

/**
 * Work order export options
 */
export type WorkOrderExportOptions = {
  format: "csv" | "xlsx" | "pdf";
  includeTimeEntries: boolean;
  includeMaterials: boolean;
  includeUpdates: boolean;
  includeAttachments: boolean;
  fields: string[];
  filters?: WorkOrderFilters;
};

/**
 * Work order report
 */
export type WorkOrderReport = {
  _id: string;
  workOrder: string;
  reportType:
    | "completion"
    | "cost_breakdown"
    | "time_tracking"
    | "quality_check";
  generatedAt: string;
  generatedBy: string;
  content: {
    summary?: string;
    details: Record<string, any>;
    attachments?: string[];
  };
  pdfUrl?: string;
};
