import { geocodeAddress, geocodePostalCode } from "@kaa/utils";
import mongoose, { type Model, Schema } from "mongoose";
import {
  type IProperty,
  ListingType,
  PropertyStatus,
  PropertyType,
} from "./types/property.type";

/**
 * Rent period type
 */
export type RentPeriod = "week" | "month";

/**
 * Furnished status type
 */
export type FurnishedStatus =
  | "unfurnished"
  | "partially furnished"
  | "furnished";

/**
 * Property image interface
 */
type IPropertyImage = {
  url: string;
  caption?: string;
  isPrimary: boolean;
};

/**
 * Property feature type
 */
export type PropertyFeature =
  | "garden"
  | "parking"
  | "garage"
  | "balcony"
  | "pets allowed"
  | "smokers allowed"
  | "students allowed"
  | "families allowed"
  | "bills included"
  | "washing machine"
  | "dishwasher"
  | "dryer"
  | "central heating"
  | "double glazing"
  | "broadband included"
  | "tv"
  | "fireplace"
  | "disabled access"
  | "alarm"
  | "intercom";

/**
 * Bill type
 */
export type BillType =
  | "gas"
  | "electricity"
  | "water"
  | "council tax"
  | "tv license"
  | "internet";

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
      ref: "User",
      required: true,
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
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
    location: {
      country: { type: String, required: true, default: "Kenya" },
      county: { type: String, required: true },
      constituency: { type: String, required: true },
      ward: { type: String, required: true },
      estate: { type: String, required: true },
      address: {
        line1: { type: String, required: true },
        line2: { type: String, required: false },
        town: { type: String, required: true },
        postalCode: { type: String, required: true },
        directions: { type: String, required: false },
      },
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
      nearbyAmenities: [String],
    },
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
    details: {
      rooms: Number,
      bedrooms: Number,
      bathrooms: Number,
      size: { type: Number, required: true },
      furnishedStatus: {
        type: String,
        enum: ["Furnished", "Unfurnished", "Semi-furnished"],
      },
      furnished: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
      security: { type: Boolean, default: false },
      generator: { type: Boolean, default: false },
      borehole: { type: Boolean, default: false },
      water: { type: Boolean, default: false },
      electricity: { type: Boolean, default: false },
      internetReady: { type: Boolean, default: false },
      petFriendly: { type: Boolean, default: false },
      smokingAllowed: { type: Boolean, default: false },
      sublettingAllowed: { type: Boolean, default: false },
      yearBuilt: Number,
      floorLevel: Number,
      totalFloors: Number,
      tags: [String],
    },

    pricing: {
      rentAmount: { type: Number, required: true },
      currency: { type: String, enum: ["KES", "USD"], default: "KES" },
      paymentFrequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually", "daily", "weekly"],
        default: "monthly",
      },
      securityDeposit: { type: Number, required: true },
      serviceCharge: { type: Number, default: 0 },
      lateFee: { type: Number, default: 0 },
      rentDueDate: { type: Number, min: 1, max: 31, default: 5 }, // Day of month
      utilitiesIncluded: [String],
      waterBill: {
        type: String,
        enum: ["Included", "Tenant pays", "Shared"],
        default: "Tenant pays",
      },
      electricityBill: {
        type: String,
        enum: ["Included", "Tenant pays", "Shared"],
        default: "Tenant pays",
      },
      negotiable: { type: Boolean, default: false },
    },

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

    media: {
      photos: [
        {
          url: String,
          caption: String,
          isPrimary: { type: Boolean, default: false },
        },
      ],
      virtualTours: [
        {
          type: Schema.Types.ObjectId,
          ref: "VirtualTour",
        },
      ],
      virtualTour: String, // Deprecated - kept for backward compatibility
      floorPlan: {
        url: String,
        caption: String,
      },
      epcImage: {
        url: String,
        caption: String,
        rating: String,
      },
      videos: [String],
    },

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

    metrics: {
      viewCount: { type: Number, default: 0 },
      inquiryCount: { type: Number, default: 0 },
      applicationCount: { type: Number, default: 0 },
      averageOccupancyRate: { type: Number, default: 0 },
      averageRentCollection: { type: Number, default: 0 },
      maintenanceRequests: { type: Number, default: 0 },
    },
    available: {
      type: Boolean,
      default: true,
    },
    availableFrom: {
      type: Date,
      required: true,
    },
    availableTo: {
      type: Date,
    },

    // Legal
    governingLaw: { type: String, default: "Laws of Kenya" },
    jurisdiction: { type: String, default: "Kenya" },

    features: [String],
    energyRating: String,
    featured: {
      type: Boolean,
      default: false,
    },

    minimumTenancy: {
      type: Number, // in months
      default: 12,
    },
    maxTenants: {
      type: Number,
      default: 1,
    },
    bills: [
      {
        type: String,
        enum: [
          "gas",
          "electricity",
          "water",
          "council tax",
          "tv license",
          "internet",
        ],
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    viewings: [
      {
        type: Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    applications: [
      {
        type: Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
    currentTenants: [
      [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    ],

    favoriteCount: {
      type: Number,
      default: 0,
    },
    amenities: [amenitySchema],
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
propertySchema.index({ "pricing.rentAmount": 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ featured: 1 });

// Ensure regular indexes on non-geospatial fields
propertySchema.index({ "location.address.line1": 1 });
propertySchema.index({ "location.address.town": 1 });
propertySchema.index({ "location.address.postalCode": 1 });
propertySchema.index({ "amenities.name": 1 });

// Create index for search queries (Full text search index)
propertySchema.index({
  title: "text",
  description: "text",
  "location.address.line1": "text",
  "location.address.town": "text",
  "location.address.postalCode": "text",
  "amenities.name": "text",
});

/**
 * Pre-save hook to automatically convert location to coordinates
 */
propertySchema.pre("save", async function (next) {
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

/**
 * Method to get main image URL
 * @returns URL of the main image or first image or null
 */
propertySchema.methods.getMainImage = function (): string | null {
  if (this.media.photos && this.media.photos.length > 0) {
    const mainImage = this.media.photos.find(
      (img: IPropertyImage) => img.isPrimary
    );
    return mainImage
      ? mainImage.url
      : this.media.photos[0]
        ? this.media.photos[0].url
        : null;
  }

  return null;
};

/**
 * Method to calculate total monthly cost
 * @returns Monthly rent amount
 */
propertySchema.methods.getTotalMonthlyCost = function (): number {
  if (this.pricing.paymentFrequency === "weekly") {
    return ((this.pricing.rentAmount || this.pricing.rentAmount) * 52) / 4; // 12
  }
  return this.pricing.rentAmount || this.pricing.rentAmount;
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
propertySchema.virtual("formattedAddress").get(function (): string {
  const address = this.location.address;
  let formatted = "";

  if (address.line1) {
    formatted += address.line1;
  }

  if (address.line2) {
    formatted += `, ${address.line2}`;
  }

  if (address.town) {
    formatted += `, ${address.town}`;
  }

  if (address.postalCode) {
    formatted += `, ${address.postalCode}`;
  }

  return formatted;
});

// Static method to find available properties
propertySchema.statics.findAvailable = function () {
  return this.find({
    available: true,
    status: PropertyStatus.ACTIVE,
    // occupiedUnits: { $lt: "$totalUnits" },
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

// Create and export the Property model
const Property: Model<IProperty> = mongoose.model<IProperty>(
  "Property",
  propertySchema
);

export { Property };
