import { httpClient } from "@/lib/axios";
import type {
  BulkInspectionOperation,
  CompleteInspectionInput,
  CreateInspectionInput,
  InspectionAttachment,
  InspectionCalendarEvent,
  InspectionListResponse,
  InspectionQueryParams,
  InspectionReportResponse,
  InspectionResponse,
  InspectionStatsResponse,
  InspectionTemplate,
  InspectionTemplatesResponse,
  InspectorAvailability,
  PropertyInspection,
  RecurringInspection,
  RescheduleInspectionInput,
  UpdateInspectionInput,
} from "./inspection.type";

/**
 * Property Inspection service for managing property inspections
 */

// Create a new inspection
export const createInspection = async (
  data: CreateInspectionInput
): Promise<InspectionResponse> => {
  const response = await httpClient.api.post("/properties/inspections/", data);
  return response.data;
};

// Get all inspections with optional filtering
export const getInspections = async (
  params: InspectionQueryParams = {}
): Promise<InspectionListResponse> => {
  const response = await httpClient.api.get("/properties/inspections/", {
    params,
  });
  return response.data;
};

// Get inspection by ID
export const getInspection = async (
  id: string
): Promise<InspectionResponse> => {
  const response = await httpClient.api.get(`/properties/inspections/${id}`);
  return response.data;
};

// Update inspection
export const updateInspection = async (
  id: string,
  data: UpdateInspectionInput
): Promise<InspectionResponse> => {
  const response = await httpClient.api.patch(
    `/properties/inspections/${id}`,
    data
  );
  return response.data;
};

// Delete inspection
export const deleteInspection = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(`/properties/inspections/${id}`);
  return response.data;
};

// Complete inspection
export const completeInspection = async (
  id: string,
  data: CompleteInspectionInput
): Promise<InspectionResponse> => {
  const response = await httpClient.api.post(
    `/properties/inspections/${id}/complete`,
    data
  );
  return response.data;
};

// Reschedule inspection
export const rescheduleInspection = async (
  id: string,
  data: RescheduleInspectionInput
): Promise<InspectionResponse> => {
  const response = await httpClient.api.post(
    `/properties/inspections/${id}/reschedule`,
    data
  );
  return response.data;
};

// Cancel inspection
export const cancelInspection = async (
  id: string,
  reason?: string
): Promise<InspectionResponse> => {
  const response = await httpClient.api.post(
    `/properties/inspections/${id}/cancel`,
    {
      reason,
    }
  );
  return response.data;
};

// Get inspection statistics
export const getInspectionStats = async (
  propertyId?: string
): Promise<InspectionStatsResponse> => {
  const params = propertyId ? { propertyId } : {};
  const response = await httpClient.api.get("/properties/inspections/stats", {
    params,
  });
  return response.data;
};

// Get inspections by property
export const getInspectionsByProperty = async (
  propertyId: string
): Promise<InspectionListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/inspections`
  );
  return response.data;
};

// Get upcoming inspections
export const getUpcomingInspections = async (
  days = 7
): Promise<InspectionListResponse> => {
  const response = await httpClient.api.get(
    "/properties/inspections/upcoming",
    {
      params: { days },
    }
  );
  return response.data;
};

// Get overdue inspections
export const getOverdueInspections =
  async (): Promise<InspectionListResponse> => {
    const response = await httpClient.api.get(
      "/properties/inspections/overdue"
    );
    return response.data;
  };

// Get inspection calendar events
export const getInspectionCalendarEvents = async (
  startDate: string,
  endDate: string
): Promise<{ events: InspectionCalendarEvent[]; status: string }> => {
  const response = await httpClient.api.get(
    "/properties/inspections/calendar",
    {
      params: { startDate, endDate },
    }
  );
  return response.data;
};

// Upload inspection attachments
export const uploadInspectionAttachment = async (
  inspectionId: string,
  file: File,
  description?: string
): Promise<{
  attachment: InspectionAttachment;
  status: string;
  message: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);
  if (description) {
    formData.append("description", description);
  }

  const response = await httpClient.api.post(
    `/properties/inspections/${inspectionId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Delete inspection attachment
export const deleteInspectionAttachment = async (
  inspectionId: string,
  attachmentId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/inspections/${inspectionId}/attachments/${attachmentId}`
  );
  return response.data;
};

// Generate inspection report
export const generateInspectionReport = async (
  inspectionId: string,
  reportType: "summary" | "detailed" | "checklist" = "detailed"
): Promise<InspectionReportResponse> => {
  const response = await httpClient.api.post(
    `/properties/inspections/${inspectionId}/report`,
    {
      reportType,
    }
  );
  return response.data;
};

// Download inspection report
export const downloadInspectionReport = async (
  inspectionId: string,
  format: "pdf" | "docx" = "pdf"
): Promise<Blob> => {
  const response = await httpClient.api.get(
    `/properties/inspections/${inspectionId}/report/download`,
    {
      params: { format },
      responseType: "blob",
    }
  );
  return response.data;
};

// Send inspection notification
export const sendInspectionNotification = async (
  inspectionId: string,
  recipients?: string[]
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/inspections/${inspectionId}/notify`,
    {
      recipients,
    }
  );
  return response.data;
};

// Confirm tenant attendance
export const confirmTenantAttendance = async (
  inspectionId: string,
  confirmed: boolean
): Promise<InspectionResponse> => {
  const response = await httpClient.api.post(
    `/properties/inspections/${inspectionId}/confirm`,
    {
      confirmed,
    }
  );
  return response.data;
};

// Get inspector availability
export const getInspectorAvailability = async (
  inspectorId: string,
  startDate: string,
  endDate: string
): Promise<{ availability: InspectorAvailability; status: string }> => {
  const response = await httpClient.api.get(
    `/inspectors/${inspectorId}/availability`,
    {
      params: { startDate, endDate },
    }
  );
  return response.data;
};

// Get available inspectors for a time slot
export const getAvailableInspectors = async (
  date: string,
  startTime: string,
  duration: number
): Promise<{ inspectors: any[]; status: string }> => {
  const response = await httpClient.api.get("/inspectors/available", {
    params: { date, startTime, duration },
  });
  return response.data;
};

// Bulk operations
export const bulkUpdateInspections = async (
  operation: BulkInspectionOperation
): Promise<{ updated: number; status: string; message: string }> => {
  const response = await httpClient.api.post(
    "/properties/inspections/bulk",
    operation
  );
  return response.data;
};

// Export inspections
export const exportInspections = async (
  filters: InspectionQueryParams = {},
  format: "csv" | "xlsx" | "pdf" = "csv"
): Promise<Blob> => {
  const response = await httpClient.api.get("/properties/inspections/export", {
    params: { ...filters, format },
    responseType: "blob",
  });
  return response.data;
};

// Inspection Templates

// Get inspection templates
export const getInspectionTemplates =
  async (): Promise<InspectionTemplatesResponse> => {
    const response = await httpClient.api.get(
      "/properties/inspections/templates"
    );
    return response.data;
  };

// Create inspection template
export const createInspectionTemplate = async (
  data: Omit<
    InspectionTemplate,
    "_id" | "createdAt" | "updatedAt" | "createdBy"
  >
): Promise<{
  template: InspectionTemplate;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/inspections/templates",
    data
  );
  return response.data;
};

// Update inspection template
export const updateInspectionTemplate = async (
  id: string,
  data: Partial<InspectionTemplate>
): Promise<{
  template: InspectionTemplate;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    `/properties/inspections/templates/${id}`,
    data
  );
  return response.data;
};

// Delete inspection template
export const deleteInspectionTemplate = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/inspections/templates/${id}`
  );
  return response.data;
};

// Recurring Inspections

// Get recurring inspections
export const getRecurringInspections = async (
  propertyId?: string
): Promise<{ inspections: RecurringInspection[]; status: string }> => {
  const params = propertyId ? { propertyId } : {};
  const response = await httpClient.api.get(
    "/properties/inspections/recurring",
    {
      params,
    }
  );
  return response.data;
};

// Create recurring inspection
export const createRecurringInspection = async (
  data: Omit<
    RecurringInspection,
    "_id" | "createdAt" | "updatedAt" | "createdBy"
  >
): Promise<{
  inspection: RecurringInspection;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/inspections/recurring",
    data
  );
  return response.data;
};

// Update recurring inspection
export const updateRecurringInspection = async (
  id: string,
  data: Partial<RecurringInspection>
): Promise<{
  inspection: RecurringInspection;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    `/properties/inspections/recurring/${id}`,
    data
  );
  return response.data;
};

// Delete recurring inspection
export const deleteRecurringInspection = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/inspections/recurring/${id}`
  );
  return response.data;
};

// Generate next inspection from recurring pattern
export const generateNextInspection = async (
  recurringId: string
): Promise<InspectionResponse> => {
  const response = await httpClient.api.post(
    `/properties/inspections/recurring/${recurringId}/generate`
  );
  return response.data;
};

// Duplicate inspection
export const duplicateInspection = async (
  id: string,
  newDate?: string
): Promise<InspectionResponse> => {
  const response = await httpClient.api.post(
    `/properties/inspections/${id}/duplicate`,
    {
      newDate,
    }
  );
  return response.data;
};

// Get inspection history for property
export const getPropertyInspectionHistory = async (
  propertyId: string,
  limit = 10
): Promise<InspectionListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/inspections/history`,
    {
      params: { limit },
    }
  );
  return response.data;
};

// Send inspection reminder
export const sendInspectionReminder = async (
  inspectionId: string,
  reminderType: "24_hours" | "1_hour" | "custom",
  customMessage?: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/inspections/${inspectionId}/reminder`,
    {
      reminderType,
      customMessage,
    }
  );
  return response.data;
};

// Update inspection checklist
export const updateInspectionChecklist = async (
  inspectionId: string,
  checklist: any[]
): Promise<InspectionResponse> => {
  const response = await httpClient.api.patch(
    `/properties/inspections/${inspectionId}/checklist`,
    {
      checklist,
    }
  );
  return response.data;
};

// Get inspection checklist templates
export const getChecklistTemplates = async (
  inspectionType?: string
): Promise<{ templates: any[]; status: string }> => {
  const params = inspectionType ? { type: inspectionType } : {};
  const response = await httpClient.api.get(
    "/properties/inspections/checklist-templates",
    {
      params,
    }
  );
  return response.data;
};

// Validate inspection conflicts
export const validateInspectionConflicts = async (
  inspectorId: string,
  date: string,
  startTime: string,
  duration: number,
  excludeInspectionId?: string
): Promise<{
  hasConflict: boolean;
  conflicts?: PropertyInspection[];
  status: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/inspections/validate-conflicts",
    {
      inspectorId,
      date,
      startTime,
      duration,
      excludeInspectionId,
    }
  );
  return response.data;
};
