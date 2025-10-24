/**
 * Properties Module - Main Index
 *
 * This module provides property management functionality including
 * core property operations, AI-powered features, and related sub-features.
 */

// =============================================================================
// CORE PROPERTY MODULE EXPORTS
// =============================================================================

// Export amenities submodule
export * from "./amenities";
export {
  useCreateProperty,
  useDeleteProperty,
  useDeleteSavedSearch,
  useSaveSearch,
  useSubmitPropertyInquiry,
  useSubscribeToPropertyAlerts,
  useUpdateProperty,
  useUploadPropertyImages,
  useUploadVirtualTour,
  useValidateAddress,
} from "./property.mutations";
// Export existing property queries
export {
  // New AI-Powered Queries
  useAIRecommendations,
  // New Comparison Queries
  useCompareProperties,
  useComparisonTemplate,
  useFavoriteProperties,
  useFeaturedProperties,
  // New Market Analysis Queries
  useInvestmentAnalysis,
  useLocationMarketInsights,
  useMarketInsights,
  // New Location Queries
  useNearbyAmenities,
  useProperties,
  usePropertiesByLandlord,
  usePropertiesByOrganization,
  usePropertiesByUser,
  useProperty,
  // New Notification Queries
  usePropertyAlerts,
  // New Analytics Queries
  usePropertyAnalytics,
  usePropertyPerformanceComparison,
  useRentalYieldAnalysis,
  // New Search Queries
  useSavedSearches,
  useSearchProperties,
  useSearchSuggestions,
  // New Virtual Tour Queries
  useVirtualTour_v1,
} from "./property.queries";
// Export existing property services
export {
  // New Comparison Services
  compareProperties,
  createProperty,
  deleteProperty,
  deleteSavedSearch,
  // New AI-Powered Services
  getAIRecommendations,
  getComparisonTemplate,
  getFavoriteProperties,
  getFeaturedProperties,
  // New Market Analysis Services
  getInvestmentAnalysis,
  getLocationMarketInsights,
  getMarketInsights,
  // New Location Services
  getNearbyAmenities,
  getProperties,
  getPropertiesByLandlord,
  getPropertiesByOrganization,
  getPropertiesByUser,
  getProperty,
  getPropertyAlerts,
  // New Analytics Services
  getPropertyAnalytics,
  getPropertyPerformanceComparison,
  getRentalYieldAnalysis,
  getSavedSearches,
  getSearchSuggestions,
  getVirtualTour_v1,
  // New Search Services
  saveSearch,
  searchProperties,
  submitPropertyInquiry,
  // New Notification Services
  subscribeToPropertyAlerts,
  updateProperty,
  uploadPropertyImages,
  // New Virtual Tour Services
  uploadVirtualTour,
  validateAddress,
} from "./property.service";
// Export property stores
export { usePropertyStore } from "./property.store";
// Export main property types
export type {
  Address,
  AddressValidationResult,
  AIRecommendation,
  Amenity,
  FavoritesResponse,
  GeoLocation,
  MarketInsights,
  NearbyAmenity,
  Property,
  // New AI and Analytics Types
  PropertyAnalytics,
  PropertyComparison,
  PropertyFilters,
  PropertyInquiryRequest,
  PropertyListResponse,
  PropertySearchParams,
  SavedSearch,
} from "./property.type";
export { useRecentlyViewedStore } from "./recently-viewed.store";

// =============================================================================
// NEW AI-POWERED COMPONENTS
// =============================================================================

// AI Description Generator
// export { AIDescriptionGenerator } from "./components/ai-description-generator";

// AI Image Analyzer
// export { AIImageAnalyzer } from "./components/ai-image-analyzer";

// Enhanced Location Picker
// export { EnhancedLocationPicker } from "./components/enhanced-location-picker";

// Property Analytics Dashboard
// export { PropertyAnalyticsDashboard } from "./components/property-analytics-dashboard";

// Property Comparison Tool
// export { PropertyComparison } from "./components/property-comparison";

// =============================================================================
// SUB-FEATURE EXPORTS
// =============================================================================

// -----------------------------------------------------------------------------
// INSPECTIONS SUB-FEATURE
// -----------------------------------------------------------------------------

// Re-export all inspection functionality
// export * from "./inspections";

// -----------------------------------------------------------------------------
// FAVOURITES SUB-FEATURE
// -----------------------------------------------------------------------------

// Re-export all favourites functionality
// export * from "./favourites";

// -----------------------------------------------------------------------------
// WORK ORDERS SUB-FEATURE
// -----------------------------------------------------------------------------

// Re-export all work orders functionality
// export * from "./work-orders";

// -----------------------------------------------------------------------------
// CONTRACTORS SUB-FEATURE
// -----------------------------------------------------------------------------

// Re-export all contractors functionality
// export * from "./contractors";

// -----------------------------------------------------------------------------
// INSURANCE SUB-FEATURE
// -----------------------------------------------------------------------------

// Re-export all insurance functionality
// export * from "./insurance";

// -----------------------------------------------------------------------------
// SCHEDULING SUB-FEATURE
// -----------------------------------------------------------------------------

// Re-export all scheduling functionality
// export * from "./scheduling";

// -----------------------------------------------------------------------------
// VALUATION SUB-FEATURE
// -----------------------------------------------------------------------------

// Re-export all valuation functionality
// export * from "./valuation";

// -----------------------------------------------------------------------------
// VIRTUAL TOURS SUB-FEATURE (NEW - ADVANCED)
// -----------------------------------------------------------------------------

// Re-export all virtual tours functionality
// export * from "./virtual-tours";

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

// Common interfaces used across sub-features
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type ApiResponse<T> = {
  status: "success" | "error";
  message?: string;
  data?: T;
};

// =============================================================================
// MODULE CONFIGURATION
// =============================================================================

/**
 * Properties module configuration
 */
export const propertiesModuleConfig = {
  name: "properties",
  version: "2.0.0",
  description:
    "Comprehensive property management system with AI-powered features",
  subFeatures: {
    inspections: {
      implemented: true,
      version: "1.0.0",
      description: "Property inspection management",
    },
    favourites: {
      implemented: true,
      version: "1.0.0",
      description: "Property favourites and recommendations",
    },
    workOrders: {
      implemented: true,
      version: "1.0.0",
      description: "Work order and maintenance management",
    },
    conditions: {
      implemented: false,
      version: "0.0.0",
      description: "Property condition reports",
    },
    contractors: {
      implemented: true,
      version: "1.0.0",
      description: "Contractor management",
    },
    insurance: {
      implemented: true,
      version: "1.0.0",
      description: "Property insurance management",
    },
    valuation: {
      implemented: true,
      version: "1.0.0",
      description: "Property valuation and market analysis",
    },
    scheduling: {
      implemented: true,
      version: "1.0.0",
      description: "General property scheduling",
    },
    // New AI-Powered Features
    aiFeatures: {
      implemented: true,
      version: "2.0.0",
      description:
        "AI-powered property features including description generation and image analysis",
    },
    enhancedLocation: {
      implemented: true,
      version: "2.0.0",
      description:
        "Enhanced location services with map integration and nearby amenities",
    },
    analytics: {
      implemented: true,
      version: "2.0.0",
      description: "Property analytics and market insights dashboard",
    },
    comparison: {
      implemented: true,
      version: "2.0.0",
      description: "Property comparison tool for side-by-side analysis",
    },
    advancedSearch: {
      implemented: true,
      version: "2.0.0",
      description: "Advanced search with saved searches and AI recommendations",
    },
    virtualTours: {
      implemented: true,
      version: "2.0.0-advanced",
      description:
        "Advanced virtual tours with AI, XR, and real-time collaboration",
    },
    smartNotifications: {
      implemented: true,
      version: "2.0.0",
      description: "Smart property alerts and notifications",
    },
    marketAnalysis: {
      implemented: true,
      version: "2.0.0",
      description: "Investment analysis and rental yield calculations",
    },
  },
} as const;

/**
 * Get list of implemented sub-features
 */
export const getImplementedSubFeatures = () =>
  Object.entries(propertiesModuleConfig.subFeatures)
    .filter(([_, config]) => config.implemented)
    .map(([name, config]) => ({ name, ...config }));

/**
 * Get list of planned sub-features
 */
export const getPlannedSubFeatures = () =>
  Object.entries(propertiesModuleConfig.subFeatures)
    .filter(([_, config]) => !config.implemented)
    .map(([name, config]) => ({ name, ...config }));

/**
 * Check if a sub-feature is implemented
 */
export const isSubFeatureImplemented = (subFeatureName: string): boolean => {
  const subFeature =
    propertiesModuleConfig.subFeatures[
      subFeatureName as keyof typeof propertiesModuleConfig.subFeatures
    ];
  return subFeature?.implemented;
};

/**
 * Get AI-powered features
 */
export const getAIFeatures = () => [
  "aiFeatures",
  "enhancedLocation",
  "analytics",
  "comparison",
  "advancedSearch",
  "virtualTours",
  "smartNotifications",
  "marketAnalysis",
];

/**
 * Check if AI features are available
 */
export const hasAIFeatures = (): boolean =>
  getAIFeatures().every((feature) => isSubFeatureImplemented(feature));
