import { httpClient } from "@/lib/axios";
import type {
  AddConditionItemInput,
  BulkConditionOperation,
  ConditionAuditLog,
  ConditionComparisonResponse,
  ConditionExportOptions,
  ConditionItem,
  ConditionItemTrend,
  ConditionListResponse,
  ConditionNotificationSettings,
  ConditionPhoto,
  ConditionQueryParams,
  ConditionResponse,
  ConditionStatsResponse,
  ConditionTemplate,
  ConditionTemplatesResponse,
  CreateConditionReportInput,
  DisputeConditionReportInput,
  PropertyConditionSummary,
  SignConditionReportInput,
  UpdateConditionItemInput,
  UpdateConditionReportInput,
} from "./condition.type";

/**
 * Property Conditions service for managing property condition reports and assessments
 */

// Create a new condition report
export const createConditionReport = async (
  data: CreateConditionReportInput
): Promise<ConditionResponse> => {
  const response = await httpClient.api.post("/properties/conditions", data);
  return response.data;
};

// Get all condition reports with optional filtering
export const getConditionReports = async (
  params: ConditionQueryParams = {}
): Promise<ConditionListResponse> => {
  const response = await httpClient.api.get("/properties/conditions", {
    params,
  });
  return response.data;
};

// Get condition report by ID
export const getConditionReport = async (
  id: string
): Promise<ConditionResponse> => {
  const response = await httpClient.api.get(`/properties/conditions/${id}`);
  return response.data;
};

// Update condition report
export const updateConditionReport = async (
  id: string,
  data: UpdateConditionReportInput
): Promise<ConditionResponse> => {
  const response = await httpClient.api.patch(
    `/properties/conditions/${id}`,
    data
  );
  return response.data;
};

// Delete condition report
export const deleteConditionReport = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(`/properties/conditions/${id}`);
  return response.data;
};

// Complete condition report
export const completeConditionReport = async (
  id: string
): Promise<ConditionResponse> => {
  const response = await httpClient.api.post(
    `/properties/conditions/${id}/complete`
  );
  return response.data;
};

// Archive condition report
export const archiveConditionReport = async (
  id: string
): Promise<ConditionResponse> => {
  const response = await httpClient.api.post(
    `/properties/conditions/${id}/archive`
  );
  return response.data;
};

// Get condition reports by property
export const getConditionReportsByProperty = async (
  propertyId: string
): Promise<ConditionListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/conditions`
  );
  return response.data;
};

// Get condition reports by tenant
export const getConditionReportsByTenant = async (
  tenantId: string
): Promise<ConditionListResponse> => {
  const response = await httpClient.api.get(`/tenants/${tenantId}/conditions`);
  return response.data;
};

// Get condition statistics
export const getConditionStats = async (
  propertyId?: string
): Promise<ConditionStatsResponse> => {
  const params = propertyId ? { propertyId } : {};
  const response = await httpClient.api.get("/properties/conditions/stats", {
    params,
  });
  return response.data;
};

// Condition Items Management

// Add condition item to report
export const addConditionItem = async (
  reportId: string,
  data: AddConditionItemInput
): Promise<{ item: ConditionItem; status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/conditions/${reportId}/items`,
    data
  );
  return response.data;
};

// Update condition item
export const updateConditionItem = async (
  reportId: string,
  itemId: string,
  data: UpdateConditionItemInput
): Promise<{ item: ConditionItem; status: string; message: string }> => {
  const response = await httpClient.api.patch(
    `/properties/conditions/${reportId}/items/${itemId}`,
    data
  );
  return response.data;
};

// Delete condition item
export const deleteConditionItem = async (
  reportId: string,
  itemId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/conditions/${reportId}/items/${itemId}`
  );
  return response.data;
};

// Photo Management

// Upload condition photos
export const uploadConditionPhotos = async (
  reportId: string,
  itemId: string,
  files: File[],
  captions?: string[]
): Promise<{ photos: ConditionPhoto[]; status: string; message: string }> => {
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    formData.append("photos", files[i] as Blob);
    if (captions?.[i]) {
      formData.append("captions", captions[i] as string);
    }
  }

  const response = await httpClient.api.post(
    `/properties/conditions/${reportId}/items/${itemId}/photos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Delete condition photo
export const deleteConditionPhoto = async (
  reportId: string,
  itemId: string,
  photoId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/conditions/${reportId}/items/${itemId}/photos/${photoId}`
  );
  return response.data;
};

// Upload report attachments
export const uploadReportAttachment = async (
  reportId: string,
  file: File,
  description?: string
): Promise<{ attachment: ConditionPhoto; status: string; message: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  if (description) {
    formData.append("description", description);
  }

  const response = await httpClient.api.post(
    `/properties/conditions/${reportId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Delete report attachment
export const deleteReportAttachment = async (
  reportId: string,
  attachmentId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/conditions/${reportId}/attachments/${attachmentId}`
  );
  return response.data;
};

// Signature Management

// Sign condition report
export const signConditionReport = async (
  reportId: string,
  data: SignConditionReportInput
): Promise<ConditionResponse> => {
  const response = await httpClient.api.post(
    `/properties/conditions/${reportId}/sign`,
    data
  );
  return response.data;
};

// Send signature request
export const sendSignatureRequest = async (
  reportId: string,
  recipients: string[],
  message?: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/conditions/${reportId}/request-signature`,
    {
      recipients,
      message,
    }
  );
  return response.data;
};

// Dispute Management

// Dispute condition report
export const disputeConditionReport = async (
  reportId: string,
  data: DisputeConditionReportInput
): Promise<ConditionResponse> => {
  const response = await httpClient.api.post(
    `/properties/conditions/${reportId}/dispute`,
    data
  );
  return response.data;
};

// Resolve dispute
export const resolveDispute = async (
  reportId: string,
  resolution: string,
  approvedChanges?: Array<{
    itemId: string;
    newStatus: string;
    reason: string;
  }>
): Promise<ConditionResponse> => {
  const response = await httpClient.api.post(
    `/properties/conditions/${reportId}/resolve-dispute`,
    {
      resolution,
      approvedChanges,
    }
  );
  return response.data;
};

// Comparison and Analysis

// Compare condition reports
export const compareConditionReports = async (
  reportId1: string,
  reportId2: string
): Promise<ConditionComparisonResponse> => {
  const response = await httpClient.api.post("/properties/conditions/compare", {
    reportId1,
    reportId2,
  });
  return response.data;
};

// Get condition history for property
export const getPropertyConditionHistory = async (
  propertyId: string,
  limit = 10
): Promise<ConditionListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/conditions/history`,
    {
      params: { limit },
    }
  );
  return response.data;
};

// Get condition trends for property
export const getPropertyConditionTrends = async (
  propertyId: string
): Promise<{ trends: ConditionItemTrend[]; status: string }> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/conditions/trends`
  );
  return response.data;
};

// Get property condition summary
export const getPropertyConditionSummary = async (
  propertyId: string
): Promise<{ summary: PropertyConditionSummary; status: string }> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/conditions/summary`
  );
  return response.data;
};

// Templates

// Get condition templates
export const getConditionTemplates = async (
  reportType?: string
): Promise<ConditionTemplatesResponse> => {
  const params = reportType ? { reportType } : {};
  const response = await httpClient.api.get(
    "/properties/conditions/templates",
    { params }
  );
  return response.data;
};

// Create condition template
export const createConditionTemplate = async (
  data: Omit<ConditionTemplate, "_id" | "createdAt" | "updatedAt" | "createdBy">
): Promise<{
  template: ConditionTemplate;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/conditions/templates",
    data
  );
  return response.data;
};

// Update condition template
export const updateConditionTemplate = async (
  id: string,
  data: Partial<ConditionTemplate>
): Promise<{
  template: ConditionTemplate;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    `/properties/conditions/templates/${id}`,
    data
  );
  return response.data;
};

// Delete condition template
export const deleteConditionTemplate = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/conditions/templates/${id}`
  );
  return response.data;
};

// Create report from template
export const createReportFromTemplate = async (
  templateId: string,
  data: {
    propertyId: string;
    unitId?: string;
    tenantId?: string;
    reportDate?: string;
  }
): Promise<ConditionResponse> => {
  const response = await httpClient.api.post(
    `/properties/conditions/templates/${templateId}/create-report`,
    data
  );
  return response.data;
};

// Bulk Operations

// Bulk update condition reports
export const bulkUpdateConditionReports = async (
  operation: BulkConditionOperation
): Promise<{ updated: number; status: string; message: string }> => {
  const response = await httpClient.api.post(
    "/properties/conditions/bulk",
    operation
  );
  return response.data;
};

// Export condition reports
export const exportConditionReports = async (
  options: ConditionExportOptions
): Promise<Blob> => {
  const response = await httpClient.api.post(
    "/properties/conditions/export",
    options,
    {
      responseType: "blob",
    }
  );
  return response.data;
};

// Generate condition report PDF
export const generateConditionReportPDF = async (
  reportId: string,
  includePhotos = true,
  includeSignatures = true
): Promise<Blob> => {
  const response = await httpClient.api.get(
    `/properties/conditions/${reportId}/pdf`,
    {
      params: { includePhotos, includeSignatures },
      responseType: "blob",
    }
  );
  return response.data;
};

// Notifications

// Get notification settings
export const getConditionNotificationSettings = async (): Promise<{
  settings: ConditionNotificationSettings;
  status: string;
}> => {
  const response = await httpClient.api.get(
    "/properties/conditions/notification-settings"
  );
  return response.data;
};

// Update notification settings
export const updateConditionNotificationSettings = async (
  settings: ConditionNotificationSettings
): Promise<{
  settings: ConditionNotificationSettings;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.put(
    "/properties/conditions/notification-settings",
    settings
  );
  return response.data;
};

// Send condition report notification
export const sendConditionReportNotification = async (
  reportId: string,
  recipients?: string[],
  message?: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/conditions/${reportId}/notify`,
    {
      recipients,
      message,
    }
  );
  return response.data;
};

// Audit and Logs

// Get condition audit logs
export const getConditionAuditLogs = async (
  reportId: string
): Promise<{ logs: ConditionAuditLog[]; status: string }> => {
  const response = await httpClient.api.get(
    `/properties/conditions/${reportId}/audit-logs`
  );
  return response.data;
};

// Duplicate condition report
export const duplicateConditionReport = async (
  reportId: string,
  newReportDate?: string,
  newPropertyId?: string
): Promise<ConditionResponse> => {
  const response = await httpClient.api.post(
    `/properties/conditions/${reportId}/duplicate`,
    {
      newReportDate,
      newPropertyId,
    }
  );
  return response.data;
};

// Validate condition data
export const validateConditionData = async (
  data: CreateConditionReportInput | UpdateConditionReportInput
): Promise<{
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  status: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/conditions/validate",
    data
  );
  return response.data;
};

// Get condition insights
export const getConditionInsights = async (
  propertyId?: string,
  dateRange?: { startDate: string; endDate: string }
): Promise<{
  insights: {
    totalReports: number;
    averageCondition: string;
    mostCommonIssues: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    improvementAreas: string[];
    costImplications: {
      estimated: number;
      urgent: number;
      preventive: number;
    };
    complianceScore: number;
    recommendations: string[];
  };
  status: string;
}> => {
  const params = {
    ...(propertyId && { propertyId }),
    ...(dateRange && dateRange),
  };
  const response = await httpClient.api.get("/properties/conditions/insights", {
    params,
  });
  return response.data;
};

// Schedule periodic condition check
export const schedulePeriodicConditionCheck = async (
  propertyId: string,
  frequency: "monthly" | "quarterly" | "semi-annually" | "annually",
  nextDate: string,
  templateId?: string
): Promise<{ schedule: any; status: string; message: string }> => {
  const response = await httpClient.api.post(
    "/properties/conditions/schedule",
    {
      propertyId,
      frequency,
      nextDate,
      templateId,
    }
  );
  return response.data;
};

// Get condition metrics
export const getConditionMetrics = async (filters?: {
  propertyIds?: string[];
  dateRange?: { startDate: string; endDate: string };
  reportTypes?: string[];
}): Promise<{
  metrics: {
    totalReports: number;
    completionRate: number;
    averageTimeToComplete: number;
    signatureRate: number;
    disputeRate: number;
    qualityScore: number;
    trendDirection: "improving" | "declining" | "stable";
  };
  status: string;
}> => {
  const response = await httpClient.api.get("/properties/conditions/metrics", {
    params: filters,
  });
  return response.data;
};
