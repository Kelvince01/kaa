import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as scheduleService from "./schedule.service";
import type {
  CreateScheduleInput,
  RecurringSchedulePattern,
  ScheduleParticipant,
  ScheduleQueryParams,
  ScheduleTemplate,
  UpdateScheduleInput,
} from "./schedule.type";

/**
 * Schedule query keys for consistent cache management
 */
export const scheduleKeys = {
  all: ["schedules"] as const,
  lists: () => [...scheduleKeys.all, "list"] as const,
  list: (params: ScheduleQueryParams) =>
    [...scheduleKeys.lists(), params] as const,
  details: () => [...scheduleKeys.all, "detail"] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
  stats: () => [...scheduleKeys.all, "stats"] as const,
  statsByProperty: (propertyId: string) =>
    [...scheduleKeys.stats(), propertyId] as const,
  calendar: (startDate: string, endDate: string) =>
    [...scheduleKeys.all, "calendar", startDate, endDate] as const,
  calendarByProperty: (
    propertyId: string,
    startDate: string,
    endDate: string
  ) =>
    [
      ...scheduleKeys.all,
      "calendar-by-property",
      propertyId,
      startDate,
      endDate,
    ] as const,
  availability: (userId: string, startDate: string, endDate: string) =>
    [...scheduleKeys.all, "availability", userId, startDate, endDate] as const,
  conflicts: (userId: string, startDate: string, endDate: string) =>
    [...scheduleKeys.all, "conflicts", userId, startDate, endDate] as const,
  upcoming: (days: number) => [...scheduleKeys.all, "upcoming", days] as const,
  overdue: () => [...scheduleKeys.all, "overdue"] as const,
  byProperty: (propertyId: string) =>
    [...scheduleKeys.all, "by-property", propertyId] as const,
  byUser: (userId: string) => [...scheduleKeys.all, "by-user", userId] as const,
  participants: (scheduleId: string) =>
    [...scheduleKeys.all, "participants", scheduleId] as const,
  templates: () => [...scheduleKeys.all, "templates"] as const,
  recurring: () => [...scheduleKeys.all, "recurring"] as const,
  recurringByProperty: (propertyId: string) =>
    [...scheduleKeys.recurring(), propertyId] as const,
  attachments: (scheduleId: string) =>
    [...scheduleKeys.all, "attachments", scheduleId] as const,
  reminders: (scheduleId: string) =>
    [...scheduleKeys.all, "reminders", scheduleId] as const,
};

/**
 * Query Hooks - for fetching data
 */

// Get all schedules with filtering
export const useSchedules = (params: ScheduleQueryParams = {}) => {
  return useQuery({
    queryKey: scheduleKeys.list(params),
    queryFn: () => scheduleService.getSchedules(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get schedule by ID
export const useSchedule = (id: string) =>
  useQuery({
    queryKey: scheduleKeys.detail(id),
    queryFn: () => scheduleService.getSchedule(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Get schedule statistics
export const useScheduleStats = (propertyId?: string) => {
  return useQuery({
    queryKey: propertyId
      ? scheduleKeys.statsByProperty(propertyId)
      : scheduleKeys.stats(),
    queryFn: () => scheduleService.getScheduleStats(propertyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get schedule calendar events
export const useScheduleCalendarEvents = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: scheduleKeys.calendar(startDate, endDate),
    queryFn: () =>
      scheduleService.getScheduleCalendarEvents(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000,
  });

// Get schedule calendar events by property
export const useScheduleCalendarEventsByProperty = (
  propertyId: string,
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: scheduleKeys.calendarByProperty(propertyId, startDate, endDate),
    queryFn: () =>
      scheduleService.getScheduleCalendarEventsByProperty(
        propertyId,
        startDate,
        endDate
      ),
    enabled: !!(propertyId && startDate && endDate),
    staleTime: 2 * 60 * 1000,
  });

// Check user availability
export const useUserAvailability = (
  userId: string,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: scheduleKeys.availability(userId, startDate, endDate),
    queryFn: () =>
      scheduleService.checkUserAvailability(userId, startDate, endDate),
    enabled: !!(userId && startDate && endDate),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Check schedule conflicts
export const useScheduleConflicts = (
  userId: string,
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: scheduleKeys.conflicts(userId, startDate, endDate),
    queryFn: () =>
      scheduleService.checkScheduleConflicts({
        startDate,
        endDate,
        participants: [userId],
      }),
    enabled: !!(userId && startDate && endDate),
    staleTime: 1 * 60 * 1000,
  });

// Get upcoming schedules
export const useUpcomingSchedules = (days = 7) =>
  useQuery({
    queryKey: scheduleKeys.upcoming(days),
    queryFn: () => scheduleService.getUpcomingSchedules(days),
    staleTime: 5 * 60 * 1000,
  });

// Get overdue schedules
export const useOverdueSchedules = () =>
  useQuery({
    queryKey: scheduleKeys.overdue(),
    queryFn: scheduleService.getOverdueSchedules,
    staleTime: 5 * 60 * 1000,
  });

// Get schedules by property
export const useSchedulesByProperty = (propertyId: string) =>
  useQuery({
    queryKey: scheduleKeys.byProperty(propertyId),
    queryFn: () => scheduleService.getSchedulesByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get schedules by user
export const useSchedulesByUser = (userId: string) =>
  useQuery({
    queryKey: scheduleKeys.byUser(userId),
    queryFn: () => scheduleService.getSchedulesByUser(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

// Get schedule participants
export const useScheduleParticipants = (scheduleId: string) =>
  useQuery({
    queryKey: scheduleKeys.participants(scheduleId),
    queryFn: () => scheduleService.getScheduleParticipants(scheduleId),
    enabled: !!scheduleId,
    staleTime: 5 * 60 * 1000,
  });

// Get schedule templates
export const useScheduleTemplates = () => {
  return useQuery({
    queryKey: scheduleKeys.templates(),
    queryFn: scheduleService.getScheduleTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get recurring schedules
export const useRecurringSchedules = (propertyId?: string) =>
  useQuery({
    queryKey: propertyId
      ? scheduleKeys.recurringByProperty(propertyId)
      : scheduleKeys.recurring(),
    queryFn: () =>
      scheduleService.getRecurringSchedules({ property: propertyId }),
    staleTime: 5 * 60 * 1000,
  });

// Get schedule attachments
export const useScheduleAttachments = (scheduleId: string) =>
  useQuery({
    queryKey: scheduleKeys.attachments(scheduleId),
    queryFn: () => scheduleService.getScheduleAttachments(scheduleId),
    enabled: !!scheduleId,
    staleTime: 5 * 60 * 1000,
  });

// Get schedule reminders
export const useScheduleReminders = (scheduleId: string) =>
  useQuery({
    queryKey: scheduleKeys.reminders(scheduleId),
    queryFn: () => scheduleService.getScheduleReminders(scheduleId),
    enabled: !!scheduleId,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Mutation Hooks - for modifying data
 */

// Create schedule
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.createSchedule,
    onSuccess: (data) => {
      // Add schedule to cache
      const schedule = data.schedule || data.data;
      if (schedule) {
        queryClient.setQueryData(scheduleKeys.detail(schedule._id), data);
      }

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.stats() });
      queryClient.invalidateQueries({
        queryKey: [...scheduleKeys.all, "calendar"],
      });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.upcoming(7) });
    },
  });
};

// Update schedule
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleInput }) =>
      scheduleService.updateSchedule(id, data),
    onSuccess: (data, variables) => {
      // Update schedule in cache
      queryClient.setQueryData(scheduleKeys.detail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.stats() });
      queryClient.invalidateQueries({
        queryKey: [...scheduleKeys.all, "calendar"],
      });
    },
  });
};

// Delete schedule
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.deleteSchedule,
    onSuccess: (_, scheduleId) => {
      // Remove schedule from cache
      queryClient.removeQueries({ queryKey: scheduleKeys.detail(scheduleId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.stats() });
      queryClient.invalidateQueries({
        queryKey: [...scheduleKeys.all, "calendar"],
      });
    },
  });
};

// Complete schedule
export const useCompleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      completionNotes,
    }: {
      scheduleId: string;
      completionNotes?: string;
    }) => scheduleService.completeSchedule(scheduleId, completionNotes),
    onSuccess: (data, variables) => {
      // Update schedule in cache
      queryClient.setQueryData(scheduleKeys.detail(variables.scheduleId), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.stats() });
    },
  });
};

// Reschedule
export const useRescheduleSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      newStartDate,
      newEndDate,
      reason,
    }: {
      scheduleId: string;
      newStartDate: string;
      newEndDate: string;
      reason?: string;
    }) =>
      scheduleService.rescheduleSchedule(
        scheduleId,
        newStartDate,
        newEndDate,
        reason
      ),
    onSuccess: (data, variables) => {
      // Update schedule in cache
      queryClient.setQueryData(scheduleKeys.detail(variables.scheduleId), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...scheduleKeys.all, "calendar"],
      });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.upcoming(7) });
    },
  });
};

// Add participant
export const useAddScheduleParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      participant,
    }: {
      scheduleId: string;
      participant: Omit<ScheduleParticipant, "_id" | "addedAt">;
    }) => scheduleService.addScheduleParticipant(scheduleId, participant),
    onSuccess: (data, variables) => {
      // Update participants in cache
      queryClient.setQueryData(
        scheduleKeys.participants(variables.scheduleId),
        data
      );

      // Update schedule in cache
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(variables.scheduleId),
      });
    },
  });
};

// Remove participant
export const useRemoveScheduleParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      participantId,
    }: {
      scheduleId: string;
      participantId: string;
    }) => scheduleService.removeScheduleParticipant(scheduleId, participantId),
    onSuccess: (data, variables) => {
      // Update participants in cache
      queryClient.setQueryData(
        scheduleKeys.participants(variables.scheduleId),
        data
      );

      // Update schedule in cache
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(variables.scheduleId),
      });
    },
  });
};

// Send notification
export const useSendScheduleNotification = () =>
  useMutation({
    mutationFn: ({
      scheduleId,
      notificationType,
      recipients,
    }: {
      scheduleId: string;
      notificationType: "created" | "updated" | "cancelled" | "reminder";
      customMessage?: string;
      recipients: string[];
    }) =>
      scheduleService.sendScheduleNotification(
        scheduleId,
        notificationType,
        recipients
      ),
  });

// Upload attachment
export const useUploadScheduleAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      file,
      description,
    }: {
      scheduleId: string;
      file: File;
      description?: string;
    }) =>
      scheduleService.uploadScheduleAttachment(scheduleId, file, description),
    onSuccess: (_, variables) => {
      // Invalidate attachments query
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.attachments(variables.scheduleId),
      });

      // Update schedule in cache
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(variables.scheduleId),
      });
    },
  });
};

// Delete attachment
export const useDeleteScheduleAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      attachmentId,
    }: {
      scheduleId: string;
      attachmentId: string;
    }) => scheduleService.deleteScheduleAttachment(scheduleId, attachmentId),
    onSuccess: (_, variables) => {
      // Invalidate attachments query
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.attachments(variables.scheduleId),
      });

      // Update schedule in cache
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(variables.scheduleId),
      });
    },
  });
};

// Create schedule template
export const useCreateScheduleTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.createScheduleTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.templates() });
    },
  });
};

// Update schedule template
export const useUpdateScheduleTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ScheduleTemplate>;
    }) => scheduleService.updateScheduleTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.templates() });
    },
  });
};

// Delete schedule template
export const useDeleteScheduleTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.deleteScheduleTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.templates() });
    },
  });
};

// Create recurring schedule
export const useCreateRecurringSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleData,
      pattern,
    }: {
      scheduleData: CreateScheduleInput;
      pattern: RecurringSchedulePattern;
    }) => scheduleService.createRecurringSchedule(scheduleData, pattern),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.recurring() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
};

// Update recurring schedule
export const useUpdateRecurringSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      scheduleData,
      pattern,
    }: {
      id: string;
      scheduleData?: Partial<CreateScheduleInput>;
      pattern?: Partial<RecurringSchedulePattern>;
    }) => scheduleService.updateRecurringSchedule(id, scheduleData, pattern),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.recurring() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
};

// Delete recurring schedule
export const useDeleteRecurringSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.deleteRecurringSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.recurring() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
};

// Bulk update schedules
export const useBulkUpdateSchedules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleIds,
      updates,
    }: {
      scheduleIds: string[];
      updates: Partial<UpdateScheduleInput>;
    }) =>
      scheduleService.bulkUpdateSchedules({
        scheduleIds,
        operation: "update_status",
        data: updates,
      }),
    onSuccess: () => {
      // Invalidate all schedule queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
};

// Sync external calendar
export const useSyncExternalCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      provider,
      credentials,
    }: {
      provider: "google" | "outlook" | "apple";
      credentials: any;
    }) => scheduleService.syncExternalCalendar(provider, credentials),
    onSuccess: () => {
      // Invalidate calendar queries
      queryClient.invalidateQueries({
        queryKey: [...scheduleKeys.all, "calendar"],
      });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
};

// Generate schedule report
export const useGenerateScheduleReport = () =>
  useMutation({
    mutationFn: ({
      type,
      filters,
      format,
    }: {
      type: "summary" | "detailed" | "calendar";
      filters?: ScheduleQueryParams;
      format?: "pdf" | "xlsx" | "csv";
    }) => scheduleService.generateScheduleReport(type, filters, format),
  });

// Export schedules
export const useExportSchedules = () =>
  useMutation({
    mutationFn: ({
      filters,
      format,
    }: {
      filters?: ScheduleQueryParams;
      format?: "csv" | "xlsx" | "pdf" | "ical";
    }) => scheduleService.exportSchedules(filters, format),
  });

/**
 * Utility functions for cache management
 */

// Prefetch schedule
export const usePrefetchSchedule = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: scheduleKeys.detail(id),
      queryFn: () => scheduleService.getSchedule(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Invalidate all schedule queries
export const useInvalidateSchedules = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
  };
};
