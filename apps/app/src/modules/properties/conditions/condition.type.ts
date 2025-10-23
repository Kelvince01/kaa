/**
 * Property Conditions Types
 *
 * This module provides type definitions for property condition management
 * including condition reports, assessments, and inventory tracking.
 */

/**
 * Condition status enumeration
 */
export enum ConditionStatus {
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
  DAMAGED = "damaged",
}

/**
 * Report type enumeration
 */
export enum ReportType {
  CHECK_IN = "check_in",
  CHECK_OUT = "check_out",
  INSPECTION = "inspection",
  INVENTORY = "inventory",
  MAINTENANCE = "maintenance",
  PERIODIC = "periodic",
}

/**
 * Condition item category enumeration
 */
export enum ConditionCategory {
  STRUCTURE = "structure",
  INTERIOR = "interior",
  EXTERIOR = "exterior",
  ELECTRICAL = "electrical",
  PLUMBING = "plumbing",
  HEATING = "heating",
  APPLIANCES = "appliances",
  FIXTURES = "fixtures",
  FLOORING = "flooring",
  WALLS = "walls",
  WINDOWS = "windows",
  DOORS = "doors",
  GARDEN = "garden",
  OTHER = "other",
}

/**
 * Condition item photo interface
 */
export type ConditionPhoto = {
  url: string;
  fileName: string;
  fileType: string;
  size: number;
  caption?: string;
  timestamp: string;
  uploadedBy?: string;
};

/**
 * Individual condition item interface
 */
export type ConditionItem = {
  _id?: string;
  name: string;
  category: ConditionCategory;
  status: ConditionStatus;
  description?: string;
  photos?: ConditionPhoto[];
  notes?: string;
  priority?: "low" | "medium" | "high";
  location?: string;
  quantity?: number;
  estimatedCost?: number;
  actionRequired?: boolean;
  actionDescription?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Signature interface
 */
export type ConditionSignature = {
  signedBy: string;
  signedByName: string;
  signedAt: string;
  signatureType: "digital" | "electronic" | "wet";
  signatureData?: string;
  role: "tenant" | "landlord" | "inspector" | "witness";
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Comparison data interface
 */
export type ConditionComparison = {
  itemId: string;
  itemName: string;
  category: ConditionCategory;
  previousStatus: ConditionStatus;
  currentStatus: ConditionStatus;
  previousPhotos?: ConditionPhoto[];
  currentPhotos?: ConditionPhoto[];
  statusChanged: boolean;
  improvementOrDeterioration: "improvement" | "deterioration" | "unchanged";
  notes?: string;
};

/**
 * Main property condition interface
 */
export type PropertyCondition = {
  _id: string;
  property: string;
  unit?: string;
  tenant?: string;
  landlord: string;
  inspector?: string;
  reportType: ReportType;
  reportDate: string;
  items: ConditionItem[];
  overallCondition: ConditionStatus;
  notes: string;

  // Signatures
  signedByTenant: boolean;
  signedByLandlord: boolean;
  signedByInspector?: boolean;
  tenantSignatureDate?: string;
  landlordSignatureDate?: string;
  inspectorSignatureDate?: string;
  signatures: ConditionSignature[];

  // Metadata
  createdBy: string;
  lastModifiedBy?: string;

  // Attachments
  attachments?: ConditionPhoto[];

  // Comparison with previous report
  previousReport?: string;
  comparisonData?: ConditionComparison[];

  // Status and workflow
  status:
    | "draft"
    | "pending_signatures"
    | "completed"
    | "disputed"
    | "archived";
  isDisputed?: boolean;
  disputeReason?: string;
  disputeDate?: string;
  disputeResolvedDate?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;

  // Additional frontend fields
  propertyTitle?: string;
  propertyAddress?: string;
  tenantName?: string;
  landlordName?: string;
  inspectorName?: string;
  totalItemsCount?: number;
  damagedItemsCount?: number;
  excellentItemsCount?: number;
};

/**
 * Condition report creation input
 */
export type CreateConditionReportInput = {
  propertyId: string;
  unitId?: string;
  tenantId?: string;
  reportType: ReportType;
  reportDate?: string;
  items: Omit<ConditionItem, "_id" | "createdAt" | "updatedAt">[];
  notes?: string;
  overallCondition?: ConditionStatus;
  previousReportId?: string;
};

/**
 * Condition report update input
 */
export type UpdateConditionReportInput = {
  reportType?: ReportType;
  reportDate?: string;
  items?: ConditionItem[];
  notes?: string;
  overallCondition?: ConditionStatus;
  status?:
    | "draft"
    | "pending_signatures"
    | "completed"
    | "disputed"
    | "archived";
  disputeReason?: string;
};

/**
 * Add condition item input
 */
export type AddConditionItemInput = {
  name: string;
  category: ConditionCategory;
  status: ConditionStatus;
  description?: string;
  notes?: string;
  priority?: "low" | "medium" | "high";
  location?: string;
  quantity?: number;
  estimatedCost?: number;
  actionRequired?: boolean;
  actionDescription?: string;
};

/**
 * Update condition item input
 */
export type UpdateConditionItemInput = {
  name?: string;
  category?: ConditionCategory;
  status?: ConditionStatus;
  description?: string;
  notes?: string;
  priority?: "low" | "medium" | "high";
  location?: string;
  quantity?: number;
  estimatedCost?: number;
  actionRequired?: boolean;
  actionDescription?: string;
};

/**
 * Sign condition report input
 */
export type SignConditionReportInput = {
  signatureType: "digital" | "electronic" | "wet";
  signatureData?: string;
  role: "tenant" | "landlord" | "inspector";
};

/**
 * Dispute condition report input
 */
export type DisputeConditionReportInput = {
  reason: string;
  itemIds?: string[];
  proposedChanges?: Array<{
    itemId: string;
    proposedStatus: ConditionStatus;
    reason: string;
  }>;
};

/**
 * Condition query parameters
 */
export type ConditionQueryParams = {
  property?: string;
  unit?: string;
  tenant?: string;
  landlord?: string;
  inspector?: string;
  reportType?: ReportType;
  status?:
    | "draft"
    | "pending_signatures"
    | "completed"
    | "disputed"
    | "archived";
  overallCondition?: ConditionStatus;
  reportDateFrom?: string;
  reportDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  search?: string;
  signedByTenant?: boolean;
  signedByLandlord?: boolean;
  disputed?: boolean;
  sortBy?:
    | "reportDate"
    | "createdAt"
    | "updatedAt"
    | "overallCondition"
    | "status";
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
};

/**
 * Condition filters
 */
export type ConditionFilters = {
  status?: (
    | "draft"
    | "pending_signatures"
    | "completed"
    | "disputed"
    | "archived"
  )[];
  reportType?: ReportType[];
  overallCondition?: ConditionStatus[];
  propertyIds?: string[];
  unitIds?: string[];
  tenantIds?: string[];
  landlordIds?: string[];
  inspectorIds?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
    field: "reportDate" | "createdAt" | "completedAt";
  };
  categories?: ConditionCategory[];
  itemStatuses?: ConditionStatus[];
  signatureStatus?: "all_signed" | "pending_signatures" | "unsigned";
  disputed?: boolean;
  actionRequired?: boolean;
};

/**
 * Condition statistics
 */
export type ConditionStats = {
  total: number;
  draft: number;
  pendingSignatures: number;
  completed: number;
  disputed: number;
  archived: number;

  // By report type
  checkIn: number;
  checkOut: number;
  inspection: number;
  inventory: number;
  maintenance: number;
  periodic: number;

  // By condition status
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  damaged: number;

  // By category
  byCategory: Record<
    ConditionCategory,
    {
      total: number;
      excellent: number;
      good: number;
      fair: number;
      poor: number;
      damaged: number;
    }
  >;

  // Performance metrics
  averageReportCompletionTime: number;
  signatureCompletionRate: number;
  disputeRate: number;
  actionRequiredItems: number;
  totalEstimatedCosts: number;
};

/**
 * Condition template
 */
export type ConditionTemplate = {
  _id: string;
  name: string;
  description?: string;
  reportType: ReportType;
  propertyType?: string;
  categories: ConditionCategory[];
  items: Array<{
    name: string;
    category: ConditionCategory;
    description?: string;
    isRequired: boolean;
    defaultStatus?: ConditionStatus;
  }>;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Bulk condition operations
 */
export type BulkConditionOperation = {
  reportIds: string[];
  operation:
    | "archive"
    | "delete"
    | "change_status"
    | "assign_inspector"
    | "export";
  data?: {
    status?:
      | "draft"
      | "pending_signatures"
      | "completed"
      | "disputed"
      | "archived";
    inspectorId?: string;
    reason?: string;
    format?: "pdf" | "csv" | "xlsx";
  };
};

/**
 * Condition export options
 */
export type ConditionExportOptions = {
  format: "pdf" | "csv" | "xlsx";
  includePhotos: boolean;
  includeSignatures: boolean;
  includeComparisons: boolean;
  template?: string;
  filters?: ConditionFilters;
  groupBy?: "property" | "tenant" | "date" | "reportType";
};

/**
 * Condition notification settings
 */
export type ConditionNotificationSettings = {
  enableReportCreated: boolean;
  enableSignatureRequests: boolean;
  enableReportCompleted: boolean;
  enableDisputes: boolean;
  enableReminders: boolean;
  reminderDays: number[];
  channels: ("email" | "sms" | "push")[];
  notifyTenants: boolean;
  notifyLandlords: boolean;
  notifyInspectors: boolean;
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
 * Condition API responses
 */
export interface ConditionResponse extends ApiResponse<PropertyCondition> {
  condition?: PropertyCondition;
  report?: PropertyCondition;
}

export interface ConditionListResponse
  extends ApiResponse<PropertyCondition[]> {
  conditions?: PropertyCondition[];
  reports?: PropertyCondition[];
  items?: PropertyCondition[];
  pagination: Pagination;
}

export interface ConditionStatsResponse extends ApiResponse<ConditionStats> {
  stats?: ConditionStats;
}

export interface ConditionTemplatesResponse
  extends ApiResponse<ConditionTemplate[]> {
  templates?: ConditionTemplate[];
}

export interface ConditionComparisonResponse
  extends ApiResponse<ConditionComparison[]> {
  comparison?: ConditionComparison[];
  changes?: ConditionComparison[];
}

/**
 * Condition audit log
 */
export type ConditionAuditLog = {
  _id: string;
  reportId: string;
  action: string;
  userId: string;
  timestamp: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
};

/**
 * Property condition summary
 */
export type PropertyConditionSummary = {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  latestReport?: PropertyCondition;
  reportCount: number;
  averageCondition: ConditionStatus;
  lastInspectionDate?: string;
  nextInspectionDue?: string;
  actionRequiredCount: number;
  totalEstimatedCosts: number;
  improvementTrend: "improving" | "deteriorating" | "stable";
};

/**
 * Condition item trend
 */
export type ConditionItemTrend = {
  itemName: string;
  category: ConditionCategory;
  location?: string;
  statusHistory: Array<{
    status: ConditionStatus;
    reportDate: string;
    reportId: string;
    reportType: ReportType;
  }>;
  trend: "improving" | "deteriorating" | "stable";
  lastChanged: string;
  actionRecommended: boolean;
  estimatedCost?: number;
};
