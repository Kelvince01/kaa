import { model, Schema } from "mongoose";
import {
  AmenityCategory,
  AreaUnit,
  GeocodingProvider,
  type ILocation,
  type ILocationAnalytics,
  type ILocationEvent,
  type ILocationStatistics,
  KenyanCounty,
  LocationEventType,
  LocationStatus,
  LocationType,
} from "./types/location.type";

// Location Image Schema
const LocationImageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["primary", "gallery", "map", "aerial"],
      default: "gallery",
    },
    caption: {
      type: String,
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

// Location Document Schema
const LocationDocumentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["deed", "survey", "planning", "other"],
      default: "other",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

// Location Metadata Schema
const LocationMetadataSchema = new Schema(
  {
    population: {
      type: Number,
      min: 0,
    },
    elevation: {
      type: Number, // in meters above sea level
    },
    timeZone: {
      type: String,
      default: "Africa/Nairobi",
    },
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    currency: {
      type: String,
      default: "KES",
    },
    dialCode: {
      type: String,
      default: "+254",
    },
    alternativeNames: [
      {
        type: String,
        trim: true,
      },
    ],
    historicalNames: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    images: [LocationImageSchema],
    documents: [LocationDocumentSchema],
  },
  { _id: false }
);

// Location Address Schema
const LocationAddressSchema = new Schema(
  {
    street: {
      type: String,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
    estate: {
      type: String,
      trim: true,
    },
    suburb: {
      type: String,
      trim: true,
    },
    ward: {
      type: String,
      trim: true,
    },
    constituency: {
      type: String,
      trim: true,
    },
    county: {
      type: String,
      enum: Object.values(KenyanCounty),
      required: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: "Kenya",
    },
    formatted: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

// Demographics Schema
const DemographicsSchema = new Schema(
  {
    population: {
      type: Number,
      required: true,
      min: 0,
    },
    households: {
      type: Number,
      min: 0,
    },
    averageAge: {
      type: Number,
      min: 0,
      max: 120,
    },
    literacy: {
      type: Number,
      min: 0,
      max: 100, // percentage
    },
    employment: {
      type: Number,
      min: 0,
      max: 100, // percentage
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

// Amenity Schema
const AmenitySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: Object.values(AmenityCategory),
    required: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
  },
  distance: {
    type: Number,
    min: 0, // in meters
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  contact: {
    phone: {
      type: String,
      trim: true,
      match: /^\+254[0-9]{9}$/, // Kenyan phone format
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    website: {
      type: String,
      trim: true,
    },
  },
  hours: {
    monday: [
      {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
    ],
    tuesday: [
      {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
    ],
    wednesday: [
      {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
    ],
    thursday: [
      {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
    ],
    friday: [
      {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
    ],
    saturday: [
      {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
    ],
    sunday: [
      {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
    ],
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
});

// Transportation Schemas
const PublicTransportSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["bus", "matatu", "boda", "taxi", "train"],
      required: true,
    },
    routes: [
      {
        type: String,
        trim: true,
      },
    ],
    frequency: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    cost: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: "KES" },
    },
  },
  { _id: false }
);

const RoadInfoSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["highway", "arterial", "collector", "local"],
      required: true,
    },
    surface: {
      type: String,
      enum: ["tarmac", "murram", "dirt"],
      default: "tarmac",
    },
    condition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
  },
  { _id: false }
);

const TransportHubSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    distance: {
      type: Number,
      required: true,
      min: 0,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
  },
  { _id: false }
);

const MatutuRouteSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    from: {
      type: String,
      required: true,
      trim: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
    fare: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const MatutuStageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    routes: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const TransportationSchema = new Schema(
  {
    publicTransport: [PublicTransportSchema],
    roads: [RoadInfoSchema],
    airports: [TransportHubSchema],
    trainStations: [TransportHubSchema],
    busStations: [TransportHubSchema],
    matatu: {
      routes: [MatutuRouteSchema],
      stages: [MatutuStageSchema],
    },
  },
  { _id: false }
);

// Safety Schemas
const SecurityFacilitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    distance: {
      type: Number,
      required: true,
      min: 0,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      enum: ["immediate", "fast", "moderate", "slow"],
      default: "moderate",
    },
  },
  { _id: false }
);

const EmergencyServiceSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["police", "fire", "medical", "rescue"],
      required: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    availability: {
      type: String,
      enum: ["24/7", "business_hours", "on_call"],
      default: "business_hours",
    },
  },
  { _id: false }
);

const SecurityIncidentSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const SafetyInfoSchema = new Schema(
  {
    crimeRate: {
      type: String,
      enum: ["very_low", "low", "moderate", "high", "very_high"],
      default: "moderate",
    },
    policeStations: [SecurityFacilitySchema],
    securityFirms: [SecurityFacilitySchema],
    emergencyServices: [EmergencyServiceSchema],
    safetyRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    incidents: [SecurityIncidentSchema],
  },
  { _id: false }
);

// Economic Data Schema
const EconomicDataSchema = new Schema(
  {
    averageIncome: {
      type: Number,
      min: 0,
    },
    unemploymentRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    majorIndustries: [
      {
        type: String,
        trim: true,
      },
    ],
    businessCount: {
      type: Number,
      min: 0,
    },
    rentRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      average: { type: Number, min: 0 },
      currency: { type: String, default: "KES" },
    },
    propertyPrices: {
      residential: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
        average: { type: Number, min: 0 },
      },
      commercial: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
        average: { type: Number, min: 0 },
      },
      land: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
        average: { type: Number, min: 0 },
      },
    },
    costOfLiving: {
      index: { type: Number, min: 0 },
      categories: { type: Schema.Types.Mixed, default: {} },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Weather Data Schema
const WeatherDataSchema = new Schema(
  {
    temperature: {
      min: { type: Number },
      max: { type: Number },
      average: { type: Number },
    },
    rainfall: {
      annual: { type: Number, min: 0 },
      seasonal: { type: Schema.Types.Mixed, default: {} },
    },
    humidity: {
      average: { type: Number, min: 0, max: 100 },
      range: {
        min: { type: Number, min: 0, max: 100 },
        max: { type: Number, min: 0, max: 100 },
      },
    },
    seasons: {
      dry: { months: [{ type: String }] },
      wet: { months: [{ type: String }] },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Location Analytics Schema
const LocationAnalyticsSchema = new Schema(
  {
    views: {
      total: { type: Number, default: 0 },
      unique: { type: Number, default: 0 },
      lastMonth: { type: Number, default: 0 },
      trending: { type: Boolean, default: false },
    },
    searches: {
      total: { type: Number, default: 0 },
      keywords: [{ type: String, trim: true }],
      sources: { type: Schema.Types.Mixed, default: {} },
    },
    properties: {
      total: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      averagePrice: { type: Number, default: 0 },
      categories: { type: Schema.Types.Mixed, default: {} },
    },
    users: {
      registered: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      demographics: { type: Schema.Types.Mixed, default: {} },
    },
    bookings: {
      total: { type: Number, default: 0 },
      successful: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    popularity: {
      score: { type: Number, default: 0 },
      rank: { type: Number, default: 0 },
      trending: { type: Boolean, default: false },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Main Location Schema
const LocationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    type: {
      type: String,
      enum: Object.values(LocationType),
      required: true,
    },
    county: {
      type: String,
      enum: Object.values(KenyanCounty),
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Location",
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: "Location",
      },
    ],
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -1.5, // Kenya's southernmost point
        max: 5.5, // Kenya's northernmost point
      },
      longitude: {
        type: Number,
        required: true,
        min: 33.5, // Kenya's westernmost point
        max: 42.0, // Kenya's easternmost point
      },
      accuracy: {
        type: Number,
        min: 0,
      },
    },
    address: {
      type: LocationAddressSchema,
      required: true,
    },
    boundaries: {
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon",
      },
      coordinates: [[[Number]]],
    },
    area: {
      size: { type: Number, min: 0 },
      unit: {
        type: String,
        enum: Object.values(AreaUnit),
        default: AreaUnit.SQUARE_METERS,
      },
      calculatedAt: { type: Date, default: Date.now },
      source: {
        type: String,
        enum: ["manual", "calculated", "imported"],
        default: "manual",
      },
    },
    metadata: {
      type: LocationMetadataSchema,
      required: true,
    },
    demographics: DemographicsSchema,
    amenities: [AmenitySchema],
    transportation: {
      type: TransportationSchema,
      default: {},
    },
    safety: {
      type: SafetyInfoSchema,
      default: {},
    },
    economy: EconomicDataSchema,
    weather: WeatherDataSchema,
    visibility: {
      isPublic: {
        type: Boolean,
        default: true,
      },
      searchable: {
        type: Boolean,
        default: true,
      },
      featured: {
        type: Boolean,
        default: false,
      },
    },
    analytics: {
      type: LocationAnalyticsSchema,
      default: {},
    },
    seo: {
      title: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      description: {
        type: String,
        trim: true,
        maxlength: 300,
      },
      keywords: [
        {
          type: String,
          trim: true,
          lowercase: true,
        },
      ],
    },
    status: {
      type: String,
      enum: Object.values(LocationStatus),
      default: LocationStatus.ACTIVE,
    },
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
LocationSchema.index({ coordinates: "2dsphere" }); // Geospatial index
LocationSchema.index({ type: 1, status: 1 });
LocationSchema.index({ county: 1, type: 1 });
LocationSchema.index({ "analytics.popularity.score": -1 });
LocationSchema.index({ "analytics.properties.total": -1 });
LocationSchema.index({
  name: "text",
  "metadata.description": "text",
  "metadata.tags": "text",
});
LocationSchema.index({ createdAt: -1 });
LocationSchema.index({ updatedAt: -1 });
LocationSchema.index({ parent: 1 });
LocationSchema.index({ "visibility.isPublic": 1, "visibility.searchable": 1 });

// Virtual for full hierarchy path
LocationSchema.virtual("hierarchyPath").get(function () {
  // This would need to be populated in the service layer
  return this.name;
});

// Schema methods
LocationSchema.methods.updateAnalytics = function (
  data: Partial<ILocationAnalytics>
) {
  this.analytics = { ...this.analytics, ...data, lastUpdated: new Date() };
  return this.save();
};

LocationSchema.methods.addView = function (userId?: string) {
  this.analytics.views.total += 1;
  if (userId && !this.analytics.views.unique) {
    this.analytics.views.unique += 1;
  }
  this.analytics.lastUpdated = new Date();
  return this.save();
};

LocationSchema.methods.isWithinRadius = function (
  latitude: number,
  longitude: number,
  radiusKm: number
): boolean {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((latitude - this.coordinates.latitude) * Math.PI) / 180;
  const dLon = ((longitude - this.coordinates.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((this.coordinates.latitude * Math.PI) / 180) *
      Math.cos((latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= radiusKm;
};

// Geocoding Cache Schema
const GeocodingCacheSchema = new Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
    },
    queryHash: {
      type: String,
      required: true,
      unique: true,
    },
    provider: {
      type: String,
      enum: Object.values(GeocodingProvider),
      required: true,
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  {
    timestamps: true,
  }
);

GeocodingCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Location Event Schema
const LocationEventSchema = new Schema<ILocationEvent>(
  {
    type: {
      type: String,
      enum: Object.values(LocationEventType),
      required: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

LocationEventSchema.index({ type: 1, timestamp: -1 });
LocationEventSchema.index({ locationId: 1, timestamp: -1 });
LocationEventSchema.index({ userId: 1, timestamp: -1 });
LocationEventSchema.index({ timestamp: -1 });

// Location Statistics Schema
const LocationStatisticsSchema = new Schema<ILocationStatistics>(
  {
    totalLocations: {
      type: Number,
      default: 0,
    },
    locationsByType: {
      type: Schema.Types.Mixed,
      default: {},
    },
    locationsByCounty: {
      type: Schema.Types.Mixed,
      default: {},
    },
    geocodingUsage: {
      total: { type: Number, default: 0 },
      byProvider: { type: Schema.Types.Mixed, default: {} },
      today: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
    },
    searchMetrics: {
      totalSearches: { type: Number, default: 0 },
      topKeywords: [
        {
          keyword: String,
          count: Number,
        },
      ],
      popularLocations: [
        {
          locationId: String,
          name: String,
          views: Number,
        },
      ],
    },
    dataQuality: {
      withCoordinates: { type: Number, default: 0 },
      withBoundaries: { type: Number, default: 0 },
      withAmenities: { type: Number, default: 0 },
      withImages: { type: Number, default: 0 },
      verified: { type: Number, default: 0 },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware
LocationSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("name")) {
    // Generate slug from name
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  // Ensure coordinates are within Kenya bounds
  if (this.coordinates) {
    if (this.coordinates.latitude < -1.5 || this.coordinates.latitude > 5.5) {
      return next(new Error("Latitude must be within Kenya bounds"));
    }
    if (
      this.coordinates.longitude < 33.5 ||
      this.coordinates.longitude > 42.0
    ) {
      return next(new Error("Longitude must be within Kenya bounds"));
    }
  }

  // Auto-generate address formatted string if not provided
  if (!this.address.formatted) {
    const parts: string[] = [];
    if (this.address.building) parts.push(this.address.building);
    if (this.address.street) parts.push(this.address.street);
    if (this.address.estate) parts.push(this.address.estate);
    if (this.address.suburb) parts.push(this.address.suburb);
    if (this.address.county) parts.push(this.address.county);
    if (this.address.country) parts.push(this.address.country);
    this.address.formatted = parts.join(", ");
  }

  next();
});

// Create and export models
export const Location = model<ILocation>("Location", LocationSchema);
export const GeocodingCache = model("GeocodingCache", GeocodingCacheSchema);
export const LocationEvent = model<ILocationEvent>(
  "LocationEvent",
  LocationEventSchema
);
export const LocationStatistics = model<ILocationStatistics>(
  "LocationStatistics",
  LocationStatisticsSchema
);

// Export schemas for reuse
export {
  LocationSchema,
  GeocodingCacheSchema,
  LocationEventSchema,
  LocationStatisticsSchema,
  AmenitySchema,
  LocationAddressSchema,
  LocationMetadataSchema,
};
