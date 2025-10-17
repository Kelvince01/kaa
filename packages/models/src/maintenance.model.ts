/**
 * Maintenance request model
 */

import mongoose, { type Model, Schema } from "mongoose";
import {
  type IMaintenance,
  type IMaintenanceUpdate,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "./types/maintenance.type";

const maintenanceUpdateSchema = new Schema<IMaintenanceUpdate>({
  message: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: Object.values(MaintenanceStatus),
  },
  scheduledDate: Date,
  attachments: [
    {
      url: String,
      fileName: String,
      fileType: String,
      size: Number,
    },
  ],
});

const maintenanceSchema = new Schema<IMaintenance>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    maintenanceType: {
      type: String,
      enum: Object.values(MaintenanceType),
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(MaintenancePriority),
      default: MaintenancePriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(MaintenanceStatus),
      default: MaintenanceStatus.PENDING,
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    updates: [maintenanceUpdateSchema],
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
      },
    ],
    scheduledDate: Date,
    completedDate: Date,
    assignedContractor: {
      name: String,
      phone: String,
      email: String,
      company: String,
    },
    estimatedCost: {
      type: Number,
      min: [0, "Estimated cost cannot be negative"],
    },
    cost: {
      type: Number,
      min: [0, "Actual cost cannot be negative"],
    },
    workOrderNumber: String,
    paidBy: {
      type: String,
      enum: ["landlord", "tenant"],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ["weekly", "monthly", "quarterly", "yearly"],
      },
      interval: {
        type: Number,
        default: 1,
      },
      nextDate: Date,
    },
    notes: String,
  },
  { timestamps: true }
);

// Create indexes for efficient querying
maintenanceSchema.index({ property: 1 });
maintenanceSchema.index({ tenant: 1 });
maintenanceSchema.index({ landlord: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ priority: 1 });
maintenanceSchema.index({ scheduledDate: 1 });
maintenanceSchema.index({ maintenanceType: 1 });

// Virtual for days open
maintenanceSchema.virtual("daysOpen").get(function () {
  if (this.status === "completed" && this.completedDate) {
    const created = new Date(this.createdAt);
    const completed = new Date(this.completedDate);
    const diffTime = completed.getTime() - created.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const created = new Date(this.createdAt);
  const today = new Date();
  const diffTime = today.getTime() - created.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for cost variance
maintenanceSchema.virtual("costVariance").get(function () {
  if (!(this.estimatedCost && this.cost)) return null;
  return this.cost - this.estimatedCost;
});

// Virtual for priority color
maintenanceSchema.virtual("priorityColor").get(function () {
  switch (this.priority) {
    case MaintenancePriority.EMERGENCY:
      return "red";
    case MaintenancePriority.HIGH:
      return "orange";
    case MaintenancePriority.MEDIUM:
      return "yellow";
    case MaintenancePriority.LOW:
      return "green";
    default:
      return "gray";
  }
});

// Pre-save middleware to generate work order number
maintenanceSchema.pre("save", function (next) {
  if (!this.workOrderNumber) {
    this.workOrderNumber = `WO${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Pre-save middleware to update completed date
maintenanceSchema.pre("save", function (next) {
  if (this.status === "completed" && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

// Static method to find urgent maintenance
maintenanceSchema.statics.findUrgent = function () {
  return this.find({
    priority: MaintenancePriority.EMERGENCY,
    status: { $in: ["pending", "in_progress"] },
  }).sort({ createdAt: 1 });
};

// Static method to find by status
maintenanceSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find by property
maintenanceSchema.statics.findByProperty = function (propertyId: string) {
  return this.find({ property: propertyId }).sort({ createdAt: -1 });
};

// Static method to find by tenant
maintenanceSchema.statics.findByTenant = function (tenantId: string) {
  return this.find({ tenant: tenantId }).sort({ createdAt: -1 });
};

// Static method to find overdue maintenance
maintenanceSchema.statics.findOverdue = function () {
  const today = new Date();
  return this.find({
    status: { $in: ["pending", "in_progress"] },
    scheduledDate: { $lt: today },
  }).sort({ scheduledDate: 1 });
};

// Static method to get maintenance statistics
maintenanceSchema.statics.getStatistics = async function (
  startDate?: Date,
  endDate?: Date
) {
  const matchStage: any = {};

  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        pendingRequests: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        inProgressRequests: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        completedRequests: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        urgentRequests: {
          $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
        },
        totalCost: { $sum: "$cost" },
        avgCompletionTime: {
          $avg: {
            $cond: [
              { $eq: ["$status", "completed"] },
              { $subtract: ["$completedDate", "$createdAt"] },
              null,
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalRequests: 0,
      pendingRequests: 0,
      inProgressRequests: 0,
      completedRequests: 0,
      urgentRequests: 0,
      totalCost: 0,
      avgCompletionTime: 0,
    }
  );
};

export const Maintenance: Model<IMaintenance> = mongoose.model<IMaintenance>(
  "Maintenance",
  maintenanceSchema
);
