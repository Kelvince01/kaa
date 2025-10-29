import { create } from "zustand";
import type {
  AnalyticsFilter,
  MarketInsight,
  PortfolioAnalytics,
  PropertyPerformanceMetrics,
} from "./analytics.type";

type AnalyticsStore = {
  // Filter State
  currentFilter: AnalyticsFilter;

  // Selected Data
  selectedProperty?: string;
  selectedPeriod: "7d" | "30d" | "90d" | "1y";
  selectedChart: "views" | "engagement" | "revenue" | "performance";

  // Cache
  propertyMetrics: Record<string, PropertyPerformanceMetrics>;
  portfolioData?: PortfolioAnalytics;
  marketInsights: MarketInsight[];

  // UI State
  activeTab: "overview" | "properties" | "portfolio" | "market" | "behavior";
  isLoading: boolean;
  sidebarExpanded: boolean;
  chartType: "line" | "bar" | "area" | "pie";

  // Comparison Mode
  comparisonMode: boolean;
  comparedProperties: string[];

  // Real-time Updates
  lastUpdated?: Date;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds

  // Actions
  setFilter: (filter: Partial<AnalyticsFilter>) => void;
  resetFilter: () => void;

  // Property Selection
  setSelectedProperty: (propertyId?: string) => void;
  setSelectedPeriod: (period: "7d" | "30d" | "90d" | "1y") => void;
  setSelectedChart: (
    chart: "views" | "engagement" | "revenue" | "performance"
  ) => void;

  // Cache Management
  setPropertyMetrics: (
    propertyId: string,
    metrics: PropertyPerformanceMetrics
  ) => void;
  setPortfolioData: (data: PortfolioAnalytics) => void;
  setMarketInsights: (insights: MarketInsight[]) => void;
  clearCache: () => void;

  // UI Actions
  setActiveTab: (
    tab: "overview" | "properties" | "portfolio" | "market" | "behavior"
  ) => void;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setChartType: (type: "line" | "bar" | "area" | "pie") => void;

  // Comparison Actions
  toggleComparisonMode: () => void;
  addToComparison: (propertyId: string) => void;
  removeFromComparison: (propertyId: string) => void;
  clearComparison: () => void;

  // Real-time Actions
  updateLastRefresh: () => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (seconds: number) => void;
};

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  // Initial State
  currentFilter: {},
  selectedPeriod: "30d",
  selectedChart: "views",
  propertyMetrics: {},
  marketInsights: [],
  activeTab: "overview",
  isLoading: false,
  sidebarExpanded: true,
  chartType: "line",
  comparisonMode: false,
  comparedProperties: [],
  autoRefresh: false,
  refreshInterval: 300, // 5 minutes

  // Filter Actions
  setFilter: (filter) => {
    set((state) => ({
      currentFilter: { ...state.currentFilter, ...filter },
    }));
  },

  resetFilter: () => {
    set({ currentFilter: {} });
  },

  // Property Selection Actions
  setSelectedProperty: (propertyId) => {
    set({ selectedProperty: propertyId });
  },

  setSelectedPeriod: (period) => {
    set({ selectedPeriod: period });
  },

  setSelectedChart: (chart) => {
    set({ selectedChart: chart });
  },

  // Cache Management Actions
  setPropertyMetrics: (propertyId, metrics) => {
    set((state) => ({
      propertyMetrics: {
        ...state.propertyMetrics,
        [propertyId]: metrics,
      },
    }));
  },

  setPortfolioData: (data) => {
    set({ portfolioData: data });
  },

  setMarketInsights: (insights) => {
    set({ marketInsights: insights });
  },

  clearCache: () => {
    set({
      propertyMetrics: {},
      portfolioData: undefined,
      marketInsights: [],
    });
  },

  // UI Actions
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarExpanded: !state.sidebarExpanded }));
  },

  setChartType: (type) => {
    set({ chartType: type });
  },

  // Comparison Actions
  toggleComparisonMode: () => {
    set((state) => ({
      comparisonMode: !state.comparisonMode,
      comparedProperties: state.comparisonMode ? [] : state.comparedProperties,
    }));
  },

  addToComparison: (propertyId) => {
    set((state) => {
      if (state.comparedProperties.includes(propertyId)) return state;
      if (state.comparedProperties.length >= 5) return state; // Max 5 properties

      return {
        comparedProperties: [...state.comparedProperties, propertyId],
      };
    });
  },

  removeFromComparison: (propertyId) => {
    set((state) => ({
      comparedProperties: state.comparedProperties.filter(
        (id) => id !== propertyId
      ),
    }));
  },

  clearComparison: () => {
    set({ comparedProperties: [] });
  },

  // Real-time Actions
  updateLastRefresh: () => {
    set({ lastUpdated: new Date() });
  },

  setAutoRefresh: (enabled) => {
    set({ autoRefresh: enabled });
  },

  setRefreshInterval: (seconds) => {
    set({ refreshInterval: seconds });
  },
}));
