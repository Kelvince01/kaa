import type { Types } from "mongoose";
import { ReportTemplate } from "@kaa/models";
import {
  ReportType,
  DataSource,
  ReportFormat,
  AggregationType,
  TimeGranularity,
  ChartType,
} from "@kaa/models/types";

/**
 * System Report Templates
 * Pre-configured templates for common reporting needs
 */

export const SYSTEM_TEMPLATES = [
  // ==================== OCCUPANCY REPORTS ====================
  {
    name: "Property Occupancy Rate",
    description:
      "Track occupancy rates across all properties with trend analysis",
    type: ReportType.OPERATIONAL,
    category: "occupancy",
    isSystemTemplate: true,
    isPublic: true,
    isActive: true,
    query: {
      dataSource: DataSource.PROPERTIES,
      groupBy: [
        { field: "status", alias: "propertyStatus" },
        { field: "type", alias: "propertyType" },
      ],
      aggregations: [
        { field: "_id", type: AggregationType.COUNT, alias: "totalProperties" },
        {
          field: "occupiedUnits",
          type: AggregationType.SUM,
          alias: "totalOccupied",
        },
        { field: "totalUnits", type: AggregationType.SUM, alias: "totalUnits" },
      ],
      timeGranularity: TimeGranularity.MONTH,
      limit: 1000,
    },
    charts: [
      {
        type: ChartType.LINE,
        title: "Occupancy Trend",
        xAxis: { field: "createdAt", label: "Month" },
        yAxis: { field: "occupancyRate", label: "Occupancy (%)" },
      },
      {
        type: ChartType.BAR,
        title: "Properties by Status",
        xAxis: { field: "propertyStatus", label: "Status" },
        yAxis: { field: "totalProperties", label: "Count" },
      },
    ],
    parameters: [
      {
        name: "startDate",
        label: "Start Date",
        type: "date",
        required: true,
        defaultValue: "${today - 90 days}",
      },
      {
        name: "endDate",
        label: "End Date",
        type: "date",
        required: true,
        defaultValue: "${today}",
      },
    ],
    tags: ["occupancy", "properties", "analytics"],
  },

  // ==================== REVENUE REPORTS ====================
  {
    name: "Monthly Revenue Summary",
    description: "Comprehensive revenue breakdown by property and payment type",
    type: ReportType.FINANCIAL,
    category: "revenue",
    isSystemTemplate: true,
    isPublic: true,
    isActive: true,
    query: {
      dataSource: DataSource.PAYMENTS,
      filters: [{ field: "status", operator: "eq", value: "completed" }],
      groupBy: [
        { field: "propertyId", alias: "property" },
        { field: "method", alias: "paymentMethod" },
      ],
      aggregations: [
        { field: "amount", type: AggregationType.SUM, alias: "totalRevenue" },
        { field: "_id", type: AggregationType.COUNT, alias: "transactionCount" },
        { field: "amount", type: AggregationType.AVG, alias: "averageAmount" },
      ],
      timeGranularity: TimeGranularity.MONTH,
      sort: [{ field: "totalRevenue", order: "desc" }],
      limit: 500,
    },
    charts: [
      {
        type: ChartType.BAR,
        title: "Revenue by Payment Method",
        xAxis: { field: "paymentMethod", label: "Method" },
        yAxis: { field: "totalRevenue", label: "Revenue (KES)", format: "currency" },
      },
      {
        type: ChartType.PIE,
        title: "Revenue Distribution",
        series: [{ field: "totalRevenue", label: "Revenue", color: "#3498db" }],
      },
    ],
    parameters: [
      {
        name: "month",
        label: "Month",
        type: "date",
        required: true,
        defaultValue: "${currentMonth}",
      },
    ],
    tags: ["revenue", "financial", "payments", "monthly"],
  },

  // ==================== TENANT REPORTS ====================
  {
    name: "Tenant Behavior Analysis",
    description: "Analyze tenant payment patterns, renewal rates, and satisfaction",
    type: ReportType.ANALYTICAL,
    category: "tenants",
    isSystemTemplate: true,
    isPublic: true,
    isActive: true,
    query: {
      dataSource: DataSource.USERS,
      filters: [{ field: "role", operator: "eq", value: "tenant" }],
      groupBy: [{ field: "status", alias: "tenantStatus" }],
      aggregations: [
        { field: "_id", type: AggregationType.COUNT, alias: "totalTenants" },
        {
          field: "contractsCompleted",
          type: AggregationType.SUM,
          alias: "totalContracts",
        },
        {
          field: "paymentsOnTime",
          type: AggregationType.AVG,
          alias: "onTimePaymentRate",
        },
      ],
      limit: 1000,
    },
    charts: [
      {
        type: ChartType.BAR,
        title: "Tenant Distribution",
        xAxis: { field: "tenantStatus", label: "Status" },
        yAxis: { field: "totalTenants", label: "Count" },
      },
      {
        type: ChartType.LINE,
        title: "Payment Reliability",
        xAxis: { field: "month", label: "Month" },
        yAxis: { field: "onTimePaymentRate", label: "On-Time Rate (%)" },
      },
    ],
    parameters: [
      {
        name: "period",
        label: "Analysis Period",
        type: "select",
        required: true,
        options: ["last_30_days", "last_90_days", "last_year"],
        defaultValue: "last_90_days",
      },
    ],
    tags: ["tenants", "behavior", "analytics", "payments"],
  },

  // ==================== MAINTENANCE REPORTS ====================
  {
    name: "Maintenance Request Tracking",
    description:
      "Track maintenance requests, response times, and completion rates",
    type: ReportType.OPERATIONAL,
    category: "maintenance",
    isSystemTemplate: true,
    isPublic: true,
    isActive: true,
    query: {
      dataSource: DataSource.MAINTENANCE,
      groupBy: [
        { field: "status", alias: "requestStatus" },
        { field: "priority", alias: "priority" },
        { field: "category", alias: "category" },
      ],
      aggregations: [
        { field: "_id", type: AggregationType.COUNT, alias: "totalRequests" },
        {
          field: "responseTime",
          type: AggregationType.AVG,
          alias: "avgResponseTime",
        },
        {
          field: "completionTime",
          type: AggregationType.AVG,
          alias: "avgCompletionTime",
        },
        { field: "cost", type: AggregationType.SUM, alias: "totalCost" },
      ],
      timeGranularity: TimeGranularity.WEEK,
      limit: 500,
    },
    charts: [
      {
        type: ChartType.BAR,
        title: "Requests by Status",
        xAxis: { field: "requestStatus", label: "Status" },
        yAxis: { field: "totalRequests", label: "Count" },
      },
      {
        type: ChartType.LINE,
        title: "Response Time Trend",
        xAxis: { field: "week", label: "Week" },
        yAxis: { field: "avgResponseTime", label: "Hours" },
      },
    ],
    parameters: [
      {
        name: "propertyId",
        label: "Property (Optional)",
        type: "string",
        required: false,
      },
      {
        name: "startDate",
        label: "Start Date",
        type: "date",
        required: true,
        defaultValue: "${today - 30 days}",
      },
    ],
    tags: ["maintenance", "operations", "tracking"],
  },

  // ==================== COMPLIANCE REPORTS ====================
  {
    name: "Regulatory Compliance Report",
    description:
      "Track compliance with Kenyan rental regulations and documentation",
    type: ReportType.COMPLIANCE,
    category: "compliance",
    isSystemTemplate: true,
    isPublic: true,
    isActive: true,
    query: {
      dataSource: DataSource.PROPERTIES,
      filters: [{ field: "country", operator: "eq", value: "Kenya" }],
      groupBy: [
        { field: "county", alias: "county" },
        { field: "complianceStatus", alias: "status" },
      ],
      aggregations: [
        { field: "_id", type: AggregationType.COUNT, alias: "totalProperties" },
        {
          field: "missingDocuments",
          type: AggregationType.SUM,
          alias: "documentIssues",
        },
        {
          field: "expiringCertificates",
          type: AggregationType.SUM,
          alias: "expiringCerts",
        },
      ],
      sort: [{ field: "documentIssues", order: "desc" }],
      limit: 100,
    },
    charts: [
      {
        type: ChartType.BAR,
        title: "Compliance by County",
        xAxis: { field: "county", label: "County" },
        yAxis: { field: "totalProperties", label: "Properties" },
        series: [
          { field: "compliant", label: "Compliant", color: "#2ecc71" },
          { field: "nonCompliant", label: "Non-Compliant", color: "#e74c3c" },
        ],
      },
    ],
    parameters: [
      {
        name: "county",
        label: "County (Optional)",
        type: "select",
        required: false,
        options: [
          "Nairobi",
          "Mombasa",
          "Kisumu",
          "Nakuru",
          "Eldoret",
          "All Counties",
        ],
        defaultValue: "All Counties",
      },
    ],
    tags: ["compliance", "regulatory", "kenya", "legal"],
  },

  // ==================== BOOKING REPORTS ====================
  {
    name: "Booking Performance Report",
    description: "Analyze booking trends, conversion rates, and cancellations",
    type: ReportType.ANALYTICAL,
    category: "bookings",
    isSystemTemplate: true,
    isPublic: true,
    isActive: true,
    query: {
      dataSource: DataSource.BOOKINGS,
      groupBy: [
        { field: "status", alias: "bookingStatus" },
        { field: "propertyType", alias: "propertyType" },
      ],
      aggregations: [
        { field: "_id", type: AggregationType.COUNT, alias: "totalBookings" },
        { field: "amount", type: AggregationType.SUM, alias: "totalValue" },
        { field: "amount", type: AggregationType.AVG, alias: "averageValue" },
      ],
      timeGranularity: TimeGranularity.DAY,
      sort: [{ field: "createdAt", order: "desc" }],
      limit: 1000,
    },
    charts: [
      {
        type: ChartType.LINE,
        title: "Daily Booking Trend",
        xAxis: { field: "date", label: "Date" },
        yAxis: { field: "totalBookings", label: "Bookings" },
      },
      {
        type: ChartType.PIE,
        title: "Bookings by Status",
        series: [{ field: "totalBookings", label: "Bookings" }],
      },
    ],
    parameters: [
      {
        name: "dateRange",
        label: "Date Range",
        type: "dateRange",
        required: true,
        defaultValue: "${last_30_days}",
      },
    ],
    tags: ["bookings", "performance", "analytics"],
  },

  // ==================== KENYA-SPECIFIC REPORTS ====================
  {
    name: "M-Pesa Transaction Analytics",
    description:
      "Detailed M-Pesa payment analysis for Kenyan rental transactions",
    type: ReportType.FINANCIAL,
    category: "kenya",
    isSystemTemplate: true,
    isPublic: true,
    isActive: true,
    query: {
      dataSource: DataSource.PAYMENTS,
      filters: [{ field: "method", operator: "eq", value: "mpesa" }],
      groupBy: [
        { field: "status", alias: "transactionStatus" },
        { field: "phoneNetwork", alias: "network" },
      ],
      aggregations: [
        {
          field: "_id",
          type: AggregationType.COUNT,
          alias: "totalTransactions",
        },
        { field: "amount", type: AggregationType.SUM, alias: "totalAmount" },
        { field: "amount", type: AggregationType.AVG, alias: "averageAmount" },
        {
          field: "processingTime",
          type: AggregationType.AVG,
          alias: "avgProcessingTime",
        },
      ],
      timeGranularity: TimeGranularity.HOUR,
      limit: 500,
    },
    charts: [
      {
        type: ChartType.LINE,
        title: "M-Pesa Transaction Volume",
        xAxis: { field: "hour", label: "Time" },
        yAxis: { field: "totalTransactions", label: "Transactions" },
      },
      {
        type: ChartType.BAR,
        title: "Transaction Status",
        xAxis: { field: "transactionStatus", label: "Status" },
        yAxis: { field: "totalTransactions", label: "Count" },
      },
    ],
    parameters: [
      {
        name: "date",
        label: "Date",
        type: "date",
        required: true,
        defaultValue: "${today}",
      },
    ],
    tags: ["mpesa", "kenya", "payments", "mobile money"],
  },
];

/**
 * Seed system templates into database
 */
export async function seedSystemTemplates(
  adminUserId: Types.ObjectId
): Promise<void> {
  try {
    console.log("[System Templates] Starting seeding...");

    // Remove existing system templates
    const deleted = await ReportTemplate.deleteMany({ isSystemTemplate: true });
    console.log(`[System Templates] Removed ${deleted.deletedCount} existing templates`);

    // Create new system templates
    const templates = SYSTEM_TEMPLATES.map((template) => ({
      ...template,
      createdBy: adminUserId,
      version: 1,
    }));

    const created = await ReportTemplate.insertMany(templates);
    console.log(`[System Templates] Created ${created.length} templates`);

    console.log("[System Templates] Seeding completed successfully!");
  } catch (error) {
    console.error("[System Templates] Error seeding templates:", error);
    throw error;
  }
}

/**
 * Get all system templates
 */
export async function getSystemTemplates(): Promise<any[]> {
  return await ReportTemplate.find({
    isSystemTemplate: true,
    isActive: true,
  })
    .sort({ category: 1, name: 1 })
    .lean();
}

/**
 * Get system templates by category
 */
export async function getSystemTemplatesByCategory(
  category: string
): Promise<any[]> {
  return await ReportTemplate.find({
    isSystemTemplate: true,
    isActive: true,
    category,
  })
    .sort({ name: 1 })
    .lean();
}
