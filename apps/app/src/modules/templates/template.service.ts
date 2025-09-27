import { httpClient } from "@/lib/axios";
import type {
  BatchRenderRequest,
  CacheStatsResponse,
  CategoriesResponse,
  FileExportRequest,
  FileExportResponse,
  FileImportRequest,
  FileImportResponse,
  SMSPreviewResponse,
  TemplateCreateInput,
  TemplateListQuery,
  TemplateListResponse,
  TemplatePreviewRequest,
  TemplatePreviewResponse,
  TemplateRenderRequest,
  TemplateRenderResponse,
  TemplateType,
  TemplateUpdateInput,
  TypesResponse,
  UsageTrackingResponse,
} from "./template.type";

const TEMPLATES_API = "/templates";

/**
 * Get a list of templates with pagination and filters
 */
export const getTemplates = async (
  params: TemplateListQuery = {},
  _userId?: string
): Promise<TemplateListResponse> => {
  const response = await httpClient.api.get(TEMPLATES_API, { params });
  return response.data;
};

/**
 * Get a specific template by ID
 */
export const getTemplate = async (
  id: string
): Promise<{ data: TemplateType }> => {
  const response = await httpClient.api.get(`${TEMPLATES_API}/${id}`);
  return response.data;
};

/**
 * Create a new template
 */
export const createTemplate = async (
  template: TemplateCreateInput,
  _userId?: string
): Promise<{ data: TemplateType }> => {
  const response = await httpClient.api.post(TEMPLATES_API, template);
  return response.data;
};

/**
 * Update an existing template
 */
export const updateTemplate = async (
  id: string,
  updates: TemplateUpdateInput
): Promise<{ data: TemplateType }> => {
  const response = await httpClient.api.put(`${TEMPLATES_API}/${id}`, updates);
  return response.data;
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id: string): Promise<void> => {
  await httpClient.api.delete(`${TEMPLATES_API}/${id}`);
};

/**
 * Duplicate a template
 */
export const duplicateTemplate = async (
  id: string
): Promise<{ data: TemplateType }> => {
  const response = await httpClient.api.post(
    `${TEMPLATES_API}/${id}/duplicate`
  );
  return response.data;
};

/**
 * Get template categories
 */
export const getTemplateCategories = async (): Promise<{
  data: CategoriesResponse;
}> => {
  const response = await httpClient.api.get(`${TEMPLATES_API}/categories`);
  return response.data;
};

/**
 * Get template types
 */
export const getTemplateTypes = async (): Promise<{ data: TypesResponse }> => {
  const response = await httpClient.api.get(`${TEMPLATES_API}/types`);
  return response.data;
};

/**
 * Render a template
 */
export const renderTemplate = async (
  renderRequest: TemplateRenderRequest
): Promise<{ data: TemplateRenderResponse }> => {
  const response = await httpClient.api.post(
    `${TEMPLATES_API}/render`,
    renderRequest
  );
  return response.data.data;
};

/**
 * Render a specific template by ID
 */
export const renderTemplateById = async (
  id: string,
  data: Record<string, any>,
  options?: TemplateRenderRequest["options"]
): Promise<{ data: TemplateRenderResponse }> => {
  const response = await httpClient.api.post(`${TEMPLATES_API}/${id}/render`, {
    data,
    options,
  });
  return response.data.data;
};

/**
 * Batch render multiple templates
 */
export const batchRenderTemplates = async (
  batchRequest: BatchRenderRequest
): Promise<TemplateRenderResponse[]> => {
  const response = await httpClient.api.post(
    `${TEMPLATES_API}/batch-render`,
    batchRequest
  );
  return response.data;
};

/**
 * Get rendering history
 */
export const getRenderingHistory = async (
  params: { page?: number; limit?: number } = {}
): Promise<{
  renderings: TemplateRenderResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const response = await httpClient.api.get(`${TEMPLATES_API}/renders`, {
    params,
  });
  return response.data;
};

/**
 * Get specific render details
 */
export const getRenderDetails = async (
  id: string
): Promise<TemplateRenderResponse> => {
  const response = await httpClient.api.get(`${TEMPLATES_API}/renders/${id}`);
  return response.data;
};

/**
 * Preview template
 */
export const previewTemplate = async (
  previewRequest: TemplatePreviewRequest
): Promise<{ data: TemplatePreviewResponse }> => {
  const response = await httpClient.api.post(
    `${TEMPLATES_API}/preview`,
    previewRequest
  );
  return response.data;
};

/**
 * Preview template with sample data
 */
export const previewTemplateById = async (
  id: string,
  data: Record<string, any> = {}
): Promise<{ data: TemplatePreviewResponse }> => {
  const response = await httpClient.api.get(`${TEMPLATES_API}/${id}/preview`, {
    params: data,
  });
  return response.data.data;
};

/**
 * Send test email
 */
export const sendTestEmail = async (
  id: string,
  data: Record<string, any>
): Promise<{ success: boolean; message: string }> => {
  const response = await httpClient.api.post(
    `${TEMPLATES_API}/${id}/test`,
    data
  );
  return response.data.data;
};

/**
 * Preview SMS template with metadata
 */
export const previewSMSTemplate = async (
  id: string,
  sampleData: Record<string, any>
): Promise<{ data: SMSPreviewResponse }> => {
  const response = await httpClient.api.post(
    `${TEMPLATES_API}/${id}/sms-preview`,
    {
      sampleData,
    }
  );
  return response.data;
};

/**
 * Import templates from files
 */
export const importTemplates = async (
  importRequest: FileImportRequest
): Promise<FileImportResponse> => {
  const response = await httpClient.api.post(
    `${TEMPLATES_API}/import`,
    importRequest
  );
  return response.data;
};

/**
 * Export templates to files
 */
export const exportTemplates = async (
  exportRequest: FileExportRequest
): Promise<FileExportResponse> => {
  const response = await httpClient.api.post(
    `${TEMPLATES_API}/export`,
    exportRequest
  );
  return response.data;
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  data: CacheStatsResponse;
}> => {
  const response = await httpClient.api.get(`${TEMPLATES_API}/meta/cache`);
  return response.data;
};

/**
 * Clear template cache
 */
export const clearCache = async (): Promise<void> => {
  await httpClient.api.delete(`${TEMPLATES_API}/meta/cache`);
};

/**
 * Get template usage statistics
 */
export const getTemplateUsage = async (
  id: string
): Promise<{ data: UsageTrackingResponse }> => {
  const response = await httpClient.api.get(`${TEMPLATES_API}/${id}/usage`);
  return response.data;
};
