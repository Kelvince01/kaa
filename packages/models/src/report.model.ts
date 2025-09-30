import { model, Schema } from "mongoose";
import {
  AggregationType,
  BusinessMetricType,
  ChartType,
  DataSource,
  type IBusinessIntelligence,
  type IReportAlert,
  type IReportAnalytics,
  type IReportDashboard,
  type IReportDefinition,
  type IReportExecution,
  type IReportTemplate,
  ReportDeliveryMethod,
  ReportErrorCode,
  ReportFormat,
  ReportFrequency,
  ReportPriority,
  ReportStatus,
  ReportType,
  TimeGranularity,
} from "./types/report.type";

// Sub-schemas
const reportFilterSchema = new Schema(
  {
    field: {
      type: String,
      required: true,
    },
    operator: {
      type: String,
      enum: [
        "eq",
        "ne",
        "gt",
        "gte",
        "lt",
        "lte",
        "in",
        "nin",
        "regex",
        "exists",
      ],
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    dataType: {
      type: String,
      enum: ["string", "number", "date", "boolean", "array"],
    },
  },
  { _id: false }
);

const reportGroupBySchema = new Schema(
  {
    field: {
      type: String,
      required: true,
    },
    alias: String,
    sortOrder: {
      type: String,
      enum: ["asc", "desc"],
      default: "asc",
    },
    limit: {
      type: Number,
      min: 1,
    },
  },
  { _id: false }
);

const reportAggregationSchema = new Schema(
  {
    field: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(AggregationType),
      required: true,
    },
    alias: String,
    format: String,
  },
  { _id: false }
);

const reportSortSchema = new Schema(
  {
    field: {
      type: String,
      required: true,
    },
    order: {
      type: String,
      enum: ["asc", "desc"],
      default: "asc",
    },
  },
  { _id: false }
);

const timeRangeSchema = new Schema(
  {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: "Africa/Nairobi",
    },
  },
  { _id: false }
);

const chartConfigSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(ChartType),
      required: true,
    },
    title: String,
    xAxis: {
      field: String,
      label: String,
      format: String,
    },
    yAxis: {
      field: String,
      label: String,
      format: String,
    },
    series: [
      {
        field: String,
        label: String,
        color: String,
      },
    ],
    options: {
      showLegend: { type: Boolean, default: true },
      showGrid: { type: Boolean, default: true },
      showTooltip: { type: Boolean, default: true },
      colors: [String],
      width: { type: Number, min: 100 },
      height: { type: Number, min: 100 },
      responsive: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const reportQuerySchema = new Schema(
  {
    dataSource: {
      type: Schema.Types.Mixed, // Can be single DataSource or array
      required: true,
    },
    filters: [reportFilterSchema],
    groupBy: [reportGroupBySchema],
    aggregations: [reportAggregationSchema],
    sort: [reportSortSchema],
    timeRange: timeRangeSchema,
    timeGranularity: {
      type: String,
      enum: Object.values(TimeGranularity),
    },
    limit: {
      type: Number,
      min: 1,
      default: 1000,
    },
    offset: {
      type: Number,
      min: 0,
      default: 0,
    },
    customQuery: String, // For complex MongoDB aggregation pipelines
  },
  { _id: false }
);

const reportParameterSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "string",
        "number",
        "date",
        "boolean",
        "select",
        "multiselect",
        "daterange",
      ],
      required: true,
    },
    defaultValue: Schema.Types.Mixed,
    options: [
      {
        label: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
      },
    ],
    required: {
      type: Boolean,
      default: false,
    },
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      message: String,
    },
  },
  { _id: false }
);

const reportSectionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["header", "text", "table", "chart", "kpi", "image", "pagebreak"],
      required: true,
    },
    title: String,
    content: String,
    query: reportQuerySchema,
    chart: chartConfigSchema,
    position: {
      x: { type: Number, required: true, min: 0 },
      y: { type: Number, required: true, min: 0 },
      width: { type: Number, required: true, min: 1 },
      height: { type: Number, required: true, min: 1 },
    },
    styling: Schema.Types.Mixed,
    conditional: {
      field: String,
      operator: String,
      value: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const reportScheduleSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: Object.values(ReportFrequency),
      required: true,
    },
    interval: Number,
    dayOfWeek: [{ type: Number, min: 0, max: 6 }],
    dayOfMonth: [{ type: Number, min: 1, max: 31 }],
    hour: { type: Number, min: 0, max: 23 },
    minute: { type: Number, min: 0, max: 59 },
    timezone: {
      type: String,
      default: "Africa/Nairobi",
    },
    startDate: Date,
    endDate: Date,
    maxRuns: { type: Number, min: 1 },
  },
  { _id: false }
);

const reportRecipientSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(ReportDeliveryMethod),
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: Object.values(ReportFormat),
    },
    parameters: Schema.Types.Mixed,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const reportFileSchema = new Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: Object.values(ReportFormat),
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    path: {
      type: String,
      required: true,
    },
    url: String,
    checksum: String,
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
  },
  { _id: false }
);

const kpiDefinitionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(BusinessMetricType),
      required: true,
    },
    calculation: {
      formula: { type: String, required: true },
      aggregation: {
        type: String,
        enum: Object.values(AggregationType),
        required: true,
      },
      filters: [reportFilterSchema],
    },
    target: {
      value: { type: Number, required: true },
      operator: {
        type: String,
        enum: ["gt", "lt", "gte", "lte", "eq"],
        required: true,
      },
      period: {
        type: String,
        enum: Object.values(TimeGranularity),
        required: true,
      },
    },
    format: {
      type: {
        type: String,
        enum: ["number", "percentage", "currency", "duration"],
        required: true,
      },
      decimals: { type: Number, min: 0, max: 10 },
      prefix: String,
      suffix: String,
    },
    trend: {
      enabled: { type: Boolean, default: true },
      period: {
        type: String,
        enum: Object.values(TimeGranularity),
        required: true,
      },
      comparison: {
        type: String,
        enum: ["previous", "year_ago", "custom"],
        default: "previous",
      },
    },
  },
  { _id: false }
);

const dimensionDefinitionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["categorical", "temporal", "geographical", "hierarchical"],
      required: true,
    },
    dataSource: {
      type: String,
      enum: Object.values(DataSource),
      required: true,
    },
    field: {
      type: String,
      required: true,
    },
    hierarchy: [String],
    geoMapping: {
      type: {
        type: String,
        enum: ["country", "county", "city", "coordinates"],
      },
      field: String,
    },
  },
  { _id: false }
);

const measureDefinitionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["numeric", "calculated"],
      required: true,
    },
    dataSource: {
      type: String,
      enum: Object.values(DataSource),
      required: true,
    },
    field: String,
    calculation: {
      formula: String,
      dependencies: [String],
    },
    aggregation: {
      type: String,
      enum: Object.values(AggregationType),
      required: true,
    },
    format: {
      type: {
        type: String,
        enum: ["number", "percentage", "currency"],
        required: true,
      },
      decimals: { type: Number, min: 0, max: 10 },
    },
  },
  { _id: false }
);

// Report Template Schema
const reportTemplateSchema = new Schema<IReportTemplate>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      maxlength: 100,
      index: true,
    },
    query: {
      type: reportQuerySchema,
      required: true,
    },
    charts: [chartConfigSchema],
    layout: {
      sections: [reportSectionSchema],
      styling: {
        theme: String,
        colors: [String],
        fonts: {
          primary: String,
          secondary: String,
        },
        logo: String,
        watermark: String,
      },
    },
    parameters: [reportParameterSchema],
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSystemTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Report Template
reportTemplateSchema.index({ name: 1, version: -1 });
reportTemplateSchema.index({ type: 1, category: 1 });
reportTemplateSchema.index({ createdBy: 1, createdAt: -1 });

// Report Definition Schema
const reportDefinitionSchema = new Schema<IReportDefinition>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "ReportTemplate",
      index: true,
    },
    query: {
      type: reportQuerySchema,
      required: true,
    },
    charts: [chartConfigSchema],
    format: [
      {
        type: String,
        enum: Object.values(ReportFormat),
        required: true,
      },
    ],
    frequency: {
      type: String,
      enum: Object.values(ReportFrequency),
      required: true,
      index: true,
    },
    schedule: reportScheduleSchema,
    recipients: [reportRecipientSchema],
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(ReportPriority),
      default: ReportPriority.NORMAL,
      index: true,
    },
    retentionDays: {
      type: Number,
      min: 1,
      max: 365,
      default: 30,
    },
    tags: {
      type: [String],
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
    lastRunAt: {
      type: Date,
      index: true,
    },
    nextRunAt: {
      type: Date,
      index: true,
    },
    runCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      estimatedRuntime: { type: Number, min: 0 },
      dataSize: { type: Number, min: 0 },
      complexity: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
      kenyaSpecific: { type: Boolean, default: false },
      businessCritical: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Report Definition
reportDefinitionSchema.index({ type: 1, isActive: 1 });
reportDefinitionSchema.index({ frequency: 1, nextRunAt: 1 });
reportDefinitionSchema.index({ priority: 1, nextRunAt: 1 });
reportDefinitionSchema.index({ createdBy: 1, createdAt: -1 });
reportDefinitionSchema.index({ "metadata.kenyaSpecific": 1 });
reportDefinitionSchema.index({ "metadata.businessCritical": 1 });

// Report Definition Methods
reportDefinitionSchema.methods.updateNextRun = function () {
  if (!this.schedule || this.frequency === ReportFrequency.ON_DEMAND) {
    this.nextRunAt = undefined;
    return this.save();
  }

  const now = new Date();
  const nextRun = new Date(now);

  switch (this.frequency) {
    case ReportFrequency.HOURLY:
      nextRun.setHours(nextRun.getHours() + (this.schedule.interval || 1));
      break;
    case ReportFrequency.DAILY:
      nextRun.setDate(nextRun.getDate() + (this.schedule.interval || 1));
      if (this.schedule.hour !== undefined) {
        nextRun.setHours(this.schedule.hour, this.schedule.minute || 0, 0, 0);
      }
      break;
    case ReportFrequency.WEEKLY:
      nextRun.setDate(nextRun.getDate() + 7);
      break;
    case ReportFrequency.MONTHLY:
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    case ReportFrequency.QUARTERLY:
      nextRun.setMonth(nextRun.getMonth() + 3);
      break;
    case ReportFrequency.YEARLY:
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      break;
    default:
      break;
  }

  this.nextRunAt = nextRun;
  return this.save();
};

reportDefinitionSchema.methods.incrementRunCount = function () {
  this.runCount += 1;
  this.lastRunAt = new Date();
  return this.save();
};

// Report Execution Schema
const reportExecutionSchema = new Schema<IReportExecution>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: "ReportDefinition",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: -1,
    },
    completedAt: Date,
    duration: {
      type: Number,
      min: 0,
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    results: {
      recordCount: { type: Number, min: 0 },
      dataSize: { type: Number, min: 0 },
      charts: [String],
      files: [reportFileSchema],
      summary: Schema.Types.Mixed,
    },
    error: {
      code: {
        type: String,
        enum: Object.values(ReportErrorCode),
      },
      message: String,
      stack: String,
      details: Schema.Types.Mixed,
    },
    deliveryStatus: {
      type: Schema.Types.Mixed,
      default: {},
    },
    triggeredBy: {
      type: {
        type: String,
        enum: ["schedule", "manual", "api", "webhook"],
        required: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "AdminUser",
      },
      source: String,
    },
    metadata: {
      serverInstance: String,
      executionContext: Schema.Types.Mixed,
      performanceMetrics: {
        queryTime: { type: Number, min: 0 },
        renderTime: { type: Number, min: 0 },
        deliveryTime: { type: Number, min: 0 },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Report Execution
reportExecutionSchema.index({ reportId: 1, startedAt: -1 });
reportExecutionSchema.index({ status: 1, startedAt: -1 });
reportExecutionSchema.index({ "triggeredBy.userId": 1, startedAt: -1 });
reportExecutionSchema.index({ createdAt: -1 });

// Report Execution Methods
reportExecutionSchema.methods.markAsCompleted = function (results?: any) {
  this.status = ReportStatus.COMPLETED;
  this.completedAt = new Date();
  this.duration = this.completedAt.getTime() - this.startedAt.getTime();

  if (results) {
    this.results = results;
  }

  return this.save();
};

reportExecutionSchema.methods.markAsFailed = function (error: any) {
  this.status = ReportStatus.FAILED;
  this.completedAt = new Date();
  this.duration = this.completedAt.getTime() - this.startedAt.getTime();
  this.error = error;

  return this.save();
};

reportExecutionSchema.methods.updateDeliveryStatus = function (
  recipient: string,
  status: string,
  error?: string
) {
  if (!this.deliveryStatus) {
    this.deliveryStatus = {};
  }

  this.deliveryStatus[recipient] = {
    status,
    timestamp: new Date(),
    error,
  };

  return this.save();
};

// Report Analytics Schema
const reportAnalyticsSchema = new Schema<IReportAnalytics>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: "ReportDefinition",
      required: true,
      index: true,
    },
    period: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },
    metrics: {
      executionCount: { type: Number, default: 0, min: 0 },
      averageExecutionTime: { type: Number, default: 0, min: 0 },
      successRate: { type: Number, default: 0, min: 0, max: 100 },
      failureRate: { type: Number, default: 0, min: 0, max: 100 },
      dataVolume: { type: Number, default: 0, min: 0 },
      deliverySuccessRate: { type: Number, default: 0, min: 0, max: 100 },
      userEngagement: {
        views: { type: Number, default: 0, min: 0 },
        downloads: { type: Number, default: 0, min: 0 },
        shares: { type: Number, default: 0, min: 0 },
      },
    },
    performance: {
      queryPerformance: {
        averageTime: { type: Number, default: 0, min: 0 },
        slowestQuery: { type: Number, default: 0, min: 0 },
        fastestQuery: { type: Number, default: 0, min: 0 },
      },
      renderPerformance: {
        averageTime: { type: Number, default: 0, min: 0 },
        slowestRender: { type: Number, default: 0, min: 0 },
        fastestRender: { type: Number, default: 0, min: 0 },
      },
    },
    reportErrors: [
      {
        errorType: {
          type: String,
          enum: Object.values(ReportErrorCode),
          required: true,
        },
        count: { type: Number, default: 0, min: 0 },
        lastOccurrence: { type: Date, required: true },
      },
    ],
    usage: {
      topUsers: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: "AdminUser",
            required: true,
          },
          executionCount: { type: Number, default: 0, min: 0 },
          lastAccess: { type: Date, required: true },
        },
      ],
      peakHours: [
        {
          hour: { type: Number, min: 0, max: 23 },
          count: { type: Number, default: 0, min: 0 },
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Report Analytics
reportAnalyticsSchema.index({ reportId: 1, "period.start": -1 });
reportAnalyticsSchema.index({ createdAt: -1 });

// Report Dashboard Schema
const reportDashboardSchema = new Schema<IReportDashboard>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    reports: [
      {
        reportId: {
          type: Schema.Types.ObjectId,
          ref: "ReportDefinition",
          required: true,
        },
        position: {
          x: { type: Number, required: true, min: 0 },
          y: { type: Number, required: true, min: 0 },
          width: { type: Number, required: true, min: 1 },
          height: { type: Number, required: true, min: 1 },
        },
        refreshInterval: { type: Number, min: 30 },
        parameters: Schema.Types.Mixed,
      },
    ],
    layout: {
      columns: { type: Number, min: 1, max: 12, default: 4 },
      rows: { type: Number, min: 1, default: 4 },
      responsive: { type: Boolean, default: true },
    },
    theme: {
      colors: [String],
      fonts: {
        type: Schema.Types.Mixed,
        default: {},
      },
      spacing: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    accessControl: {
      isPublic: { type: Boolean, default: false },
      allowedUsers: [
        {
          type: Schema.Types.ObjectId,
          ref: "AdminUser",
        },
      ],
      allowedRoles: [String],
    },
    refreshInterval: {
      type: Number,
      min: 30,
      default: 300,
    },
    lastRefreshed: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Report Dashboard
reportDashboardSchema.index({ createdBy: 1, isActive: 1 });
reportDashboardSchema.index({ "accessControl.isPublic": 1 });

// Dashboard Methods
reportDashboardSchema.methods.addReport = function (reportConfig: any) {
  this.reports.push(reportConfig);
  return this.save();
};

reportDashboardSchema.methods.removeReport = function (reportId: string) {
  this.reports = this.reports.filter(
    (r: any) => r.reportId.toString() !== reportId
  );
  return this.save();
};

reportDashboardSchema.methods.updateLastRefreshed = function () {
  this.lastRefreshed = new Date();
  return this.save();
};

// Business Intelligence Schema
const businessIntelligenceSchema = new Schema<IBusinessIntelligence>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      maxlength: 100,
      index: true,
    },
    kpis: [kpiDefinitionSchema],
    dimensions: [dimensionDefinitionSchema],
    measures: [measureDefinitionSchema],
    dataSources: [
      {
        type: String,
        enum: Object.values(DataSource),
      },
    ],
    refreshFrequency: {
      type: String,
      enum: Object.values(ReportFrequency),
      default: ReportFrequency.DAILY,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Business Intelligence
businessIntelligenceSchema.index({ category: 1, isActive: 1 });
businessIntelligenceSchema.index({ createdBy: 1, createdAt: -1 });

// Report Alert Schema
const reportAlertSchema = new Schema<IReportAlert>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: "ReportDefinition",
      required: true,
      index: true,
    },
    condition: {
      metric: { type: String, required: true },
      operator: {
        type: String,
        enum: ["gt", "lt", "gte", "lte", "eq", "ne"],
        required: true,
      },
      value: { type: Number, required: true },
      threshold: Number,
    },
    frequency: {
      type: String,
      enum: Object.values(ReportFrequency),
      required: true,
    },
    recipients: [reportRecipientSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastTriggered: Date,
    triggerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for Report Alert
reportAlertSchema.index({ reportId: 1, isActive: 1 });
reportAlertSchema.index({ createdBy: 1, createdAt: -1 });
reportAlertSchema.index({ frequency: 1, lastTriggered: 1 });

// Alert Methods
reportAlertSchema.methods.trigger = function () {
  this.lastTriggered = new Date();
  this.triggerCount += 1;
  return this.save();
};

// Create and export models
export const ReportTemplate = model<IReportTemplate>(
  "ReportTemplate",
  reportTemplateSchema
);
export const ReportDefinition = model<IReportDefinition>(
  "ReportDefinition",
  reportDefinitionSchema
);
export const ReportExecution = model<IReportExecution>(
  "ReportExecution",
  reportExecutionSchema
);
export const ReportAnalytics = model<IReportAnalytics>(
  "ReportAnalytics",
  reportAnalyticsSchema
);
export const ReportDashboard = model<IReportDashboard>(
  "ReportDashboard",
  reportDashboardSchema
);
export const BusinessIntelligence = model<IBusinessIntelligence>(
  "BusinessIntelligence",
  businessIntelligenceSchema
);
export const ReportAlert = model<IReportAlert>(
  "ReportAlert",
  reportAlertSchema
);
