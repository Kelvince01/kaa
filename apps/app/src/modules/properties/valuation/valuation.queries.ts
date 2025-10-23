import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as valuationService from "./valuation.service";
import type {
  UpdateValuationInput,
  ValuationAlert,
  ValuationQueryParams,
} from "./valuation.type";

/**
 * Valuation query keys for consistent cache management
 */
export const valuationKeys = {
  all: ["valuations"] as const,
  lists: () => [...valuationKeys.all, "list"] as const,
  list: (params: ValuationQueryParams) =>
    [...valuationKeys.lists(), params] as const,
  details: () => [...valuationKeys.all, "detail"] as const,
  detail: (id: string) => [...valuationKeys.details(), id] as const,
  stats: () => [...valuationKeys.all, "stats"] as const,
  statsByProperty: (propertyId: string) =>
    [...valuationKeys.stats(), propertyId] as const,
  byProperty: (propertyId: string) =>
    [...valuationKeys.all, "by-property", propertyId] as const,
  history: (propertyId: string) =>
    [...valuationKeys.all, "history", propertyId] as const,
  marketAnalysis: (propertyId: string) =>
    [...valuationKeys.all, "market-analysis", propertyId] as const,
  comparables: (propertyId: string) =>
    [...valuationKeys.all, "comparables", propertyId] as const,
  rentalEstimate: (propertyId: string) =>
    [...valuationKeys.all, "rental-estimate", propertyId] as const,
  alerts: () => [...valuationKeys.all, "alerts"] as const,
  alertsByProperty: (propertyId: string) =>
    [...valuationKeys.alerts(), propertyId] as const,
  trends: (propertyId: string, period: string) =>
    [...valuationKeys.all, "trends", propertyId, period] as const,
  portfolio: (portfolioId: string) =>
    [...valuationKeys.all, "portfolio", portfolioId] as const,
  automated: () => [...valuationKeys.all, "automated"] as const,
  pending: () => [...valuationKeys.all, "pending"] as const,
  recent: (days: number) => [...valuationKeys.all, "recent", days] as const,
};

/**
 * Query Hooks - for fetching data
 */

// Get all valuations with filtering
export const useValuations = (params: ValuationQueryParams = {}) => {
  return useQuery({
    queryKey: valuationKeys.list(params),
    queryFn: () => valuationService.getValuations(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get valuation by ID
export const useValuation = (id: string) =>
  useQuery({
    queryKey: valuationKeys.detail(id),
    queryFn: () => valuationService.getValuation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Get valuation statistics
export const useValuationStats = (propertyId?: string) => {
  return useQuery({
    queryKey: propertyId
      ? valuationKeys.statsByProperty(propertyId)
      : valuationKeys.stats(),
    queryFn: () => valuationService.getValuationStats({ property: propertyId }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get valuations by property
export const useValuationsByProperty = (propertyId: string) =>
  useQuery({
    queryKey: valuationKeys.byProperty(propertyId),
    queryFn: () => valuationService.getValuationsByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get property valuation history
export const usePropertyValuationHistory = (propertyId: string, limit = 10) =>
  useQuery({
    queryKey: valuationKeys.history(propertyId),
    queryFn: () =>
      valuationService.getPropertyValuationHistory(propertyId, limit),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get market analysis
export const useMarketAnalysis = (propertyId: string) => {
  return useQuery({
    queryKey: valuationKeys.marketAnalysis(propertyId),
    queryFn: () => valuationService.getMarketAnalysis(propertyId),
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 minutes (market data changes slowly)
  });
};

// Get comparable properties
export const useComparableProperties = (propertyId: string) =>
  useQuery({
    queryKey: valuationKeys.comparables(propertyId),
    queryFn: () => valuationService.getComparableProperties(propertyId),
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000,
  });

// Get rental estimate
export const useRentalEstimate = (propertyId: string) =>
  useQuery({
    queryKey: valuationKeys.rentalEstimate(propertyId),
    queryFn: () => valuationService.getRentalEstimate(propertyId),
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000,
  });

// Get valuation alerts
export const useValuationAlerts = (propertyId?: string) =>
  useQuery({
    queryKey: propertyId
      ? valuationKeys.alertsByProperty(propertyId)
      : valuationKeys.alerts(),
    queryFn: () => valuationService.getValuationAlerts(propertyId),
    staleTime: 2 * 60 * 1000,
  });

// Get property value trends
export const usePropertyValueTrends = (
  propertyId: string,
  period: "3m" | "6m" | "1y" | "2y" | "5y" = "1y"
) =>
  useQuery({
    queryKey: valuationKeys.trends(propertyId, period),
    queryFn: () => valuationService.getPropertyValueTrends(propertyId, period),
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000,
  });

// Get portfolio valuation
export const usePortfolioValuation = (portfolioId: string) =>
  useQuery({
    queryKey: valuationKeys.portfolio(portfolioId),
    queryFn: () => valuationService.getPortfolioValuation(portfolioId),
    enabled: !!portfolioId,
    staleTime: 10 * 60 * 1000,
  });

// Get automated valuations
export const useAutomatedValuations = () =>
  useQuery({
    queryKey: valuationKeys.automated(),
    queryFn: valuationService.getAutomatedValuations,
    staleTime: 5 * 60 * 1000,
  });

// Get pending valuations
export const usePendingValuations = () =>
  useQuery({
    queryKey: valuationKeys.pending(),
    queryFn: valuationService.getPendingValuations,
    staleTime: 2 * 60 * 1000,
  });

// Get recent valuations
export const useRecentValuations = (days = 7) =>
  useQuery({
    queryKey: valuationKeys.recent(days),
    queryFn: () => valuationService.getRecentValuations(days),
    staleTime: 5 * 60 * 1000,
  });

/**
 * Mutation Hooks - for modifying data
 */

// Request valuation
export const useRequestValuation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: valuationService.requestValuation,
    onSuccess: (data) => {
      // Add valuation to cache
      const valuation = data.valuation || data.data;
      if (valuation) {
        queryClient.setQueryData(valuationKeys.detail(valuation._id), data);
      }

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: valuationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valuationKeys.stats() });
      queryClient.invalidateQueries({ queryKey: valuationKeys.pending() });
    },
  });
};

// Create valuation
export const useCreateValuation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: valuationService.createValuation,
    onSuccess: (data) => {
      // Add valuation to cache
      const valuation = data.valuation || data.data;
      if (valuation) {
        queryClient.setQueryData(valuationKeys.detail(valuation._id), data);
      }

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: valuationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valuationKeys.stats() });
    },
  });
};

// Update valuation
export const useUpdateValuation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateValuationInput }) =>
      valuationService.updateValuation(id, data),
    onSuccess: (data, variables) => {
      // Update valuation in cache
      queryClient.setQueryData(valuationKeys.detail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: valuationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valuationKeys.stats() });
    },
  });
};

// Delete valuation
export const useDeleteValuation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: valuationService.deleteValuation,
    onSuccess: (_, valuationId) => {
      // Remove valuation from cache
      queryClient.removeQueries({
        queryKey: valuationKeys.detail(valuationId),
      });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: valuationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valuationKeys.stats() });
    },
  });
};

// Generate automated valuation
export const useGenerateAutomatedValuation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      requestedBy,
    }: {
      propertyId: string;
      requestedBy: string;
    }) => valuationService.generateAutomatedValuation(propertyId, requestedBy),
    onSuccess: (data, { propertyId }) => {
      // Add valuation to cache
      const valuation = data.valuation || data.data;
      if (valuation) {
        queryClient.setQueryData(valuationKeys.detail(valuation._id), data);
      }

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: valuationKeys.byProperty(propertyId),
      });
      queryClient.invalidateQueries({ queryKey: valuationKeys.automated() });
      queryClient.invalidateQueries({ queryKey: valuationKeys.lists() });
    },
  });
};

// Generate market analysis
export const useGenerateMarketAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: valuationService.generateMarketAnalysis,
    onSuccess: (data, propertyId) => {
      // Update market analysis in cache
      queryClient.setQueryData(valuationKeys.marketAnalysis(propertyId), data);
    },
  });
};

// Generate rental estimate
export const useGenerateRentalEstimate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: valuationService.generateRentalEstimate,
    onSuccess: (data, propertyId) => {
      // Update rental estimate in cache
      queryClient.setQueryData(valuationKeys.rentalEstimate(propertyId), data);
    },
  });
};

// Create valuation alert
export const useCreateValuationAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      alertType,
      threshold,
      frequency,
    }: {
      propertyId: string;
      alertType: "value_change" | "market_trend" | "expiry_reminder";
      threshold?: number;
      frequency?: "daily" | "weekly" | "monthly";
    }) =>
      valuationService.createValuationAlert(
        propertyId,
        alertType,
        threshold,
        frequency
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationKeys.alerts() });
    },
  });
};

// Update valuation alert
export const useUpdateValuationAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertId,
      updates,
    }: {
      alertId: string;
      updates: Partial<ValuationAlert>;
    }) => valuationService.updateValuationAlert(alertId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationKeys.alerts() });
    },
  });
};

// Delete valuation alert
export const useDeleteValuationAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: valuationService.deleteValuationAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationKeys.alerts() });
    },
  });
};

// Bulk request valuations
export const useBulkRequestValuations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyIds,
      valuationType,
      priority,
    }: {
      propertyIds: string[];
      valuationType: "automated" | "professional";
      priority?: "low" | "medium" | "high";
    }) =>
      valuationService.bulkRequestValuations(
        propertyIds,
        valuationType,
        priority
      ),
    onSuccess: () => {
      // Invalidate all valuation queries
      queryClient.invalidateQueries({ queryKey: valuationKeys.all });
    },
  });
};

// Bulk update valuations
export const useBulkUpdateValuations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      valuationIds,
      updates,
    }: {
      valuationIds: string[];
      updates: Partial<UpdateValuationInput>;
    }) => valuationService.bulkUpdateValuations(valuationIds, updates),
    onSuccess: () => {
      // Invalidate all valuation queries
      queryClient.invalidateQueries({ queryKey: valuationKeys.all });
    },
  });
};

// Validate valuation
export const useValidateValuation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      valuationId,
      validationNotes,
    }: {
      valuationId: string;
      validationNotes?: string;
    }) => valuationService.validateValuation(valuationId, validationNotes),
    onSuccess: (data, variables) => {
      // Update valuation in cache
      queryClient.setQueryData(
        valuationKeys.detail(variables.valuationId),
        data
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: valuationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valuationKeys.stats() });
    },
  });
};

// Generate valuation report
export const useGenerateValuationReport = () =>
  useMutation({
    mutationFn: ({
      valuationId,
      reportType,
      format,
      includeComparables,
    }: {
      valuationId: string;
      reportType?: "summary" | "detailed" | "comparative";
      format?: "pdf" | "html";
      includeComparables?: boolean;
    }) =>
      valuationService.generateValuationReport(
        valuationId,
        reportType,
        format,
        includeComparables
      ),
  });

// Generate portfolio report
export const useGeneratePortfolioReport = () =>
  useMutation({
    mutationFn: ({
      portfolioId,
      format,
      includeDetails,
    }: {
      portfolioId: string;
      format?: "pdf" | "html";
      includeDetails?: boolean;
    }) =>
      valuationService.generatePortfolioReport(
        portfolioId,
        format,
        includeDetails
      ),
  });

// Export valuations
export const useExportValuations = () =>
  useMutation({
    mutationFn: ({
      filters,
      format,
    }: {
      filters?: ValuationQueryParams;
      format?: "csv" | "xlsx" | "pdf";
    }) => valuationService.exportValuations(filters, format),
  });

// Import valuations
export const useImportValuations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      mapping,
    }: {
      file: File;
      mapping: Record<string, string>;
    }) => valuationService.importValuations(file, mapping),
    onSuccess: () => {
      // Invalidate all valuation queries
      queryClient.invalidateQueries({ queryKey: valuationKeys.all });
    },
  });
};

// Schedule automated valuation
export const useScheduleAutomatedValuation = () =>
  useMutation({
    mutationFn: ({
      propertyId,
      frequency,
      nextRunDate,
    }: {
      propertyId: string;
      frequency: "weekly" | "monthly" | "quarterly";
      nextRunDate?: string;
    }) =>
      valuationService.scheduleAutomatedValuation(
        propertyId,
        frequency,
        nextRunDate
      ),
  });

/**
 * Utility functions for cache management
 */

// Prefetch valuation
export const usePrefetchValuation = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: valuationKeys.detail(id),
      queryFn: () => valuationService.getValuation(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Prefetch market analysis
export const usePrefetchMarketAnalysis = () => {
  const queryClient = useQueryClient();

  return (propertyId: string) => {
    queryClient.prefetchQuery({
      queryKey: valuationKeys.marketAnalysis(propertyId),
      queryFn: () => valuationService.getMarketAnalysis(propertyId),
      staleTime: 10 * 60 * 1000,
    });
  };
};

// Invalidate all valuation queries
export const useInvalidateValuations = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: valuationKeys.all });
  };
};
