import type {
  ICreateReportRequest,
  ReportFormat,
  ReportFrequency,
  ReportStatus,
  ReportType,
} from "@kaa/models/types";

// Re-export types for convenience
export type {
  ChartType,
  DataSource,
  IChartConfig,
  ICreateReportRequest,
  IExecuteReportRequest,
  IReportDefinition,
  IReportExecution,
  IReportQuery,
  IReportRecipient,
  IReportSchedule,
  IReportTemplate,
  ReportFormat,
  ReportFrequency,
  ReportPriority,
  ReportStatus,
  ReportType,
  TimeGranularity,
} from "@kaa/models/types";

// API Response Types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
};

export type PaginatedResponse<T> = {
  success: boolean;
  data?: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
};

// Query Parameters
export type ListReportsQuery = {
  page?: number;
  limit?: number;
  status?: string;
  type?: ReportType;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tags?: string;
};

export type ListExecutionsQuery = {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
};

export type ListSchedulesQuery = {
  page?: number;
  limit?: number;
  active?: boolean;
  frequency?: ReportFrequency;
};

export type ListTemplatesQuery = {
  page?: number;
  limit?: number;
  category?: string;
  type?: ReportType;
  isPublic?: boolean;
  search?: string;
};

export type DownloadReportQuery = {
  format?: ReportFormat;
  includeCharts?: boolean;
  includeRawData?: boolean;
  compression?: "zip" | "gzip";
};

export type ReportAnalyticsQuery = {
  period?: "7d" | "30d" | "90d" | "1y";
  startDate?: string;
  endDate?: string;
};

export type BusinessIntelligenceQuery = {
  timeframe?: "7d" | "30d" | "90d" | "1y";
  metrics?: string;
  county?: string;
  propertyType?: string;
  compareWith?: string;
};

export type MarketInsightsQuery = {
  location?: string;
  propertyType?: string;
  priceRange?: string;
  period?: "7d" | "30d" | "90d" | "1y";
  compareWith?: string;
};

// Component Props Types
export type ReportFormData = ICreateReportRequest;

export type ReportExecutionStatus = {
  executionId: string;
  status: ReportStatus;
  progress?: number;
  message?: string;
  error?: string;
};

// UI Helper Types
export type ReportViewMode = "list" | "grid" | "table";

export type ReportFilterState = {
  type?: ReportType;
  status?: ReportStatus;
  search?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
};

export type ReportSortState = {
  field: string;
  order: "asc" | "desc";
};
