import {
  AggregationType,
  ChartType,
  DataSource,
  ReportDeliveryMethod,
  ReportFormat,
  ReportFrequency,
  ReportPriority,
  ReportStatus,
  ReportType,
  TimeGranularity,
} from "@kaa/models/types";
import { t } from "elysia";

// Base schemas for nested objects
export const ReportFilterSchema = t.Object({
  field: t.String({ minLength: 1 }),
  operator: t.Union([
    t.Literal("eq"),
    t.Literal("ne"),
    t.Literal("gt"),
    t.Literal("gte"),
    t.Literal("lt"),
    t.Literal("lte"),
    t.Literal("in"),
    t.Literal("nin"),
    t.Literal("regex"),
    t.Literal("exists"),
  ]),
  value: t.Any(),
  dataType: t.Optional(
    t.Union([
      t.Literal("string"),
      t.Literal("number"),
      t.Literal("date"),
      t.Literal("boolean"),
      t.Literal("array"),
    ])
  ),
});

export const ReportGroupBySchema = t.Object({
  field: t.String({ minLength: 1 }),
  alias: t.Optional(t.String()),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  limit: t.Optional(t.Number({ minimum: 1 })),
});

export const ReportAggregationSchema = t.Object({
  field: t.String({ minLength: 1 }),
  type: t.Enum(AggregationType),
  alias: t.Optional(t.String()),
  format: t.Optional(t.String()),
});

export const ReportSortSchema = t.Object({
  field: t.String({ minLength: 1 }),
  order: t.Union([t.Literal("asc"), t.Literal("desc")]),
});

export const TimeRangeSchema = t.Object({
  start: t.String({ format: "date-time" }),
  end: t.String({ format: "date-time" }),
  timezone: t.Optional(t.String({ default: "Africa/Nairobi" })),
});

export const ChartConfigSchema = t.Object({
  type: t.Enum(ChartType),
  title: t.Optional(t.String()),
  xAxis: t.Optional(
    t.Object({
      field: t.String(),
      label: t.Optional(t.String()),
      format: t.Optional(t.String()),
    })
  ),
  yAxis: t.Optional(
    t.Object({
      field: t.String(),
      label: t.Optional(t.String()),
      format: t.Optional(t.String()),
    })
  ),
  series: t.Optional(
    t.Array(
      t.Object({
        field: t.String(),
        label: t.Optional(t.String()),
        color: t.Optional(t.String()),
      })
    )
  ),
  options: t.Optional(
    t.Object({
      showLegend: t.Optional(t.Boolean({ default: true })),
      showGrid: t.Optional(t.Boolean({ default: true })),
      showTooltip: t.Optional(t.Boolean({ default: true })),
      colors: t.Optional(t.Array(t.String())),
      width: t.Optional(t.Number({ minimum: 100 })),
      height: t.Optional(t.Number({ minimum: 100 })),
      responsive: t.Optional(t.Boolean({ default: true })),
    })
  ),
});

export const ReportQuerySchema = t.Object({
  dataSource: t.Union([t.Enum(DataSource), t.Array(t.Enum(DataSource))]),
  filters: t.Optional(t.Array(ReportFilterSchema)),
  groupBy: t.Optional(t.Array(ReportGroupBySchema)),
  aggregations: t.Optional(t.Array(ReportAggregationSchema)),
  sort: t.Optional(t.Array(ReportSortSchema)),
  timeRange: t.Optional(TimeRangeSchema),
  timeGranularity: t.Optional(t.Enum(TimeGranularity)),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 10_000, default: 1000 })),
  offset: t.Optional(t.Number({ minimum: 0, default: 0 })),
  customQuery: t.Optional(t.String()),
});

export const ReportScheduleSchema = t.Object({
  frequency: t.Enum(ReportFrequency),
  interval: t.Optional(t.Number({ minimum: 1 })),
  dayOfWeek: t.Optional(t.Array(t.Number({ minimum: 0, maximum: 6 }))),
  dayOfMonth: t.Optional(t.Array(t.Number({ minimum: 1, maximum: 31 }))),
  hour: t.Optional(t.Number({ minimum: 0, maximum: 23 })),
  minute: t.Optional(t.Number({ minimum: 0, maximum: 59 })),
  timezone: t.Optional(t.String({ default: "Africa/Nairobi" })),
  startDate: t.Optional(t.String({ format: "date-time" })),
  endDate: t.Optional(t.String({ format: "date-time" })),
  maxRuns: t.Optional(t.Number({ minimum: 1 })),
});

export const ReportRecipientSchema = t.Object({
  type: t.Enum(ReportDeliveryMethod),
  target: t.String({ minLength: 1 }),
  format: t.Optional(t.Enum(ReportFormat)),
  parameters: t.Optional(t.Record(t.String(), t.Any())),
  isActive: t.Boolean({ default: true }),
});

export const ReportParameterSchema = t.Object({
  name: t.String({ minLength: 1 }),
  label: t.String({ minLength: 1 }),
  type: t.Union([
    t.Literal("string"),
    t.Literal("number"),
    t.Literal("date"),
    t.Literal("boolean"),
    t.Literal("select"),
    t.Literal("multiselect"),
    t.Literal("daterange"),
  ]),
  defaultValue: t.Optional(t.Any()),
  options: t.Optional(
    t.Array(
      t.Object({
        label: t.String(),
        value: t.Any(),
      })
    )
  ),
  required: t.Boolean({ default: false }),
  validation: t.Optional(
    t.Object({
      min: t.Optional(t.Number()),
      max: t.Optional(t.Number()),
      pattern: t.Optional(t.String()),
      message: t.Optional(t.String()),
    })
  ),
});

export const ReportSectionSchema = t.Object({
  id: t.String({ minLength: 1 }),
  type: t.Union([
    t.Literal("header"),
    t.Literal("text"),
    t.Literal("table"),
    t.Literal("chart"),
    t.Literal("kpi"),
    t.Literal("image"),
    t.Literal("pagebreak"),
  ]),
  title: t.Optional(t.String()),
  content: t.Optional(t.String()),
  query: t.Optional(ReportQuerySchema),
  chart: t.Optional(ChartConfigSchema),
  position: t.Object({
    x: t.Number({ minimum: 0 }),
    y: t.Number({ minimum: 0 }),
    width: t.Number({ minimum: 1 }),
    height: t.Number({ minimum: 1 }),
  }),
  styling: t.Optional(t.Record(t.String(), t.Any())),
  conditional: t.Optional(
    t.Object({
      field: t.String(),
      operator: t.String(),
      value: t.Any(),
    })
  ),
});

// Request schemas
export const CreateReportRequestSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  description: t.Optional(t.String({ maxLength: 1000 })),
  type: t.Enum(ReportType),
  templateId: t.Optional(t.String()),
  query: ReportQuerySchema,
  charts: t.Optional(t.Array(ChartConfigSchema)),
  format: t.Array(t.Enum(ReportFormat), { minItems: 1 }),
  frequency: t.Enum(ReportFrequency),
  schedule: t.Optional(ReportScheduleSchema),
  recipients: t.Array(ReportRecipientSchema),
  parameters: t.Optional(t.Record(t.String(), t.Any())),
  priority: t.Optional(t.Enum(ReportPriority)),
  tags: t.Optional(t.Array(t.String())),
});

export const ExecuteReportRequestSchema = t.Object({
  reportId: t.String({ minLength: 24, maxLength: 24 }),
  parameters: t.Optional(t.Record(t.String(), t.Any())),
  format: t.Optional(t.Array(t.Enum(ReportFormat))),
  recipients: t.Optional(t.Array(ReportRecipientSchema)),
  priority: t.Optional(t.Enum(ReportPriority)),
});

export const UpdateReportRequestSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  description: t.Optional(t.String({ maxLength: 1000 })),
  query: t.Optional(ReportQuerySchema),
  charts: t.Optional(t.Array(ChartConfigSchema)),
  format: t.Optional(t.Array(t.Enum(ReportFormat))),
  frequency: t.Optional(t.Enum(ReportFrequency)),
  schedule: t.Optional(ReportScheduleSchema),
  recipients: t.Optional(t.Array(ReportRecipientSchema)),
  parameters: t.Optional(t.Record(t.String(), t.Any())),
  priority: t.Optional(t.Enum(ReportPriority)),
  tags: t.Optional(t.Array(t.String())),
  isActive: t.Optional(t.Boolean()),
});

export const CreateScheduleRequestSchema = t.Object({
  reportId: t.String({ minLength: 24, maxLength: 24 }),
  schedule: ReportScheduleSchema,
  recipients: t.Optional(t.Array(ReportRecipientSchema)),
  parameters: t.Optional(t.Record(t.String(), t.Any())),
});

export const UpdateScheduleRequestSchema = t.Object({
  schedule: t.Optional(ReportScheduleSchema),
  recipients: t.Optional(t.Array(ReportRecipientSchema)),
  parameters: t.Optional(t.Record(t.String(), t.Any())),
  isActive: t.Optional(t.Boolean()),
});

export const ReportTemplateSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  description: t.String({ maxLength: 1000 }),
  type: t.Enum(ReportType),
  category: t.String({ minLength: 1 }),
  query: ReportQuerySchema,
  charts: t.Optional(t.Array(ChartConfigSchema)),
  layout: t.Object({
    sections: t.Array(ReportSectionSchema),
    styling: t.Optional(
      t.Object({
        theme: t.Optional(t.String()),
        colors: t.Optional(t.Array(t.String())),
        fonts: t.Optional(
          t.Object({
            primary: t.Optional(t.String()),
            secondary: t.Optional(t.String()),
          })
        ),
        logo: t.Optional(t.String()),
        watermark: t.Optional(t.String()),
      })
    ),
  }),
  parameters: t.Optional(t.Array(ReportParameterSchema)),
  isPublic: t.Boolean({ default: false }),
  tags: t.Optional(t.Array(t.String())),
});

export const UpdateTemplateRequestSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  description: t.Optional(t.String({ maxLength: 1000 })),
  query: t.Optional(ReportQuerySchema),
  charts: t.Optional(t.Array(ChartConfigSchema)),
  layout: t.Optional(
    t.Object({
      sections: t.Array(ReportSectionSchema),
      styling: t.Optional(t.Record(t.String(), t.Any())),
    })
  ),
  parameters: t.Optional(t.Array(ReportParameterSchema)),
  isPublic: t.Optional(t.Boolean()),
  tags: t.Optional(t.Array(t.String())),
});

// Query parameter schemas
export const ListReportsQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  status: t.Optional(t.String()),
  type: t.Optional(t.Enum(ReportType)),
  search: t.Optional(t.String()),
  sortBy: t.Optional(t.String({ default: "createdAt" })),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  tags: t.Optional(t.String()),
});

export const ListExecutionsQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  status: t.Optional(t.Enum(ReportStatus)),
  startDate: t.Optional(t.String({ format: "date-time" })),
  endDate: t.Optional(t.String({ format: "date-time" })),
});

export const ListSchedulesQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  active: t.Optional(t.Boolean()),
  frequency: t.Optional(t.Enum(ReportFrequency)),
});

export const ListTemplatesQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  category: t.Optional(t.String()),
  type: t.Optional(t.Enum(ReportType)),
  isPublic: t.Optional(t.Boolean()),
  search: t.Optional(t.String()),
});

export const DownloadReportQuerySchema = t.Object({
  format: t.Optional(t.Enum(ReportFormat)),
  includeCharts: t.Optional(t.Boolean({ default: true })),
  includeRawData: t.Optional(t.Boolean({ default: true })),
  compression: t.Optional(t.Union([t.Literal("zip"), t.Literal("gzip")])),
});

export const ReportAnalyticsQuerySchema = t.Object({
  period: t.Optional(
    t.Union([
      t.Literal("7d"),
      t.Literal("30d"),
      t.Literal("90d"),
      t.Literal("1y"),
    ])
  ),
  startDate: t.Optional(t.String({ format: "date-time" })),
  endDate: t.Optional(t.String({ format: "date-time" })),
});

export const BusinessIntelligenceQuerySchema = t.Object({
  timeframe: t.Optional(
    t.Union([
      t.Literal("7d"),
      t.Literal("30d"),
      t.Literal("90d"),
      t.Literal("1y"),
    ])
  ),
  metrics: t.Optional(t.String()),
  county: t.Optional(t.String()),
  propertyType: t.Optional(t.String()),
  compareWith: t.Optional(t.String({ format: "date-time" })),
});

export const MarketInsightsQuerySchema = t.Object({
  location: t.Optional(t.String()),
  propertyType: t.Optional(t.String()),
  priceRange: t.Optional(t.String()),
  period: t.Optional(
    t.Union([
      t.Literal("7d"),
      t.Literal("30d"),
      t.Literal("90d"),
      t.Literal("1y"),
    ])
  ),
  compareWith: t.Optional(t.String()),
});

// Param schemas
export const ReportIdParamSchema = t.Object({
  reportId: t.String({ minLength: 24, maxLength: 24 }),
});

export const ExecutionIdParamSchema = t.Object({
  executionId: t.String({ minLength: 24, maxLength: 24 }),
});

export const ScheduleIdParamSchema = t.Object({
  scheduleId: t.String({ minLength: 24, maxLength: 24 }),
});

export const TemplateIdParamSchema = t.Object({
  templateId: t.String({ minLength: 24, maxLength: 24 }),
});

// Response schemas
export const ReportResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Optional(t.Any()),
  message: t.Optional(t.String()),
  error: t.Optional(
    t.Object({
      code: t.String(),
      message: t.String(),
      details: t.Optional(t.Record(t.String(), t.Any())),
    })
  ),
});

export const PaginatedResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Optional(
    t.Object({
      items: t.Array(t.Any()),
      total: t.Number(),
      page: t.Number(),
      limit: t.Number(),
      totalPages: t.Number(),
      hasMore: t.Boolean(),
    })
  ),
  error: t.Optional(
    t.Object({
      code: t.String(),
      message: t.String(),
    })
  ),
});
