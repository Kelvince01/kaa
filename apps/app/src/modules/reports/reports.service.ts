import type { AxiosResponse } from "axios";
import { httpClient } from "@/lib/axios";
import type {
  ApiResponse,
  BusinessIntelligenceQuery,
  DownloadReportQuery,
  ICreateReportRequest,
  IExecuteReportRequest,
  IReportDefinition,
  IReportExecution,
  IReportSchedule,
  IReportTemplate,
  ListExecutionsQuery,
  ListReportsQuery,
  ListSchedulesQuery,
  ListTemplatesQuery,
  MarketInsightsQuery,
  PaginatedResponse,
  ReportAnalyticsQuery,
} from "./reports.type";

export const reportsService = {
  // ==================== REPORT CRUD ====================

  /**
   * Create a new report definition
   */
  createReport: async (
    data: ICreateReportRequest
  ): Promise<IReportDefinition> => {
    const response: AxiosResponse<ApiResponse<IReportDefinition>> =
      await httpClient.api.post("/reports", data);
    return response.data.data as IReportDefinition;
  },

  /**
   * Get report by ID
   */
  getReportById: async (reportId: string): Promise<IReportDefinition> => {
    const response: AxiosResponse<ApiResponse<IReportDefinition>> =
      await httpClient.api.get(`/reports/${reportId}`);
    return response.data.data as IReportDefinition;
  },

  /**
   * Update report
   */
  updateReport: async (
    reportId: string,
    data: Partial<ICreateReportRequest>
  ): Promise<IReportDefinition> => {
    const response: AxiosResponse<ApiResponse<IReportDefinition>> =
      await httpClient.api.put(`/reports/${reportId}`, data);
    return response.data.data as IReportDefinition;
  },

  /**
   * Delete report (soft delete)
   */
  deleteReport: async (reportId: string): Promise<void> => {
    await httpClient.api.delete(`/reports/${reportId}`);
  },

  /**
   * Duplicate report
   */
  duplicateReport: async (reportId: string): Promise<IReportDefinition> => {
    const response: AxiosResponse<ApiResponse<IReportDefinition>> =
      await httpClient.api.post(`/reports/${reportId}/duplicate`);
    return response.data.data as IReportDefinition;
  },

  /**
   * List user reports
   */
  listReports: async (
    query?: ListReportsQuery
  ): Promise<PaginatedResponse<IReportDefinition>> => {
    const response: AxiosResponse<PaginatedResponse<IReportDefinition>> =
      await httpClient.api.get("/reports", { params: query });
    return response.data;
  },

  // ==================== REPORT EXECUTION ====================

  /**
   * Execute report (generate)
   */
  executeReport: async (
    data: IExecuteReportRequest
  ): Promise<IReportExecution> => {
    const response: AxiosResponse<ApiResponse<IReportExecution>> =
      await httpClient.api.post("/reports/execute", data);
    return response.data.data as IReportExecution;
  },

  /**
   * Get execution status
   */
  getExecutionById: async (executionId: string): Promise<IReportExecution> => {
    const response: AxiosResponse<ApiResponse<IReportExecution>> =
      await httpClient.api.get(`/reports/executions/${executionId}`);
    return response.data.data as IReportExecution;
  },

  /**
   * List report executions
   */
  getReportExecutions: async (
    reportId: string,
    query?: ListExecutionsQuery
  ): Promise<PaginatedResponse<IReportExecution>> => {
    const response: AxiosResponse<PaginatedResponse<IReportExecution>> =
      await httpClient.api.get(`/reports/${reportId}/executions`, {
        params: query,
      });
    return response.data;
  },

  // ==================== DOWNLOAD ====================

  /**
   * Get download URL for report
   */
  getReportDownloadUrl: async (
    reportId: string,
    query?: DownloadReportQuery
  ): Promise<{ url: string; expiresAt: string }> => {
    const response: AxiosResponse<
      ApiResponse<{ url: string; expiresAt: string }>
    > = await httpClient.api.get(`/reports/${reportId}/download`, {
      params: query,
    });
    return response.data.data as { url: string; expiresAt: string };
  },

  /**
   * Download report file directly
   */
  downloadReport: async (reportId: string, format = "pdf"): Promise<Blob> => {
    const response: AxiosResponse<Blob> = await httpClient.api.get(
      `/reports/${reportId}/download`,
      {
        params: { format },
        responseType: "blob",
      }
    );
    return response.data;
  },

  // ==================== SCHEDULES ====================

  /**
   * Create schedule
   */
  createSchedule: async (data: {
    reportId: string;
    schedule: IReportSchedule;
    recipients?: any[];
    parameters?: Record<string, any>;
  }): Promise<IReportSchedule> => {
    const response: AxiosResponse<ApiResponse<IReportSchedule>> =
      await httpClient.api.post("/reports/schedules", data);
    return response.data.data as IReportSchedule;
  },

  /**
   * List schedules
   */
  listSchedules: async (
    query?: ListSchedulesQuery
  ): Promise<PaginatedResponse<IReportSchedule>> => {
    const response: AxiosResponse<PaginatedResponse<IReportSchedule>> =
      await httpClient.api.get("/reports/schedules", { params: query });
    return response.data;
  },

  /**
   * Update schedule
   */
  updateSchedule: async (
    scheduleId: string,
    data: Partial<IReportSchedule>
  ): Promise<IReportSchedule> => {
    const response: AxiosResponse<ApiResponse<IReportSchedule>> =
      await httpClient.api.put(`/reports/schedules/${scheduleId}`, data);
    return response.data.data as IReportSchedule;
  },

  /**
   * Delete schedule
   */
  deleteSchedule: async (scheduleId: string): Promise<void> => {
    await httpClient.api.delete(`/reports/schedules/${scheduleId}`);
  },

  /**
   * Pause schedule
   */
  pauseSchedule: async (scheduleId: string): Promise<IReportSchedule> => {
    const response: AxiosResponse<ApiResponse<IReportSchedule>> =
      await httpClient.api.post(`/reports/schedules/${scheduleId}/pause`);
    return response.data.data as IReportSchedule;
  },

  /**
   * Resume schedule
   */
  resumeSchedule: async (scheduleId: string): Promise<IReportSchedule> => {
    const response: AxiosResponse<ApiResponse<IReportSchedule>> =
      await httpClient.api.post(`/reports/schedules/${scheduleId}/resume`);
    return response.data.data as IReportSchedule;
  },

  // ==================== TEMPLATES ====================

  /**
   * Create template
   */
  createTemplate: async (data: IReportTemplate): Promise<IReportTemplate> => {
    const response: AxiosResponse<ApiResponse<IReportTemplate>> =
      await httpClient.api.post("/reports/templates", data);
    return response.data.data as IReportTemplate;
  },

  /**
   * List templates
   */
  listTemplates: async (
    query?: ListTemplatesQuery
  ): Promise<PaginatedResponse<IReportTemplate>> => {
    const response: AxiosResponse<PaginatedResponse<IReportTemplate>> =
      await httpClient.api.get("/reports/templates", { params: query });
    return response.data;
  },

  /**
   * Get system templates
   */
  getSystemTemplates: async (): Promise<IReportTemplate[]> => {
    const response: AxiosResponse<ApiResponse<IReportTemplate[]>> =
      await httpClient.api.get("/reports/templates/system");
    return response.data.data as IReportTemplate[];
  },

  /**
   * Get template by ID
   */
  getTemplateById: async (templateId: string): Promise<IReportTemplate> => {
    const response: AxiosResponse<ApiResponse<IReportTemplate>> =
      await httpClient.api.get(`/reports/templates/${templateId}`);
    return response.data.data as IReportTemplate;
  },

  /**
   * Update template
   */
  updateTemplate: async (
    templateId: string,
    data: Partial<IReportTemplate>
  ): Promise<IReportTemplate> => {
    const response: AxiosResponse<ApiResponse<IReportTemplate>> =
      await httpClient.api.put(`/reports/templates/${templateId}`, data);
    return response.data.data as IReportTemplate;
  },

  /**
   * Delete template
   */
  deleteTemplate: async (templateId: string): Promise<void> => {
    await httpClient.api.delete(`/reports/templates/${templateId}`);
  },

  // ==================== ANALYTICS & INSIGHTS ====================

  /**
   * Get report analytics
   */
  getReportAnalytics: async (query?: ReportAnalyticsQuery): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await httpClient.api.get(
      "/reports/analytics",
      { params: query }
    );
    return response.data.data;
  },

  /**
   * Get business intelligence
   */
  getBusinessIntelligence: async (
    query?: BusinessIntelligenceQuery
  ): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await httpClient.api.get(
      "/reports/business-intelligence",
      { params: query }
    );
    return response.data.data;
  },

  /**
   * Get market insights
   */
  getMarketInsights: async (query?: MarketInsightsQuery): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await httpClient.api.get(
      "/reports/market-insights",
      { params: query }
    );
    return response.data.data;
  },

  /**
   * Get Kenya-specific metrics
   */
  getKenyaMetrics: async (): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await httpClient.api.get(
      "/reports/kenya-metrics"
    );
    return response.data.data;
  },
};
