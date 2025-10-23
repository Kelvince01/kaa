import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import * as conditionService from "./condition.service";
import type {
  AddConditionItemInput,
  ConditionQueryParams,
  ConditionTemplate,
  DisputeConditionReportInput,
  SignConditionReportInput,
  UpdateConditionItemInput,
  UpdateConditionReportInput,
} from "./condition.type";

/**
 * Property Condition query keys for consistent cache management
 */
export const conditionKeys = {
  all: ["conditions"] as const,
  lists: () => [...conditionKeys.all, "list"] as const,
  list: (params: ConditionQueryParams) =>
    [...conditionKeys.lists(), params] as const,
  details: () => [...conditionKeys.all, "detail"] as const,
  detail: (id: string) => [...conditionKeys.details(), id] as const,
  stats: () => [...conditionKeys.all, "stats"] as const,
  statsByProperty: (propertyId: string) =>
    [...conditionKeys.stats(), propertyId] as const,
  byProperty: (propertyId: string) =>
    [...conditionKeys.all, "by-property", propertyId] as const,
  byTenant: (tenantId: string) =>
    [...conditionKeys.all, "by-tenant", tenantId] as const,
  history: (propertyId: string) =>
    [...conditionKeys.all, "history", propertyId] as const,
  trends: (propertyId: string) =>
    [...conditionKeys.all, "trends", propertyId] as const,
  summary: (propertyId: string) =>
    [...conditionKeys.all, "summary", propertyId] as const,
  templates: () => [...conditionKeys.all, "templates"] as const,
  templatesByType: (type: string) =>
    [...conditionKeys.templates(), type] as const,
  comparison: (reportId1: string, reportId2: string) =>
    [...conditionKeys.all, "comparison", reportId1, reportId2] as const,
  auditLogs: (reportId: string) =>
    [...conditionKeys.all, "audit-logs", reportId] as const,
  insights: (propertyId?: string) =>
    [...conditionKeys.all, "insights", propertyId] as const,
  metrics: (filters?: any) =>
    [...conditionKeys.all, "metrics", filters] as const,
  notificationSettings: () =>
    [...conditionKeys.all, "notification-settings"] as const,
};

/**
 * Query Hooks - for fetching data
 */

// Get all condition reports with filtering
export const useConditionReports = (params: ConditionQueryParams = {}) =>
  useQuery({
    queryKey: conditionKeys.list(params),
    queryFn: () => conditionService.getConditionReports(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

// Get condition report by ID
export const useConditionReport = (id: string) =>
  useQuery({
    queryKey: conditionKeys.detail(id),
    queryFn: () => conditionService.getConditionReport(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Get condition statistics
export const useConditionStats = (propertyId?: string) =>
  useQuery({
    queryKey: propertyId
      ? conditionKeys.statsByProperty(propertyId)
      : conditionKeys.stats(),
    queryFn: () => conditionService.getConditionStats(propertyId),
    staleTime: 2 * 60 * 1000,
  });

// Get condition reports by property
export const useConditionReportsByProperty = (propertyId: string) =>
  useQuery({
    queryKey: conditionKeys.byProperty(propertyId),
    queryFn: () => conditionService.getConditionReportsByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get condition reports by tenant
export const useConditionReportsByTenant = (tenantId: string) =>
  useQuery({
    queryKey: conditionKeys.byTenant(tenantId),
    queryFn: () => conditionService.getConditionReportsByTenant(tenantId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

// Get property condition history
export const usePropertyConditionHistory = (propertyId: string, limit = 10) =>
  useQuery({
    queryKey: conditionKeys.history(propertyId),
    queryFn: () =>
      conditionService.getPropertyConditionHistory(propertyId, limit),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get property condition trends
export const usePropertyConditionTrends = (propertyId: string) =>
  useQuery({
    queryKey: conditionKeys.trends(propertyId),
    queryFn: () => conditionService.getPropertyConditionTrends(propertyId),
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000,
  });

// Get property condition summary
export const usePropertyConditionSummary = (propertyId: string) =>
  useQuery({
    queryKey: conditionKeys.summary(propertyId),
    queryFn: () => conditionService.getPropertyConditionSummary(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get condition templates
export const useConditionTemplates = (reportType?: string) =>
  useQuery({
    queryKey: reportType
      ? conditionKeys.templatesByType(reportType)
      : conditionKeys.templates(),
    queryFn: () => conditionService.getConditionTemplates(reportType),
    staleTime: 10 * 60 * 1000,
  });

// Get condition insights
export const useConditionInsights = (propertyId?: string, dateRange?: any) =>
  useQuery({
    queryKey: conditionKeys.insights(propertyId),
    queryFn: () => conditionService.getConditionInsights(propertyId, dateRange),
    staleTime: 15 * 60 * 1000,
  });

// Get condition metrics
export const useConditionMetrics = (filters?: any) =>
  useQuery({
    queryKey: conditionKeys.metrics(filters),
    queryFn: () => conditionService.getConditionMetrics(filters),
    staleTime: 10 * 60 * 1000,
  });

// Get notification settings
export const useConditionNotificationSettings = () =>
  useQuery({
    queryKey: conditionKeys.notificationSettings(),
    queryFn: conditionService.getConditionNotificationSettings,
    staleTime: 10 * 60 * 1000,
  });

/**
 * Mutation Hooks - for modifying data
 */

// Create condition report
export const useCreateConditionReport = () =>
  useMutation({
    mutationFn: conditionService.createConditionReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: conditionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conditionKeys.stats() });

      const report = data.condition || data.report || data.data;
      if (report) {
        queryClient.setQueryData(conditionKeys.detail(report._id), data);
        if (report.property) {
          queryClient.invalidateQueries({
            queryKey: conditionKeys.byProperty(report.property),
          });
        }
      }
    },
  });

// Update condition report
export const useUpdateConditionReport = () =>
  useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConditionReportInput;
    }) => conditionService.updateConditionReport(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(conditionKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: conditionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conditionKeys.stats() });
    },
  });

// Delete condition report
export const useDeleteConditionReport = () =>
  useMutation({
    mutationFn: conditionService.deleteConditionReport,
    onSuccess: (_, reportId) => {
      queryClient.removeQueries({ queryKey: conditionKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: conditionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conditionKeys.stats() });
    },
  });

// Complete condition report
export const useCompleteConditionReport = () =>
  useMutation({
    mutationFn: conditionService.completeConditionReport,
    onSuccess: (data, reportId) => {
      queryClient.setQueryData(conditionKeys.detail(reportId), data);
      queryClient.invalidateQueries({ queryKey: conditionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conditionKeys.stats() });
    },
  });

// Sign condition report
export const useSignConditionReport = () =>
  useMutation({
    mutationFn: ({
      reportId,
      data,
    }: {
      reportId: string;
      data: SignConditionReportInput;
    }) => conditionService.signConditionReport(reportId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(conditionKeys.detail(variables.reportId), data);
      queryClient.invalidateQueries({ queryKey: conditionKeys.lists() });
    },
  });

// Dispute condition report
export const useDisputeConditionReport = () =>
  useMutation({
    mutationFn: ({
      reportId,
      data,
    }: {
      reportId: string;
      data: DisputeConditionReportInput;
    }) => conditionService.disputeConditionReport(reportId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(conditionKeys.detail(variables.reportId), data);
      queryClient.invalidateQueries({ queryKey: conditionKeys.lists() });
    },
  });

// Add condition item
export const useAddConditionItem = () =>
  useMutation({
    mutationFn: ({
      reportId,
      data,
    }: {
      reportId: string;
      data: AddConditionItemInput;
    }) => conditionService.addConditionItem(reportId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: conditionKeys.detail(variables.reportId),
      });
    },
  });

// Update condition item
export const useUpdateConditionItem = () =>
  useMutation({
    mutationFn: ({
      reportId,
      itemId,
      data,
    }: {
      reportId: string;
      itemId: string;
      data: UpdateConditionItemInput;
    }) => conditionService.updateConditionItem(reportId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: conditionKeys.detail(variables.reportId),
      });
    },
  });

// Upload condition photos
export const useUploadConditionPhotos = () =>
  useMutation({
    mutationFn: ({
      reportId,
      itemId,
      files,
      captions,
    }: {
      reportId: string;
      itemId: string;
      files: File[];
      captions?: string[];
    }) =>
      conditionService.uploadConditionPhotos(reportId, itemId, files, captions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: conditionKeys.detail(variables.reportId),
      });
    },
  });

// Create condition template
export const useCreateConditionTemplate = () =>
  useMutation({
    mutationFn: conditionService.createConditionTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conditionKeys.templates() });
    },
  });

// Update condition template
export const useUpdateConditionTemplate = () =>
  useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ConditionTemplate>;
    }) => conditionService.updateConditionTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conditionKeys.templates() });
    },
  });

// Bulk update condition reports
export const useBulkUpdateConditionReports = () =>
  useMutation({
    mutationFn: conditionService.bulkUpdateConditionReports,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conditionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conditionKeys.stats() });
    },
  });

// Export condition reports
export const useExportConditionReports = () =>
  useMutation({
    mutationFn: conditionService.exportConditionReports,
  });

// Compare condition reports
export const useCompareConditionReports = () =>
  useMutation({
    mutationFn: ({
      reportId1,
      reportId2,
    }: {
      reportId1: string;
      reportId2: string;
    }) => conditionService.compareConditionReports(reportId1, reportId2),
  });

// Update notification settings
export const useUpdateConditionNotificationSettings = () =>
  useMutation({
    mutationFn: conditionService.updateConditionNotificationSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(conditionKeys.notificationSettings(), data);
    },
  });

/**
 * Utility functions for cache management
 */

// Prefetch condition report
export const usePrefetchConditionReport = () => (id: string) => {
  queryClient.prefetchQuery({
    queryKey: conditionKeys.detail(id),
    queryFn: () => conditionService.getConditionReport(id),
    staleTime: 5 * 60 * 1000,
  });
};

// Invalidate all condition queries
export const useInvalidateConditions = () => () => {
  queryClient.invalidateQueries({ queryKey: conditionKeys.all });
};
