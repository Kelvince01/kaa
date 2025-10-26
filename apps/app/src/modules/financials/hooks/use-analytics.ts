import { useQuery } from "@tanstack/react-query";
import { financialsKeys } from "../financials.queries";
import { financialsService } from "../financials.service";
import type { AnalyticsFilters } from "../financials.type";

// Analytics Hooks
export const useExpenseAnalytics = (
  timeframe: "month" | "quarter" | "year" = "month",
  filters?: AnalyticsFilters
) => {
  return useQuery({
    queryKey: [...financialsKeys.analytics(timeframe), "expenses", filters],
    queryFn: () => financialsService.getExpenseAnalytics(timeframe, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useFinancialTrends = (
  timeframe: "month" | "quarter" | "year" = "month",
  filters?: AnalyticsFilters
) =>
  useQuery({
    queryKey: [...financialsKeys.analytics(timeframe), "trends", filters],
    queryFn: () => financialsService.getFinancialTrends(timeframe, filters),
    staleTime: 1000 * 60 * 5,
  });

export const useBudgetAnalysis = (
  timeframe: "month" | "quarter" | "year" = "month",
  filters?: AnalyticsFilters
) =>
  useQuery({
    queryKey: [...financialsKeys.analytics(timeframe), "budget", filters],
    queryFn: () => financialsService.getBudgetAnalysis(timeframe, filters),
    staleTime: 1000 * 60 * 5,
  });

export const useFinancialInsights = (
  timeframe: "month" | "quarter" | "year" = "month"
) => {
  return useQuery({
    queryKey: [...financialsKeys.analytics(timeframe), "insights"],
    queryFn: () => financialsService.getFinancialInsights(timeframe),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useFinancialForecast = (
  periods = 6,
  type: "expenses" | "income" | "cashflow" = "expenses"
) => {
  return useQuery({
    queryKey: [...financialsKeys.analytics("forecast"), type, periods],
    queryFn: () => financialsService.getFinancialForecast(periods, type),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useCashFlowAnalysis = (
  timeframe: "month" | "quarter" | "year" = "month"
) =>
  useQuery({
    queryKey: [...financialsKeys.analytics(timeframe), "cashflow"],
    queryFn: () => financialsService.getCashFlowAnalysis(timeframe),
    staleTime: 1000 * 60 * 5,
  });

export const useROIAnalysis = (propertyId?: string) => {
  return useQuery({
    queryKey: [...financialsKeys.analytics("roi"), propertyId],
    queryFn: () => financialsService.getROIAnalysis(propertyId),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useExpenseComparison = (
  compareType: "month" | "quarter" | "year" = "month",
  periods = 2
) =>
  useQuery({
    queryKey: [...financialsKeys.analytics("comparison"), compareType, periods],
    queryFn: () => financialsService.getExpenseComparison(compareType, periods),
    staleTime: 1000 * 60 * 5,
  });

export const useTaxOptimizationInsights = (taxYear?: number) => {
  return useQuery({
    queryKey: [...financialsKeys.analytics("tax-optimization"), taxYear],
    queryFn: () => financialsService.getTaxOptimizationInsights(taxYear),
    enabled: !!taxYear,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Re-export types for convenience
// export type {
// 	ExpenseAnalytics,
// 	FinancialTrends,
// 	BudgetAnalysis,
// 	FinancialInsights,
// 	ForecastData,
// 	CashFlowAnalysis,
// 	ROIAnalysis,
// 	ExpenseComparison,
// 	TaxOptimizationInsights,
// 	AnalyticsFilters,
// };
