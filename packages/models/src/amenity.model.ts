import mongoose, { type Model, Schema } from "mongoose";
// import { geocodeAddress } from "@kaa/utils";
import {
  AmenityApprovalStatus,
  AmenityCategory,
  AmenitySource,
  AmenityType,
  type IAmenity,
} from "./types/amenity.type";

/**
 * Amenity schema definition
 */
export const amenitySchema = new Schema<IAmenity>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AmenityType),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(AmenityCategory),
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Source and discovery tracking
    source: {
      type: String,
      enum: Object.values(AmenitySource),
      required: true,
      default: AmenitySource.MANUAL,
      index: true,
    },
    isAutoDiscovered: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(AmenityApprovalStatus),
      required: true,
      default: AmenityApprovalStatus.PENDING,
      index: true,
    },
    discoveredAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },

    // Enhanced verification tracking
    verificationLevel: {
      type: String,
      enum: ["unverified", "basic", "full", "community_verified"],
      default: "unverified",
      index: true,
    },
    verificationNotes: {
      type: String,
      trim: true,
    },
    lastVerificationDate: {
      type: Date,
    },
    verificationHistory: [
      {
        verifiedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        verifiedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
        verificationLevel: {
          type: String,
          enum: ["basic", "full", "community_verified"],
          required: true,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],

    // Location details (Kenya-specific)
    location: {
      country: { type: String, required: true, default: "Kenya" },
      county: { type: String, required: true, index: true },
      constituency: { type: String, index: true },
      ward: { type: String, index: true },
      estate: { type: String, index: true },
      address: {
        line1: { type: String, required: true },
        line2: { type: String },
        town: { type: String, required: true, index: true },
        postalCode: { type: String },
      },
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
    },

    geolocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude] - GeoJSON format
        required: true,
        index: "2dsphere", // Enable geospatial queries
      },
    },

    distance: {
      type: Number,
      min: 0, // in meters
    },

    // Additional details
    contact: {
      phone: {
        type: String,
        trim: true,
        match: /^\+254[0-9]{9}$/, // Kenyan phone format },
        email: {
          type: String,
          trim: true,
          lowercase: true,
          match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        website: { type: String, trim: true },
      },

      // Operating hours
      operatingHours: {
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
    },

    // Ratings and reviews
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Verification status
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },

    // Additional metadata
    tags: [{ type: String, trim: true }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
amenitySchema.index({ geolocation: "2dsphere" }); // Geospatial index for proximity queries
amenitySchema.index({ category: 1, type: 1 }); // Compound index for category and type filtering
amenitySchema.index({ "location.county": 1, category: 1 }); // County-based filtering
amenitySchema.index({ verified: 1, isActive: 1 }); // Status filtering
amenitySchema.index({ source: 1, approvalStatus: 1 }); // Source and approval filtering
amenitySchema.index({ isAutoDiscovered: 1, approvalStatus: 1 }); // Discovery status filtering
amenitySchema.index({ approvalStatus: 1, discoveredAt: -1 }); // Pending approvals
amenitySchema.index({ verificationLevel: 1, verified: 1 }); // Verification filtering
amenitySchema.index({ name: "text", description: "text" }); // Text search

// Pre-save middleware to set geolocation from coordinates
amenitySchema.pre("save", function (next) {
  if (this.location?.coordinates) {
    this.geolocation = {
      type: "Point",
      coordinates: [
        this.location.coordinates.longitude,
        this.location.coordinates.latitude,
      ],
    };
  }
  next();
});

// Pre-update middleware for findOneAndUpdate
amenitySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;
  if (update?.location?.coordinates) {
    update.geolocation = {
      type: "Point",
      coordinates: [
        update.location.coordinates.longitude,
        update.location.coordinates.latitude,
      ],
    };
  }
  next();
});

// Virtual for distance calculation (populated by aggregation)
// amenitySchema.virtual("distance");
amenitySchema.virtual("walkingTime");
amenitySchema.virtual("drivingTime");

/**
 * Static methods for the amenity model
 */
amenitySchema.statics = {
  /**
   * Find amenities near a specific location
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm = 5,
    options: {
      categories?: AmenityCategory[];
      types?: AmenityType[];
      limit?: number;
      verified?: boolean;
    } = {}
  ) {
    const { categories, types, limit = 50, verified } = options;

    const matchStage: any = {
      isActive: true,
      geolocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON format
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      },
    };

    if (categories?.length) {
      matchStage.category = { $in: categories };
    }

    if (types?.length) {
      matchStage.type = { $in: types };
    }

    if (verified !== undefined) {
      matchStage.verified = verified;
    }

    return await this.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          distance: {
            $divide: [
              {
                $sqrt: {
                  $add: [
                    {
                      $pow: [
                        {
                          $multiply: [
                            {
                              $subtract: [
                                {
                                  $arrayElemAt: ["$geolocation.coordinates", 1],
                                },
                                latitude,
                              ],
                            },
                            111.32, // km per degree latitude
                          ],
                        },
                        2,
                      ],
                    },
                    {
                      $pow: [
                        {
                          $multiply: [
                            {
                              $multiply: [
                                {
                                  $subtract: [
                                    {
                                      $arrayElemAt: [
                                        "$geolocation.coordinates",
                                        0,
                                      ],
                                    },
                                    longitude,
                                  ],
                                },
                                {
                                  $cos: {
                                    $multiply: [latitude, Math.PI / 180],
                                  },
                                },
                              ],
                            },
                            111.32, // km per degree longitude at equator
                          ],
                        },
                        2,
                      ],
                    },
                  ],
                },
              },
              1,
            ],
          },
        },
      },
      { $sort: { distance: 1 } },
      { $limit: limit },
    ]);
  },

  /**
   * Get amenities grouped by category for a location
   */
  async findNearbyGrouped(
    latitude: number,
    longitude: number,
    radiusKm = 5,
    options: {
      categories?: AmenityCategory[];
      limit?: number;
      verified?: boolean;
    } = {}
  ) {
    const { categories, limit = 10, verified } = options;

    const matchStage: any = {
      isActive: true,
      geolocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000,
        },
      },
    };

    if (categories?.length) {
      matchStage.category = { $in: categories };
    }

    if (verified !== undefined) {
      matchStage.verified = verified;
    }

    return await this.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          distance: {
            $divide: [
              {
                $sqrt: {
                  $add: [
                    {
                      $pow: [
                        {
                          $multiply: [
                            {
                              $subtract: [
                                {
                                  $arrayElemAt: ["$geolocation.coordinates", 1],
                                },
                                latitude,
                              ],
                            },
                            111.32,
                          ],
                        },
                        2,
                      ],
                    },
                    {
                      $pow: [
                        {
                          $multiply: [
                            {
                              $multiply: [
                                {
                                  $subtract: [
                                    {
                                      $arrayElemAt: [
                                        "$geolocation.coordinates",
                                        0,
                                      ],
                                    },
                                    longitude,
                                  ],
                                },
                                {
                                  $cos: {
                                    $multiply: [latitude, Math.PI / 180],
                                  },
                                },
                              ],
                            },
                            111.32,
                          ],
                        },
                        2,
                      ],
                    },
                  ],
                },
              },
              1,
            ],
          },
        },
      },
      { $sort: { distance: 1 } },
      {
        $group: {
          _id: "$category",
          amenities: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: "$_id",
          amenities: { $slice: ["$amenities", limit] },
          count: 1,
          _id: 0,
        },
      },
      { $sort: { category: 1 } },
    ]);
  },
};

/**
 * Amenity model
 */
export const Amenity: Model<IAmenity> = mongoose.model<IAmenity>(
  "Amenity",
  amenitySchema
);
