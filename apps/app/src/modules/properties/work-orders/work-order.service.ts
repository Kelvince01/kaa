import { httpClient } from "@/lib/axios";
import type {
  AddMaterialInput,
  AddTimeEntryInput,
  AddUpdateInput,
  AssignWorkOrderInput,
  BulkWorkOrderOperation,
  CompleteWorkOrderInput,
  ContractorAvailability,
  CreateWorkOrderInput,
  QualityCheck,
  RecurringWorkOrder,
  RecurringWorkOrdersResponse,
  UpdateWorkOrderInput,
  WorkOrder,
  WorkOrderAttachment,
  WorkOrderCalendarEvent,
  WorkOrderCostBreakdown,
  WorkOrderCostBreakdownResponse,
  WorkOrderExportOptions,
  WorkOrderListResponse,
  WorkOrderMaterial,
  WorkOrderQueryParams,
  WorkOrderReport,
  WorkOrderResponse,
  WorkOrderStatsResponse,
  WorkOrderTemplate,
  WorkOrderTemplatesResponse,
  WorkOrderTimeEntry,
  WorkOrderUpdate,
} from "./work-order.type";

/**
 * Work Order service for managing property maintenance and repair operations
 */

// Create a new work order
export const createWorkOrder = async (
  data: CreateWorkOrderInput
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.post("/properties/work-orders", data);
  return response.data;
};

// Get all work orders with optional filtering
export const getWorkOrders = async (
  params: WorkOrderQueryParams = {}
): Promise<WorkOrderListResponse> => {
  const response = await httpClient.api.get("/properties/work-orders", {
    params,
  });
  return response.data;
};

// Get work order by ID
export const getWorkOrder = async (id: string): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.get(`/properties/work-orders/${id}`);
  return response.data;
};

// Update work order
export const updateWorkOrder = async (
  id: string,
  data: UpdateWorkOrderInput
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.patch(
    `/properties/work-orders/${id}`,
    data
  );
  return response.data;
};

// Delete work order
export const deleteWorkOrder = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(`/properties/work-orders/${id}`);
  return response.data;
};

// Assign work order to contractor
export const assignWorkOrder = async (
  id: string,
  data: AssignWorkOrderInput
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${id}/assign`,
    data
  );
  return response.data;
};

// Complete work order
export const completeWorkOrder = async (
  id: string,
  data: CompleteWorkOrderInput
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${id}/complete`,
    data
  );
  return response.data;
};

// Cancel work order
export const cancelWorkOrder = async (
  id: string,
  reason?: string
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${id}/cancel`,
    {
      reason,
    }
  );
  return response.data;
};

// Get work order statistics
export const getWorkOrderStats = async (
  propertyId?: string
): Promise<WorkOrderStatsResponse> => {
  const params = propertyId ? { propertyId } : {};
  const response = await httpClient.api.get("/properties/work-orders/stats", {
    params,
  });
  return response.data;
};

// Get work orders by property
export const getWorkOrdersByProperty = async (
  propertyId: string
): Promise<WorkOrderListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/work-orders`
  );
  return response.data;
};

// Get work orders by contractor
export const getWorkOrdersByContractor = async (
  contractorId: string
): Promise<WorkOrderListResponse> => {
  const response = await httpClient.api.get(
    `/contractors/${contractorId}/work-orders`
  );
  return response.data;
};

// Get upcoming work orders
export const getUpcomingWorkOrders = async (
  days = 7
): Promise<WorkOrderListResponse> => {
  const response = await httpClient.api.get(
    "/properties/work-orders/upcoming",
    {
      params: { days },
    }
  );
  return response.data;
};

// Get overdue work orders
export const getOverdueWorkOrders =
  async (): Promise<WorkOrderListResponse> => {
    const response = await httpClient.api.get(
      "/properties/work-orders/overdue"
    );
    return response.data;
  };

// Get work order calendar events
export const getWorkOrderCalendarEvents = async (
  startDate: string,
  endDate: string
): Promise<{ events: WorkOrderCalendarEvent[]; status: string }> => {
  const response = await httpClient.api.get(
    "/properties/work-orders/calendar",
    {
      params: { startDate, endDate },
    }
  );
  return response.data;
};

// Time Entry Management

// Add time entry to work order
export const addTimeEntry = async (
  workOrderId: string,
  data: AddTimeEntryInput
): Promise<{
  timeEntry: WorkOrderTimeEntry;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/time-entries`,
    data
  );
  return response.data;
};

// Update time entry
export const updateTimeEntry = async (
  workOrderId: string,
  timeEntryId: string,
  data: Partial<AddTimeEntryInput>
): Promise<{
  timeEntry: WorkOrderTimeEntry;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    `/properties/work-orders/${workOrderId}/time-entries/${timeEntryId}`,
    data
  );
  return response.data;
};

// Delete time entry
export const deleteTimeEntry = async (
  workOrderId: string,
  timeEntryId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/work-orders/${workOrderId}/time-entries/${timeEntryId}`
  );
  return response.data;
};

// Material Management

// Add material to work order
export const addMaterial = async (
  workOrderId: string,
  data: AddMaterialInput
): Promise<{
  material: WorkOrderMaterial;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/materials`,
    data
  );
  return response.data;
};

// Update material
export const updateMaterial = async (
  workOrderId: string,
  materialId: string,
  data: Partial<AddMaterialInput>
): Promise<{
  material: WorkOrderMaterial;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    `/properties/work-orders/${workOrderId}/materials/${materialId}`,
    data
  );
  return response.data;
};

// Delete material
export const deleteMaterial = async (
  workOrderId: string,
  materialId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/work-orders/${workOrderId}/materials/${materialId}`
  );
  return response.data;
};

// Updates Management

// Add update to work order
export const addWorkOrderUpdate = async (
  workOrderId: string,
  data: AddUpdateInput
): Promise<{ update: WorkOrderUpdate; status: string; message: string }> => {
  const formData = new FormData();
  formData.append("message", data.message);
  if (data.status) {
    formData.append("status", data.status);
  }
  if (data.attachments) {
    for (const file of data.attachments) {
      formData.append("attachments", file);
    }
  }

  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/updates`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Attachment Management

// Upload work order attachment
export const uploadWorkOrderAttachment = async (
  workOrderId: string,
  file: File,
  description?: string
): Promise<{
  attachment: WorkOrderAttachment;
  status: string;
  message: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);
  if (description) {
    formData.append("description", description);
  }

  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Delete work order attachment
export const deleteWorkOrderAttachment = async (
  workOrderId: string,
  attachmentId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/work-orders/${workOrderId}/attachments/${attachmentId}`
  );
  return response.data;
};

// Reporting

// Generate work order report
export const generateWorkOrderReport = async (
  workOrderId: string,
  reportType:
    | "completion"
    | "cost_breakdown"
    | "time_tracking"
    | "quality_check" = "completion"
): Promise<{ report: WorkOrderReport; status: string }> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/report`,
    {
      reportType,
    }
  );
  return response.data;
};

// Download work order report
export const downloadWorkOrderReport = async (
  workOrderId: string,
  format: "pdf" | "docx" = "pdf"
): Promise<Blob> => {
  const response = await httpClient.api.get(
    `/properties/work-orders/${workOrderId}/report/download`,
    {
      params: { format },
      responseType: "blob",
    }
  );
  return response.data;
};

// Notifications

// Send work order notification
export const sendWorkOrderNotification = async (
  workOrderId: string,
  recipients?: string[]
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/notify`,
    {
      recipients,
    }
  );
  return response.data;
};

// Contractor Availability

// Get contractor availability
export const getContractorAvailability = async (
  contractorId: string,
  startDate: string,
  endDate: string
): Promise<{ availability: ContractorAvailability; status: string }> => {
  const response = await httpClient.api.get(
    `/contractors/${contractorId}/availability`,
    {
      params: { startDate, endDate },
    }
  );
  return response.data;
};

// Get available contractors for a time slot
export const getAvailableContractors = async (
  date: string,
  startTime: string,
  duration: number,
  specialties?: string[]
): Promise<{ contractors: ContractorAvailability[]; status: string }> => {
  const response = await httpClient.api.get("/contractors/available", {
    params: { date, startTime, duration, specialties: specialties?.join(",") },
  });
  return response.data;
};

// Bulk Operations

// Bulk update work orders
export const bulkUpdateWorkOrders = async (
  operation: BulkWorkOrderOperation
): Promise<{ updated: number; status: string; message: string }> => {
  const response = await httpClient.api.post(
    "/properties/work-orders/bulk",
    operation
  );
  return response.data;
};

// Export work orders
export const exportWorkOrders = async (
  options: WorkOrderExportOptions
): Promise<Blob> => {
  const response = await httpClient.api.post(
    "/properties/work-orders/export",
    options,
    {
      responseType: "blob",
    }
  );
  return response.data;
};

// Templates

// Get work order templates
export const getWorkOrderTemplates =
  async (): Promise<WorkOrderTemplatesResponse> => {
    const response = await httpClient.api.get(
      "/properties/work-orders/templates"
    );
    return response.data;
  };

// Create work order template
export const createWorkOrderTemplate = async (
  data: Omit<WorkOrderTemplate, "_id" | "createdAt" | "updatedAt" | "createdBy">
): Promise<{
  template: WorkOrderTemplate;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/work-orders/templates",
    data
  );
  return response.data;
};

// Update work order template
export const updateWorkOrderTemplate = async (
  id: string,
  data: Partial<WorkOrderTemplate>
): Promise<{
  template: WorkOrderTemplate;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    `/properties/work-orders/templates/${id}`,
    data
  );
  return response.data;
};

// Delete work order template
export const deleteWorkOrderTemplate = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/work-orders/templates/${id}`
  );
  return response.data;
};

// Recurring Work Orders

// Get recurring work orders
export const getRecurringWorkOrders = async (
  propertyId?: string
): Promise<RecurringWorkOrdersResponse> => {
  const params = propertyId ? { propertyId } : {};
  const response = await httpClient.api.get(
    "/properties/work-orders/recurring",
    {
      params,
    }
  );
  return response.data;
};

// Create recurring work order
export const createRecurringWorkOrder = async (
  data: Omit<
    RecurringWorkOrder,
    "_id" | "createdAt" | "updatedAt" | "createdBy"
  >
): Promise<{
  recurringWorkOrder: RecurringWorkOrder;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/work-orders/recurring",
    data
  );
  return response.data;
};

// Update recurring work order
export const updateRecurringWorkOrder = async (
  id: string,
  data: Partial<RecurringWorkOrder>
): Promise<{
  recurringWorkOrder: RecurringWorkOrder;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    `/properties/work-orders/recurring/${id}`,
    data
  );
  return response.data;
};

// Delete recurring work order
export const deleteRecurringWorkOrder = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/work-orders/recurring/${id}`
  );
  return response.data;
};

// Generate next work order from recurring pattern
export const generateNextWorkOrder = async (
  recurringId: string
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/recurring/${recurringId}/generate`
  );
  return response.data;
};

// Utility Functions

// Duplicate work order
export const duplicateWorkOrder = async (
  id: string,
  newScheduledDate?: string
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${id}/duplicate`,
    {
      newScheduledDate,
    }
  );
  return response.data;
};

// Get work order history for property
export const getWorkOrderHistory = async (
  propertyId: string,
  limit = 10
): Promise<WorkOrderListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/work-orders/history`,
    {
      params: { limit },
    }
  );
  return response.data;
};

// Send work order reminder
export const sendWorkOrderReminder = async (
  workOrderId: string,
  reminderType: "24_hours" | "1_hour" | "overdue" | "custom",
  customMessage?: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/reminder`,
    {
      reminderType,
      customMessage,
    }
  );
  return response.data;
};

// Update quality check
export const updateQualityCheck = async (
  workOrderId: string,
  qualityCheck: Partial<QualityCheck>
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.patch(
    `/properties/work-orders/${workOrderId}/quality-check`,
    {
      qualityCheck,
    }
  );
  return response.data;
};

// Cost Management

// Calculate work order costs
export const calculateWorkOrderCosts = async (
  workOrderId: string
): Promise<{
  totalCost: number;
  breakdown: WorkOrderCostBreakdown;
  status: string;
}> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/calculate-costs`
  );
  return response.data;
};

// Get work order cost breakdown
export const getWorkOrderCostBreakdown = async (
  workOrderId: string
): Promise<WorkOrderCostBreakdownResponse> => {
  const response = await httpClient.api.get(
    `/properties/work-orders/${workOrderId}/cost-breakdown`
  );
  return response.data;
};

// Validation

// Validate work order conflicts
export const validateWorkOrderConflicts = async (
  contractorId: string,
  date: string,
  startTime: string,
  duration: number,
  excludeWorkOrderId?: string
): Promise<{
  hasConflict: boolean;
  conflicts?: WorkOrder[];
  status: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/work-orders/validate-conflicts",
    {
      contractorId,
      date,
      startTime,
      duration,
      excludeWorkOrderId,
    }
  );
  return response.data;
};

// Get work order templates by type
export const getWorkOrderTemplatesByType = async (
  type: string
): Promise<{ templates: WorkOrderTemplate[]; status: string }> => {
  const response = await httpClient.api.get(
    "/properties/work-orders/templates",
    {
      params: { type },
    }
  );
  return response.data;
};

// Get work order performance metrics
export const getWorkOrderPerformanceMetrics = async (
  contractorId?: string,
  propertyId?: string,
  startDate?: string,
  endDate?: string
): Promise<{
  metrics: {
    completionRate: number;
    averageTime: number;
    qualityScore: number;
    costEfficiency: number;
  };
  status: string;
}> => {
  const params = {
    ...(contractorId && { contractorId }),
    ...(propertyId && { propertyId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };
  const response = await httpClient.api.get(
    "/properties/work-orders/performance",
    {
      params,
    }
  );
  return response.data;
};

// Schedule work order
export const scheduleWorkOrder = async (
  workOrderId: string,
  scheduledDate: string,
  estimatedDuration?: number
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/schedule`,
    {
      scheduledDate,
      estimatedDuration,
    }
  );
  return response.data;
};

// Reschedule work order
export const rescheduleWorkOrder = async (
  workOrderId: string,
  newScheduledDate: string,
  reason?: string
): Promise<WorkOrderResponse> => {
  const response = await httpClient.api.post(
    `/properties/work-orders/${workOrderId}/reschedule`,
    {
      newScheduledDate,
      reason,
    }
  );
  return response.data;
};
