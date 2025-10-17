import mongoose, { Schema } from "mongoose";
import type {
  IAnalyticsEvent,
  IPropertyView,
  IUserSession,
} from "./types/analytics.type";

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    event: { type: String, required: true, index: true },
    step: { type: String, index: true },
    field: { type: String, index: true },
    value: Schema.Types.Mixed,
    timestamp: { type: Date, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
analyticsEventSchema.index({ sessionId: 1, timestamp: 1 });
analyticsEventSchema.index({ event: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, event: 1, timestamp: -1 });
analyticsEventSchema.index({ memberId: 1, timestamp: -1 });

const propertyViewSchema = new Schema<IPropertyView>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    sessionId: { type: String, required: true, index: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    referrer: { type: String },
    viewDuration: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ["direct", "search", "social", "email", "ads", "other"],
      default: "direct",
      index: true,
    },
    deviceType: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      required: true,
      index: true,
    },
    location: {
      country: String,
      city: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },
    engagement: {
      scrollDepth: { type: Number, default: 0 },
      timeOnPage: { type: Number, default: 0 },
      interactions: [String],
      contactRequested: { type: Boolean, default: false },
      favorited: { type: Boolean, default: false },
      shared: { type: Boolean, default: false },
    },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics queries
propertyViewSchema.index({ propertyId: 1, timestamp: -1 });
propertyViewSchema.index({ propertyId: 1, userId: 1, timestamp: -1 });
propertyViewSchema.index({ timestamp: -1, source: 1 });
propertyViewSchema.index({ timestamp: -1, deviceType: 1 });

const userSessionSchema = new Schema<IUserSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, index: true },
    duration: { type: Number }, // calculated field
    pageViews: { type: Number, default: 1 },
    deviceInfo: {
      userAgent: { type: String, required: true },
      deviceType: {
        type: String,
        enum: ["mobile", "tablet", "desktop"],
        required: true,
        index: true,
      },
      browser: { type: String },
      os: { type: String },
      screenResolution: { type: String },
    },
    location: {
      ipAddress: { type: String, required: true },
      country: { type: String, index: true },
      city: { type: String },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
    referrer: { type: String },
    entryPage: { type: String, required: true },
    exitPage: { type: String },
    formInteractions: {
      formType: { type: String, index: true },
      currentStep: { type: String },
      completedSteps: [String],
      fieldInteractions: { type: Schema.Types.Mixed, default: {} },
      errors: [
        {
          field: String,
          error: String,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      timePerStep: { type: Schema.Types.Mixed, default: {} },
      completed: { type: Boolean, default: false, index: true },
      dropOffPoint: { type: String, index: true },
    },
    engagement: {
      totalScrollDepth: { type: Number, default: 0 },
      totalTimeActive: { type: Number, default: 0 },
      clicksCount: { type: Number, default: 0 },
      pagesVisited: [String],
    },
    conversionEvents: [
      {
        event: String,
        timestamp: { type: Date, default: Date.now },
        value: Number,
      },
    ],
    isBot: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for session analytics
userSessionSchema.index({ startTime: -1, deviceInfo: 1 });
userSessionSchema.index({ userId: 1, startTime: -1 });
userSessionSchema.index({ memberId: 1, startTime: -1 });
userSessionSchema.index({
  "formInteractions.formType": 1,
  "formInteractions.completed": 1,
});

// Pre-save middleware to calculate duration
userSessionSchema.pre("save", function () {
  if (this.endTime && this.startTime) {
    this.duration = Math.round(
      (this.endTime.getTime() - this.startTime.getTime()) / 1000
    );
  }
});

// Export models
export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>(
  "AnalyticsEvent",
  analyticsEventSchema
);
export const PropertyView = mongoose.model<IPropertyView>(
  "PropertyView",
  propertyViewSchema
);
export const UserSession = mongoose.model<IUserSession>(
  "UserSession",
  userSessionSchema
);
