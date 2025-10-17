import mongoose from "mongoose";
import {
  ApplicationStatus,
  type IApplication,
  TimelineEventStatus,
} from "./types/application.type";

const timelineEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: Object.values(TimelineEventStatus),
    default: TimelineEventStatus.COMPLETED,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const applicationSchema = new mongoose.Schema<IApplication>(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.DRAFT,
    },
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    moveInDate: {
      type: Date,
      required: true,
    },
    offerAmount: {
      type: Number,
    },
    notes: {
      type: String,
    },
    timeline: [timelineEventSchema],
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    rejectionReason: {
      type: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add method to add timeline event
applicationSchema.methods.addTimelineEvent = function (
  title: string,
  description: string,
  status: TimelineEventStatus = TimelineEventStatus.COMPLETED,
  actor?: mongoose.Types.ObjectId
) {
  this.timeline.push({
    title,
    description,
    date: new Date(),
    status,
    actor,
  });

  return this.save();
};

// Pre-save hook to set landlord from property if not set
applicationSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  if (!this.landlord && this.property) {
    try {
      const property = await mongoose.model("Property").findById(this.property);
      if (property?.landlord) {
        this.landlord = property.landlord;
      }
    } catch (error) {
      console.error("Failed to set landlord from property:", error);
    }
  }

  // Set expiration date (30 days from application)
  if (!this.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    this.expiresAt = expiryDate;
  }

  next();
});

export const Application = mongoose.model<IApplication>(
  "Application",
  applicationSchema
);
