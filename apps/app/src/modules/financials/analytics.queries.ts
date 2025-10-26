import { useQuery } from "@tanstack/react-query";
import { financialsKeys } from "./financials.queries";
import { financialsService } from "./financials.service";

// Analytics types
export type ExpenseAnalytics = {
  totalExpenses: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  comparisonToPrevious: {
    amount: number;
    percentage: number;
  };
};

export type FinancialTrends = {
  revenue: Array<{
    period: string;
    amount: number;
    type: "rental" | "fees" | "other";
  }>;
  expenses: Array<{
    period: string;
    amount: number;
    category: string;
  }>;
  netIncome: Array<{
    period: string;
    amount: number;
    margin: number;
  }>;
};

export type BudgetAnalysis = {
  categories: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  }>;
  monthlyComparison: Array<{
    month: string;
    budgeted: number;
    actual: number;
    variance: number;
  }>;
  totalBudget: number;
  totalActual: number;
  overallVariance: number;
};

export type FinancialInsights = {
  kpis: {
    profitMargin: number;
    expenseRatio: number;
    averageMonthlyExpense: number;
    largestExpenseCategory: string;
    cashFlowTrend: "increasing" | "decreasing" | "stable";
  };
  alerts: Array<{
    type: "warning" | "info" | "critical";
    message: string;
    value: number;
    threshold: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    category: string;
  }>;
};

export type ForecastData = {
  expenses: Array<{
    period: string;
    predicted: number;
    confidence: number;
    factors: string[];
  }>;
  income: Array<{
    period: string;
    predicted: number;
    confidence: number;
  }>;
  cashFlow: Array<{
    period: string;
    predicted: number;
    confidence: number;
  }>;
  scenario: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
};

// Analytics Hooks
export const useExpenseAnalytics = (
  timeframe: "month" | "quarter" | "year" = "month",
  filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    propertyId?: string;
  }
) => {
  return useQuery({
    queryKey: [...financialsKeys.analytics(timeframe), "expenses", filters],
    queryFn: () => financialsService.getExpenseAnalytics(timeframe, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useFinancialTrends = (
  timeframe: "month" | "quarter" | "year" = "month",
  filters?: {
    startDate?: string;
    endDate?: string;
    propertyId?: string;
  }
) =>
  useQuery({
    queryKey: [...financialsKeys.analytics(timeframe), "trends", filters],
    queryFn: () => financialsService.getFinancialTrends(timeframe, filters),
    staleTime: 1000 * 60 * 5,
  });

export const useBudgetAnalysis = (
  timeframe: "month" | "quarter" | "year" = "month",
  filters?: {
    startDate?: string;
    endDate?: string;
    propertyId?: string;
  }
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
