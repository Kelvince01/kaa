import mongoose, { type Model, Schema } from "mongoose";
import {
  HotspotTrigger,
  HotspotType,
  type IVirtualTour,
  SceneType,
  TourStatus,
  TourType,
  TransitionType,
} from "./types/virtual-tours.type";

const viewAngleSchema = new Schema(
  {
    yaw: { type: Number, required: true, min: -180, max: 180 },
    pitch: { type: Number, required: true, min: -90, max: 90 },
    fov: { type: Number, required: true, min: 30, max: 120 },
  },
  { _id: false }
);

const brandingSettingsSchema = new Schema(
  {
    showLogo: { type: Boolean, default: true },
    logoPosition: {
      type: String,
      enum: ["top-left", "top-right", "bottom-left", "bottom-right"],
      default: "top-right",
    },
    showWatermark: { type: Boolean, default: true },
    customCSS: { type: String },
    theme: {
      type: String,
      enum: ["light", "dark", "custom"],
      default: "light",
    },
  },
  { _id: false }
);

const tourSettingsSchema = new Schema(
  {
    autoRotate: { type: Boolean, default: false },
    autoRotateSpeed: { type: Number, default: 2, min: 0.1, max: 10 },
    initialView: { type: viewAngleSchema, required: true },
    controlsEnabled: { type: Boolean, default: true },
    gyroscopeEnabled: { type: Boolean, default: true },
    vrMode: { type: Boolean, default: false },
    arEnabled: { type: Boolean, default: false },
    audioEnabled: { type: Boolean, default: false },
    backgroundMusic: { type: String },
    logoOverlay: { type: String },
    branding: { type: brandingSettingsSchema, required: true },
  },
  { _id: false }
);

const scenePositionSchema = new Schema(
  {
    latitude: { type: Number },
    longitude: { type: Number },
    altitude: { type: Number },
    floor: { type: Number },
    room: { type: String },
  },
  { _id: false }
);

const sceneConnectionSchema = new Schema(
  {
    targetSceneId: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
    },
    arrow: { type: Boolean, default: true },
    transition: {
      type: String,
      enum: Object.values(TransitionType),
      default: TransitionType.FADE,
    },
  },
  { _id: false }
);

const processingInfoSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    error: { type: String },
  },
  { _id: false }
);

const sceneMetadataSchema = new Schema(
  {
    captureDate: { type: Date, required: true },
    camera: { type: String },
    resolution: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    fileSize: { type: Number, required: true },
    processing: { type: processingInfoSchema },
  },
  { _id: false }
);

const tourSceneSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(SceneType),
      required: true,
    },
    mediaUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    position: { type: scenePositionSchema },
    connections: [sceneConnectionSchema],
    hotspots: [{ type: String }], // Array of hotspot IDs
    metadata: { type: sceneMetadataSchema, required: true },
    order: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const hotspotPositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number },
    yaw: { type: Number, min: -180, max: 180 },
    pitch: { type: Number, min: -90, max: 90 },
  },
  { _id: false }
);

const hotspotActionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["navigate", "call", "email", "whatsapp", "external", "modal"],
      required: true,
    },
    target: { type: String, required: true },
    parameters: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const measurementDataSchema = new Schema(
  {
    dimensions: {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number },
    },
    area: { type: Number, required: true },
    unit: {
      type: String,
      enum: ["meters", "feet"],
      default: "meters",
    },
    accuracy: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const hotspotContentSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    mediaUrl: { type: String },
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "3d"],
    },
    link: { type: String },
    action: { type: hotspotActionSchema },
    measurements: { type: measurementDataSchema },
  },
  { _id: false }
);

const hotspotStyleSchema = new Schema(
  {
    icon: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: Number, required: true, min: 1, max: 100 },
    animation: {
      type: String,
      enum: ["pulse", "bounce", "rotate", "none"],
      default: "none",
    },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

const hotspotAnalyticsSchema = new Schema(
  {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    averageViewTime: { type: Number, default: 0 },
    lastInteraction: { type: Date, default: Date.now },
  },
  { _id: false }
);

const hotspotSchema = new Schema(
  {
    id: { type: String, required: true },
    sceneId: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(HotspotType),
      required: true,
    },
    position: { type: hotspotPositionSchema, required: true },
    content: { type: hotspotContentSchema, required: true },
    style: { type: hotspotStyleSchema, required: true },
    trigger: {
      type: String,
      enum: Object.values(HotspotTrigger),
      default: HotspotTrigger.CLICK,
    },
    analytics: { type: hotspotAnalyticsSchema, default: () => ({}) },
  },
  { _id: false }
);

const deviceAnalyticsSchema = new Schema(
  {
    mobile: { type: Number, default: 0 },
    desktop: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 },
    vr: { type: Number, default: 0 },
    ar: { type: Number, default: 0 },
  },
  { _id: false }
);

const sceneAnalyticsSchema = new Schema(
  {
    sceneId: { type: String, required: true },
    views: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    exitRate: { type: Number, default: 0 },
    hotspotEngagement: { type: Number, default: 0 },
  },
  { _id: false }
);

const heatmapDataSchema = new Schema(
  {
    sceneId: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    intensity: { type: Number, required: true, min: 0, max: 1 },
    duration: { type: Number, required: true },
  },
  { _id: false }
);

const conversionMetricsSchema = new Schema(
  {
    inquiries: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    phoneClicks: { type: Number, default: 0 },
    emailClicks: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const tourAnalyticsSchema = new Schema(
  {
    totalViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    averageDuration: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    deviceBreakdown: { type: deviceAnalyticsSchema, default: () => ({}) },
    locationBreakdown: { type: Schema.Types.Mixed, default: {} },
    sceneAnalytics: [sceneAnalyticsSchema],
    heatmap: [heatmapDataSchema],
    conversionMetrics: { type: conversionMetricsSchema, default: () => ({}) },
  },
  { _id: false }
);

const tourMetadataSchema = new Schema(
  {
    propertyType: { type: String, required: true },
    totalSize: { type: Number, required: true }, // in square meters
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    floor: { type: Number, required: true },
    county: { type: String, required: true },
    constituency: { type: String, required: true },
    ward: { type: String, required: true },
    amenities: [{ type: String }],
    features: [{ type: String }],
  },
  { _id: false }
);

const virtualTourSchema = new Schema<IVirtualTour>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: Object.values(TourType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TourStatus),
      default: TourStatus.DRAFT,
    },
    settings: {
      type: tourSettingsSchema,
      required: true,
    },
    scenes: [tourSceneSchema],
    hotspots: [hotspotSchema],
    analytics: {
      type: tourAnalyticsSchema,
      default: () => ({}),
    },
    metadata: {
      type: tourMetadataSchema,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
virtualTourSchema.index({ propertyId: 1 });
virtualTourSchema.index({ status: 1 });
virtualTourSchema.index({ type: 1 });
virtualTourSchema.index({ createdBy: 1 });
virtualTourSchema.index({ createdAt: -1 });
virtualTourSchema.index({ "analytics.totalViews": -1 });

// Text search index
virtualTourSchema.index({
  title: "text",
  description: "text",
  "metadata.county": "text",
  "metadata.constituency": "text",
});

const VirtualTour: Model<IVirtualTour> = mongoose.model<IVirtualTour>(
  "VirtualTour",
  virtualTourSchema
);

export default VirtualTour;
