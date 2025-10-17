import mongoose, { type Model, Schema } from "mongoose";
import {
  type IWorkOrder,
  type IWorkOrderMaterial,
  type IWorkOrderTimeEntry,
  type IWorkOrderUpdate,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from "./types/work-order.type";

const workOrderTimeEntrySchema = new Schema<IWorkOrderTimeEntry>(
  {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: Date,
    description: {
      type: String,
      required: true,
    },
    contractor: {
      type: Schema.Types.ObjectId,
      ref: "Contractor",
      required: true,
    },
    hourlyRate: Number,
    totalHours: Number,
    totalCost: Number,
  },
  { timestamps: true }
);

const workOrderMaterialSchema = new Schema<IWorkOrderMaterial>(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: String,
    partNumber: String,
  },
  { timestamps: true }
);

const workOrderUpdateSchema = new Schema<IWorkOrderUpdate>(
  {
    message: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(WorkOrderStatus),
    },
    attachments: [
      {
        url: String,
        fileName: String,
        fileType: String,
        size: Number,
      },
    ],
  },
  { timestamps: true }
);

const workOrderSchema = new Schema<IWorkOrder>(
  {
    workOrderNumber: {
      type: String,
      required: true,
      unique: true,
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
    type: {
      type: String,
      enum: Object.values(WorkOrderType),
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(WorkOrderPriority),
      default: WorkOrderPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(WorkOrderStatus),
      default: WorkOrderStatus.DRAFT,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
    },
    maintenanceRequest: {
      type: Schema.Types.ObjectId,
      ref: "Maintenance",
    },
    assignedContractor: {
      type: Schema.Types.ObjectId,
      ref: "Contractor",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledDate: Date,
    estimatedDuration: Number,
    actualStartDate: Date,
    actualEndDate: Date,
    estimatedCost: {
      type: Number,
      min: 0,
    },
    laborCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    materialCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    timeEntries: [workOrderTimeEntrySchema],
    materials: [workOrderMaterialSchema],
    updates: [workOrderUpdateSchema],
    completionNotes: String,
    completionPhotos: [
      {
        url: String,
        fileName: String,
        description: String,
      },
    ],
    qualityCheckRequired: {
      type: Boolean,
      default: false,
    },
    qualityCheckCompleted: Boolean,
    qualityCheckBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    qualityCheckDate: Date,
    qualityCheckNotes: String,
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
      },
      interval: {
        type: Number,
        default: 1,
      },
      nextDate: Date,
      endDate: Date,
    },
    tags: [String],
    customFields: Schema.Types.Mixed,
    notes: String,
  },
  { timestamps: true }
);

// Indexes for efficient querying
workOrderSchema.index({ property: 1 });
workOrderSchema.index({ unit: 1 });
workOrderSchema.index({ assignedContractor: 1 });
workOrderSchema.index({ status: 1 });
workOrderSchema.index({ priority: 1 });
workOrderSchema.index({ scheduledDate: 1 });
workOrderSchema.index({ createdBy: 1 });
workOrderSchema.index({ type: 1 });

// Virtual for actual duration
workOrderSchema.virtual("actualDuration").get(function () {
  if (!(this.actualStartDate && this.actualEndDate)) return null;
  const diffMs = this.actualEndDate.getTime() - this.actualStartDate.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
});

// Virtual for cost variance
workOrderSchema.virtual("costVariance").get(function () {
  if (!(this.estimatedCost && this.totalCost)) return null;
  return this.totalCost - this.estimatedCost;
});

// Virtual for is overdue
workOrderSchema.virtual("isOverdue").get(function () {
  if (!this.scheduledDate || this.status === WorkOrderStatus.COMPLETED)
    return false;
  return new Date() > this.scheduledDate;
});

// Pre-save middleware to generate work order number
workOrderSchema.pre("save", function (next) {
  if (!this.workOrderNumber) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.workOrderNumber = `WO${year}${random}`;
  }
  next();
});

// Pre-save middleware to calculate total costs
workOrderSchema.pre("save", function (next) {
  // Calculate labor cost from time entries
  this.laborCost = this.timeEntries.reduce((total, entry) => {
    if (entry.totalCost) return total + entry.totalCost;
    if (entry.totalHours && entry.hourlyRate) {
      entry.totalCost = entry.totalHours * entry.hourlyRate;
      return total + entry.totalCost;
    }
    return total;
  }, 0);

  // Calculate material cost
  this.materialCost = this.materials.reduce(
    (total, material) => total + material.totalCost,
    0
  );

  // Calculate total cost
  this.totalCost = this.laborCost + this.materialCost;

  next();
});

// Pre-save middleware to update actual dates based on status
workOrderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === WorkOrderStatus.IN_PROGRESS && !this.actualStartDate) {
      this.actualStartDate = new Date();
    }
    if (this.status === WorkOrderStatus.COMPLETED && !this.actualEndDate) {
      this.actualEndDate = new Date();
    }
  }
  next();
});

// Static method to find overdue work orders
workOrderSchema.statics.findOverdue = function () {
  const now = new Date();
  return this.find({
    scheduledDate: { $lt: now },
    status: { $in: [WorkOrderStatus.SCHEDULED, WorkOrderStatus.IN_PROGRESS] },
  }).sort({ scheduledDate: 1 });
};

// Static method to find by contractor
workOrderSchema.statics.findByContractor = function (contractorId: string) {
  return this.find({ assignedContractor: contractorId }).sort({
    scheduledDate: -1,
  });
};

// Static method to find by property
workOrderSchema.statics.findByProperty = function (propertyId: string) {
  return this.find({ property: propertyId }).sort({ createdAt: -1 });
};

// Static method to get work order statistics
workOrderSchema.statics.getStatistics = async function (
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
        totalWorkOrders: { $sum: 1 },
        draftWorkOrders: {
          $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
        },
        scheduledWorkOrders: {
          $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] },
        },
        inProgressWorkOrders: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        completedWorkOrders: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        emergencyWorkOrders: {
          $sum: { $cond: [{ $eq: ["$priority", "emergency"] }, 1, 0] },
        },
        totalCost: { $sum: "$totalCost" },
        avgCost: { $avg: "$totalCost" },
        avgDuration: {
          $avg: {
            $cond: [
              { $and: ["$actualStartDate", "$actualEndDate"] },
              { $subtract: ["$actualEndDate", "$actualStartDate"] },
              null,
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalWorkOrders: 0,
      draftWorkOrders: 0,
      scheduledWorkOrders: 0,
      inProgressWorkOrders: 0,
      completedWorkOrders: 0,
      emergencyWorkOrders: 0,
      totalCost: 0,
      avgCost: 0,
      avgDuration: 0,
    }
  );
};

export const WorkOrder: Model<IWorkOrder> = mongoose.model<IWorkOrder>(
  "WorkOrder",
  workOrderSchema
);
