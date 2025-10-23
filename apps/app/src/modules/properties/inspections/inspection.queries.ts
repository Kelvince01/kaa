import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as inspectionService from "./inspection.service";
import type {
  CompleteInspectionInput,
  InspectionQueryParams,
  InspectionTemplate,
  RecurringInspection,
  RescheduleInspectionInput,
  UpdateInspectionInput,
} from "./inspection.type";

/**
 * Property Inspection query keys for consistent cache management
 */
export const inspectionKeys = {
  all: ["inspections"] as const,
  lists: () => [...inspectionKeys.all, "list"] as const,
  list: (params: InspectionQueryParams) =>
    [...inspectionKeys.lists(), params] as const,
  details: () => [...inspectionKeys.all, "detail"] as const,
  detail: (id: string) => [...inspectionKeys.details(), id] as const,
  stats: () => [...inspectionKeys.all, "stats"] as const,
  statsByProperty: (propertyId: string) =>
    [...inspectionKeys.stats(), propertyId] as const,
  upcoming: (days: number) =>
    [...inspectionKeys.all, "upcoming", days] as const,
  overdue: () => [...inspectionKeys.all, "overdue"] as const,
  calendar: (startDate: string, endDate: string) =>
    [...inspectionKeys.all, "calendar", startDate, endDate] as const,
  byProperty: (propertyId: string) =>
    [...inspectionKeys.all, "by-property", propertyId] as const,
  history: (propertyId: string) =>
    [...inspectionKeys.all, "history", propertyId] as const,
  templates: () => [...inspectionKeys.all, "templates"] as const,
  recurring: () => [...inspectionKeys.all, "recurring"] as const,
  recurringByProperty: (propertyId: string) =>
    [...inspectionKeys.recurring(), propertyId] as const,
  inspectorAvailability: (
    inspectorId: string,
    startDate: string,
    endDate: string
  ) =>
    [
      ...inspectionKeys.all,
      "inspector-availability",
      inspectorId,
      startDate,
      endDate,
    ] as const,
  availableInspectors: (date: string, startTime: string, duration: number) =>
    [
      ...inspectionKeys.all,
      "available-inspectors",
      date,
      startTime,
      duration,
    ] as const,
  checklistTemplates: (type?: string) =>
    [...inspectionKeys.all, "checklist-templates", type] as const,
};

/**
 * Query Hooks - for fetching data
 */

// Get all inspections with filtering
export const useInspections = (params: InspectionQueryParams = {}) => {
  return useQuery({
    queryKey: inspectionKeys.list(params),
    queryFn: () => inspectionService.getInspections(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get inspection by ID
export const useInspection = (id: string) =>
  useQuery({
    queryKey: inspectionKeys.detail(id),
    queryFn: () => inspectionService.getInspection(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Get inspection statistics
export const useInspectionStats = (propertyId?: string) => {
  return useQuery({
    queryKey: propertyId
      ? inspectionKeys.statsByProperty(propertyId)
      : inspectionKeys.stats(),
    queryFn: () => inspectionService.getInspectionStats(propertyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get upcoming inspections
export const useUpcomingInspections = (days = 7) =>
  useQuery({
    queryKey: inspectionKeys.upcoming(days),
    queryFn: () => inspectionService.getUpcomingInspections(days),
    staleTime: 5 * 60 * 1000,
  });

// Get overdue inspections
export const useOverdueInspections = () =>
  useQuery({
    queryKey: inspectionKeys.overdue(),
    queryFn: inspectionService.getOverdueInspections,
    staleTime: 5 * 60 * 1000,
  });

// Get inspection calendar events
export const useInspectionCalendarEvents = (
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: inspectionKeys.calendar(startDate, endDate),
    queryFn: () =>
      inspectionService.getInspectionCalendarEvents(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000,
  });

// Get inspections by property
export const useInspectionsByProperty = (propertyId: string) =>
  useQuery({
    queryKey: inspectionKeys.byProperty(propertyId),
    queryFn: () => inspectionService.getInspectionsByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get property inspection history
export const usePropertyInspectionHistory = (propertyId: string, limit = 10) =>
  useQuery({
    queryKey: inspectionKeys.history(propertyId),
    queryFn: () =>
      inspectionService.getPropertyInspectionHistory(propertyId, limit),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get inspection templates
export const useInspectionTemplates = () => {
  return useQuery({
    queryKey: inspectionKeys.templates(),
    queryFn: inspectionService.getInspectionTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get recurring inspections
export const useRecurringInspections = (propertyId?: string) =>
  useQuery({
    queryKey: propertyId
      ? inspectionKeys.recurringByProperty(propertyId)
      : inspectionKeys.recurring(),
    queryFn: () => inspectionService.getRecurringInspections(propertyId),
    staleTime: 5 * 60 * 1000,
  });

// Get inspector availability
export const useInspectorAvailability = (
  inspectorId: string,
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: inspectionKeys.inspectorAvailability(
      inspectorId,
      startDate,
      endDate
    ),
    queryFn: () =>
      inspectionService.getInspectorAvailability(
        inspectorId,
        startDate,
        endDate
      ),
    enabled: !!inspectorId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000,
  });

// Get available inspectors
export const useAvailableInspectors = (
  date: string,
  startTime: string,
  duration: number
) => {
  return useQuery({
    queryKey: inspectionKeys.availableInspectors(date, startTime, duration),
    queryFn: () =>
      inspectionService.getAvailableInspectors(date, startTime, duration),
    enabled: !!date && !!startTime && !!duration,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Get checklist templates
export const useChecklistTemplates = (type?: string) =>
  useQuery({
    queryKey: inspectionKeys.checklistTemplates(type),
    queryFn: () => inspectionService.getChecklistTemplates(type),
    staleTime: 10 * 60 * 1000,
  });

/**
 * Mutation Hooks - for modifying data
 */

// Create inspection
export const useCreateInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inspectionService.createInspection,
    onSuccess: (data) => {
      // Invalidate and refetch inspection lists
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.upcoming(7) });

      // Add the new inspection to the cache
      const inspection = data.inspection || data.data;
      if (inspection) {
        queryClient.setQueryData(inspectionKeys.detail(inspection._id), data);

        // Invalidate property-specific queries
        if (inspection.property) {
          queryClient.invalidateQueries({
            queryKey: inspectionKeys.byProperty(inspection.property),
          });
          queryClient.invalidateQueries({
            queryKey: inspectionKeys.statsByProperty(inspection.property),
          });
        }
      }
    },
  });
};

// Update inspection
export const useUpdateInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInspectionInput }) =>
      inspectionService.updateInspection(id, data),
    onSuccess: (data, variables) => {
      // Update the specific inspection in cache
      queryClient.setQueryData(inspectionKeys.detail(variables.id), data);

      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.upcoming(7) });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.overdue() });

      // Invalidate calendar events
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.all,
        predicate: (query) => query.queryKey.includes("calendar"),
      });

      // Invalidate property-specific queries
      const inspection = data.inspection || data.data;
      if (inspection?.property) {
        queryClient.invalidateQueries({
          queryKey: inspectionKeys.byProperty(inspection.property),
        });
      }
    },
  });
};

// Delete inspection
export const useDeleteInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inspectionService.deleteInspection,
    onSuccess: (_, inspectionId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: inspectionKeys.detail(inspectionId),
      });

      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.upcoming(7) });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.overdue() });
    },
  });
};

// Complete inspection
export const useCompleteInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteInspectionInput }) =>
      inspectionService.completeInspection(id, data),
    onSuccess: (data, variables) => {
      // Update inspection in cache
      queryClient.setQueryData(inspectionKeys.detail(variables.id), data);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.upcoming(7) });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.overdue() });
    },
  });
};

// Reschedule inspection
export const useRescheduleInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: RescheduleInspectionInput;
    }) => inspectionService.rescheduleInspection(id, data),
    onSuccess: (data, variables) => {
      // Update inspection in cache
      queryClient.setQueryData(inspectionKeys.detail(variables.id), data);

      // Invalidate calendar and scheduling related queries
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.upcoming(7) });
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.all,
        predicate: (query) =>
          query.queryKey.includes("calendar") ||
          query.queryKey.includes("availability"),
      });
    },
  });
};

// Cancel inspection
export const useCancelInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      inspectionService.cancelInspection(id, reason),
    onSuccess: (data, variables) => {
      // Update inspection in cache
      queryClient.setQueryData(inspectionKeys.detail(variables.id), data);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.upcoming(7) });
    },
  });
};

// Upload inspection attachment
export const useUploadInspectionAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inspectionId,
      file,
      description,
    }: {
      inspectionId: string;
      file: File;
      description?: string;
    }) =>
      inspectionService.uploadInspectionAttachment(
        inspectionId,
        file,
        description
      ),
    onSuccess: (_, variables) => {
      // Invalidate inspection to show new attachment
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.detail(variables.inspectionId),
      });
    },
  });
};

// Delete inspection attachment
export const useDeleteInspectionAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inspectionId,
      attachmentId,
    }: {
      inspectionId: string;
      attachmentId: string;
    }) =>
      inspectionService.deleteInspectionAttachment(inspectionId, attachmentId),
    onSuccess: (_, variables) => {
      // Invalidate inspection to remove deleted attachment
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.detail(variables.inspectionId),
      });
    },
  });
};

// Generate inspection report
export const useGenerateInspectionReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inspectionId,
      reportType,
    }: {
      inspectionId: string;
      reportType?: "summary" | "detailed" | "checklist";
    }) => inspectionService.generateInspectionReport(inspectionId, reportType),
    onSuccess: (_, variables) => {
      // Invalidate inspection to show report
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.detail(variables.inspectionId),
      });
    },
  });
};

// Send inspection notification
export const useSendInspectionNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inspectionId,
      recipients,
    }: {
      inspectionId: string;
      recipients?: string[];
    }) =>
      inspectionService.sendInspectionNotification(inspectionId, recipients),
    onSuccess: (_, variables) => {
      // Update notification status
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.detail(variables.inspectionId),
      });
    },
  });
};

// Confirm tenant attendance
export const useConfirmTenantAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inspectionId,
      confirmed,
    }: {
      inspectionId: string;
      confirmed: boolean;
    }) => inspectionService.confirmTenantAttendance(inspectionId, confirmed),
    onSuccess: (data, variables) => {
      // Update inspection in cache
      queryClient.setQueryData(
        inspectionKeys.detail(variables.inspectionId),
        data
      );
    },
  });
};

// Bulk update inspections
export const useBulkUpdateInspections = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inspectionService.bulkUpdateInspections,
    onSuccess: () => {
      // Invalidate all inspection lists and related data
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.upcoming(7) });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.overdue() });
    },
  });
};

// Duplicate inspection
export const useDuplicateInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newDate }: { id: string; newDate?: string }) =>
      inspectionService.duplicateInspection(id, newDate),
    onSuccess: (data) => {
      // Add duplicated inspection to cache
      const inspection = data.inspection || data.data;
      if (inspection) {
        queryClient.setQueryData(inspectionKeys.detail(inspection._id), data);
      }

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.stats() });
    },
  });
};

// Template management mutations

// Create inspection template
export const useCreateInspectionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inspectionService.createInspectionTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.templates() });
    },
  });
};

// Update inspection template
export const useUpdateInspectionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InspectionTemplate>;
    }) => inspectionService.updateInspectionTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.templates() });
    },
  });
};

// Delete inspection template
export const useDeleteInspectionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inspectionService.deleteInspectionTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.templates() });
    },
  });
};

// Recurring inspection mutations

// Create recurring inspection
export const useCreateRecurringInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inspectionService.createRecurringInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.recurring() });
    },
  });
};

// Update recurring inspection
export const useUpdateRecurringInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<RecurringInspection>;
    }) => inspectionService.updateRecurringInspection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.recurring() });
    },
  });
};

// Delete recurring inspection
export const useDeleteRecurringInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inspectionService.deleteRecurringInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.recurring() });
    },
  });
};

// Generate next inspection
export const useGenerateNextInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inspectionService.generateNextInspection,
    onSuccess: (data) => {
      // Add generated inspection to cache
      const inspection = data.inspection || data.data;
      if (inspection) {
        queryClient.setQueryData(inspectionKeys.detail(inspection._id), data);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.recurring() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.upcoming(7) });
    },
  });
};

// Send inspection reminder
export const useSendInspectionReminder = () =>
  useMutation({
    mutationFn: ({
      inspectionId,
      reminderType,
      customMessage,
    }: {
      inspectionId: string;
      reminderType: "24_hours" | "1_hour" | "custom";
      customMessage?: string;
    }) =>
      inspectionService.sendInspectionReminder(
        inspectionId,
        reminderType,
        customMessage
      ),
  });

// Update inspection checklist
export const useUpdateInspectionChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inspectionId,
      checklist,
    }: {
      inspectionId: string;
      checklist: any[];
    }) => inspectionService.updateInspectionChecklist(inspectionId, checklist),
    onSuccess: (data, variables) => {
      // Update inspection in cache
      queryClient.setQueryData(
        inspectionKeys.detail(variables.inspectionId),
        data
      );
    },
  });
};

// Validate inspection conflicts
export const useValidateInspectionConflicts = () =>
  useMutation({
    mutationFn: ({
      inspectorId,
      date,
      startTime,
      duration,
      excludeInspectionId,
    }: {
      inspectorId: string;
      date: string;
      startTime: string;
      duration: number;
      excludeInspectionId?: string;
    }) =>
      inspectionService.validateInspectionConflicts(
        inspectorId,
        date,
        startTime,
        duration,
        excludeInspectionId
      ),
  });

// Export inspections
export const useExportInspections = () =>
  useMutation({
    mutationFn: ({
      filters,
      format,
    }: {
      filters?: InspectionQueryParams;
      format?: "csv" | "xlsx" | "pdf";
    }) => inspectionService.exportInspections(filters, format),
  });

/**
 * Utility functions for cache management
 */

// Prefetch inspection
export const usePrefetchInspection = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: inspectionKeys.detail(id),
      queryFn: () => inspectionService.getInspection(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Invalidate all inspection queries
export const useInvalidateInspections = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: inspectionKeys.all });
  };
};
