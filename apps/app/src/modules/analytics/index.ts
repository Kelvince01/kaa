// Analytics Module Exports

// Queries
export * from "./analytics.queries";

// Services
export * from "./analytics.service";
// Store
export { useAnalyticsStore } from "./analytics.store";
// Re-export key types for convenience
export type {
  AnalyticsEvent,
  AnalyticsFilter,
  AnalyticsStats,
  ChartData,
  DemandForecast,
  FinancialAnalytics,
  FormAnalytics,
  InvestmentOpportunity,
  LocationScore,
  MarketData,
  MarketInsight,
  PortfolioAnalytics,
  PropertyComparison,
  PropertyPerformanceMetrics,
  PropertyView,
  UserBehavior,
} from "./analytics.type";
// Types
export * from "./analytics.type";
// Chart Components (Updated with shadcn integration)
// Chart Examples and Sample Data
export {
  AreaChartComponent,
  BarChartComponent,
  CHART_COLORS,
  ChartExamplesGrid,
  formatChartValue,
  generateChartConfig,
  generatePieChartConfig,
  generateTrendData,
  LEGACY_CHART_COLORS,
  LineChartComponent,
  MixedChartComponent,
  MixedPerformanceChart,
  MonthlyViewsChart,
  PERFORMANCE_CONFIG,
  PieChartComponent,
  PROPERTY_TYPES_CONFIG,
  PropertyTypesChart,
  QuarterlyPerformanceChart,
  REVENUE_CHART_CONFIG,
  RevenueAreaChart,
  SAMPLE_MIXED_PERFORMANCE_DATA,
  SAMPLE_MONTHLY_VIEWS_DATA,
  SAMPLE_PROPERTY_TYPES_DATA,
  SAMPLE_REVENUE_DATA,
  VIEWS_CHART_CONFIG,
} from "./components/charts";
export { PropertyPerformanceChart } from "./components/charts/property-performance-chart";
// Components
export { AnalyticsOverview } from "./components/dashboard/analytics-overview";
export { EngagementFunnelChart } from "./components/dashboard/engagement-funnel-chart";
export { PerformanceComparisonChart } from "./components/dashboard/performance-comparison-chart";
export { PropertyDistributionChart } from "./components/dashboard/property-distribution-chart";
// Dashboard Chart Components
export { RevenueChart } from "./components/dashboard/revenue-chart";
export { MarketInsightsPanel } from "./components/market-intelligence/market-insights-panel";
