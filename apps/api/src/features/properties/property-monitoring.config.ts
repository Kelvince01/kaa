/**
 * Property Monitoring Configuration
 *
 * Defines monitoring metrics, alerts, and dashboards for property management
 */

import type { CreateAlertData } from "@kaa/services";

// ==================== METRICS DEFINITIONS ====================

export const propertyMetrics = {
  // Property Count Metrics
  TOTAL_PROPERTIES: "properties_total",
  ACTIVE_PROPERTIES: "properties_active",
  DRAFT_PROPERTIES: "properties_draft",
  INACTIVE_PROPERTIES: "properties_inactive",
  VERIFIED_PROPERTIES: "properties_verified",
  FEATURED_PROPERTIES: "properties_featured",

  // Property Activity Metrics
  PROPERTY_VIEWS: "properties_views_total",
  PROPERTY_INQUIRIES: "properties_inquiries_total",
  PROPERTY_APPLICATIONS: "properties_applications_total",
  PROPERTY_BOOKMARKS: "properties_bookmarks_total",

  // Property Operations Metrics
  PROPERTY_CREATED: "properties_created_total",
  PROPERTY_UPDATED: "properties_updated_total",
  PROPERTY_DELETED: "properties_deleted_total",
  PROPERTY_APPROVED: "properties_approved_total",
  PROPERTY_REJECTED: "properties_rejected_total",

  // Property Performance Metrics
  PROPERTY_CREATION_TIME: "properties_creation_duration_ms",
  PROPERTY_UPDATE_TIME: "properties_update_duration_ms",
  PROPERTY_SEARCH_TIME: "properties_search_duration_ms",
  PROPERTY_ANALYTICS_TIME: "properties_analytics_duration_ms",

  // Property Quality Metrics
  PROPERTY_WITH_IMAGES: "properties_with_images_count",
  PROPERTY_WITH_VIDEOS: "properties_with_videos_count",
  PROPERTY_WITH_VIRTUAL_TOURS: "properties_with_virtual_tours_count",
  PROPERTY_COMPLETE_PROFILES: "properties_complete_profiles_count",

  // Property Moderation Metrics
  PENDING_MODERATION: "properties_pending_moderation_count",
  FLAGGED_PROPERTIES: "properties_flagged_count",
  MODERATION_QUEUE_TIME: "properties_moderation_queue_duration_ms",
};

// ==================== ALERT CONFIGURATIONS ====================

export const propertyAlerts: Omit<CreateAlertData, "createdBy" | "memberId">[] =
  [
    // High Pending Moderation Alert
    {
      name: "High Pending Moderation Queue",
      description:
        "Alert when there are too many properties pending moderation",
      type: "metric",
      severity: "warning",
      conditions: {
        metric: propertyMetrics.PENDING_MODERATION,
        operator: "gt",
        threshold: 50,
        timeWindow: 30, // 30 minutes
      },
      channels: [
        {
          type: "email",
          config: {
            recipients: ["moderators@example.com"],
            subject: "High Property Moderation Queue",
          },
        },
        {
          type: "slack",
          config: {
            channel: "#property-moderation",
            webhook:
              process.env.SLACK_MODERATION_WEBHOOK ||
              "https://hooks.slack.com/...",
          },
        },
      ],
    },

    // Low Active Properties Alert
    {
      name: "Low Active Properties",
      description: "Alert when active property count drops significantly",
      type: "metric",
      severity: "error",
      conditions: {
        metric: propertyMetrics.ACTIVE_PROPERTIES,
        operator: "lt",
        threshold: 100,
        timeWindow: 60,
      },
      channels: [
        {
          type: "email",
          config: {
            recipients: ["admin@example.com"],
            subject: "Low Active Property Count",
          },
        },
      ],
    },

    // High Property Creation Time Alert
    {
      name: "Slow Property Creation",
      description: "Alert when property creation takes too long",
      type: "performance",
      severity: "warning",
      conditions: {
        metric: propertyMetrics.PROPERTY_CREATION_TIME,
        operator: "gt",
        threshold: 5000, // 5 seconds
        timeWindow: 15,
      },
      channels: [
        {
          type: "slack",
          config: {
            channel: "#property-performance",
            webhook:
              process.env.SLACK_PERFORMANCE_WEBHOOK ||
              "https://hooks.slack.com/...",
          },
        },
      ],
    },

    // Many Flagged Properties Alert
    {
      name: "High Flagged Property Count",
      description: "Alert when too many properties are flagged for review",
      type: "security",
      severity: "critical",
      conditions: {
        metric: propertyMetrics.FLAGGED_PROPERTIES,
        operator: "gt",
        threshold: 20,
        timeWindow: 60,
      },
      channels: [
        {
          type: "email",
          config: {
            recipients: ["security@example.com", "admin@example.com"],
            subject: "Critical: High Flagged Property Count",
          },
        },
        {
          type: "sms",
          config: {
            recipients: ["+254700000000"],
          },
        },
      ],
    },

    // Slow Search Performance Alert
    {
      name: "Slow Property Search",
      description: "Alert when property searches are slow",
      type: "performance",
      severity: "warning",
      conditions: {
        metric: propertyMetrics.PROPERTY_SEARCH_TIME,
        operator: "gt",
        threshold: 3000, // 3 seconds
        timeWindow: 15,
      },
      channels: [
        {
          type: "slack",
          config: {
            channel: "#property-performance",
            webhook:
              process.env.SLACK_PERFORMANCE_WEBHOOK ||
              "https://hooks.slack.com/...",
          },
        },
      ],
    },

    // Low Engagement Alert
    {
      name: "Low Property Engagement",
      description: "Alert when property views drop significantly",
      type: "metric",
      severity: "info",
      conditions: {
        metric: propertyMetrics.PROPERTY_VIEWS,
        operator: "lt",
        threshold: 100,
        timeWindow: 60,
      },
      channels: [
        {
          type: "email",
          config: {
            recipients: ["marketing@example.com"],
            subject: "Low Property Engagement Detected",
          },
        },
      ],
    },
  ];

// ==================== DASHBOARD CONFIGURATION ====================

export const propertyDashboardConfig = {
  name: "Property Management Dashboard",
  description:
    "Comprehensive dashboard for monitoring property listings and operations",
  layout: {
    columns: 4,
    rows: 6,
    responsive: true,
  },
  refreshInterval: 60, // 60 seconds
  widgets: [
    // Row 1: Key Metrics
    {
      id: "total-properties",
      title: "Total Properties",
      type: "stat",
      metric: propertyMetrics.TOTAL_PROPERTIES,
      position: { x: 0, y: 0, width: 1, height: 1 },
      visualization: "number",
      color: "blue",
    },
    {
      id: "active-properties",
      title: "Active Properties",
      type: "stat",
      metric: propertyMetrics.ACTIVE_PROPERTIES,
      position: { x: 1, y: 0, width: 1, height: 1 },
      visualization: "number",
      color: "green",
    },
    {
      id: "pending-moderation",
      title: "Pending Moderation",
      type: "stat",
      metric: propertyMetrics.PENDING_MODERATION,
      position: { x: 2, y: 0, width: 1, height: 1 },
      visualization: "number",
      color: "yellow",
      alert: {
        threshold: 50,
        severity: "warning",
      },
    },
    {
      id: "verified-properties",
      title: "Verified Properties",
      type: "stat",
      metric: propertyMetrics.VERIFIED_PROPERTIES,
      position: { x: 3, y: 0, width: 1, height: 1 },
      visualization: "number",
      color: "purple",
    },

    // Row 2: Engagement Metrics
    {
      id: "total-views",
      title: "Total Views",
      type: "stat",
      metric: propertyMetrics.PROPERTY_VIEWS,
      position: { x: 0, y: 1, width: 1, height: 1 },
      visualization: "number",
      color: "indigo",
    },
    {
      id: "total-inquiries",
      title: "Total Inquiries",
      type: "stat",
      metric: propertyMetrics.PROPERTY_INQUIRIES,
      position: { x: 1, y: 1, width: 1, height: 1 },
      visualization: "number",
      color: "cyan",
    },
    {
      id: "total-applications",
      title: "Total Applications",
      type: "stat",
      metric: propertyMetrics.PROPERTY_APPLICATIONS,
      position: { x: 2, y: 1, width: 1, height: 1 },
      visualization: "number",
      color: "teal",
    },
    {
      id: "total-bookmarks",
      title: "Total Bookmarks",
      type: "stat",
      metric: propertyMetrics.PROPERTY_BOOKMARKS,
      position: { x: 3, y: 1, width: 1, height: 1 },
      visualization: "number",
      color: "pink",
    },

    // Row 3: Property Operations Trend
    {
      id: "property-operations",
      title: "Property Operations (24h)",
      type: "timeseries",
      metrics: [
        propertyMetrics.PROPERTY_CREATED,
        propertyMetrics.PROPERTY_UPDATED,
        propertyMetrics.PROPERTY_DELETED,
      ],
      position: { x: 0, y: 2, width: 4, height: 2 },
      visualization: "line",
      timeRange: "24h",
    },

    // Row 5: Property Status Distribution
    {
      id: "property-status",
      title: "Property Status Distribution",
      type: "chart",
      metrics: [
        propertyMetrics.ACTIVE_PROPERTIES,
        propertyMetrics.DRAFT_PROPERTIES,
        propertyMetrics.INACTIVE_PROPERTIES,
      ],
      position: { x: 0, y: 4, width: 2, height: 2 },
      visualization: "pie",
    },

    // Row 5: Property Quality Metrics
    {
      id: "property-quality",
      title: "Property Quality Metrics",
      type: "chart",
      metrics: [
        propertyMetrics.PROPERTY_WITH_IMAGES,
        propertyMetrics.PROPERTY_WITH_VIDEOS,
        propertyMetrics.PROPERTY_WITH_VIRTUAL_TOURS,
        propertyMetrics.PROPERTY_COMPLETE_PROFILES,
      ],
      position: { x: 2, y: 4, width: 2, height: 2 },
      visualization: "bar",
    },
  ],
  theme: {
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
    fonts: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif",
    },
  },
};

// ==================== REPORT DEFINITIONS ====================

export const propertyReports = {
  // Daily Property Report
  dailyReport: {
    name: "Daily Property Report",
    schedule: "0 0 * * *", // Daily at midnight
    recipients: ["admin@example.com", "management@example.com"],
    metrics: [
      {
        name: "New Properties",
        metric: propertyMetrics.PROPERTY_CREATED,
        aggregation: "sum",
        period: "24h",
      },
      {
        name: "Active Properties",
        metric: propertyMetrics.ACTIVE_PROPERTIES,
        aggregation: "last",
      },
      {
        name: "Pending Moderation",
        metric: propertyMetrics.PENDING_MODERATION,
        aggregation: "last",
      },
      {
        name: "Total Views",
        metric: propertyMetrics.PROPERTY_VIEWS,
        aggregation: "sum",
        period: "24h",
      },
      {
        name: "Total Inquiries",
        metric: propertyMetrics.PROPERTY_INQUIRIES,
        aggregation: "sum",
        period: "24h",
      },
    ],
  },

  // Weekly Performance Report
  weeklyReport: {
    name: "Weekly Property Performance Report",
    schedule: "0 9 * * 1", // Mondays at 9 AM
    recipients: ["admin@example.com", "marketing@example.com"],
    metrics: [
      {
        name: "New Properties This Week",
        metric: propertyMetrics.PROPERTY_CREATED,
        aggregation: "sum",
        period: "7d",
      },
      {
        name: "Average Property Creation Time",
        metric: propertyMetrics.PROPERTY_CREATION_TIME,
        aggregation: "avg",
        period: "7d",
      },
      {
        name: "Total Engagement",
        metrics: [
          propertyMetrics.PROPERTY_VIEWS,
          propertyMetrics.PROPERTY_INQUIRIES,
          propertyMetrics.PROPERTY_APPLICATIONS,
        ],
        aggregation: "sum",
        period: "7d",
      },
      {
        name: "Properties Approved",
        metric: propertyMetrics.PROPERTY_APPROVED,
        aggregation: "sum",
        period: "7d",
      },
      {
        name: "Properties Rejected",
        metric: propertyMetrics.PROPERTY_REJECTED,
        aggregation: "sum",
        period: "7d",
      },
    ],
  },

  // Monthly Analytics Report
  monthlyReport: {
    name: "Monthly Property Analytics Report",
    schedule: "0 9 1 * *", // First day of month at 9 AM
    recipients: [
      "admin@example.com",
      "management@example.com",
      "analytics@example.com",
    ],
    metrics: [
      {
        name: "Total Properties",
        metric: propertyMetrics.TOTAL_PROPERTIES,
        aggregation: "last",
      },
      {
        name: "Growth Rate",
        metric: propertyMetrics.PROPERTY_CREATED,
        aggregation: "sum",
        period: "30d",
        comparison: "previous_period",
      },
      {
        name: "Engagement Rate",
        metrics: [
          propertyMetrics.PROPERTY_VIEWS,
          propertyMetrics.PROPERTY_INQUIRIES,
        ],
        aggregation: "sum",
        period: "30d",
        comparison: "previous_period",
      },
      {
        name: "Average Moderation Time",
        metric: propertyMetrics.MODERATION_QUEUE_TIME,
        aggregation: "avg",
        period: "30d",
      },
      {
        name: "Property Quality Score",
        metrics: [
          propertyMetrics.PROPERTY_WITH_IMAGES,
          propertyMetrics.PROPERTY_COMPLETE_PROFILES,
        ],
        aggregation: "avg",
        period: "30d",
      },
    ],
  },
};

// ==================== HEALTH CHECKS ====================

export const propertyHealthChecks = {
  // Check if property service is responsive
  serviceHealth: {
    name: "Property Service Health",
    interval: 60, // Check every 60 seconds
    timeout: 5000, // 5 second timeout
    check: () => {
      // This would be implemented in the health check service
      return { healthy: true, responseTime: 150 };
    },
  },

  // Check database connection
  databaseHealth: {
    name: "Property Database Health",
    interval: 120, // Check every 2 minutes
    timeout: 10_000, // 10 second timeout
    check: () => {
      // This would be implemented in the health check service
      return { healthy: true, lag: 5 };
    },
  },

  // Check search performance
  searchHealth: {
    name: "Property Search Performance",
    interval: 300, // Check every 5 minutes
    timeout: 3000, // 3 second timeout
    check: () => {
      // This would be implemented in the health check service
      return { healthy: true, avgResponseTime: 250 };
    },
  },
};

// ==================== EXPORT ====================

export const propertyMonitoringConfig = {
  metrics: propertyMetrics,
  alerts: propertyAlerts,
  dashboard: propertyDashboardConfig,
  reports: propertyReports,
  healthChecks: propertyHealthChecks,
};
