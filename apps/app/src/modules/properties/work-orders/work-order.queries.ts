import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as workOrderService from "./work-order.service";
import type {
  AddMaterialInput,
  AddTimeEntryInput,
  AddUpdateInput,
  AssignWorkOrderInput,
  CompleteWorkOrderInput,
  QualityCheck,
  RecurringWorkOrder,
  UpdateWorkOrderInput,
  WorkOrderQueryParams,
  WorkOrderTemplate,
} from "./work-order.type";

/**
 * Work Order query keys for consistent cache management
 */
export const workOrderKeys = {
  all: ["work-orders"] as const,
  lists: () => [...workOrderKeys.all, "list"] as const,
  list: (params: WorkOrderQueryParams) =>
    [...workOrderKeys.lists(), params] as const,
  details: () => [...workOrderKeys.all, "detail"] as const,
  detail: (id: string) => [...workOrderKeys.details(), id] as const,
  stats: () => [...workOrderKeys.all, "stats"] as const,
  statsByProperty: (propertyId: string) =>
    [...workOrderKeys.stats(), propertyId] as const,
  upcoming: (days: number) => [...workOrderKeys.all, "upcoming", days] as const,
  overdue: () => [...workOrderKeys.all, "overdue"] as const,
  calendar: (startDate: string, endDate: string) =>
    [...workOrderKeys.all, "calendar", startDate, endDate] as const,
  byProperty: (propertyId: string) =>
    [...workOrderKeys.all, "by-property", propertyId] as const,
  byContractor: (contractorId: string) =>
    [...workOrderKeys.all, "by-contractor", contractorId] as const,
  history: (propertyId: string) =>
    [...workOrderKeys.all, "history", propertyId] as const,
  templates: () => [...workOrderKeys.all, "templates"] as const,
  templatesByType: (type: string) =>
    [...workOrderKeys.templates(), type] as const,
  recurring: () => [...workOrderKeys.all, "recurring"] as const,
  recurringByProperty: (propertyId: string) =>
    [...workOrderKeys.recurring(), propertyId] as const,
  contractorAvailability: (
    contractorId: string,
    startDate: string,
    endDate: string
  ) =>
    [
      ...workOrderKeys.all,
      "contractor-availability",
      contractorId,
      startDate,
      endDate,
    ] as const,
  availableContractors: (date: string, startTime: string, duration: number) =>
    [
      ...workOrderKeys.all,
      "available-contractors",
      date,
      startTime,
      duration,
    ] as const,
  costBreakdown: (workOrderId: string) =>
    [...workOrderKeys.all, "cost-breakdown", workOrderId] as const,
  performanceMetrics: (params: Record<string, any>) =>
    [...workOrderKeys.all, "performance-metrics", params] as const,
};

/**
 * Query Hooks - for fetching data
 */

// Get all work orders with filtering
export const useWorkOrders = (params: WorkOrderQueryParams = {}) => {
  return useQuery({
    queryKey: workOrderKeys.list(params),
    queryFn: () => workOrderService.getWorkOrders(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get work order by ID
export const useWorkOrder = (id: string) =>
  useQuery({
    queryKey: workOrderKeys.detail(id),
    queryFn: () => workOrderService.getWorkOrder(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Get work order statistics
export const useWorkOrderStats = (propertyId?: string) => {
  return useQuery({
    queryKey: propertyId
      ? workOrderKeys.statsByProperty(propertyId)
      : workOrderKeys.stats(),
    queryFn: () => workOrderService.getWorkOrderStats(propertyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get work orders by property
export const useWorkOrdersByProperty = (propertyId: string) =>
  useQuery({
    queryKey: workOrderKeys.byProperty(propertyId),
    queryFn: () => workOrderService.getWorkOrdersByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get work orders by contractor
export const useWorkOrdersByContractor = (contractorId: string) =>
  useQuery({
    queryKey: workOrderKeys.byContractor(contractorId),
    queryFn: () => workOrderService.getWorkOrdersByContractor(contractorId),
    enabled: !!contractorId,
    staleTime: 5 * 60 * 1000,
  });

// Get upcoming work orders
export const useUpcomingWorkOrders = (days = 7) =>
  useQuery({
    queryKey: workOrderKeys.upcoming(days),
    queryFn: () => workOrderService.getUpcomingWorkOrders(days),
    staleTime: 5 * 60 * 1000,
  });

// Get overdue work orders
export const useOverdueWorkOrders = () =>
  useQuery({
    queryKey: workOrderKeys.overdue(),
    queryFn: workOrderService.getOverdueWorkOrders,
    staleTime: 5 * 60 * 1000,
  });

// Get work order calendar events
export const useWorkOrderCalendarEvents = (
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: workOrderKeys.calendar(startDate, endDate),
    queryFn: () =>
      workOrderService.getWorkOrderCalendarEvents(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000,
  });

// Get work order history for property
export const useWorkOrderHistory = (propertyId: string, limit = 10) =>
  useQuery({
    queryKey: workOrderKeys.history(propertyId),
    queryFn: () => workOrderService.getWorkOrderHistory(propertyId, limit),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get work order templates
export const useWorkOrderTemplates = () => {
  return useQuery({
    queryKey: workOrderKeys.templates(),
    queryFn: workOrderService.getWorkOrderTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get work order templates by type
export const useWorkOrderTemplatesByType = (type: string) =>
  useQuery({
    queryKey: workOrderKeys.templatesByType(type),
    queryFn: () => workOrderService.getWorkOrderTemplatesByType(type),
    enabled: !!type,
    staleTime: 10 * 60 * 1000,
  });

// Get recurring work orders
export const useRecurringWorkOrders = (propertyId?: string) =>
  useQuery({
    queryKey: propertyId
      ? workOrderKeys.recurringByProperty(propertyId)
      : workOrderKeys.recurring(),
    queryFn: () => workOrderService.getRecurringWorkOrders(propertyId),
    staleTime: 5 * 60 * 1000,
  });

// Get contractor availability
export const useContractorAvailability = (
  contractorId: string,
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: workOrderKeys.contractorAvailability(
      contractorId,
      startDate,
      endDate
    ),
    queryFn: () =>
      workOrderService.getContractorAvailability(
        contractorId,
        startDate,
        endDate
      ),
    enabled: !!contractorId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000,
  });

// Get available contractors
export const useAvailableContractors = (
  date: string,
  startTime: string,
  duration: number,
  specialties?: string[]
) => {
  return useQuery({
    queryKey: workOrderKeys.availableContractors(date, startTime, duration),
    queryFn: () =>
      workOrderService.getAvailableContractors(
        date,
        startTime,
        duration,
        specialties
      ),
    enabled: !!date && !!startTime && !!duration,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Get work order cost breakdown
export const useWorkOrderCostBreakdown = (workOrderId: string) =>
  useQuery({
    queryKey: workOrderKeys.costBreakdown(workOrderId),
    queryFn: () => workOrderService.getWorkOrderCostBreakdown(workOrderId),
    enabled: !!workOrderId,
    staleTime: 5 * 60 * 1000,
  });

// Get work order performance metrics
export const useWorkOrderPerformanceMetrics = (
  params: {
    contractorId?: string;
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  } = {}
) =>
  useQuery({
    queryKey: workOrderKeys.performanceMetrics(params),
    queryFn: () =>
      workOrderService.getWorkOrderPerformanceMetrics(
        params.contractorId,
        params.propertyId,
        params.startDate,
        params.endDate
      ),
    staleTime: 10 * 60 * 1000,
  });

/**
 * Mutation Hooks - for modifying data
 */

// Create work order
export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrderService.createWorkOrder,
    onSuccess: (data) => {
      // Invalidate and refetch work order lists
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.upcoming(7) });

      // Add the new work order to the cache
      const workOrder = data.workOrder || data.data;
      if (workOrder) {
        queryClient.setQueryData(workOrderKeys.detail(workOrder._id), data);

        // Invalidate property-specific queries
        if (workOrder.property) {
          queryClient.invalidateQueries({
            queryKey: workOrderKeys.byProperty(workOrder.property),
          });
          queryClient.invalidateQueries({
            queryKey: workOrderKeys.statsByProperty(workOrder.property),
          });
        }
      }
    },
  });
};

// Update work order
export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkOrderInput }) =>
      workOrderService.updateWorkOrder(id, data),
    onSuccess: (data, variables) => {
      // Update the specific work order in cache
      queryClient.setQueryData(workOrderKeys.detail(variables.id), data);

      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.upcoming(7) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.overdue() });

      // Invalidate calendar events
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.all,
        predicate: (query) => query.queryKey.includes("calendar"),
      });

      // Invalidate property-specific queries
      const workOrder = data.workOrder || data.data;
      if (workOrder?.property) {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.byProperty(workOrder.property),
        });
      }
    },
  });
};

// Delete work order
export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrderService.deleteWorkOrder,
    onSuccess: (_, workOrderId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: workOrderKeys.detail(workOrderId),
      });

      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.upcoming(7) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.overdue() });
    },
  });
};

// Assign work order
export const useAssignWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignWorkOrderInput }) =>
      workOrderService.assignWorkOrder(id, data),
    onSuccess: (data, variables) => {
      // Update work order in cache
      queryClient.setQueryData(workOrderKeys.detail(variables.id), data);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });

      // Invalidate contractor-specific queries
      if (variables.data.contractorId) {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.byContractor(variables.data.contractorId),
        });
      }
    },
  });
};

// Complete work order
export const useCompleteWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteWorkOrderInput }) =>
      workOrderService.completeWorkOrder(id, data),
    onSuccess: (data, variables) => {
      // Update work order in cache
      queryClient.setQueryData(workOrderKeys.detail(variables.id), data);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.upcoming(7) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.overdue() });

      // Invalidate cost breakdown
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.costBreakdown(variables.id),
      });
    },
  });
};

// Cancel work order
export const useCancelWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      workOrderService.cancelWorkOrder(id, reason),
    onSuccess: (data, variables) => {
      // Update work order in cache
      queryClient.setQueryData(workOrderKeys.detail(variables.id), data);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.upcoming(7) });
    },
  });
};

// Time Entry mutations

// Add time entry
export const useAddTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      data,
    }: {
      workOrderId: string;
      data: AddTimeEntryInput;
    }) => workOrderService.addTimeEntry(workOrderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.costBreakdown(variables.workOrderId),
      });
    },
  });
};

// Update time entry
export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      timeEntryId,
      data,
    }: {
      workOrderId: string;
      timeEntryId: string;
      data: Partial<AddTimeEntryInput>;
    }) => workOrderService.updateTimeEntry(workOrderId, timeEntryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.costBreakdown(variables.workOrderId),
      });
    },
  });
};

// Delete time entry
export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      timeEntryId,
    }: {
      workOrderId: string;
      timeEntryId: string;
    }) => workOrderService.deleteTimeEntry(workOrderId, timeEntryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.costBreakdown(variables.workOrderId),
      });
    },
  });
};

// Material mutations

// Add material
export const useAddMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      data,
    }: {
      workOrderId: string;
      data: AddMaterialInput;
    }) => workOrderService.addMaterial(workOrderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.costBreakdown(variables.workOrderId),
      });
    },
  });
};

// Update material
export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      materialId,
      data,
    }: {
      workOrderId: string;
      materialId: string;
      data: Partial<AddMaterialInput>;
    }) => workOrderService.updateMaterial(workOrderId, materialId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.costBreakdown(variables.workOrderId),
      });
    },
  });
};

// Delete material
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      materialId,
    }: {
      workOrderId: string;
      materialId: string;
    }) => workOrderService.deleteMaterial(workOrderId, materialId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.costBreakdown(variables.workOrderId),
      });
    },
  });
};

// Add work order update
export const useAddWorkOrderUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      data,
    }: {
      workOrderId: string;
      data: AddUpdateInput;
    }) => workOrderService.addWorkOrderUpdate(workOrderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
    },
  });
};

// Upload work order attachment
export const useUploadWorkOrderAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      file,
      description,
    }: {
      workOrderId: string;
      file: File;
      description?: string;
    }) =>
      workOrderService.uploadWorkOrderAttachment(
        workOrderId,
        file,
        description
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
    },
  });
};

// Delete work order attachment
export const useDeleteWorkOrderAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      attachmentId,
    }: {
      workOrderId: string;
      attachmentId: string;
    }) => workOrderService.deleteWorkOrderAttachment(workOrderId, attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
    },
  });
};

// Generate work order report
export const useGenerateWorkOrderReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      reportType,
    }: {
      workOrderId: string;
      reportType?:
        | "completion"
        | "cost_breakdown"
        | "time_tracking"
        | "quality_check";
    }) => workOrderService.generateWorkOrderReport(workOrderId, reportType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
    },
  });
};

// Send work order notification
export const useSendWorkOrderNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      recipients,
    }: {
      workOrderId: string;
      recipients?: string[];
    }) => workOrderService.sendWorkOrderNotification(workOrderId, recipients),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(variables.workOrderId),
      });
    },
  });
};

// Bulk update work orders
export const useBulkUpdateWorkOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrderService.bulkUpdateWorkOrders,
    onSuccess: () => {
      // Invalidate all work order lists and related data
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.upcoming(7) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.overdue() });
    },
  });
};

// Duplicate work order
export const useDuplicateWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      newScheduledDate,
    }: {
      id: string;
      newScheduledDate?: string;
    }) => workOrderService.duplicateWorkOrder(id, newScheduledDate),
    onSuccess: (data) => {
      // Add duplicated work order to cache
      const workOrder = data.workOrder || data.data;
      if (workOrder) {
        queryClient.setQueryData(workOrderKeys.detail(workOrder._id), data);
      }

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.stats() });
    },
  });
};

// Template management mutations

// Create work order template
export const useCreateWorkOrderTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrderService.createWorkOrderTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.templates() });
    },
  });
};

// Update work order template
export const useUpdateWorkOrderTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<WorkOrderTemplate>;
    }) => workOrderService.updateWorkOrderTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.templates() });
    },
  });
};

// Delete work order template
export const useDeleteWorkOrderTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrderService.deleteWorkOrderTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.templates() });
    },
  });
};

// Recurring work order mutations

// Create recurring work order
export const useCreateRecurringWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrderService.createRecurringWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.recurring() });
    },
  });
};

// Update recurring work order
export const useUpdateRecurringWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<RecurringWorkOrder>;
    }) => workOrderService.updateRecurringWorkOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.recurring() });
    },
  });
};

// Delete recurring work order
export const useDeleteRecurringWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrderService.deleteRecurringWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.recurring() });
    },
  });
};

// Generate next work order
export const useGenerateNextWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrderService.generateNextWorkOrder,
    onSuccess: (data) => {
      // Add generated work order to cache
      const workOrder = data.workOrder || data.data;
      if (workOrder) {
        queryClient.setQueryData(workOrderKeys.detail(workOrder._id), data);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.recurring() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.upcoming(7) });
    },
  });
};

// Send work order reminder
export const useSendWorkOrderReminder = () =>
  useMutation({
    mutationFn: ({
      workOrderId,
      reminderType,
      customMessage,
    }: {
      workOrderId: string;
      reminderType: "24_hours" | "1_hour" | "overdue" | "custom";
      customMessage?: string;
    }) =>
      workOrderService.sendWorkOrderReminder(
        workOrderId,
        reminderType,
        customMessage
      ),
  });

// Update quality check
export const useUpdateQualityCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      qualityCheck,
    }: {
      workOrderId: string;
      qualityCheck: Partial<QualityCheck>;
    }) => workOrderService.updateQualityCheck(workOrderId, qualityCheck),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        workOrderKeys.detail(variables.workOrderId),
        data
      );
    },
  });
};

// Validate work order conflicts
export const useValidateWorkOrderConflicts = () =>
  useMutation({
    mutationFn: ({
      contractorId,
      date,
      startTime,
      duration,
      excludeWorkOrderId,
    }: {
      contractorId: string;
      date: string;
      startTime: string;
      duration: number;
      excludeWorkOrderId?: string;
    }) =>
      workOrderService.validateWorkOrderConflicts(
        contractorId,
        date,
        startTime,
        duration,
        excludeWorkOrderId
      ),
  });

// Export work orders
export const useExportWorkOrders = () =>
  useMutation({
    mutationFn: workOrderService.exportWorkOrders,
  });

// Schedule work order
export const useScheduleWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      scheduledDate,
      estimatedDuration,
    }: {
      workOrderId: string;
      scheduledDate: string;
      estimatedDuration?: number;
    }) =>
      workOrderService.scheduleWorkOrder(
        workOrderId,
        scheduledDate,
        estimatedDuration
      ),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        workOrderKeys.detail(variables.workOrderId),
        data
      );
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.upcoming(7) });
    },
  });
};

// Reschedule work order
export const useRescheduleWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      newScheduledDate,
      reason,
    }: {
      workOrderId: string;
      newScheduledDate: string;
      reason?: string;
    }) =>
      workOrderService.rescheduleWorkOrder(
        workOrderId,
        newScheduledDate,
        reason
      ),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        workOrderKeys.detail(variables.workOrderId),
        data
      );
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.upcoming(7) });
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.all,
        predicate: (query) => query.queryKey.includes("calendar"),
      });
    },
  });
};

/**
 * Utility functions for cache management
 */

// Prefetch work order
export const usePrefetchWorkOrder = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: workOrderKeys.detail(id),
      queryFn: () => workOrderService.getWorkOrder(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Invalidate all work order queries
export const useInvalidateWorkOrders = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
  };
};
