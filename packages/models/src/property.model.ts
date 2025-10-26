import { geocodeAddress, geocodePostalCode, slugify } from "@kaa/utils";
import mongoose, { type Model, Schema } from "mongoose";
import {
  type IProperty,
  ListingType,
  PropertyStatus,
  PropertyType,
} from "./types/property.type";

/**
 * Property image interface
 */
type IPropertyImage = {
  url: string;
  caption?: string;
  isPrimary: boolean;
};

// Enhanced schema definitions for structured property data

/**
 * Property Amenities Schema
 */
const propertyAmenitiesSchema = new Schema(
  {
    // Basic amenities
    water: { type: Boolean, default: false },
    electricity: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    security: { type: Boolean, default: false },
    garden: { type: Boolean, default: false },

    // Luxury amenities
    swimmingPool: { type: Boolean, default: false },
    gym: { type: Boolean, default: false },
    lift: { type: Boolean, default: false },
    generator: { type: Boolean, default: false },
    solarPower: { type: Boolean, default: false },

    // Connectivity
    internet: { type: Boolean, default: false },
    dstv: { type: Boolean, default: false },
    cableTv: { type: Boolean, default: false },

    // Storage & Extra Rooms
    storeRoom: { type: Boolean, default: false },
    servantQuarter: { type: Boolean, default: false },
    studyRoom: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },

    // Outdoor features
    compound: { type: Boolean, default: false },
    gate: { type: Boolean, default: false },
    perimeter: { type: Boolean, default: false },
    borehole: { type: Boolean, default: false },

    // Services
    laundry: { type: Boolean, default: false },
    cleaning: { type: Boolean, default: false },
    caretaker: { type: Boolean, default: false },
    cctv: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Property Pricing Schema
 */
const propertyPricingSchema = new Schema(
  {
    rent: { type: Number, required: true },
    currency: { type: String, enum: ["KES", "USD"], default: "KES" },
    deposit: { type: Number, required: true },
    serviceFee: { type: Number, default: 0 },
    agentFee: { type: Number },
    legalFee: { type: Number },
    lateFee: { type: Number },

    // Payment terms
    paymentFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "annually", "daily", "weekly"],
      default: "monthly",
    },
    advanceMonths: { type: Number, default: 1 },
    depositMonths: { type: Number, default: 2 },

    // Utilities
    utilitiesIncluded: {
      water: { type: Boolean, default: false },
      electricity: { type: Boolean, default: false },
      internet: { type: Boolean, default: false },
      garbage: { type: Boolean, default: false },
      security: { type: Boolean, default: false },
    },

    negotiable: { type: Boolean, default: false },

    // Price history
    priceHistory: [
      {
        price: Number,
        changedAt: { type: Date, default: Date.now },
        reason: String,
      },
    ],
  },
  { _id: false }
);

/**
 * Property Location Schema (Enhanced)
 */
const propertyLocationSchema = new Schema(
  {
    // Administrative divisions
    country: { type: String, required: true, default: "Kenya" },
    county: { type: String, required: true },
    constituency: { type: String, required: true },
    ward: { type: String, required: true },
    estate: { type: String, required: true },

    // Address details
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      town: { type: String, required: true },
      postalCode: { type: String, required: true },
      directions: { type: String },
    },

    // Geographic coordinates
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },

    // Enhanced location data
    plotNumber: { type: String },
    buildingName: { type: String },
    floor: { type: Number },
    unitNumber: { type: String },

    // Transportation
    nearbyTransport: [String],
    walkingDistanceToRoad: { type: Number, default: 0 }, // meters
    accessRoad: {
      type: String,
      enum: ["tarmac", "murram", "earth"],
      default: "tarmac",
    },

    // Nearby facilities
    nearbySchools: [String],
    nearbyHospitals: [String],
    nearbyShopping: [String],
    nearbyChurches: [String],
    nearbyAmenities: [String],

    // Bounding box for searches
    boundingBox: {
      northeast: {
        lat: Number,
        lng: Number,
      },
      southwest: {
        lat: Number,
        lng: Number,
      },
    },
  },
  { _id: false }
);

/**
 * Property Media Schema (Enhanced)
 */
const propertyMediaSchema = new Schema(
  {
    images: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
        thumbnailUrl: String,
        caption: String,
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    videos: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
        thumbnailUrl: String,
        duration: Number,
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    virtualTours: [
      {
        type: Schema.Types.ObjectId,
        ref: "VirtualTour",
      },
    ],

    floorPlans: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
        name: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);

/**
 * Property Specifications Schema
 */
const propertySpecsSchema = new Schema(
  {
    // Basic specs
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    halfBaths: { type: Number, default: 0 },
    kitchens: { type: Number, default: 1 },
    livingRooms: { type: Number, default: 1 },
    diningRooms: { type: Number, default: 0 },

    // Measurements
    totalArea: { type: Number }, // square meters
    builtUpArea: { type: Number },
    plotSize: { type: Number },

    // Building details
    floors: { type: Number, default: 1 },
    floorLevel: { type: Number },
    yearBuilt: { type: Number },
    condition: {
      type: String,
      enum: ["new", "excellent", "good", "fair", "needs_renovation"],
      default: "good",
    },
    furnished: {
      type: String,
      enum: ["unfurnished", "semi_furnished", "fully_furnished"],
      default: "unfurnished",
    },

    // Construction details
    roofType: {
      type: String,
      enum: ["iron_sheets", "tiles", "concrete", "thatch"],
    },
    wallType: {
      type: String,
      enum: ["stone", "brick", "block", "wood", "mixed"],
    },
    floorType: {
      type: String,
      enum: ["tiles", "concrete", "wood", "marble", "terrazzo"],
    },
  },
  { _id: false }
);

/**
 * Property Rules Schema
 */
const propertyRulesSchema = new Schema(
  {
    petsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    partiesAllowed: { type: Boolean, default: false },
    childrenAllowed: { type: Boolean, default: true },
    sublettingAllowed: { type: Boolean, default: false },

    // Specific restrictions
    maxOccupants: { type: Number },
    quietHours: {
      start: String, // HH:mm format
      end: String,
    },

    // Lease terms
    minimumLease: { type: Number, default: 12 }, // months
    maximumLease: { type: Number },
    renewalTerms: String,

    // Special requirements
    creditCheckRequired: { type: Boolean, default: false },
    employmentVerification: { type: Boolean, default: false },
    previousLandlordReference: { type: Boolean, default: false },

    customRules: [String],
  },
  { _id: false }
);

/**
 * Property Availability Schema
 */
const propertyAvailabilitySchema = new Schema(
  {
    isAvailable: { type: Boolean, default: true },
    availableFrom: { type: Date },
    availableTo: { type: Date },

    // Viewing schedule
    viewingDays: [
      {
        day: {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
        startTime: String, // HH:mm
        endTime: String, // HH:mm
      },
    ],

    // Contact for viewing
    viewingContact: {
      name: String,
      phone: String,
      alternativePhone: String,
      preferredMethod: {
        type: String,
        enum: ["call", "whatsapp", "sms"],
        default: "call",
      },
    },

    // Booking requirements
    viewingFee: { type: Number },
    bookingDeposit: { type: Number },
  },
  { _id: false }
);

// Legacy amenity schema (kept for backward compatibility)
const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
  description: { type: String },
});

/**
 * Property schema definition
 */
const propertySchema = new Schema<IProperty>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    slug: { type: String, required: true, trim: true, unique: true },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "Landlord",
      required: true,
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
    },
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    type: {
      type: String,
      enum: Object.values(PropertyType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PropertyStatus),
      default: PropertyStatus.DRAFT,
      required: true,
    },
    // Enhanced structured location
    location: propertyLocationSchema,
    geolocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // Structured fields
    specifications: propertySpecsSchema,
    amenities: propertyAmenitiesSchema,
    rules: propertyRulesSchema,
    availability: propertyAvailabilitySchema,
    pricing: propertyPricingSchema,

    aiInsights: {
      marketValue: { type: Number, default: 0 },
      rentPrediction: { type: Number, default: 0 },
      occupancyScore: { type: Number, default: 0 },
      investmentScore: { type: Number, default: 0 },
      maintenanceRisk: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
      },
      lastUpdated: { type: Date, default: Date.now },
    },

    media: propertyMediaSchema,

    utilities: {
      electricity: {
        provider: String,
        meterNumber: String,
        averageMonthlyBill: Number,
      },
      water: {
        provider: String,
        meterNumber: String,
        averageMonthlyBill: Number,
      },
      internet: {
        available: { type: Boolean, default: false },
        providers: [String],
      },
      waste: {
        collectionDay: String,
        provider: String,
      },
    },

    compliance: {
      titleDeed: { type: Boolean, default: false },
      occupancyCertificate: { type: Boolean, default: false },
      fireCompliance: { type: Boolean, default: false },
      environmentalCompliance: { type: Boolean, default: false },
      countyApprovals: [String],
      insurancePolicy: String,
      lastInspection: Date,
    },

    // Statistics
    stats: {
      views: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      applications: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      averageRating: { type: Number },
      totalReviews: { type: Number },
    },

    // Legal
    governingLaw: { type: String, default: "Laws of Kenya" },
    jurisdiction: { type: String, default: "Kenya" },

    // SEO & Marketing
    tags: [String],
    featured: {
      type: Boolean,
      default: false,
    },

    // Verification
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },

    // Moderation
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "pending",
    },
    moderationNotes: { type: String },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: { type: Date },

    // Timestamps
    publishedAt: { type: Date },
    lastUpdatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },

    // Computed fields
    pricePerSqm: { type: Number },
    isPromoted: { type: Boolean, default: false },
    distanceFromCenter: { type: Number }, // km from city center

    energyRating: String,
    viewings: [
      {
        type: Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    /*applications: [
      {
        type: Schema.Types.ObjectId,
        ref: "Application",
      },
    ],*/
    currentTenants: [
      [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    ],

    listingType: {
      type: String,
      enum: Object.values(ListingType),
      required: true,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create index for location-based queries - ensure it's only on the geolocation field
propertySchema.index({ geolocation: "2dsphere" });

// Indexes for efficient querying
propertySchema.index({ memberId: 1, status: 1 });
propertySchema.index({ "location.county": 1, "location.constituency": 1 });
propertySchema.index({ "location.coordinates": "2dsphere" });
propertySchema.index({ "pricing.rent": 1 });
propertySchema.index({
  "specifications.bedrooms": 1,
  "specifications.bathrooms": 1,
});
propertySchema.index({ type: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ featured: 1 });
propertySchema.index({ verified: 1 });
propertySchema.index({ moderationStatus: 1 });
propertySchema.index({ tags: 1 });

// Ensure regular indexes on non-geospatial fields
propertySchema.index({ "location.address.line1": 1 });
propertySchema.index({ "location.address.town": 1 });
propertySchema.index({ "location.address.postalCode": 1 });

// Create index for search queries (Full text search index)
propertySchema.index({
  title: "text",
  description: "text",
  "location.address.line1": "text",
  "location.address.town": "text",
  "location.address.postalCode": "text",
});

/**
 * Pre-save hook to automatically convert location to coordinates
 */
propertySchema.pre("save", async function (next) {
  // Generate slug if not provided
  if (!this.slug && this.title) {
    this.slug = `${slugify(this.title)}-${this._id}`;
  }

  // Calculate price per square meter
  if (this.specifications.totalArea && this.pricing.rent) {
    this.pricePerSqm = Math.round(
      this.pricing.rent / this.specifications.totalArea
    );
  }

  // Update lastUpdatedAt
  this.lastUpdatedAt = new Date();

  // Ensure only one primary image
  if (this.media.images && this.media.images.length > 0) {
    let primaryCount = 0;
    for (const img of this.media.images) {
      if (img.isPrimary) {
        primaryCount++;
        if (primaryCount > 1) {
          img.isPrimary = false;
        }
      }
    }

    // If no primary image, set the first one as primary
    if (primaryCount === 0) {
      // biome-ignore lint/style/noNonNullAssertion: ignore
      this.media.images[0]!.isPrimary = true;
    }
  }

  // Set published date when status changes to active
  if (
    this.isModified("status") &&
    this.status === PropertyStatus.ACTIVE &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  // Always ensure geolocation field is properly initialized
  if (!this.geolocation) {
    this.geolocation = {
      type: "Point",
      coordinates: [0, 0],
    };
  }

  // Check if location or address has changed
  if (
    (this.isModified("location") && this.location) ||
    (this.isModified("location.address") && this.location.address)
  ) {
    try {
      let coordinatesFound = false;

      // Try with full location string first
      if (this.location) {
        const coordinates = await geocodeAddress(this.location.address.line1);

        // Only update if we got valid coordinates (not 0,0)
        if (coordinates[0] !== 0 || coordinates[1] !== 0) {
          this.geolocation.type = "Point";
          this.geolocation.coordinates = coordinates;
          coordinatesFound = true;
        }
      }

      // If location failed or returned 0,0, try with formatted address
      if (!coordinatesFound && this.location.address) {
        const formattedAddress = [
          this.location.address.line1,
          this.location.address.line2,
          this.location.address.town,
          this.location.county,
          this.location.address.postalCode,
          this.location.country,
        ]
          .filter(Boolean)
          .join(", ");

        if (formattedAddress) {
          const coordinates = await geocodeAddress(formattedAddress);

          // Only update if we got valid coordinates (not 0,0)
          if (coordinates[0] !== 0 || coordinates[1] !== 0) {
            this.geolocation.type = "Point";
            this.geolocation.coordinates = coordinates;
            coordinatesFound = true;
          }
        }
      }

      // If we still don't have coordinates, try with just the postal code
      if (
        !coordinatesFound &&
        this.location.address &&
        this.location.address.postalCode
      ) {
        const coordinates = await geocodePostalCode(
          this.location.address.postalCode
        );

        if (coordinates[0] !== 0 || coordinates[1] !== 0) {
          this.geolocation.type = "Point";
          this.geolocation.coordinates = coordinates;
        }
      }
    } catch (error) {
      // Log error but don't block saving
      console.error("Error geocoding address:", error);
      // Default coordinates [0,0] will be used
    }
  }

  // Validate geolocation format before saving to ensure it's a valid GeoJSON Point
  if (
    !(this.geolocation?.type && Array.isArray(this.geolocation.coordinates))
  ) {
    this.geolocation = {
      type: "Point",
      coordinates: [0, 0],
    };
  }

  next();
});

// Virtual for occupancy rate
// propertySchema.virtual("occupancyRate").get(function () {
// 	if (this.totalUnits === 0) return 0;
// 	return Math.round((this.occupiedUnits / this.totalUnits) * 100);
// });

// Virtual for available units
// propertySchema.virtual("availableUnits").get(function () {
// 	return this.totalUnits - this.occupiedUnits;
// });

// Virtual for populating virtual tours
propertySchema.virtual("virtualToursData", {
  ref: "VirtualTour",
  localField: "_id",
  foreignField: "propertyId",
  justOne: false,
});

// Virtual fields
propertySchema.virtual("primaryImage").get(function () {
  const primaryImg = this.media.images.find((img: any) => img.isPrimary);
  return primaryImg ? primaryImg.url : this.media.images[0]?.url || null;
});

propertySchema.virtual("imageCount").get(function () {
  return this.media.images.length;
});

propertySchema.virtual("fullAddress").get(function () {
  return `${this.location.address}, ${this.location.estate}, ${this.location.county}`;
});

/**
 * Method to get main image URL
 * @returns URL of the main image or first image or null
 */
propertySchema.methods.getMainImage = function (): string | null {
  // Try new media.images first
  if (this.media.images && this.media.images.length > 0) {
    const mainImage = this.media.images.find((img: any) => img.isPrimary);
    return mainImage
      ? mainImage.url
      : this.media.images[0]
        ? this.media.images[0].url
        : null;
  }

  return null;
};

/**
 * Method to calculate total monthly cost
 * @returns Monthly rent amount
 */
propertySchema.methods.getTotalMonthlyCost = function (): number {
  const rent = this.pricing.rent || 0;
  const frequency = this.pricing.paymentFrequency;

  if (frequency === "weekly") {
    return (rent * 52) / 12; // Convert weekly to monthly
  }

  if (frequency === "daily") {
    return (rent * 365) / 12; // Convert daily to monthly
  }

  if (frequency === "quarterly") {
    return rent / 3; // Convert quarterly to monthly
  }

  if (frequency === "annually") {
    return rent / 12; // Convert annually to monthly
  }

  return rent; // Already monthly
};

/**
 * Method to get the primary virtual tour
 * @returns Primary virtual tour ID or null
 */
propertySchema.methods.getPrimaryVirtualTour =
  function (): mongoose.Types.ObjectId | null {
    if (this.media.virtualTours && this.media.virtualTours.length > 0) {
      // Return the first published virtual tour, or just the first one
      return this.media.virtualTours[0];
    }
    return null;
  };

/**
 * Method to check if property has virtual tours
 * @returns Boolean indicating if property has virtual tours
 */
propertySchema.methods.hasVirtualTours = function (): boolean {
  return this.media.virtualTours && this.media.virtualTours.length > 0;
};

/**
 * Virtual for formatting the address
 */
// propertySchema.virtual("formattedAddress").get(function (): string {
//   const address = this.location.address;
//   let formatted = "";

//   if (address.line1) {
//     formatted += address.line1;
//   }

//   if (address.line2) {
//     formatted += `, ${address.line2}`;
//   }

//   if (address.town) {
//     formatted += `, ${address.town}`;
//   }

//   if (address.postalCode) {
//     formatted += `, ${address.postalCode}`;
//   }

//   return formatted;
// });

// Static method to find available properties
propertySchema.statics.findAvailable = function () {
  return this.find({
    "availability.isAvailable": true,
    status: PropertyStatus.ACTIVE,
  });
};

// Static method to find by owner
propertySchema.statics.findByOwner = function (ownerId: string) {
  return this.find({ landlord: ownerId });
};

// Static method to find by location
propertySchema.statics.findByLocation = function (
  city: string,
  county?: string
) {
  const query: any = { "location.address.town": city };
  if (county) query["location.county"] = county;
  return this.find(query);
};

// Instance methods
propertySchema.methods.incrementViews = function () {
  this.stats.views += 1;
  return this.save();
};

propertySchema.methods.incrementInquiries = function () {
  this.stats.inquiries += 1;
  return this.save();
};

propertySchema.methods.incrementApplications = function () {
  this.stats.applications += 1;
  return this.save();
};

propertySchema.methods.toggleBookmark = function () {
  // This would be used with user bookmarks
  // Implementation depends on bookmark system
  return this;
};

propertySchema.methods.updateRating = function (
  newRating: number,
  reviewCount: number
) {
  this.stats.averageRating = newRating;
  this.stats.totalReviews = reviewCount;
  return this.save();
};

propertySchema.methods.isOwnedBy = function (userId: string) {
  return this.owner.toString() === userId;
};

propertySchema.methods.canBeEditedBy = function (
  userId: string,
  userRole: string
) {
  return (
    this.isOwnedBy(userId) ||
    this.agent?.toString() === userId ||
    ["admin", "super_admin"].includes(userRole)
  );
};

// Static methods
propertySchema.statics.findByOwner = function (ownerId: string) {
  return this.find({ owner: ownerId }).sort({ createdAt: -1 });
};

propertySchema.statics.findAvailable = function (filters = {}) {
  return this.find({
    status: PropertyStatus.ACTIVE,
    "availability.isAvailable": true,
    moderationStatus: "approved",
    ...filters,
  });
};

propertySchema.statics.searchByLocation = function (
  latitude: number,
  longitude: number,
  radius = 5
) {
  return this.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: radius * 1000, // Convert km to meters
      },
    },
    status: PropertyStatus.ACTIVE,
    "availability.isAvailable": true,
    moderationStatus: "approved",
  });
};

propertySchema.statics.getFeatured = function (limit = 10) {
  return this.find({
    featured: true,
    status: PropertyStatus.ACTIVE,
    "availability.isAvailable": true,
    moderationStatus: "approved",
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Create and export the Property model
export const Property: Model<IProperty> = mongoose.model<IProperty>(
  "Property",
  propertySchema
);
