import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum ScheduleType {
  MAINTENANCE = "maintenance",
  INSPECTION = "inspection",
  REPAIR = "repair",
  INSTALLATION = "installation",
  CLEANING = "cleaning",
  MEETING = "meeting",
  OTHER = "other",
}

export enum ScheduleStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  RESCHEDULED = "rescheduled",
}

export enum RecurrenceFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
}

export type IScheduleRecurrence = {
  frequency: RecurrenceFrequency;
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  endDate?: Date;
  maxOccurrences?: number;
};

export type IScheduleParticipant = {
  user?: mongoose.Types.ObjectId;
  contractor?: mongoose.Types.ObjectId;
  email?: string;
  name?: string;
  role: "organizer" | "attendee" | "contractor" | "tenant" | "landlord";
  status: "pending" | "accepted" | "declined" | "tentative";
  notified: boolean;
};

export interface ISchedule extends BaseDocument {
  title: string;
  description?: string;
  type: ScheduleType;
  status: ScheduleStatus;

  // Timing
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  timezone?: string;

  // Location
  property?: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  location?: string;

  // Related entities
  workOrder?: mongoose.Types.ObjectId;
  maintenanceRequest?: mongoose.Types.ObjectId;

  // Participants
  organizer: mongoose.Types.ObjectId;
  participants: IScheduleParticipant[];

  // Recurrence
  isRecurring: boolean;
  recurrence?: IScheduleRecurrence;
  parentSchedule?: mongoose.Types.ObjectId; // For recurring instances

  // Notifications
  reminders: Array<{
    type: "email" | "sms" | "push";
    minutesBefore: number;
    sent: boolean;
  }>;

  // Additional fields
  priority: "low" | "medium" | "high" | "urgent";
  tags?: string[];
  attachments?: Array<{
    url: string;
    fileName: string;
    fileType: string;
    size: number;
  }>;
  notes?: string;

  // Completion tracking
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  completionNotes?: string;
}
