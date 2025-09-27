import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  batchRenderTemplates,
  clearCache,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  exportTemplates,
  getCacheStats,
  getRenderDetails,
  getRenderingHistory,
  getTemplate,
  getTemplateCategories,
  getTemplates,
  getTemplateTypes,
  getTemplateUsage,
  importTemplates,
  previewSMSTemplate,
  previewTemplate,
  previewTemplateById,
  renderTemplate,
  renderTemplateById,
  sendTestEmail,
  updateTemplate,
} from "./template.service";
import type {
  BatchRenderRequest,
  FileExportRequest,
  FileImportRequest,
  TemplateCreateInput,
  TemplateListQuery,
  TemplatePreviewRequest,
  TemplateRenderRequest,
  TemplateUpdateInput,
} from "./template.type";

/**
 * Keys for template related queries. These keys help to uniquely identify different query.
 * For managing query caching and invalidation.
 */
export const templateKeys = {
  all: ["templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (filters: TemplateListQuery) =>
    [...templateKeys.lists(), filters] as const,
  create: () => [...templateKeys.all, "create"] as const,
  update: () => [...templateKeys.all, "update"] as const,
  delete: () => [...templateKeys.all, "delete"] as const,
  details: () => [...templateKeys.all, "detail"] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  categories: () => [...templateKeys.all, "categories"] as const,
  types: () => [...templateKeys.all, "types"] as const,
  renders: () => [...templateKeys.all, "renders"] as const,
  renderHistory: (params?: any) =>
    [...templateKeys.renders(), "history", params] as const,
  renderDetail: (id: string) => [...templateKeys.renders(), id] as const,
  usage: (id: string) => [...templateKeys.all, "usage", id] as const,
  cache: () => [...templateKeys.all, "cache"] as const,
};

/**
 * Get templates with filters
 */
export const useTemplates = (params: TemplateListQuery = {}) => {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => getTemplates(params),
    staleTime: 30_000,
  });
};

/**
 * Get a specific template
 */
export const useTemplate = (id: string) => {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => getTemplate(id),
    enabled: !!id,
    staleTime: 60_000,
  });
};

/**
 * Get template categories
 */
export const useTemplateCategories = () => {
  return useQuery({
    queryKey: templateKeys.categories(),
    queryFn: getTemplateCategories,
    staleTime: Number.POSITIVE_INFINITY, // Categories don't change often
  });
};

/**
 * Get template types
 */
export const useTemplateTypes = () => {
  return useQuery({
    queryKey: templateKeys.types(),
    queryFn: getTemplateTypes,
    staleTime: Number.POSITIVE_INFINITY, // Types don't change often
  });
};

/**
 * Get rendering history
 */
export const useRenderingHistory = (
  params: { page?: number; limit?: number } = {}
) => {
  return useQuery({
    queryKey: templateKeys.renderHistory(params),
    queryFn: () => getRenderingHistory(params),
    staleTime: 30_000,
  });
};

/**
 * Get specific render details
 */
export const useRenderDetails = (id: string) => {
  return useQuery({
    queryKey: templateKeys.renderDetail(id),
    queryFn: () => getRenderDetails(id),
    enabled: !!id,
    staleTime: 60_000,
  });
};

/**
 * Get template usage statistics
 */
export const useTemplateUsage = (id: string) => {
  return useQuery({
    queryKey: templateKeys.usage(id),
    queryFn: () => getTemplateUsage(id),
    enabled: !!id,
    staleTime: 300_000, // 5 minutes
  });
};

/**
 * Get cache statistics
 */
export const useCacheStats = () => {
  return useQuery({
    queryKey: templateKeys.cache(),
    queryFn: getCacheStats,
    staleTime: 60_000,
  });
};

/**
 * Create template mutation
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: TemplateCreateInput) => createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.categories() });
      queryClient.invalidateQueries({ queryKey: templateKeys.types() });
    },
  });
};

/**
 * Update template mutation
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: TemplateUpdateInput;
    }) => updateTemplate(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
};

/**
 * Delete template mutation
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
};

/**
 * Duplicate template mutation
 */
export const useDuplicateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => duplicateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
};

/**
 * Render template mutation
 */
export const useRenderTemplate = () => {
  return useMutation({
    mutationFn: (renderRequest: TemplateRenderRequest) =>
      renderTemplate(renderRequest),
  });
};

/**
 * Render template by ID mutation
 */
export const useRenderTemplateById = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
      options,
    }: {
      id: string;
      data: Record<string, any>;
      options?: TemplateRenderRequest["options"];
    }) => renderTemplateById(id, data, options),
  });
};

/**
 * Batch render templates mutation
 */
export const useBatchRenderTemplates = () => {
  return useMutation({
    mutationFn: (batchRequest: BatchRenderRequest) =>
      batchRenderTemplates(batchRequest),
  });
};

/**
 * Preview template mutation
 */
export const usePreviewTemplate = () => {
  return useMutation({
    mutationFn: (previewRequest: TemplatePreviewRequest) =>
      previewTemplate(previewRequest),
  });
};

/**
 * Preview template by ID
 */
export const usePreviewTemplateById = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Record<string, any> }) =>
      previewTemplateById(id, data),
  });
};

/**
 * Send test email mutation
 */
export const useSendTestEmail = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      sendTestEmail(id, data),
  });
};

/**
 * Preview SMS template mutation
 */
export const usePreviewSMSTemplate = () => {
  return useMutation({
    mutationFn: ({
      id,
      sampleData,
    }: {
      id: string;
      sampleData: Record<string, any>;
    }) => previewSMSTemplate(id, sampleData),
  });
};

/**
 * Import templates mutation
 */
export const useImportTemplates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importRequest: FileImportRequest) =>
      importTemplates(importRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
};

/**
 * Export templates mutation
 */
export const useExportTemplates = () => {
  return useMutation({
    mutationFn: (exportRequest: FileExportRequest) =>
      exportTemplates(exportRequest),
  });
};

/**
 * Clear cache mutation
 */
export const useClearCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.cache() });
    },
  });
};
