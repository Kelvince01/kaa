import mongoose, { type Model, Schema } from "mongoose";
import {
  type ISchedule,
  type IScheduleParticipant,
  type IScheduleRecurrence,
  RecurrenceFrequency,
  ScheduleStatus,
  ScheduleType,
} from "./types/schedule.type";

const scheduleParticipantSchema = new Schema<IScheduleParticipant>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  contractor: {
    type: Schema.Types.ObjectId,
    ref: "Contractor",
  },
  email: String,
  name: String,
  role: {
    type: String,
    enum: ["organizer", "attendee", "contractor", "tenant", "landlord"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "tentative"],
    default: "pending",
  },
  notified: {
    type: Boolean,
    default: false,
  },
});

const scheduleRecurrenceSchema = new Schema<IScheduleRecurrence>({
  frequency: {
    type: String,
    enum: Object.values(RecurrenceFrequency),
    required: true,
  },
  interval: {
    type: Number,
    required: true,
    min: 1,
  },
  daysOfWeek: [Number],
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
  },
  endDate: Date,
  maxOccurrences: {
    type: Number,
    min: 1,
  },
});

const scheduleSchema = new Schema<ISchedule>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: Object.values(ScheduleType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ScheduleStatus),
      default: ScheduleStatus.SCHEDULED,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
    },
    location: String,
    workOrder: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrder",
    },
    maintenanceRequest: {
      type: Schema.Types.ObjectId,
      ref: "Maintenance",
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [scheduleParticipantSchema],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: scheduleRecurrenceSchema,
    parentSchedule: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
    },
    reminders: [
      {
        type: {
          type: String,
          enum: ["email", "sms", "push"],
          required: true,
        },
        minutesBefore: {
          type: Number,
          required: true,
        },
        sent: {
          type: Boolean,
          default: false,
        },
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: [String],
    attachments: [
      {
        url: String,
        fileName: String,
        fileType: String,
        size: Number,
      },
    ],
    notes: String,
    completedAt: Date,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    completionNotes: String,
  },
  { timestamps: true }
);

// Indexes for efficient querying
scheduleSchema.index({ startDate: 1, endDate: 1 });
scheduleSchema.index({ organizer: 1 });
scheduleSchema.index({ "participants.user": 1 });
scheduleSchema.index({ "participants.contractor": 1 });
scheduleSchema.index({ property: 1 });
scheduleSchema.index({ workOrder: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ type: 1 });

// Virtual for duration in minutes
scheduleSchema.virtual("durationMinutes").get(function () {
  const diffMs = this.endDate.getTime() - this.startDate.getTime();
  return Math.floor(diffMs / (1000 * 60));
});

// Virtual for is past due
scheduleSchema.virtual("isPastDue").get(function () {
  return new Date() > this.endDate && this.status !== ScheduleStatus.COMPLETED;
});

// Method to check if user is participant
scheduleSchema.methods.isParticipant = function (userId: string) {
  return this.participants.some(
    (p: any) =>
      p.user?.toString() === userId || this.organizer.toString() === userId
  );
};

// Method to get next occurrence for recurring schedules
scheduleSchema.methods.getNextOccurrence = function (): Date | null {
  if (!(this.isRecurring && this.recurrence)) return null;

  const {
    frequency,
    interval,
    daysOfWeek,
    dayOfMonth,
    endDate,
    maxOccurrences,
  } = this.recurrence;
  const nextDate = new Date(this.startDate);

  switch (frequency) {
    case RecurrenceFrequency.DAILY:
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case RecurrenceFrequency.WEEKLY:
      nextDate.setDate(nextDate.getDate() + interval * 7);
      break;
    case RecurrenceFrequency.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + interval);
      if (dayOfMonth) {
        nextDate.setDate(dayOfMonth);
      }
      break;
    case RecurrenceFrequency.QUARTERLY:
      nextDate.setMonth(nextDate.getMonth() + interval * 3);
      break;
    case RecurrenceFrequency.YEARLY:
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
    default:
      throw new Error(`Invalid recurrence frequency: ${frequency}`);
  }

  // Check if next occurrence exceeds end date or max occurrences
  if (endDate && nextDate > endDate) return null;

  return nextDate;
};

// Static method to find schedules by date range
scheduleSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date
) {
  return this.find({
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
    ],
  }).sort({ startDate: 1 });
};

// Static method to find schedules for a user
scheduleSchema.statics.findForUser = function (
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = {
    $or: [{ organizer: userId }, { "participants.user": userId }],
  };

  if (startDate && endDate) {
    query.$and = [
      {
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
        ],
      },
    ];
  }

  return this.find(query).sort({ startDate: 1 });
};

// Static method to find schedules for a contractor
scheduleSchema.statics.findForContractor = function (
  contractorId: string,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = {
    "participants.contractor": contractorId,
  };

  if (startDate && endDate) {
    query.$and = [
      {
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
        ],
      },
    ];
  }

  return this.find(query).sort({ startDate: 1 });
};

// Static method to find conflicting schedules
scheduleSchema.statics.findConflicts = function (
  startDate: Date,
  endDate: Date,
  participants: string[],
  excludeId?: string
) {
  const query: any = {
    $or: [{ startDate: { $lt: endDate }, endDate: { $gt: startDate } }],
    $and: [
      {
        $or: [
          { "participants.user": { $in: participants } },
          { "participants.contractor": { $in: participants } },
          { organizer: { $in: participants } },
        ],
      },
    ],
    status: { $nin: [ScheduleStatus.CANCELLED, ScheduleStatus.COMPLETED] },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query);
};

// Pre-save validation
scheduleSchema.pre("save", function (next) {
  // Validate end date is after start date
  if (this.endDate <= this.startDate) {
    return next(new Error("End date must be after start date"));
  }

  // Validate recurrence settings
  if (this.isRecurring && !this.recurrence) {
    return next(
      new Error("Recurrence settings required for recurring schedules")
    );
  }

  next();
});

export const Schedule: Model<ISchedule> = mongoose.model<ISchedule>(
  "Schedule",
  scheduleSchema
);
