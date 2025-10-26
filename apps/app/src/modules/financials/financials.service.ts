import type { AxiosResponse } from "axios";
import { httpClient } from "@/lib/axios";
import type {
  AnalyticsFilters,
  Asset,
  AssetFilters,
  AssetsResponse,
  BudgetAnalysis,
  CashFlowAnalysis,
  CreateAssetRequest,
  CreateExpenseRequest,
  Expense,
  // Analytics types
  ExpenseAnalytics,
  ExpenseComparison,
  ExpenseFilters,
  ExpensesResponse,
  FinancialDashboardData,
  FinancialInsights,
  FinancialReport,
  FinancialReportsResponse,
  FinancialSettings,
  FinancialTrends,
  ForecastData,
  GenerateReportRequest,
  ReportFilters,
  ROIAnalysis,
  TaxOptimizationInsights,
  TaxReport,
  UpdateExpenseRequest,
  UpdateFinancialSettingsRequest,
} from "./financials.type";

export type ApiResponse<T = any> = {
  status: "success" | "error";
  message?: string;
  data?: T;
};

export const financialsService = {
  // Financial Reports
  getReports: async (
    filters?: ReportFilters
  ): Promise<FinancialReportsResponse> => {
    const response: AxiosResponse<ApiResponse<FinancialReportsResponse>> =
      await httpClient.api.get("/financial/reports", { params: filters });
    return response.data.data as FinancialReportsResponse;
  },

  generateReport: async (
    data: GenerateReportRequest
  ): Promise<FinancialReport> => {
    const response: AxiosResponse<ApiResponse<FinancialReport>> =
      await httpClient.api.post("/financial/reports/generate", data);
    return response.data.data as FinancialReport;
  },

  downloadReport: async (reportId: string): Promise<Blob> => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const response = await fetch(
        `${baseUrl}/financial/reports/${reportId}/download`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const contentType = response.headers.get("content-type");
      if (contentType !== "application/pdf") {
        throw new Error("Invalid response type: Expected a PDF");
      }

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      // Create a Blob from the response data
      const pdfBlob = await response.blob();

      return pdfBlob;
    } catch (error) {
      throw new Error(
        `Failed to download report: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  downloadReport_v2: async (reportId: string): Promise<Blob> => {
    try {
      const response: AxiosResponse<Blob> = await httpClient.api.get(
        `/financial/reports/${reportId}/download`,
        { responseType: "blob" }
      );

      if (response.headers["content-type"] !== "application/pdf") {
        throw new Error("Invalid response type: Expected a PDF");
      }

      // Create a Blob from the response data
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });

      return pdfBlob;
    } catch (error) {
      throw new Error(
        `Failed to download report: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  // Tax Reports
  getTaxReports: async (taxYear?: number): Promise<TaxReport[] | TaxReport> => {
    const response: AxiosResponse<ApiResponse<TaxReport[] | TaxReport>> =
      await httpClient.api.get("/financial/tax-reports", {
        params: taxYear ? { taxYear } : {},
      });
    return response.data.data as TaxReport | TaxReport[];
  },

  generateTaxReport: async (taxYear: number): Promise<TaxReport> => {
    const response: AxiosResponse<ApiResponse<TaxReport>> =
      await httpClient.api.post(
        `/financial/tax-reports/generate/${taxYear}`,
        {}
      );
    return response.data.data as TaxReport;
  },

  // Expenses
  getExpenses: async (filters?: ExpenseFilters): Promise<ExpensesResponse> => {
    const response: AxiosResponse<ApiResponse<ExpensesResponse>> =
      await httpClient.api.get("/financial/expenses", { params: filters });
    return response.data.data as ExpensesResponse;
  },

  createExpense: async (data: CreateExpenseRequest): Promise<Expense> => {
    const response: AxiosResponse<ApiResponse<Expense>> =
      await httpClient.api.post("/financial/expenses", data);
    return response.data.data as Expense;
  },

  updateExpense: async (
    id: string,
    data: Partial<CreateExpenseRequest & UpdateExpenseRequest>
  ): Promise<Expense> => {
    const response: AxiosResponse<ApiResponse<Expense>> =
      await httpClient.api.patch(`/financial/expenses/${id}`, data);
    return response.data.data as Expense;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await httpClient.api.delete(`/financial/expenses/${id}`);
  },

  uploadExpenseReceipt: async (
    expenseId: string,
    file: File
  ): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("receipt", file);

    const response: AxiosResponse<ApiResponse<{ url: string }>> =
      await httpClient.api.post(
        `/financial/expenses/${expenseId}/receipt`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    return response.data.data as { url: string };
  },

  // Assets
  getAssets: async (filters?: AssetFilters): Promise<AssetsResponse> => {
    const response: AxiosResponse<ApiResponse<AssetsResponse>> =
      await httpClient.api.get("/financial/assets", { params: filters });
    return response.data.data as AssetsResponse;
  },

  createAsset: async (data: CreateAssetRequest): Promise<Asset> => {
    const response: AxiosResponse<ApiResponse<Asset>> =
      await httpClient.api.post("/financial/assets", data);
    return response.data.data as Asset;
  },

  updateAsset: async (
    id: string,
    data: Partial<CreateAssetRequest>
  ): Promise<Asset> => {
    const response: AxiosResponse<ApiResponse<Asset>> =
      await httpClient.api.patch(`/financial/assets/${id}`, data);
    return response.data.data as Asset;
  },

  deleteAsset: async (id: string): Promise<void> => {
    await httpClient.api.delete(`/financial/assets/${id}`);
  },

  // Financial Settings
  getSettings: async (): Promise<FinancialSettings> => {
    const response: AxiosResponse<ApiResponse<FinancialSettings>> =
      await httpClient.api.get("/financial/settings");
    return response.data.data as FinancialSettings;
  },

  updateSettings: async (
    data: UpdateFinancialSettingsRequest
  ): Promise<FinancialSettings> => {
    const response: AxiosResponse<ApiResponse<FinancialSettings>> =
      await httpClient.api.patch("/financial/settings", data);
    return response.data.data as FinancialSettings;
  },

  // Dashboard
  getDashboardData: async (
    period?: "monthly" | "quarterly" | "yearly"
  ): Promise<FinancialDashboardData> => {
    const response: AxiosResponse<ApiResponse<FinancialDashboardData>> =
      await httpClient.api.get("/financial/dashboard", {
        params: period ? { period } : {},
      });
    return response.data.data as FinancialDashboardData;
  },

  // Utility Functions
  exportData: async (
    type: "expenses" | "assets" | "reports",
    format: "csv" | "xlsx" = "csv"
  ): Promise<Blob> => {
    const response: AxiosResponse<Blob> = await httpClient.api.get(
      `/financial/export/${type}`,
      {
        params: { format },
        responseType: "blob",
      }
    );
    return response.data as Blob;
  },

  getExpenseCategories: async (): Promise<string[]> => {
    const response: AxiosResponse<ApiResponse<string[]>> =
      await httpClient.api.get("/financial/expenses/categories");
    return response.data.data as string[];
  },

  // Analytics and Insights
  getFinancialAnalytics: async (
    timeframe: "month" | "quarter" | "year" = "month"
  ) => {
    const response: AxiosResponse<ApiResponse<any>> = await httpClient.api.get(
      `/analytics/financial/${timeframe}`
    );
    return response.data.data as any;
  },

  // Expense Analytics
  getExpenseAnalytics: async (
    timeframe: "month" | "quarter" | "year" = "month",
    filters?: AnalyticsFilters
  ): Promise<ExpenseAnalytics> => {
    const response: AxiosResponse<ApiResponse<ExpenseAnalytics>> =
      await httpClient.api.get(`/analytics/expenses/${timeframe}`, {
        params: filters,
      });
    return response.data.data as ExpenseAnalytics;
  },

  // Financial Trends
  getFinancialTrends: async (
    timeframe: "month" | "quarter" | "year" = "month",
    filters?: AnalyticsFilters
  ): Promise<FinancialTrends> => {
    const response: AxiosResponse<ApiResponse<FinancialTrends>> =
      await httpClient.api.get(`/analytics/trends/${timeframe}`, {
        params: filters,
      });
    return response.data.data as FinancialTrends;
  },

  // Budget Analysis
  getBudgetAnalysis: async (
    timeframe: "month" | "quarter" | "year" = "month",
    filters?: AnalyticsFilters
  ): Promise<BudgetAnalysis> => {
    const response: AxiosResponse<ApiResponse<BudgetAnalysis>> =
      await httpClient.api.get(`/analytics/budget/${timeframe}`, {
        params: filters,
      });
    return response.data.data as BudgetAnalysis;
  },

  // Financial Insights
  getFinancialInsights: async (
    timeframe: "month" | "quarter" | "year" = "month"
  ): Promise<FinancialInsights> => {
    const response: AxiosResponse<ApiResponse<FinancialInsights>> =
      await httpClient.api.get(`/analytics/insights/${timeframe}`);
    return response.data.data as FinancialInsights;
  },

  // Financial Forecast
  getFinancialForecast: async (
    periods = 6,
    type: "expenses" | "income" | "cashflow" = "expenses"
  ): Promise<ForecastData> => {
    const response: AxiosResponse<ApiResponse<ForecastData>> =
      await httpClient.api.get(`/analytics/forecast/${type}`, {
        params: { periods },
      });
    return response.data.data as ForecastData;
  },

  // Cash Flow Analysis
  getCashFlowAnalysis: async (
    timeframe: "month" | "quarter" | "year" = "month"
  ): Promise<CashFlowAnalysis> => {
    const response: AxiosResponse<ApiResponse<CashFlowAnalysis>> =
      await httpClient.api.get(`/analytics/cashflow/${timeframe}`);
    return response.data.data as CashFlowAnalysis;
  },

  // ROI Analysis
  getROIAnalysis: async (propertyId?: string): Promise<ROIAnalysis> => {
    const response: AxiosResponse<ApiResponse<ROIAnalysis>> =
      await httpClient.api.get("/analytics/roi", {
        params: propertyId ? { propertyId } : {},
      });
    return response.data.data as ROIAnalysis;
  },

  // Expense Comparison
  getExpenseComparison: async (
    compareType: "month" | "quarter" | "year" = "month",
    periods = 2
  ): Promise<ExpenseComparison> => {
    const response: AxiosResponse<ApiResponse<ExpenseComparison>> =
      await httpClient.api.get(`/analytics/comparison/${compareType}`, {
        params: { periods },
      });
    return response.data.data as ExpenseComparison;
  },

  // Tax Optimization Insights
  getTaxOptimizationInsights: async (
    taxYear?: number
  ): Promise<TaxOptimizationInsights> => {
    const response: AxiosResponse<ApiResponse<TaxOptimizationInsights>> =
      await httpClient.api.get("/analytics/tax-optimization", {
        params: taxYear ? { taxYear } : {},
      });
    return response.data.data as TaxOptimizationInsights;
  },

  // Bulk Operations
  bulkCreateExpenses: async (
    expenses: CreateExpenseRequest[]
  ): Promise<Expense[]> => {
    const response: AxiosResponse<ApiResponse<Expense[]>> =
      await httpClient.api.post("/financial/expenses/bulk", { expenses });
    return response.data.data as Expense[];
  },

  bulkUpdateExpenses: async (
    updates: Array<{ id: string; data: Partial<CreateExpenseRequest> }>
  ): Promise<Expense[]> => {
    const response: AxiosResponse<ApiResponse<Expense[]>> =
      await httpClient.api.patch("/financial/expenses/bulk", { updates });
    return response.data.data as Expense[];
  },

  // Recurring Expenses
  getRecurringExpenses: async (): Promise<Expense[]> => {
    const response: AxiosResponse<ApiResponse<Expense[]>> =
      await httpClient.api.get("/financial/expenses/recurring");
    return response.data.data as Expense[];
  },

  processRecurringExpenses: async (): Promise<{
    processed: number;
    created: Expense[];
  }> => {
    const response: AxiosResponse<
      ApiResponse<{ processed: number; created: Expense[] }>
    > = await httpClient.api.post("/financial/expenses/recurring/process");
    return response.data.data as { processed: number; created: Expense[] };
  },

  // Tax-related utilities
  getTaxDeductibleExpenses: async (taxYear: number): Promise<Expense[]> => {
    const response: AxiosResponse<ApiResponse<Expense[]>> =
      await httpClient.api.get(`/financial/expenses/tax-deductible/${taxYear}`);
    return response.data.data as Expense[];
  },

  calculateDepreciation: async (
    assetId: string,
    year: number
  ): Promise<{ amount: number; method: string }> => {
    const response: AxiosResponse<
      ApiResponse<{ amount: number; method: string }>
    > = await httpClient.api.get(
      `/financial/assets/${assetId}/depreciation/${year}`
    );
    return response.data.data as { amount: number; method: string };
  },
};
