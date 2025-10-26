import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { toast } from "sonner";
import { financialsService } from "./financials.service";
import { useFinancialsStore } from "./financials.store";
import type {
  AssetFilters,
  CreateAssetRequest,
  CreateExpenseRequest,
  ExpenseFilters,
  GenerateReportRequest,
  ReportFilters,
  UpdateFinancialSettingsRequest,
} from "./financials.type";

// Query Keys
export const financialsKeys = {
  all: ["financials"] as const,
  reports: () => [...financialsKeys.all, "reports"] as const,
  report: (id: string) => [...financialsKeys.reports(), id] as const,
  reportsList: (filters: ReportFilters) =>
    [...financialsKeys.reports(), "list", filters] as const,
  taxReports: () => [...financialsKeys.all, "tax-reports"] as const,
  taxReport: (year: number) => [...financialsKeys.taxReports(), year] as const,
  expenses: () => [...financialsKeys.all, "expenses"] as const,
  expense: (id: string) => [...financialsKeys.expenses(), id] as const,
  expensesList: (filters: ExpenseFilters) =>
    [...financialsKeys.expenses(), "list", filters] as const,
  expenseCategories: () =>
    [...financialsKeys.expenses(), "categories"] as const,
  assets: () => [...financialsKeys.all, "assets"] as const,
  asset: (id: string) => [...financialsKeys.assets(), id] as const,
  assetsList: (filters: AssetFilters) =>
    [...financialsKeys.assets(), "list", filters] as const,
  settings: () => [...financialsKeys.all, "settings"] as const,
  dashboard: (period?: string) =>
    [...financialsKeys.all, "dashboard", period] as const,
  analytics: (timeframe: string) =>
    [...financialsKeys.all, "analytics", timeframe] as const,
};

// Financial Reports Hooks
export const useFinancialReports = (filters?: ReportFilters) => {
  const { setReports, setReportsLoading, setReportsPagination } =
    useFinancialsStore();

  const query = useQuery({
    queryKey: financialsKeys.reportsList(filters || {}),
    queryFn: () => financialsService.getReports(filters),
  });

  useEffect(() => {
    if (query.data) {
      setReports(query.data.reports);
      setReportsPagination(query.data.pagination);
    }
    setReportsLoading(query.isLoading);
  }, [
    query.data,
    query.isLoading,
    setReports,
    setReportsPagination,
    setReportsLoading,
  ]);

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to fetch financial reports", {
        description: (query.error as Error).message,
      });
    }
  }, [query.error]);

  return query;
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  const { addReport } = useFinancialsStore();

  return useMutation({
    mutationFn: (data: GenerateReportRequest) =>
      financialsService.generateReport(data),
    onSuccess: (report) => {
      addReport(report);
      queryClient.invalidateQueries({ queryKey: financialsKeys.reports() });
      toast.success("Financial report generated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to generate report", {
        description: error.message,
      });
    },
  });
};

export const useDownloadReport = () =>
  useMutation({
    mutationFn: (reportId: string) =>
      financialsService.downloadReport(reportId),
    onSuccess: (blob, reportId) => {
      console.log("blob", blob);

      if (blob.size === 0) {
        toast.error("Downloaded report is empty");
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Report downloaded successfully");
    },
    onError: (error: AxiosError) => {
      toast.error("Failed to download report", {
        description: (error.response?.data as any)?.message || error.message,
      });
    },
  });

// Tax Reports Hooks
export const useTaxReports = (taxYear?: number) => {
  const { setTaxReports, setTaxReportsLoading } = useFinancialsStore();

  const query = useQuery({
    queryKey: financialsKeys.taxReport(taxYear || 0),
    queryFn: () => financialsService.getTaxReports(taxYear),
  });

  useEffect(() => {
    if (query.data) {
      if (Array.isArray(query.data)) {
        setTaxReports(query.data);
      } else {
        setTaxReports([query.data]);
      }
    }
    setTaxReportsLoading(query.isLoading);
  }, [query.data, query.isLoading, setTaxReports, setTaxReportsLoading]);

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to fetch tax reports", {
        description: (query.error as Error).message,
      });
    }
  }, [query.error]);

  return query;
};

export const useGenerateTaxReport = () => {
  const queryClient = useQueryClient();
  const { addTaxReport } = useFinancialsStore();

  return useMutation({
    mutationFn: (taxYear: number) =>
      financialsService.generateTaxReport(taxYear),
    onSuccess: (report) => {
      addTaxReport(report);
      queryClient.invalidateQueries({ queryKey: financialsKeys.taxReports() });
      toast.success("Tax report generated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to generate tax report", {
        description: error.message,
      });
    },
  });
};

// Expenses Hooks
export const useExpenses = (filters?: ExpenseFilters) => {
  const { setExpenses, setExpensesLoading, setExpensesPagination } =
    useFinancialsStore();

  const query = useQuery({
    queryKey: financialsKeys.expensesList(filters || {}),
    queryFn: () => financialsService.getExpenses(filters),
  });

  useEffect(() => {
    if (query.data) {
      setExpenses(query.data.expenses);
      setExpensesPagination(query.data.pagination);
    }
    setExpensesLoading(query.isLoading);
  }, [
    query.data,
    query.isLoading,
    setExpenses,
    setExpensesPagination,
    setExpensesLoading,
  ]);

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to fetch expenses", {
        description: (query.error as Error).message,
      });
    }
  }, [query.error]);

  return query;
};

export const useExpenseCategories = () => {
  const { setExpenseCategories } = useFinancialsStore();

  const query = useQuery({
    queryKey: financialsKeys.expenseCategories(),
    queryFn: () => financialsService.getExpenseCategories(),
  });

  useEffect(() => {
    if (query.data) {
      setExpenseCategories(query.data);
    }
  }, [query.data, setExpenseCategories]);

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to fetch expense categories", {
        description: (query.error as Error).message,
      });
    }
  }, [query.error]);

  return query;
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { addExpense } = useFinancialsStore();

  return useMutation({
    mutationFn: (data: CreateExpenseRequest) =>
      financialsService.createExpense(data),
    onSuccess: (expense) => {
      addExpense(expense);
      queryClient.invalidateQueries({ queryKey: financialsKeys.expenses() });
      toast.success("Expense created successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to create expense", {
        description: error.message,
      });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const { updateExpense } = useFinancialsStore();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateExpenseRequest>;
    }) => financialsService.updateExpense(id, data),
    onSuccess: (expense) => {
      updateExpense(expense._id, expense);
      queryClient.invalidateQueries({ queryKey: financialsKeys.expenses() });
      toast.success("Expense updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update expense", {
        description: error.message,
      });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { removeExpense } = useFinancialsStore();

  return useMutation({
    mutationFn: (id: string) => financialsService.deleteExpense(id),
    onSuccess: (_, id) => {
      removeExpense(id);
      queryClient.invalidateQueries({ queryKey: financialsKeys.expenses() });
      toast.success("Expense deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete expense", {
        description: error.message,
      });
    },
  });
};

// Assets Hooks
export const useAssets = (filters?: AssetFilters) => {
  const { setAssets, setAssetsLoading, setAssetsPagination } =
    useFinancialsStore();

  const query = useQuery({
    queryKey: financialsKeys.assetsList(filters || {}),
    queryFn: () => financialsService.getAssets(filters),
  });

  useEffect(() => {
    if (query.data) {
      setAssets(query.data.assets);
      setAssetsPagination(query.data.pagination);
    }
    setAssetsLoading(query.isLoading);
  }, [
    query.data,
    query.isLoading,
    setAssets,
    setAssetsPagination,
    setAssetsLoading,
  ]);

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to fetch assets", {
        description: (query.error as Error).message,
      });
    }
  }, [query.error]);

  return query;
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  const { addAsset } = useFinancialsStore();

  return useMutation({
    mutationFn: (data: CreateAssetRequest) =>
      financialsService.createAsset(data),
    onSuccess: (asset) => {
      addAsset(asset);
      queryClient.invalidateQueries({ queryKey: financialsKeys.assets() });
      toast.success("Asset created successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to create asset", {
        description: error.message,
      });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  const { updateAsset } = useFinancialsStore();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateAssetRequest>;
    }) => financialsService.updateAsset(id, data),
    onSuccess: (asset) => {
      updateAsset(asset._id, asset);
      queryClient.invalidateQueries({ queryKey: financialsKeys.assets() });
      toast.success("Asset updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update asset", {
        description: error.message,
      });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  const { removeAsset } = useFinancialsStore();

  return useMutation({
    mutationFn: (id: string) => financialsService.deleteAsset(id),
    onSuccess: (_, id) => {
      removeAsset(id);
      queryClient.invalidateQueries({ queryKey: financialsKeys.assets() });
      toast.success("Asset deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete asset", {
        description: error.message,
      });
    },
  });
};

// Financial Settings Hooks
export const useFinancialSettings = () => {
  const { setSettings, setSettingsLoading } = useFinancialsStore();

  const query = useQuery({
    queryKey: financialsKeys.settings(),
    queryFn: () => financialsService.getSettings(),
  });

  useEffect(() => {
    if (query.data) {
      setSettings(query.data);
    }
    setSettingsLoading(query.isLoading);
  }, [query.data, query.isLoading, setSettings, setSettingsLoading]);

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to fetch financial settings", {
        description: (query.error as Error).message,
      });
    }
  }, [query.error]);

  return query;
};

export const useUpdateFinancialSettings = () => {
  const queryClient = useQueryClient();
  const { updateSettings } = useFinancialsStore();

  return useMutation({
    mutationFn: (data: UpdateFinancialSettingsRequest) =>
      financialsService.updateSettings(data),
    onSuccess: (settings) => {
      updateSettings(settings);
      queryClient.invalidateQueries({ queryKey: financialsKeys.settings() });
      toast.success("Financial settings updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update financial settings", {
        description: error.message,
      });
    },
  });
};

// Dashboard Hooks
export const useFinancialDashboard = (
  period?: "monthly" | "quarterly" | "yearly"
) => {
  const { setDashboardData, setDashboardLoading } = useFinancialsStore();

  const query = useQuery({
    queryKey: financialsKeys.dashboard(period),
    queryFn: () => financialsService.getDashboardData(period),
  });

  useEffect(() => {
    if (query.data) {
      setDashboardData(query.data);
    }
    setDashboardLoading(query.isLoading);
  }, [query.data, query.isLoading, setDashboardData, setDashboardLoading]);

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to fetch dashboard data", {
        description: (query.error as Error).message,
      });
    }
  }, [query.error]);

  return query;
};

// Analytics Hooks
export const useFinancialAnalytics = (
  timeframe: "month" | "quarter" | "year" = "month"
) =>
  useQuery({
    queryKey: financialsKeys.analytics(timeframe),
    queryFn: () => financialsService.getFinancialAnalytics(timeframe),
    enabled: !!timeframe,
  });

// Utility Hooks
export const useExportData = () =>
  useMutation({
    mutationFn: ({
      type,
      format,
    }: {
      type: "expenses" | "assets" | "reports";
      format?: "csv" | "xlsx";
    }) => financialsService.exportData(type, format),
    onSuccess: (blob, { type, format = "csv" }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${type} exported successfully`);
    },
    onError: (error: any) => {
      toast.error("Failed to export data", {
        description: error.message,
      });
    },
  });

export const useUploadExpenseReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, file }: { expenseId: string; file: File }) =>
      financialsService.uploadExpenseReceipt(expenseId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialsKeys.expenses() });
      toast.success("Receipt uploaded successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to upload receipt", {
        description: error.message,
      });
    },
  });
};
