import { httpClient } from "@/lib/axios";
import type {
  BulkValuationRequest,
  BulkValuationResponse,
  ComparableProperty,
  CreateValuationInput,
  MarketAnalysis,
  PropertyValuation,
  UpdateValuationInput,
  ValuationAlert,
  ValuationComparisonResponse,
  ValuationListResponse,
  ValuationQueryParams,
  ValuationReportResponse,
  ValuationResponse,
  ValuationStatsResponse,
} from "./valuation.type";

/**
 * Property Valuation service for managing property valuations and assessments
 */

// ============ VALUATION MANAGEMENT ============

// Request a new property valuation
export const requestValuation = async (
  data: CreateValuationInput
): Promise<ValuationResponse> => {
  const response = await httpClient.api.post("/properties/valuations/", data);
  return response.data;
};

// Create a new valuation
export const createValuation = async (
  data: CreateValuationInput
): Promise<ValuationResponse> => {
  const response = await httpClient.api.post("/properties/valuations/", data);
  return response.data;
};

// Get all valuations with optional filtering
export const getValuations = async (
  params: ValuationQueryParams = {}
): Promise<ValuationListResponse> => {
  const response = await httpClient.api.get("/properties/valuations/", {
    params,
  });
  return response.data;
};

// Get valuation by ID
export const getValuation = async (id: string): Promise<ValuationResponse> => {
  const response = await httpClient.api.get(`/properties/valuations/${id}`);
  return response.data;
};

// Update valuation
export const updateValuation = async (
  id: string,
  data: UpdateValuationInput
): Promise<ValuationResponse> => {
  const response = await httpClient.api.put(
    `/properties/valuations/${id}`,
    data
  );
  return response.data;
};

// Delete valuation
export const deleteValuation = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(`/properties/valuations/${id}`);
  return response.data;
};

// Generate automated valuation
export const generateAutomatedValuation = async (
  propertyId: string,
  requestedBy: string
): Promise<ValuationResponse> => {
  const response = await httpClient.api.post(
    `/properties/valuations/generate/${propertyId}`,
    {
      requestedBy,
    }
  );
  return response.data;
};

// Refresh valuation (update with latest market data)
export const refreshValuation = async (
  id: string
): Promise<ValuationResponse> => {
  const response = await httpClient.api.post(
    `/properties/valuations/${id}/refresh`
  );
  return response.data;
};

// ============ PROPERTY-SPECIFIC VALUATIONS ============

// Get valuations for a specific property
export const getPropertyValuations = async (
  propertyId: string,
  params: Partial<ValuationQueryParams> = {}
): Promise<ValuationListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/valuations`,
    { params }
  );
  return response.data;
};

// Get valuations by property (alias for getPropertyValuations)
export const getValuationsByProperty = async (
  propertyId: string
): Promise<ValuationListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/valuations`
  );
  return response.data;
};

// Get latest valuation for a property
export const getLatestPropertyValuation = async (
  propertyId: string
): Promise<ValuationResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/valuations/latest`
  );
  return response.data;
};

// Get valuation history for a property
export const getPropertyValuationHistory = async (
  propertyId: string,
  limit = 10
): Promise<ValuationListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/valuations/history`,
    {
      params: { limit },
    }
  );
  return response.data;
};

// Compare property valuations
export const comparePropertyValuations = async (
  propertyId: string,
  currentValuationId: string,
  previousValuationId?: string
): Promise<ValuationComparisonResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/valuations/compare`,
    {
      params: { current: currentValuationId, previous: previousValuationId },
    }
  );
  return response.data;
};

// ============ MARKET ANALYSIS ============

// Get comparable properties
export const getComparableProperties = async (
  propertyId: string,
  radius = 1, // in miles
  limit = 10
): Promise<{
  comparables: ComparableProperty[];
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/comparables`,
    {
      params: { radius, limit },
    }
  );
  return response.data;
};

// Get market analysis for area
export const getMarketAnalysis = async (
  propertyId: string,
  radius = 1
): Promise<{
  analysis: MarketAnalysis;
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/market-analysis`,
    {
      params: { radius },
    }
  );
  return response.data;
};

// Generate market analysis
export const generateMarketAnalysis = async (
  propertyId: string
): Promise<{
  analysis: MarketAnalysis;
  status: string;
}> => {
  const response = await httpClient.api.post(
    `/properties/${propertyId}/market-analysis/generate`
  );
  return response.data;
};

// Get rental estimates
export const getRentalEstimate = async (
  propertyId: string
): Promise<{
  estimate: {
    monthlyRent: number;
    rentRange: { low: number; high: number };
    grossYield: number;
    netYield?: number;
    comparables: Array<{
      address: string;
      monthlyRent: number;
      bedrooms: number;
      bathrooms: number;
      squareFootage: number;
    }>;
  };
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/rental-estimate`
  );
  return response.data;
};

// Generate rental estimate
export const generateRentalEstimate = async (
  propertyId: string
): Promise<{
  estimate: {
    monthlyRent: number;
    rentRange: { low: number; high: number };
    grossYield: number;
    netYield?: number;
    comparables: Array<{
      address: string;
      monthlyRent: number;
      bedrooms: number;
      bathrooms: number;
      squareFootage: number;
    }>;
  };
  status: string;
}> => {
  const response = await httpClient.api.post(
    `/properties/${propertyId}/rental-estimate/generate`
  );
  return response.data;
};

// ============ BULK OPERATIONS ============

// Request bulk valuations
export const requestBulkValuations = async (
  data: BulkValuationRequest
): Promise<BulkValuationResponse> => {
  const response = await httpClient.api.post(
    "/properties/valuations/bulk",
    data
  );
  return response.data;
};

// Get bulk valuation status
export const getBulkValuationStatus = async (
  requestId: string
): Promise<{
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number;
  completed: number;
  total: number;
  results?: PropertyValuation[];
}> => {
  const response = await httpClient.api.get(
    `/properties/valuations/bulk/${requestId}/status`
  );
  return response.data;
};

// Bulk request valuations
export const bulkRequestValuations = async (
  propertyIds: string[],
  valuationType: string,
  priority?: string
): Promise<BulkValuationResponse> => {
  const response = await httpClient.api.post(
    "/properties/valuations/bulk-request",
    {
      propertyIds,
      valuationType,
      priority,
    }
  );
  return response.data;
};

// Bulk update valuations
export const bulkUpdateValuations = async (
  valuationIds: string[],
  updates: any
): Promise<{
  updated: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.put(
    "/properties/valuations/bulk-update",
    {
      valuationIds,
      updates,
    }
  );
  return response.data;
};

// ============ REPORTS ============

// Generate valuation report
export const generateValuationReport = async (
  valuationId: string,
  reportType: "summary" | "detailed" | "comparative" = "detailed",
  format: "pdf" | "html" = "pdf",
  includeComparables?: boolean
): Promise<ValuationReportResponse> => {
  const response = await httpClient.api.post(
    `/properties/valuations/${valuationId}/report`,
    {
      reportType,
      format,
      includeComparables,
    }
  );
  return response.data;
};

// Download valuation report
export const downloadValuationReport = async (
  valuationId: string,
  format: "pdf" | "html" = "pdf"
): Promise<Blob> => {
  const response = await httpClient.api.get(
    `/properties/valuations/${valuationId}/report/download`,
    {
      params: { format },
      responseType: "blob",
    }
  );
  return response.data;
};

// Get valuation report
export const getValuationReport = async (
  reportId: string
): Promise<ValuationReportResponse> => {
  const response = await httpClient.api.get(
    `/properties/valuations/reports/${reportId}`
  );
  return response.data;
};

// Generate portfolio report
export const generatePortfolioReport = async (
  portfolioId: string,
  format: "pdf" | "html" = "pdf",
  includeDetails = true
): Promise<ValuationReportResponse> => {
  const response = await httpClient.api.post(
    `/properties/portfolios/${portfolioId}/valuation-report`,
    {
      format,
      includeDetails,
    }
  );
  return response.data;
};

// ============ STATISTICS & ANALYTICS ============

// Get valuation statistics
export const getValuationStats = async (
  filters: Partial<ValuationQueryParams> = {}
): Promise<ValuationStatsResponse> => {
  const response = await httpClient.api.get("/properties/valuations/stats", {
    params: filters,
  });
  return response.data;
};

// Get portfolio valuation summary
export const getPortfolioValuationSummary = async (
  landlordId?: string
): Promise<{
  summary: {
    totalProperties: number;
    totalValue: number;
    averageValue: number;
    totalAppreciation: number;
    appreciationPercentage: number;
    lastUpdated: string;
  };
  breakdown: Array<{
    propertyId: string;
    address: string;
    currentValue: number;
    previousValue?: number;
    change?: number;
    changePercentage?: number;
    lastValuationDate: string;
  }>;
  status: string;
}> => {
  const params = landlordId ? { landlordId } : {};
  const response = await httpClient.api.get(
    "/properties/valuations/portfolio-summary",
    {
      params,
    }
  );
  return response.data;
};

// Get valuation trends
export const getValuationTrends = async (
  propertyId?: string,
  period: "3m" | "6m" | "1y" | "2y" | "5y" = "1y"
): Promise<{
  trends: Array<{
    date: string;
    value: number;
    change?: number;
    changePercentage?: number;
  }>;
  summary: {
    totalChange: number;
    totalChangePercentage: number;
    averageMonthlyChange: number;
    volatility: number;
  };
  status: string;
}> => {
  const params: any = { period };
  if (propertyId) params.propertyId = propertyId;

  const response = await httpClient.api.get("/properties/valuations/trends", {
    params,
  });
  return response.data;
};

// Get property value trends (alias for getValuationTrends)
export const getPropertyValueTrends = async (
  propertyId: string,
  period: "3m" | "6m" | "1y" | "2y" | "5y" = "1y"
): Promise<{
  trends: Array<{
    date: string;
    value: number;
    change?: number;
    changePercentage?: number;
  }>;
  summary: {
    totalChange: number;
    totalChangePercentage: number;
    averageMonthlyChange: number;
    volatility: number;
  };
  status: string;
}> => {
  const response = await httpClient.api.get("/properties/valuations/trends", {
    params: { propertyId, period },
  });
  return response.data;
};

// Get portfolio valuation (alias for getPortfolioValuationSummary)
export const getPortfolioValuation = async (
  portfolioId: string
): Promise<{
  summary: {
    totalProperties: number;
    totalValue: number;
    averageValue: number;
    totalAppreciation: number;
    appreciationPercentage: number;
    lastUpdated: string;
  };
  breakdown: Array<{
    propertyId: string;
    address: string;
    currentValue: number;
    previousValue?: number;
    change?: number;
    changePercentage?: number;
    lastValuationDate: string;
  }>;
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/portfolios/${portfolioId}/valuation`
  );
  return response.data;
};

// Get automated valuations
export const getAutomatedValuations =
  async (): Promise<ValuationListResponse> => {
    const response = await httpClient.api.get("/properties/valuations", {
      params: { type: "automated" },
    });
    return response.data;
  };

// Get pending valuations
export const getPendingValuations =
  async (): Promise<ValuationListResponse> => {
    const response = await httpClient.api.get("/properties/valuations", {
      params: { status: "pending" },
    });
    return response.data;
  };

// Get recent valuations
export const getRecentValuations = async (
  days = 30
): Promise<ValuationListResponse> => {
  const response = await httpClient.api.get("/properties/valuations/recent", {
    params: { days },
  });
  return response.data;
};

// ============ ALERTS & NOTIFICATIONS ============

// Create valuation alert
export const createValuationAlert = async (
  propertyId: string,
  alertType: "value_change" | "market_trend" | "expiry_reminder",
  threshold?: number,
  frequency?: "daily" | "weekly" | "monthly"
): Promise<{
  alert: ValuationAlert;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post("/properties/valuations/alerts", {
    property: propertyId,
    alertType,
    threshold,
    frequency,
  });
  return response.data;
};

// Get valuation alerts
export const getValuationAlerts = async (
  propertyId?: string
): Promise<{
  alerts: ValuationAlert[];
  status: string;
}> => {
  const params = propertyId ? { property: propertyId } : {};
  const response = await httpClient.api.get("/properties/valuations/alerts", {
    params,
  });
  return response.data;
};

// Update valuation alert
export const updateValuationAlert = async (
  alertId: string,
  updates: Partial<ValuationAlert>
): Promise<{
  alert: ValuationAlert;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.put(
    `/properties/valuations/alerts/${alertId}`,
    updates
  );
  return response.data;
};

// Delete valuation alert
export const deleteValuationAlert = async (
  alertId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/valuations/alerts/${alertId}`
  );
  return response.data;
};

// ============ EXPORT & IMPORT ============

// Export valuations
export const exportValuations = async (
  filters: Partial<ValuationQueryParams> = {},
  format: "csv" | "xlsx" | "pdf" = "csv"
): Promise<Blob> => {
  const response = await httpClient.api.get("/properties/valuations/export", {
    params: { ...filters, format },
    responseType: "blob",
  });
  return response.data;
};

// Import valuations
export const importValuations = async (
  file: File,
  options: {
    updateExisting?: boolean;
    validateOnly?: boolean;
  } = {}
): Promise<{
  imported: number;
  updated: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  status: string;
  message: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("options", JSON.stringify(options));

  const response = await httpClient.api.post(
    "/properties/valuations/import",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// ============ VALIDATION & ACCURACY ============

// Validate valuation accuracy
export const validateValuationAccuracy = async (
  valuationId: string,
  actualSalePrice: number,
  saleDate: string
): Promise<{
  accuracy: number;
  variance: number;
  variancePercentage: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    `/properties/valuations/${valuationId}/validate`,
    {
      actualSalePrice,
      saleDate,
    }
  );
  return response.data;
};

// Validate valuation (alias for validateValuationAccuracy)
export const validateValuation = async (
  valuationId: string,
  validationNotes?: string
): Promise<{
  accuracy: number;
  variance: number;
  variancePercentage: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    `/properties/valuations/${valuationId}/validate`,
    {
      validationNotes,
    }
  );
  return response.data;
};

// Schedule automated valuation
export const scheduleAutomatedValuation = async (
  propertyId: string,
  frequency: "daily" | "weekly" | "monthly" | "quarterly",
  nextRunDate?: string
): Promise<{
  schedule: {
    id: string;
    propertyId: string;
    frequency: string;
    nextRunDate: string;
    isActive: boolean;
  };
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    `/properties/${propertyId}/valuations/schedule`,
    {
      frequency,
      nextRunDate,
    }
  );
  return response.data;
};

// Get valuation accuracy metrics
export const getValuationAccuracyMetrics = async (
  period: "30d" | "90d" | "1y" | "all" = "90d"
): Promise<{
  metrics: {
    averageAccuracy: number;
    medianAccuracy: number;
    standardDeviation: number;
    totalValidations: number;
    accuracyByType: Record<string, number>;
    accuracyByConfidence: Record<string, number>;
  };
  status: string;
}> => {
  const response = await httpClient.api.get(
    "/properties/valuations/accuracy-metrics",
    {
      params: { period },
    }
  );
  return response.data;
};
