import { httpClient } from "@/lib/axios";
import type {
  BulkScheduleOperation,
  CreateScheduleInput,
  ScheduleAvailabilityQuery,
  ScheduleAvailabilityResponse,
  ScheduleCalendarEvent,
  ScheduleConflictCheckInput,
  ScheduleConflictResponse,
  ScheduleListResponse,
  ScheduleQueryParams,
  ScheduleResponse,
  ScheduleStatsResponse,
  ScheduleTemplate,
  UpdateScheduleInput,
} from "./schedule.type";

/**
 * Property Scheduling service for managing schedules and appointments
 */

// ============ SCHEDULE MANAGEMENT ============

// Create a new schedule
export const createSchedule = async (
  data: CreateScheduleInput
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.post("/properties/schedules", data);
  return response.data;
};

// Get all schedules with optional filtering
export const getSchedules = async (
  params: ScheduleQueryParams = {}
): Promise<ScheduleListResponse> => {
  const response = await httpClient.api.get("/properties/schedules", {
    params,
  });
  return response.data;
};

// Get schedule by ID
export const getSchedule = async (id: string): Promise<ScheduleResponse> => {
  const response = await httpClient.api.get(`/properties/schedules/${id}`);
  return response.data;
};

// Update schedule
export const updateSchedule = async (
  id: string,
  data: UpdateScheduleInput
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.put(
    `/properties/schedules/${id}`,
    data
  );
  return response.data;
};

// Delete schedule
export const deleteSchedule = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(`/properties/schedules/${id}`);
  return response.data;
};

// Complete schedule
export const completeSchedule = async (
  id: string,
  completionNotes?: string
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.post(
    `/properties/schedules/${id}/complete`,
    {
      completionNotes,
    }
  );
  return response.data;
};

// Cancel schedule
export const cancelSchedule = async (
  id: string,
  reason?: string
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.post(
    `/properties/schedules/${id}/cancel`,
    {
      reason,
    }
  );
  return response.data;
};

// Reschedule schedule
export const rescheduleSchedule = async (
  id: string,
  newStartDate: string,
  newEndDate: string,
  reason?: string
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.post(
    `/properties/schedules/${id}/reschedule`,
    {
      newStartDate,
      newEndDate,
      reason,
    }
  );
  return response.data;
};

// ============ SCHEDULE QUERIES ============

// Get schedules by property
export const getSchedulesByProperty = async (
  propertyId: string,
  params: Partial<ScheduleQueryParams> = {}
): Promise<ScheduleListResponse> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/schedules`,
    { params }
  );
  return response.data;
};

// Get upcoming schedules
export const getUpcomingSchedules = async (
  days = 7
): Promise<ScheduleListResponse> => {
  const response = await httpClient.api.get("/properties/schedules/upcoming", {
    params: { days },
  });
  return response.data;
};

// Get overdue schedules
export const getOverdueSchedules = async (): Promise<ScheduleListResponse> => {
  const response = await httpClient.api.get("/properties/schedules/overdue");
  return response.data;
};

// Get schedules by participant
export const getSchedulesByParticipant = async (
  participantId: string,
  params: Partial<ScheduleQueryParams> = {}
): Promise<ScheduleListResponse> => {
  const response = await httpClient.api.get(
    `/properties/schedules/participant/${participantId}`,
    {
      params,
    }
  );
  return response.data;
};

// Get schedules by user
export const getSchedulesByUser = async (
  userId: string
): Promise<ScheduleListResponse> => {
  const response = await httpClient.api.get(
    `/properties/schedules/user/${userId}`
  );
  return response.data;
};

// Get recurring schedules
export const getRecurringSchedules = async (
  params: Partial<ScheduleQueryParams> = {}
): Promise<ScheduleListResponse> => {
  const response = await httpClient.api.get("/properties/schedules/recurring", {
    params,
  });
  return response.data;
};

// ============ CALENDAR & AVAILABILITY ============

// Get schedule calendar events
export const getScheduleCalendarEvents = async (
  startDate: string,
  endDate: string,
  filters: Partial<ScheduleQueryParams> = {}
): Promise<{ events: ScheduleCalendarEvent[]; status: string }> => {
  const response = await httpClient.api.get("/properties/schedules/calendar", {
    params: { startDate, endDate, ...filters },
  });
  return response.data;
};

// Get schedule calendar events by property
export const getScheduleCalendarEventsByProperty = async (
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<{ events: ScheduleCalendarEvent[]; status: string }> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/schedules/calendar`,
    {
      params: { startDate, endDate },
    }
  );
  return response.data;
};

// Check participant availability
export const checkParticipantAvailability = async (
  params: ScheduleAvailabilityQuery
): Promise<ScheduleAvailabilityResponse> => {
  const response = await httpClient.api.get(
    "/properties/schedules/availability",
    { params }
  );
  return response.data;
};

// Check user availability
export const checkUserAvailability = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<ScheduleAvailabilityResponse> => {
  const response = await httpClient.api.get(
    `/properties/schedules/users/${userId}/availability`,
    {
      params: { startDate, endDate },
    }
  );
  return response.data;
};

// Check schedule conflicts
export const checkScheduleConflicts = async (
  data: ScheduleConflictCheckInput
): Promise<ScheduleConflictResponse> => {
  const response = await httpClient.api.post(
    "/properties/schedules/check-conflicts",
    data
  );
  return response.data;
};

// Find available time slots
export const findAvailableTimeSlots = async (
  participantIds: string[],
  startDate: string,
  endDate: string,
  duration: number
): Promise<ScheduleAvailabilityResponse> => {
  const response = await httpClient.api.post(
    "/properties/schedules/find-slots",
    {
      participantIds,
      startDate,
      endDate,
      duration,
    }
  );
  return response.data;
};

// ============ PARTICIPANTS & RESPONSES ============

// Update participant response
export const updateParticipantResponse = async (
  scheduleId: string,
  participantId: string,
  status: "accepted" | "declined" | "tentative",
  response?: string
): Promise<ScheduleResponse> => {
  const response_data = await httpClient.api.post(
    `/properties/schedules/${scheduleId}/participants/${participantId}/respond`,
    {
      status,
      response,
    }
  );
  return response_data.data;
};

// Get schedule participants
export const getScheduleParticipants = async (
  scheduleId: string
): Promise<{
  participants: Array<{
    id: string;
    user?: string;
    contractor?: string;
    email?: string;
    name?: string;
    role: string;
    status: "pending" | "accepted" | "declined";
    addedAt: string;
  }>;
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/schedules/${scheduleId}/participants`
  );
  return response.data;
};

// Add participant to schedule
export const addParticipantToSchedule = async (
  scheduleId: string,
  participant: {
    user?: string;
    contractor?: string;
    email?: string;
    name?: string;
    role: string;
  }
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.post(
    `/properties/schedules/${scheduleId}/participants`,
    {
      participant,
    }
  );
  return response.data;
};

// Add schedule participant (alias for addParticipantToSchedule)
export const addScheduleParticipant = async (
  scheduleId: string,
  participant: {
    user?: string;
    contractor?: string;
    email?: string;
    name?: string;
    role: string;
  }
): Promise<ScheduleResponse> =>
  addParticipantToSchedule(scheduleId, participant);

// Remove participant from schedule
export const removeParticipantFromSchedule = async (
  scheduleId: string,
  participantId: string
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.delete(
    `/properties/schedules/${scheduleId}/participants/${participantId}`
  );
  return response.data;
};

// Remove schedule participant (alias for removeParticipantFromSchedule)
export const removeScheduleParticipant = async (
  scheduleId: string,
  participantId: string
): Promise<ScheduleResponse> =>
  removeParticipantFromSchedule(scheduleId, participantId);

// ============ NOTIFICATIONS & REMINDERS ============

// Send schedule notification
export const sendScheduleNotification = async (
  scheduleId: string,
  type: "created" | "updated" | "cancelled" | "reminder",
  recipients?: string[]
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/schedules/${scheduleId}/notify`,
    {
      type,
      recipients,
    }
  );
  return response.data;
};

// Send schedule reminder
export const sendScheduleReminder = async (
  scheduleId: string,
  reminderType: "24_hours" | "1_hour" | "custom",
  customMessage?: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/schedules/${scheduleId}/remind`,
    {
      reminderType,
      customMessage,
    }
  );
  return response.data;
};

// Update schedule reminders
export const updateScheduleReminders = async (
  scheduleId: string,
  reminders: Array<{
    type: "email" | "sms" | "push";
    minutesBefore: number;
  }>
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.patch(
    `/properties/schedules/${scheduleId}/reminders`,
    {
      reminders,
    }
  );
  return response.data;
};

// ============ ATTACHMENTS ============

// Upload schedule attachment
export const uploadScheduleAttachment = async (
  scheduleId: string,
  file: File,
  description?: string
): Promise<{
  attachment: {
    url: string;
    fileName: string;
    fileType: string;
    size: number;
    description?: string;
  };
  status: string;
  message: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);
  if (description) {
    formData.append("description", description);
  }

  const response = await httpClient.api.post(
    `/properties/schedules/${scheduleId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Delete schedule attachment
export const deleteScheduleAttachment = async (
  scheduleId: string,
  attachmentId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/schedules/${scheduleId}/attachments/${attachmentId}`
  );
  return response.data;
};

// Get schedule attachments
export const getScheduleAttachments = async (
  scheduleId: string
): Promise<{
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    description?: string;
    uploadedAt: string;
  }>;
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/schedules/${scheduleId}/attachments`
  );
  return response.data;
};

// Get schedule reminders
export const getScheduleReminders = async (
  scheduleId: string
): Promise<{
  reminders: Array<{
    id: string;
    type: "email" | "sms" | "push";
    minutesBefore: number;
    status: "pending" | "sent" | "failed";
    scheduledAt: string;
  }>;
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/schedules/${scheduleId}/reminders`
  );
  return response.data;
};

// ============ STATISTICS & REPORTS ============

// Get schedule statistics
export const getScheduleStats = async (
  propertyId?: string,
  participantId?: string
): Promise<ScheduleStatsResponse> => {
  const params: any = {};
  if (propertyId) params.propertyId = propertyId;
  if (participantId) params.participantId = participantId;

  const response = await httpClient.api.get("/properties/schedules/stats", {
    params,
  });
  return response.data;
};

// Generate schedule report
export const generateScheduleReport = async (
  type: "summary" | "detailed" | "calendar",
  filters: Partial<ScheduleQueryParams> = {},
  format?: "pdf" | "xlsx" | "csv"
): Promise<{
  report: {
    type: string;
    generatedAt: string;
    data: any;
  };
  status: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/schedules/reports/generate",
    {
      type,
      filters,
      format,
    }
  );
  return response.data;
};

// Export schedules
export const exportSchedules = async (
  filters: Partial<ScheduleQueryParams> = {},
  format: "csv" | "xlsx" | "pdf" | "ical" = "csv"
): Promise<Blob> => {
  const response = await httpClient.api.get("/properties/schedules/export", {
    params: { ...filters, format },
    responseType: "blob",
  });
  return response.data;
};

// ============ BULK OPERATIONS ============

// Bulk update schedules
export const bulkUpdateSchedules = async (
  operation: BulkScheduleOperation
): Promise<{
  updated: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/schedules/bulk-update",
    operation
  );
  return response.data;
};

// ============ TEMPLATES ============

// Get schedule templates
export const getScheduleTemplates = async (): Promise<{
  templates: ScheduleTemplate[];
  status: string;
}> => {
  const response = await httpClient.api.get("/properties/schedules/templates");
  return response.data;
};

// Create schedule template
export const createScheduleTemplate = async (
  template: Omit<ScheduleTemplate, "_id" | "createdAt" | "updatedAt">
): Promise<{ template: ScheduleTemplate; status: string; message: string }> => {
  const response = await httpClient.api.post(
    "/properties/schedules/templates",
    template
  );
  return response.data;
};

// Update schedule template
export const updateScheduleTemplate = async (
  id: string,
  data: Partial<ScheduleTemplate>
): Promise<{ template: ScheduleTemplate; status: string; message: string }> => {
  const response = await httpClient.api.put(
    `/properties/schedules/templates/${id}`,
    data
  );
  return response.data;
};

// Delete schedule template
export const deleteScheduleTemplate = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/schedules/templates/${id}`
  );
  return response.data;
};

// Create schedule from template
export const createScheduleFromTemplate = async (
  templateId: string,
  scheduleData: Partial<CreateScheduleInput>
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.post(
    `/properties/schedules/templates/${templateId}/create`,
    {
      ...scheduleData,
    }
  );
  return response.data;
};

// ============ RECURRING SCHEDULES ============

// Create recurring schedule
export const createRecurringSchedule = async (
  scheduleData: CreateScheduleInput,
  pattern: any
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.post(
    "/properties/schedules/recurring",
    {
      scheduleData,
      pattern,
    }
  );
  return response.data;
};

// Update recurring schedule
export const updateRecurringSchedule = async (
  id: string,
  scheduleData?: Partial<CreateScheduleInput>,
  pattern?: any
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.put(
    `/properties/schedules/recurring/${id}`,
    {
      scheduleData,
      pattern,
    }
  );
  return response.data;
};

// Delete recurring schedule
export const deleteRecurringSchedule = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/schedules/recurring/${id}`
  );
  return response.data;
};

// Generate next occurrence of recurring schedule
export const generateNextRecurringSchedule = async (
  recurringScheduleId: string
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.post(
    `/properties/schedules/recurring/${recurringScheduleId}/generate-next`
  );
  return response.data;
};

// Update recurring schedule pattern
export const updateRecurringSchedulePattern = async (
  recurringScheduleId: string,
  recurrence: any
): Promise<ScheduleResponse> => {
  const response = await httpClient.api.patch(
    `/properties/schedules/recurring/${recurringScheduleId}/pattern`,
    { recurrence }
  );
  return response.data;
};

// Stop recurring schedule
export const stopRecurringSchedule = async (
  recurringScheduleId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/schedules/recurring/${recurringScheduleId}/stop`
  );
  return response.data;
};

// ============ INTEGRATION ============

// Sync with external calendar
export const syncWithExternalCalendar = async (
  calendarType: "google" | "outlook" | "apple",
  scheduleIds?: string[]
): Promise<{
  synced: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/schedules/sync-external",
    {
      calendarType,
      scheduleIds,
    }
  );
  return response.data;
};

// Sync external calendar (alias for syncWithExternalCalendar)
export const syncExternalCalendar = async (
  provider: "google" | "outlook" | "apple",
  credentials: any
): Promise<{
  synced: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/schedules/sync-external",
    {
      provider,
      credentials,
    }
  );
  return response.data;
};

// Get schedule conflicts with external calendar
export const getExternalCalendarConflicts = async (
  calendarType: "google" | "outlook" | "apple",
  startDate: string,
  endDate: string
): Promise<{
  conflicts: Array<{
    scheduleId: string;
    externalEvent: any;
    conflictType: string;
  }>;
  status: string;
}> => {
  const response = await httpClient.api.get(
    "/properties/schedules/external-conflicts",
    {
      params: { calendarType, startDate, endDate },
    }
  );
  return response.data;
};
