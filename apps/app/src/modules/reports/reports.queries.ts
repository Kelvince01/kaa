import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { reportsService } from "./reports.service";
import type {
  BusinessIntelligenceQuery,
  ICreateReportRequest,
  IExecuteReportRequest,
  IReportExecution,
  IReportSchedule,
  IReportTemplate,
  ListExecutionsQuery,
  ListReportsQuery,
  ListSchedulesQuery,
  ListTemplatesQuery,
  MarketInsightsQuery,
  ReportAnalyticsQuery,
} from "./reports.type";

// Query Keys
export const reportsKeys = {
  all: ["reports"] as const,
  reports: () => [...reportsKeys.all, "list"] as const,
  reportsList: (query?: ListReportsQuery) =>
    [...reportsKeys.reports(), query] as const,
  report: (id: string) => [...reportsKeys.all, "report", id] as const,
  executions: () => [...reportsKeys.all, "executions"] as const,
  executionsList: (reportId: string, query?: ListExecutionsQuery) =>
    [...reportsKeys.executions(), reportId, query] as const,
  execution: (id: string) => [...reportsKeys.executions(), id] as const,
  schedules: () => [...reportsKeys.all, "schedules"] as const,
  schedulesList: (query?: ListSchedulesQuery) =>
    [...reportsKeys.schedules(), query] as const,
  schedule: (id: string) => [...reportsKeys.schedules(), id] as const,
  templates: () => [...reportsKeys.all, "templates"] as const,
  templatesList: (query?: ListTemplatesQuery) =>
    [...reportsKeys.templates(), query] as const,
  template: (id: string) => [...reportsKeys.templates(), id] as const,
  systemTemplates: () => [...reportsKeys.templates(), "system"] as const,
  analytics: (query?: ReportAnalyticsQuery) =>
    [...reportsKeys.all, "analytics", query] as const,
  businessIntelligence: (query?: BusinessIntelligenceQuery) =>
    [...reportsKeys.all, "business-intelligence", query] as const,
  marketInsights: (query?: MarketInsightsQuery) =>
    [...reportsKeys.all, "market-insights", query] as const,
  kenyaMetrics: () => [...reportsKeys.all, "kenya-metrics"] as const,
};

// ==================== REPORTS CRUD ====================

/**
 * List user reports
 */
export const useReports = (query?: ListReportsQuery) =>
  useQuery({
    queryKey: reportsKeys.reportsList(query),
    queryFn: () => reportsService.listReports(query),
    enabled: true,
  });

/**
 * Get report by ID
 */
export const useReport = (reportId: string, enabled = true) =>
  useQuery({
    queryKey: reportsKeys.report(reportId),
    queryFn: () => reportsService.getReportById(reportId),
    enabled: enabled && !!reportId,
  });

/**
 * Create report
 */
export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateReportRequest) =>
      reportsService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.reports() });
      toast.success("Report created successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to create report", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Update report
 */
export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      data,
    }: {
      reportId: string;
      data: Partial<ICreateReportRequest>;
    }) => reportsService.updateReport(reportId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reportsKeys.report(variables.reportId),
      });
      queryClient.invalidateQueries({ queryKey: reportsKeys.reports() });
      toast.success("Report updated successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to update report", {
        description:
          ((error as AxiosError).response?.data as any)?.error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Delete report
 */
export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => reportsService.deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.reports() });
      toast.success("Report deleted successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to delete report", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Duplicate report
 */
export const useDuplicateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => reportsService.duplicateReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.reports() });
      toast.success("Report duplicated successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to duplicate report", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

// ==================== REPORT EXECUTION ====================

/**
 * Execute report
 */
export const useExecuteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IExecuteReportRequest) =>
      reportsService.executeReport(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.executions() });
      queryClient.invalidateQueries({
        queryKey: reportsKeys.executionsList(data.reportId.toString()),
      });
      toast.success("Report execution started");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to execute report", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Get execution status
 */
export const useExecution = (executionId: string, enabled = true) => {
  return useQuery({
    queryKey: reportsKeys.execution(executionId),
    queryFn: () => reportsService.getExecutionById(executionId),
    enabled: enabled && !!executionId,
    refetchInterval: (query) => {
      const data = query.state.data as IReportExecution | undefined;
      if (data?.status === "pending" || data?.status === "processing") {
        return 2000; // Poll every 2 seconds
      }
      return false;
    },
  });
};

/**
 * List report executions
 */
export const useReportExecutions = (
  reportId: string,
  query?: ListExecutionsQuery
) =>
  useQuery({
    queryKey: reportsKeys.executionsList(reportId, query),
    queryFn: () => reportsService.getReportExecutions(reportId, query),
    enabled: !!reportId,
  });

/**
 * Download report
 */
export const useDownloadReport = () =>
  useMutation({
    mutationFn: ({
      reportId,
      format = "pdf",
    }: {
      reportId: string;
      format?: string;
    }) => reportsService.downloadReport(reportId, format),
    onSuccess: (blob, variables) => {
      if (blob.size === 0) {
        toast.error("Downloaded report is empty");
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${variables.reportId}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Report downloaded successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to download report", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });

// ==================== SCHEDULES ====================

/**
 * List schedules
 */
export const useSchedules = (query?: ListSchedulesQuery) =>
  useQuery({
    queryKey: reportsKeys.schedulesList(query),
    queryFn: () => reportsService.listSchedules(query),
  });

/**
 * Create schedule
 */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      reportId: string;
      schedule: IReportSchedule;
      recipients?: any[];
      parameters?: Record<string, any>;
    }) => reportsService.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.schedules() });
      toast.success("Schedule created successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to create schedule", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Update schedule
 */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      data,
    }: {
      scheduleId: string;
      data: Partial<IReportSchedule>;
    }) => reportsService.updateSchedule(scheduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.schedules() });
      toast.success("Schedule updated successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to update schedule", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Delete schedule
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) =>
      reportsService.deleteSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.schedules() });
      toast.success("Schedule deleted successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to delete schedule", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Pause schedule
 */
export const usePauseSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) =>
      reportsService.pauseSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.schedules() });
      toast.success("Schedule paused successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to pause schedule", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Resume schedule
 */
export const useResumeSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) =>
      reportsService.resumeSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.schedules() });
      toast.success("Schedule resumed successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to resume schedule", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

// ==================== TEMPLATES ====================

/**
 * List templates
 */
export const useTemplates = (query?: ListTemplatesQuery) =>
  useQuery({
    queryKey: reportsKeys.templatesList(query),
    queryFn: () => reportsService.listTemplates(query),
  });

/**
 * Get system templates
 */
export const useSystemTemplates = () =>
  useQuery({
    queryKey: reportsKeys.systemTemplates(),
    queryFn: () => reportsService.getSystemTemplates(),
  });

/**
 * Get template by ID
 */
export const useTemplate = (templateId: string, enabled = true) =>
  useQuery({
    queryKey: reportsKeys.template(templateId),
    queryFn: () => reportsService.getTemplateById(templateId),
    enabled: enabled && !!templateId,
  });

/**
 * Create template
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IReportTemplate) => reportsService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.templates() });
      toast.success("Template created successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to create template", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Update template
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data: Partial<IReportTemplate>;
    }) => reportsService.updateTemplate(templateId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reportsKeys.template(variables.templateId),
      });
      queryClient.invalidateQueries({ queryKey: reportsKeys.templates() });
      toast.success("Template updated successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to update template", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

/**
 * Delete template
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      reportsService.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.templates() });
      toast.success("Template deleted successfully");
    },
    onError: (error: AxiosError | Error) => {
      toast.error("Failed to delete template", {
        description:
          ((error as AxiosError).response?.data as any).error?.message ||
          error.message,
      });
    },
  });
};

// ==================== ANALYTICS & INSIGHTS ====================

/**
 * Get report analytics
 */
export const useReportAnalytics = (query?: ReportAnalyticsQuery) =>
  useQuery({
    queryKey: reportsKeys.analytics(query),
    queryFn: () => reportsService.getReportAnalytics(query),
  });

/**
 * Get business intelligence
 */
export const useBusinessIntelligence = (query?: BusinessIntelligenceQuery) =>
  useQuery({
    queryKey: reportsKeys.businessIntelligence(query),
    queryFn: () => reportsService.getBusinessIntelligence(query),
  });

/**
 * Get market insights
 */
export const useMarketInsights = (query?: MarketInsightsQuery) =>
  useQuery({
    queryKey: reportsKeys.marketInsights(query),
    queryFn: () => reportsService.getMarketInsights(query),
  });

/**
 * Get Kenya metrics
 */
export const useKenyaMetrics = () =>
  useQuery({
    queryKey: reportsKeys.kenyaMetrics(),
    queryFn: () => reportsService.getKenyaMetrics(),
  });
