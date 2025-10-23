/**
 * Property Scheduling Types
 *
 * This module provides type definitions for property-related scheduling
 * including appointments, maintenance, inspections, and meetings.
 */

/**
 * Schedule type enumeration
 */
export enum ScheduleType {
  MAINTENANCE = "maintenance",
  INSPECTION = "inspection",
  REPAIR = "repair",
  INSTALLATION = "installation",
  CLEANING = "cleaning",
  MEETING = "meeting",
  VIEWING = "viewing",
  OTHER = "other",
}

/**
 * Schedule status enumeration
 */
export enum ScheduleStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  RESCHEDULED = "rescheduled",
  NO_SHOW = "no_show",
}

/**
 * Recurrence frequency enumeration
 */
export enum RecurrenceFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
}

/**
 * Schedule priority enumeration
 */
export enum SchedulePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

/**
 * Participant role enumeration
 */
export enum ParticipantRole {
  ORGANIZER = "organizer",
  ATTENDEE = "attendee",
  CONTRACTOR = "contractor",
  TENANT = "tenant",
  LANDLORD = "landlord",
  INSPECTOR = "inspector",
}

/**
 * Participant status enumeration
 */
export enum ParticipantStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
  TENTATIVE = "tentative",
}

/**
 * Schedule recurrence interface
 */
export type ScheduleRecurrence = {
  frequency: RecurrenceFrequency;
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  endDate?: string;
  maxOccurrences?: number;
};

/**
 * Schedule participant interface
 */
export type ScheduleParticipant = {
  user?: string;
  contractor?: string;
  email?: string;
  name?: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  notified: boolean;
  response?: string;
  responseDate?: string;
};

/**
 * Schedule reminder interface
 */
export type ScheduleReminder = {
  type: "email" | "sms" | "push";
  minutesBefore: number;
  sent: boolean;
  sentAt?: string;
};

/**
 * Schedule attachment interface
 */
export type ScheduleAttachment = {
  url: string;
  fileName: string;
  fileType: string;
  size: number;
  description?: string;
  uploadedAt: string;
};

/**
 * Main schedule interface
 */
export type Schedule = {
  _id: string;
  title: string;
  description?: string;
  type: ScheduleType;
  status: ScheduleStatus;

  // Timing
  startDate: string;
  endDate: string;
  allDay: boolean;
  timezone?: string;
  duration?: number; // in minutes

  // Location
  property?: string;
  unit?: string;
  location?: string;
  address?: string;

  // Related entities
  workOrder?: string;
  maintenanceRequest?: string;
  inspection?: string;

  // Participants
  organizer: string;
  participants: ScheduleParticipant[];

  // Recurrence
  isRecurring: boolean;
  recurrence?: ScheduleRecurrence;
  parentSchedule?: string; // For recurring instances

  // Notifications
  reminders: ScheduleReminder[];

  // Additional fields
  priority: SchedulePriority;
  tags?: string[];
  attachments?: ScheduleAttachment[];
  notes?: string;

  // Completion tracking
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Additional fields for frontend
  propertyAddress?: string;
  organizerName?: string;
  canEdit?: boolean;
  canCancel?: boolean;
  isOverdue?: boolean;
  conflictsWith?: Schedule[];
};

/**
 * Schedule creation input
 */
export type CreateScheduleInput = {
  title: string;
  description?: string;
  type: ScheduleType;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  timezone?: string;
  property?: string;
  unit?: string;
  location?: string;
  workOrder?: string;
  maintenanceRequest?: string;
  participants?: Omit<ScheduleParticipant, "status" | "notified">[];
  isRecurring?: boolean;
  recurrence?: ScheduleRecurrence;
  reminders?: Omit<ScheduleReminder, "sent" | "sentAt">[];
  priority?: SchedulePriority;
  tags?: string[];
  notes?: string;
};

/**
 * Schedule update input
 */
export type UpdateScheduleInput = {
  title?: string;
  description?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  timezone?: string;
  property?: string;
  unit?: string;
  location?: string;
  participants?: ScheduleParticipant[];
  reminders?: ScheduleReminder[];
  priority?: SchedulePriority;
  tags?: string[];
  notes?: string;
  completionNotes?: string;
};

/**
 * Schedule query parameters
 */
export type ScheduleQueryParams = {
  property?: string;
  unit?: string;
  organizer?: string;
  participant?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  priority?: SchedulePriority;
  startDate?: string;
  endDate?: string;
  isRecurring?: boolean;
  tags?: string[];
  sortBy?: "startDate" | "createdAt" | "priority" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  search?: string;
};

/**
 * Schedule conflict check input
 */
export type ScheduleConflictCheckInput = {
  startDate: string;
  endDate: string;
  participants: string[];
  excludeScheduleId?: string;
};

/**
 * Schedule availability query
 */
export type ScheduleAvailabilityQuery = {
  participantId: string;
  startDate: string;
  endDate: string;
  duration?: number; // in minutes
};

/**
 * Available time slot interface
 */
export type AvailableTimeSlot = {
  startTime: string;
  endTime: string;
  duration: number;
};

/**
 * Schedule calendar event interface
 */
export type ScheduleCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status: ScheduleStatus;
  type: ScheduleType;
  priority: SchedulePriority;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    schedule: Schedule;
    description?: string;
    location?: string;
    participants: number;
  };
};

/**
 * Schedule statistics interface
 */
export type ScheduleStats = {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  overdue: number;
  upcoming: number;
  completionRate: number;
  averageDuration: number;
  byType: Record<ScheduleType, number>;
  byStatus: Record<ScheduleStatus, number>;
  byPriority: Record<SchedulePriority, number>;
};

/**
 * Bulk schedule operation interface
 */
export type BulkScheduleOperation = {
  scheduleIds: string[];
  operation:
    | "reschedule"
    | "cancel"
    | "complete"
    | "update_status"
    | "send_reminders";
  data?: {
    newStartDate?: string;
    newEndDate?: string;
    status?: ScheduleStatus;
    reason?: string;
    notes?: string;
  };
};

/**
 * Schedule template interface
 */
export type ScheduleTemplate = {
  _id: string;
  name: string;
  description?: string;
  type: ScheduleType;
  duration: number;
  defaultReminders: Omit<ScheduleReminder, "sent" | "sentAt">[];
  defaultParticipants: Omit<ScheduleParticipant, "status" | "notified">[];
  checklist?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RecurringSchedulePattern = {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
  maxOccurrences?: number;
};

/**
 * Pagination interface
 */
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/**
 * Base API response interface
 */
export type ApiResponse<T> = {
  status: "success" | "error";
  message?: string;
  data?: T;
};

/**
 * Schedule API responses
 */
export interface ScheduleResponse extends ApiResponse<Schedule> {
  schedule?: Schedule;
}

export type ScheduleListResponse = {
  schedules?: Schedule[];
  data?: {
    schedules: Schedule[];
    pagination: Pagination;
  };
};

export interface ScheduleStatsResponse extends ApiResponse<ScheduleStats> {
  stats?: ScheduleStats;
}

export interface ScheduleAvailabilityResponse
  extends ApiResponse<AvailableTimeSlot[]> {
  availability?: AvailableTimeSlot[];
  availableSlots?: AvailableTimeSlot[];
}

export interface ScheduleConflictResponse extends ApiResponse<Schedule[]> {
  hasConflicts: boolean;
  conflicts?: Schedule[];
}
