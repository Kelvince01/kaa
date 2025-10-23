import { AmenityCategory, AmenityType } from "@kaa/models/types";
import { t } from "elysia";

/**
 * Schema for amenity coordinates
 */
export const coordinatesSchema = t.Object({
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
});

/**
 * Schema for amenity location
 */
export const locationSchema = t.Object({
  country: t.String({ default: "Kenya" }),
  county: t.String(),
  constituency: t.Optional(t.String()),
  ward: t.Optional(t.String()),
  estate: t.Optional(t.String()),
  address: t.Object({
    line1: t.String(),
    line2: t.Optional(t.String()),
    town: t.String(),
    postalCode: t.Optional(t.String()),
  }),
  coordinates: coordinatesSchema,
});

/**
 * Schema for amenity contact information
 */
export const contactSchema = t.Optional(
  t.Object({
    phone: t.Optional(t.String()),
    email: t.Optional(t.String({ format: "email" })),
    website: t.Optional(t.String({ format: "uri" })),
  })
);

/**
 * Schema for operating hours
 */
export const operatingHoursSchema = t.Optional(
  t.Object({
    monday: t.Optional(
      t.Array(
        t.Object({
          open: t.String(),
          close: t.String(),
          closed: t.Optional(t.Boolean()),
        })
      )
    ),
    tuesday: t.Optional(
      t.Array(
        t.Object({
          open: t.String(),
          close: t.String(),
          closed: t.Optional(t.Boolean()),
        })
      )
    ),
    wednesday: t.Optional(
      t.Array(
        t.Object({
          open: t.String(),
          close: t.String(),
          closed: t.Optional(t.Boolean()),
        })
      )
    ),
    thursday: t.Optional(
      t.Array(
        t.Object({
          open: t.String(),
          close: t.String(),
          closed: t.Optional(t.Boolean()),
        })
      )
    ),
    friday: t.Optional(
      t.Array(
        t.Object({
          open: t.String(),
          close: t.String(),
          closed: t.Optional(t.Boolean()),
        })
      )
    ),
    saturday: t.Optional(
      t.Array(
        t.Object({
          open: t.String(),
          close: t.String(),
          closed: t.Optional(t.Boolean()),
        })
      )
    ),
    sunday: t.Optional(
      t.Array(
        t.Object({
          open: t.String(),
          close: t.String(),
          closed: t.Optional(t.Boolean()),
        })
      )
    ),
  })
);

/**
 * Schema for geolocation
 */
export const geolocationSchema = t.Object({
  type: t.String(),
  coordinates: t.Array(t.Number()),
});

/**
 * Schema for creating a new amenity
 */
export const createAmenitySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  type: t.Enum(AmenityType),
  category: t.Enum(AmenityCategory),
  description: t.Optional(t.String({ maxLength: 1000 })),
  location: locationSchema,
  contact: contactSchema,
  operatingHours: operatingHoursSchema,
  geolocation: geolocationSchema,
  tags: t.Optional(t.Array(t.String())),
});

/**
 * Schema for updating an amenity
 */
export const updateAmenitySchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  type: t.Optional(t.Enum(AmenityType)),
  category: t.Optional(t.Enum(AmenityCategory)),
  description: t.Optional(t.String({ maxLength: 1000 })),
  location: t.Optional(locationSchema),
  contact: contactSchema,
  operatingHours: operatingHoursSchema,
  rating: t.Optional(t.Number({ minimum: 0, maximum: 5 })),
  tags: t.Optional(t.Array(t.String())),
  isActive: t.Optional(t.Boolean()),
});

/**
 * Schema for nearby amenities query parameters
 */
export const nearbyAmenitiesQuerySchema = t.Object({
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
  radius: t.Optional(t.Number({ minimum: 0.1, maximum: 50, default: 5 })),
  categories: t.Optional(t.Array(t.Enum(AmenityCategory))),
  types: t.Optional(t.Array(t.Enum(AmenityType))),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
  verified: t.Optional(t.Boolean()),
});

/**
 * Schema for search amenities query parameters
 */
export const searchAmenitiesQuerySchema = t.Object({
  q: t.String({ minLength: 1 }),
  county: t.Optional(t.String()),
  categories: t.Optional(t.Array(t.Enum(AmenityCategory))),
  types: t.Optional(t.Array(t.Enum(AmenityType))),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  verified: t.Optional(t.Boolean()),
});

/**
 * Schema for county amenities query parameters
 */
export const countyAmenitiesQuerySchema = t.Object({
  county: t.String(),
  category: t.Optional(t.Enum(AmenityCategory)),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
  verified: t.Optional(t.Boolean()),
});

/**
 * Schema for property amenities query parameters
 */
export const propertyAmenitiesQuerySchema = t.Object({
  propertyId: t.String(),
  radius: t.Optional(t.Number({ minimum: 0.1, maximum: 10, default: 2 })),
});

/**
 * Schema for amenity score query parameters
 */
export const amenityScoreQuerySchema = t.Object({
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
  radius: t.Optional(t.Number({ minimum: 0.1, maximum: 10, default: 2 })),
});

/**
 * Schema for amenity response
 */
export const amenityResponseSchema = t.Object({
  _id: t.String(),
  name: t.String(),
  type: t.Enum(AmenityType),
  category: t.Enum(AmenityCategory),
  description: t.Optional(t.String()),
  location: locationSchema,
  contact: contactSchema,
  operatingHours: operatingHoursSchema,
  geolocation: geolocationSchema,
  rating: t.Number(),
  reviewCount: t.Number(),
  verified: t.Boolean(),
  verifiedAt: t.Optional(t.Date()),
  tags: t.Optional(t.Array(t.String())),
  isActive: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

/**
 * Schema for amenity with distance response
 */
export const amenityWithDistanceResponseSchema = t.Intersect([
  amenityResponseSchema,
  t.Object({
    distance: t.Number(),
    walkingTime: t.Optional(t.Number()),
    drivingTime: t.Optional(t.Number()),
  }),
]);

/**
 * Schema for grouped amenities response
 */
export const groupedAmenitiesResponseSchema = t.Object({
  category: t.Enum(AmenityCategory),
  amenities: t.Array(amenityWithDistanceResponseSchema),
  count: t.Number(),
});

/**
 * Schema for amenity score response
 */
export const amenityScoreResponseSchema = t.Object({
  score: t.Number({ minimum: 0, maximum: 100 }),
  breakdown: t.Optional(t.Record(t.Enum(AmenityCategory), t.Number())),
  totalAmenities: t.Number(),
});

/**
 * Schema for area stats response
 */
export const areaStatsResponseSchema = t.Object({
  totalAmenities: t.Number(),
  categoryCounts: t.Record(t.Enum(AmenityCategory), t.Number()),
  verifiedPercentage: t.Number({ minimum: 0, maximum: 100 }),
});

/**
 * Schema for amenity metadata response
 */
export const amenityMetadataResponseSchema = t.Object({
  categories: t.Array(t.Enum(AmenityCategory)),
  types: t.Array(t.Enum(AmenityType)),
  categoryTypeMapping: t.Record(
    t.Enum(AmenityCategory),
    t.Array(t.Enum(AmenityType))
  ),
});

/**
 * Schema for bulk import response
 */
export const bulkImportResponseSchema = t.Object({
  created: t.Number(),
  errors: t.Number(),
  errorDetails: t.Array(t.String()),
});
