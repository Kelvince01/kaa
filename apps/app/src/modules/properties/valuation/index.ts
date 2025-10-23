// Export valuation types

// Export valuation queries
export * from "./valuation.queries";

// Export valuation services
export * from "./valuation.service";
// Re-export commonly used types for convenience
export type {
  ComparableProperty,
  CreateValuationInput,
  MarketAnalysis,
  PropertyValuation,
  UpdateValuationInput,
  ValuationComparison,
  ValuationListResponse,
  ValuationQueryParams,
  ValuationRange,
  ValuationResponse,
} from "./valuation.type";
export * from "./valuation.type";
