import type { Types } from "mongoose";

// Enums
export enum ReportType {
  USER_ANALYTICS = "user_analytics",
  PROPERTY_ANALYTICS = "property_analytics",
  BOOKING_ANALYTICS = "booking_analytics",
  PAYMENT_ANALYTICS = "payment_analytics",
  FINANCIAL_SUMMARY = "financial_summary",
  PLATFORM_PERFORMANCE = "platform_performance",
  MARKETING_METRICS = "marketing_metrics",
  COMPLIANCE_AUDIT = "compliance_audit",
  SECURITY_REPORT = "security_report",
  CUSTOM_QUERY = "custom_query",
  MPESA_TRANSACTIONS = "mpesa_transactions",
  SMS_DELIVERY = "sms_delivery",
  COUNTY_ANALYTICS = "county_analytics",
  TENANT_BEHAVIOR = "tenant_behavior",
  LANDLORD_PERFORMANCE = "landlord_performance",
  PROPERTY_VALUATION = "property_valuation",
  MARKET_TRENDS = "market_trends",
  OPERATIONAL_METRICS = "operational_metrics",
}

export enum ReportFormat {
  PDF = "pdf",
  EXCEL = "excel",
  CSV = "csv",
  JSON = "json",
  HTML = "html",
  CHART_IMAGE = "chart_image",
}

export enum ReportFrequency {
  REAL_TIME = "real_time",
  HOURLY = "hourly",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
  ON_DEMAND = "on_demand",
}

export enum ReportStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  SCHEDULED = "scheduled",
}

export enum DataSource {
  USERS = "users",
  PROPERTIES = "properties",
  BOOKINGS = "bookings",
  PAYMENTS = "payments",
  APPLICATIONS = "applications",
  REVIEWS = "reviews",
  MESSAGES = "messages",
  NOTIFICATIONS = "notifications",
  ANALYTICS = "analytics",
  AUDIT_LOGS = "audit_logs",
  LOCATIONS = "locations",
  FILES = "files",
  COMBINED = "combined",
}

export enum ChartType {
  LINE = "line",
  BAR = "bar",
  PIE = "pie",
  DOUGHNUT = "doughnut",
  AREA = "area",
  SCATTER = "scatter",
  HISTOGRAM = "histogram",
  HEATMAP = "heatmap",
  GAUGE = "gauge",
  FUNNEL = "funnel",
  TREEMAP = "treemap",
  SUNBURST = "sunburst",
  MAP = "map",
}

export enum AggregationType {
  COUNT = "count",
  SUM = "sum",
  AVG = "average",
  MIN = "minimum",
  MAX = "maximum",
  MEDIAN = "median",
  DISTINCT = "distinct",
  PERCENTAGE = "percentage",
  GROWTH_RATE = "growth_rate",
  TREND = "trend",
}

export enum TimeGranularity {
  MINUTE = "minute",
  HOUR = "hour",
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  QUARTER = "quarter",
  YEAR = "year",
}

export enum ReportPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum KenyaCounty {
  NAIROBI = "Nairobi",
  MOMBASA = "Mombasa",
  KISUMU = "Kisumu",
  NAKURU = "Nakuru",
  ELDORET = "Eldoret",
  THIKA = "Thika",
  MACHAKOS = "Machakos",
  MERU = "Meru",
  NYERI = "Nyeri",
  KITALE = "Kitale",
}

export enum ReportDeliveryMethod {
  EMAIL = "email",
  SMS = "sms",
  WEBHOOK = "webhook",
  DASHBOARD = "dashboard",
  API = "api",
  DOWNLOAD = "download",
}

export enum BusinessMetricType {
  REVENUE = "revenue",
  CONVERSION_RATE = "conversion_rate",
  USER_ACQUISITION = "user_acquisition",
  CUSTOMER_LIFETIME_VALUE = "customer_lifetime_value",
  CHURN_RATE = "churn_rate",
  AVERAGE_ORDER_VALUE = "average_order_value",
  OCCUPANCY_RATE = "occupancy_rate",
  PAYMENT_SUCCESS_RATE = "payment_success_rate",
  USER_ENGAGEMENT = "user_engagement",
  MARKET_PENETRATION = "market_penetration",
}

export enum ReportErrorCode {
  DATA_SOURCE_ERROR = "DATA_SOURCE_ERROR",
  QUERY_TIMEOUT = "QUERY_TIMEOUT",
  INSUFFICIENT_DATA = "INSUFFICIENT_DATA",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  GENERATION_FAILED = "GENERATION_FAILED",
  DELIVERY_FAILED = "DELIVERY_FAILED",
  STORAGE_ERROR = "STORAGE_ERROR",
  TEMPLATE_ERROR = "TEMPLATE_ERROR",
  CHART_GENERATION_ERROR = "CHART_GENERATION_ERROR",
}

// Interfaces
export type IReportFilter = {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "regex"
    | "exists";
  value: any;
  dataType?: "string" | "number" | "date" | "boolean" | "array";
};

export type IReportGroupBy = {
  field: string;
  alias?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
};

export type IReportAggregation = {
  field: string;
  type: AggregationType;
  alias?: string;
  format?: string;
};

export type IReportSort = {
  field: string;
  order: "asc" | "desc";
};

export type ITimeRange = {
  start: Date;
  end: Date;
  timezone?: string;
};

export type IChartConfig = {
  type: ChartType;
  title?: string;
  xAxis?: {
    field: string;
    label?: string;
    format?: string;
  };
  yAxis?: {
    field: string;
    label?: string;
    format?: string;
  };
  series?: {
    field: string;
    label?: string;
    color?: string;
  }[];
  options?: {
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    colors?: string[];
    width?: number;
    height?: number;
    responsive?: boolean;
  };
};

export type IReportQuery = {
  dataSource: DataSource | DataSource[];
  filters?: IReportFilter[];
  groupBy?: IReportGroupBy[];
  aggregations?: IReportAggregation[];
  sort?: IReportSort[];
  timeRange?: ITimeRange;
  timeGranularity?: TimeGranularity;
  limit?: number;
  offset?: number;
  customQuery?: string; // For complex MongoDB aggregation pipelines
};

export type IReportTemplate = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  type: ReportType;
  category: string;
  query: IReportQuery;
  charts?: IChartConfig[];
  layout: {
    sections: IReportSection[];
    styling?: {
      theme?: string;
      colors?: string[];
      fonts?: {
        primary?: string;
        secondary?: string;
      };
      logo?: string;
      watermark?: string;
    };
  };
  parameters?: IReportParameter[];
  isPublic: boolean;
  isSystemTemplate: boolean;
  createdBy: Types.ObjectId;
  tags: string[];
  version: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

export type IReportSection = {
  id: string;
  type: "header" | "text" | "table" | "chart" | "kpi" | "image" | "pagebreak";
  title?: string;
  content?: string;
  query?: IReportQuery;
  chart?: IChartConfig;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styling?: Record<string, any>;
  conditional?: {
    field: string;
    operator: string;
    value: any;
  };
};

export type IReportParameter = {
  name: string;
  label: string;
  type:
    | "string"
    | "number"
    | "date"
    | "boolean"
    | "select"
    | "multiselect"
    | "daterange";
  defaultValue?: any;
  options?: { label: string; value: any }[];
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
};

export type IReportDefinition = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  type: ReportType;
  templateId?: Types.ObjectId;
  query: IReportQuery;
  charts?: IChartConfig[];
  format: ReportFormat[];
  frequency: ReportFrequency;
  schedule?: IReportSchedule;
  recipients: IReportRecipient[];
  parameters?: Record<string, any>;
  isActive: boolean;
  priority: ReportPriority;
  retentionDays?: number;
  tags: string[];
  createdBy: Types.ObjectId;
  lastRunAt?: Date;
  nextRunAt?: Date;
  runCount: number;
  metadata: {
    estimatedRuntime?: number;
    dataSize?: number;
    complexity?: "low" | "medium" | "high";
    kenyaSpecific?: boolean;
    businessCritical?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;

  updateNextRun: () => Promise<void>;
};

export type IReportSchedule = {
  frequency: ReportFrequency;
  interval?: number; // For hourly, daily schedules
  dayOfWeek?: number[]; // For weekly schedules (0-6)
  dayOfMonth?: number[]; // For monthly schedules (1-31)
  hour?: number; // Hour of day (0-23)
  minute?: number; // Minute of hour (0-59)
  timezone: string;
  startDate?: Date;
  endDate?: Date;
  maxRuns?: number;
};

export type IReportRecipient = {
  type: ReportDeliveryMethod;
  target: string; // email, phone, webhook URL, etc.
  format?: ReportFormat;
  parameters?: Record<string, any>;
  isActive: boolean;
};

export type IReportExecution = {
  _id: Types.ObjectId;
  reportId: Types.ObjectId;
  status: ReportStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in milliseconds
  parameters?: Record<string, any>;
  results?: {
    recordCount: number;
    dataSize: number;
    charts?: string[]; // Chart image URLs/paths
    files?: IReportFile[];
    summary?: Record<string, any>;
  };
  error?: {
    code: ReportErrorCode;
    message: string;
    stack?: string;
    details?: Record<string, any>;
  };
  deliveryStatus?: {
    [key: string]: {
      // recipient identifier
      status: "pending" | "sent" | "delivered" | "failed";
      timestamp?: Date;
      error?: string;
    };
  };
  triggeredBy?: {
    type: "schedule" | "manual" | "api" | "webhook";
    userId?: Types.ObjectId;
    source?: string;
  };
  metadata: {
    serverInstance?: string;
    executionContext?: Record<string, any>;
    performanceMetrics?: {
      queryTime: number;
      renderTime: number;
      deliveryTime: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
};

export type IReportFile = {
  filename: string;
  format: ReportFormat;
  size: number;
  path: string;
  url?: string;
  checksum?: string;
  expiresAt?: Date;
};

export type IReportAnalytics = {
  _id: Types.ObjectId;
  reportId: Types.ObjectId;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    executionCount: number;
    averageExecutionTime: number;
    successRate: number;
    failureRate: number;
    dataVolume: number;
    deliverySuccessRate: number;
    userEngagement: {
      views: number;
      downloads: number;
      shares: number;
    };
  };
  performance: {
    queryPerformance: {
      averageTime: number;
      slowestQuery: number;
      fastestQuery: number;
    };
    renderPerformance: {
      averageTime: number;
      slowestRender: number;
      fastestRender: number;
    };
  };
  errors: {
    errorType: ReportErrorCode;
    count: number;
    lastOccurrence: Date;
  }[];
  usage: {
    topUsers: {
      userId: Types.ObjectId;
      executionCount: number;
      lastAccess: Date;
    }[];
    peakHours: {
      hour: number;
      count: number;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
};

export type IReportDashboard = {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  reports: {
    reportId: Types.ObjectId;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    refreshInterval?: number; // in seconds
    parameters?: Record<string, any>;
  }[];
  layout: {
    columns: number;
    rows: number;
    responsive: boolean;
  };
  theme: {
    colors: string[];
    fonts: Record<string, string>;
    spacing: Record<string, number>;
  };
  accessControl: {
    isPublic: boolean;
    allowedUsers: Types.ObjectId[];
    allowedRoles: string[];
  };
  refreshInterval: number; // Global refresh interval
  lastRefreshed?: Date;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type IBusinessIntelligence = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  kpis: IKPIDefinition[];
  dimensions: IDimensionDefinition[];
  measures: IMeasureDefinition[];
  dataSources: DataSource[];
  refreshFrequency: ReportFrequency;
  lastUpdated: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type IKPIDefinition = {
  name: string;
  label: string;
  description: string;
  type: BusinessMetricType;
  calculation: {
    formula: string;
    aggregation: AggregationType;
    filters?: IReportFilter[];
  };
  target?: {
    value: number;
    operator: "gt" | "lt" | "gte" | "lte" | "eq";
    period: TimeGranularity;
  };
  format: {
    type: "number" | "percentage" | "currency" | "duration";
    decimals?: number;
    prefix?: string;
    suffix?: string;
  };
  trend: {
    enabled: boolean;
    period: TimeGranularity;
    comparison: "previous" | "year_ago" | "custom";
  };
};

export type IDimensionDefinition = {
  name: string;
  label: string;
  type: "categorical" | "temporal" | "geographical" | "hierarchical";
  dataSource: DataSource;
  field: string;
  hierarchy?: string[];
  geoMapping?: {
    type: "country" | "county" | "city" | "coordinates";
    field: string;
  };
};

export type IMeasureDefinition = {
  name: string;
  label: string;
  type: "numeric" | "calculated";
  dataSource: DataSource;
  field?: string;
  calculation?: {
    formula: string;
    dependencies: string[];
  };
  aggregation: AggregationType;
  format: {
    type: "number" | "percentage" | "currency";
    decimals?: number;
  };
};

export type IReportAlert = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  reportId: Types.ObjectId;
  condition: {
    metric: string;
    operator: "gt" | "lt" | "gte" | "lte" | "eq" | "ne";
    value: number;
    threshold?: number;
  };
  frequency: ReportFrequency;
  recipients: IReportRecipient[];
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

// Request/Response Types
export type ICreateReportRequest = {
  name: string;
  description?: string;
  type: ReportType;
  templateId?: string;
  query: IReportQuery;
  charts?: IChartConfig[];
  format: ReportFormat[];
  frequency: ReportFrequency;
  schedule?: IReportSchedule;
  recipients: IReportRecipient[];
  parameters?: Record<string, any>;
  priority?: ReportPriority;
  tags?: string[];
};

export type IExecuteReportRequest = {
  reportId: string;
  parameters?: Record<string, any>;
  format?: ReportFormat[];
  recipients?: IReportRecipient[];
  priority?: ReportPriority;
};

export type IReportResponse = {
  success: boolean;
  data?: any;
  message?: string;
  error?: {
    code: ReportErrorCode;
    message: string;
    details?: Record<string, any>;
  };
};

export type IReportListResponse = {
  success: boolean;
  data?: {
    reports: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: {
    code: ReportErrorCode;
    message: string;
  };
};

export type IReportDataQuery = {
  dataSource: DataSource;
  filters?: IReportFilter[];
  groupBy?: string[];
  aggregations?: IReportAggregation[];
  timeRange?: ITimeRange;
  limit?: number;
};

export type IKenyaSpecificMetrics = {
  counties: {
    name: KenyaCounty;
    metrics: Record<string, number>;
  }[];
  mpesa: {
    transactions: number;
    volume: number;
    successRate: number;
    averageAmount: number;
  };
  sms: {
    sent: number;
    delivered: number;
    deliveryRate: number;
    cost: number;
  };
  businessHours: {
    activeUsers: number;
    transactions: number;
    peakHour: number;
    offPeakRatio: number;
  };
  languages: {
    english: number;
    swahili: number;
    other: number;
  };
  mobileNetworks: {
    safaricom: number;
    airtel: number;
    telkom: number;
  };
};

export type IReportExportOptions = {
  format: ReportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
  compression?: "zip" | "gzip";
  password?: string;
  watermark?: string;
  pageSize?: "A4" | "A3" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
};

// Constants
export const KENYA_BUSINESS_HOURS = {
  START: 8, // 8 AM
  END: 18, // 6 PM
  TIMEZONE: "Africa/Nairobi",
};

export const DEFAULT_CHART_COLORS = [
  "#3498db",
  "#e74c3c",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#34495e",
  "#1abc9c",
  "#e67e22",
  "#95a5a6",
  "#f1c40f",
];

export const REPORT_CONFIG = {
  MAX_EXECUTION_TIME: 30 * 60 * 1000, // 30 minutes
  MAX_DATA_SIZE: 100 * 1024 * 1024, // 100MB
  DEFAULT_PAGE_SIZE: 1000,
  MAX_CHART_POINTS: 1000,
  FILE_RETENTION_DAYS: 30,
  MAX_CONCURRENT_REPORTS: 5,
  CACHE_TTL: 3600, // 1 hour in seconds
  DEFAULT_TIMEZONE: "Africa/Nairobi",
  SUPPORTED_CURRENCIES: ["KES", "USD", "EUR"],
  EMAIL_TIMEOUT: 30_000, // 30 seconds
  WEBHOOK_TIMEOUT: 15_000, // 15 seconds
  SMS_TIMEOUT: 30_000, // 30 seconds

  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MAX_REPORT_SIZE: 10_000, // maximum records per report
  REPORT_TIMEOUT: 300_000, // 5 minutes
  CLEANUP_AFTER_DAYS: 90,
  SCHEDULE_CHECK_INTERVAL: 300_000, // 5 minutes
  SUPPORTED_FORMATS: ["pdf", "excel", "csv", "json"],
  MAX_TEMPLATE_SIZE: 1024 * 1024, // 1MB
  CHART_TYPES: ["bar", "line", "pie", "doughnut", "area", "scatter"],
  EMAIL_DELIVERY_ENABLED: true,
  SMS_DELIVERY_ENABLED: true,
  WEBHOOK_DELIVERY_ENABLED: true,
};

export const KENYA_COUNTIES_LIST = Object.values(KenyaCounty);

export const BUSINESS_METRICS_CONFIG = {
  [BusinessMetricType.REVENUE]: {
    format: "currency",
    currency: "KES",
    trend: true,
    target: true,
  },
  [BusinessMetricType.CONVERSION_RATE]: {
    format: "percentage",
    decimals: 2,
    trend: true,
    target: true,
  },
  [BusinessMetricType.OCCUPANCY_RATE]: {
    format: "percentage",
    decimals: 1,
    trend: true,
    target: true,
  },
};
