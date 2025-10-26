import { ListingType, PropertyStatus, PropertyType } from "@kaa/models/types";
import { t } from "elysia";

// ==================== REUSABLE SCHEMAS ====================

// Coordinates schema
const coordinatesSchema = t.Object({
  latitude: t.Number(),
  longitude: t.Number(),
});

// Address schema
const addressSchema = t.Object({
  line1: t.String(),
  line2: t.Optional(t.String()),
  town: t.String(),
  postalCode: t.String(),
  directions: t.Optional(t.String()),
});

// Location schema
const locationSchema = t.Object({
  country: t.String(),
  county: t.String(),
  constituency: t.String(),
  ward: t.String(),
  estate: t.String(),
  address: addressSchema,
  coordinates: coordinatesSchema,
  plotNumber: t.Optional(t.String()),
  buildingName: t.Optional(t.String()),
  floor: t.Optional(t.Number()),
  unitNumber: t.Optional(t.String()),
  nearbyTransport: t.Optional(t.Array(t.String())),
  walkingDistanceToRoad: t.Optional(t.Number()),
  accessRoad: t.Optional(
    t.Union([t.Literal("tarmac"), t.Literal("murram"), t.Literal("earth")])
  ),
  nearbySchools: t.Optional(t.Array(t.String())),
  nearbyHospitals: t.Optional(t.Array(t.String())),
  nearbyShopping: t.Optional(t.Array(t.String())),
  nearbyChurches: t.Optional(t.Array(t.String())),
  nearbyAmenities: t.Optional(t.Array(t.String())),
});

// Pricing schema
const pricingSchema = t.Object({
  rent: t.Number(),
  currency: t.Optional(t.Union([t.Literal("KES"), t.Literal("USD")])),
  deposit: t.Number(),
  serviceFee: t.Optional(t.Number()),
  agentFee: t.Optional(t.Number()),
  legalFee: t.Optional(t.Number()),
  paymentFrequency: t.Optional(
    t.Union([
      t.Literal("monthly"),
      t.Literal("quarterly"),
      t.Literal("annually"),
      t.Literal("daily"),
      t.Literal("weekly"),
    ])
  ),
  advanceMonths: t.Optional(t.Number()),
  depositMonths: t.Optional(t.Number()),
  negotiable: t.Optional(t.Boolean()),
  utilitiesIncluded: t.Optional(
    t.Object({
      water: t.Optional(t.Boolean()),
      electricity: t.Optional(t.Boolean()),
      internet: t.Optional(t.Boolean()),
      garbage: t.Optional(t.Boolean()),
      security: t.Optional(t.Boolean()),
    })
  ),
});

// Specifications schema
const specificationsSchema = t.Object({
  bedrooms: t.Number(),
  bathrooms: t.Number(),
  halfBaths: t.Optional(t.Number()),
  kitchens: t.Optional(t.Number()),
  livingRooms: t.Optional(t.Number()),
  diningRooms: t.Optional(t.Number()),
  totalArea: t.Optional(t.Number()),
  builtUpArea: t.Optional(t.Number()),
  plotSize: t.Optional(t.Number()),
  floors: t.Optional(t.Number()),
  floorLevel: t.Optional(t.Number()),
  yearBuilt: t.Optional(t.Number()),
  condition: t.Optional(
    t.Union([
      t.Literal("new"),
      t.Literal("excellent"),
      t.Literal("good"),
      t.Literal("fair"),
      t.Literal("needs_renovation"),
    ])
  ),
  furnished: t.Optional(
    t.Union([
      t.Literal("unfurnished"),
      t.Literal("semi_furnished"),
      t.Literal("fully_furnished"),
    ])
  ),
  roofType: t.Optional(
    t.Union([
      t.Literal("iron_sheets"),
      t.Literal("tiles"),
      t.Literal("concrete"),
      t.Literal("thatch"),
    ])
  ),
  wallType: t.Optional(
    t.Union([
      t.Literal("stone"),
      t.Literal("brick"),
      t.Literal("block"),
      t.Literal("wood"),
      t.Literal("mixed"),
    ])
  ),
  floorType: t.Optional(
    t.Union([
      t.Literal("tiles"),
      t.Literal("concrete"),
      t.Literal("wood"),
      t.Literal("marble"),
      t.Literal("terrazzo"),
    ])
  ),
});

// Amenities schema
const amenitiesSchema = t.Object({
  water: t.Optional(t.Boolean()),
  electricity: t.Optional(t.Boolean()),
  parking: t.Optional(t.Boolean()),
  security: t.Optional(t.Boolean()),
  garden: t.Optional(t.Boolean()),
  swimmingPool: t.Optional(t.Boolean()),
  gym: t.Optional(t.Boolean()),
  lift: t.Optional(t.Boolean()),
  generator: t.Optional(t.Boolean()),
  solarPower: t.Optional(t.Boolean()),
  internet: t.Optional(t.Boolean()),
  dstv: t.Optional(t.Boolean()),
  cableTv: t.Optional(t.Boolean()),
  storeRoom: t.Optional(t.Boolean()),
  servantQuarter: t.Optional(t.Boolean()),
  studyRoom: t.Optional(t.Boolean()),
  balcony: t.Optional(t.Boolean()),
  compound: t.Optional(t.Boolean()),
  gate: t.Optional(t.Boolean()),
  perimeter: t.Optional(t.Boolean()),
  borehole: t.Optional(t.Boolean()),
  laundry: t.Optional(t.Boolean()),
  cleaning: t.Optional(t.Boolean()),
  caretaker: t.Optional(t.Boolean()),
  cctv: t.Optional(t.Boolean()),
});

// Rules schema
const rulesSchema = t.Object({
  petsAllowed: t.Optional(t.Boolean()),
  smokingAllowed: t.Optional(t.Boolean()),
  partiesAllowed: t.Optional(t.Boolean()),
  childrenAllowed: t.Optional(t.Boolean()),
  sublettingAllowed: t.Optional(t.Boolean()),
  maxOccupants: t.Optional(t.Number()),
  quietHours: t.Optional(
    t.Object({
      start: t.String(),
      end: t.String(),
    })
  ),
  minimumLease: t.Optional(t.Number()),
  maximumLease: t.Optional(t.Number()),
  renewalTerms: t.Optional(t.String()),
  creditCheckRequired: t.Optional(t.Boolean()),
  employmentVerification: t.Optional(t.Boolean()),
  previousLandlordReference: t.Optional(t.Boolean()),
  customRules: t.Optional(t.Array(t.String())),
});

// Availability schema
const availabilitySchema = t.Object({
  isAvailable: t.Optional(t.Boolean()),
  availableFrom: t.Optional(t.String()),
  availableTo: t.Optional(t.String()),
  viewingDays: t.Optional(
    t.Array(
      t.Object({
        day: t.Union([
          t.Literal("monday"),
          t.Literal("tuesday"),
          t.Literal("wednesday"),
          t.Literal("thursday"),
          t.Literal("friday"),
          t.Literal("saturday"),
          t.Literal("sunday"),
        ]),
        startTime: t.String(),
        endTime: t.String(),
      })
    )
  ),
  viewingContact: t.Optional(
    t.Object({
      name: t.String(),
      phone: t.String(),
      alternativePhone: t.Optional(t.String()),
      preferredMethod: t.Optional(
        t.Union([t.Literal("call"), t.Literal("whatsapp"), t.Literal("sms")])
      ),
    })
  ),
  viewingFee: t.Optional(t.Number()),
  bookingDeposit: t.Optional(t.Number()),
});

// Media schema
const mediaSchema = t.Object({
  images: t.Optional(
    t.Array(
      t.Object({
        id: t.String(),
        url: t.String(),
        thumbnailUrl: t.Optional(t.String()),
        caption: t.Optional(t.String()),
        isPrimary: t.Optional(t.Boolean()),
        order: t.Optional(t.Number()),
      })
    )
  ),
  videos: t.Optional(
    t.Array(
      t.Object({
        id: t.String(),
        url: t.String(),
        thumbnailUrl: t.Optional(t.String()),
        duration: t.Optional(t.Number()),
        caption: t.Optional(t.String()),
      })
    )
  ),
  floorPlans: t.Optional(
    t.Array(
      t.Object({
        id: t.String(),
        url: t.String(),
        name: t.Optional(t.String()),
      })
    )
  ),
});

// ==================== REQUEST SCHEMAS ====================

export const createPropertySchema_v1 = t.Object({
  title: t.String({ minLength: 10 }),
  description: t.String({ minLength: 50 }),
  type: t.Enum(PropertyType),
  listingType: t.Enum(ListingType),
  landlord: t.String(),
  agent: t.Optional(t.String()),
  memberId: t.Optional(t.String()),
  organizationId: t.Optional(t.String()),
  location: locationSchema,
  pricing: pricingSchema,
  specifications: specificationsSchema,
  amenities: t.Optional(amenitiesSchema),
  rules: t.Optional(rulesSchema),
  availability: t.Optional(availabilitySchema),
  media: t.Optional(mediaSchema),
  tags: t.Optional(t.Array(t.String())),
});

export const createPropertySchema = t.Object({
  title: t.String({ minLength: 10 }),
  description: t.String({ minLength: 50 }),
  type: t.Enum(PropertyType),
  county: t.String(),
  estate: t.String(),
  address: t.String(),
  coordinates: t.Object({
    latitude: t.Number(),
    longitude: t.Number(),
  }),
  nearbyAmenities: t.Optional(t.Array(t.String())),
  plotNumber: t.Optional(t.String()),
  buildingName: t.Optional(t.String()),

  bedrooms: t.Number(),
  bathrooms: t.Number(),
  furnished: t.Enum({
    unfurnished: "unfurnished",
    semi_furnished: "semi_furnished",
    fully_furnished: "fully_furnished",
  }),
  totalArea: t.Optional(t.Number()),
  condition: t.Enum({
    new: "new",
    excellent: "excellent",
    good: "good",
    fair: "fair",
    needs_renovation: "needs_renovation",
  }),

  rent: t.Number(),
  deposit: t.Number(),
  serviceFee: t.Optional(t.Number()),
  paymentFrequency: t.Enum({
    monthly: "monthly",
    quarterly: "quarterly",
    annually: "annually",
  }),
  advanceMonths: t.Number(),
  depositMonths: t.Number(),

  amenities: t.Array(t.String()),

  images: t.Array(t.String()),

  availableFrom: t.Optional(t.String()),

  viewingContact: t.Object({
    name: t.String(),
    phone: t.String(),
  }),

  petsAllowed: t.Boolean(),
  minimumLease: t.Number(),

  tags: t.Optional(t.Array(t.String())),
});

export const updatePropertySchema = t.Partial(createPropertySchema);

export const propertyQuerySchema = t.Object({
  page: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  sortBy: t.Optional(t.String()),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  status: t.Optional(t.String()),
  type: t.Optional(t.String()),
  listingType: t.Optional(t.String()),
  landlordId: t.Optional(t.String()),
  agentId: t.Optional(t.String()),
  memberId: t.Optional(t.String()),
  organizationId: t.Optional(t.String()),
  county: t.Optional(t.String()),
  estate: t.Optional(t.String()),
  minRent: t.Optional(t.String()),
  maxRent: t.Optional(t.String()),
  minBedrooms: t.Optional(t.String()),
  maxBedrooms: t.Optional(t.String()),
  minBathrooms: t.Optional(t.String()),
  maxBathrooms: t.Optional(t.String()),
  amenities: t.Optional(t.String()), // Comma-separated
  featured: t.Optional(t.String()),
  verified: t.Optional(t.String()),
  isAvailable: t.Optional(t.String()),
  moderationStatus: t.Optional(t.String()),
  search: t.Optional(t.String()),
  tags: t.Optional(t.String()), // Comma-separated
  latitude: t.Optional(t.String()),
  longitude: t.Optional(t.String()),
  maxDistance: t.Optional(t.String()), // in meters
  publishedAfter: t.Optional(t.String()),
  publishedBefore: t.Optional(t.String()),
});

export const updatePricingSchema = t.Object({
  rent: t.Optional(t.Number()),
  deposit: t.Optional(t.Number()),
  serviceFee: t.Optional(t.Number()),
  agentFee: t.Optional(t.Number()),
  legalFee: t.Optional(t.Number()),
  paymentFrequency: t.Optional(t.String()),
  advanceMonths: t.Optional(t.Number()),
  depositMonths: t.Optional(t.Number()),
  negotiable: t.Optional(t.Boolean()),
  reason: t.Optional(t.String()),
});

export const addImageSchema = t.Object({
  id: t.String(),
  url: t.String(),
  thumbnailUrl: t.Optional(t.String()),
  caption: t.Optional(t.String()),
  isPrimary: t.Optional(t.Boolean()),
  order: t.Optional(t.Number()),
});

export const updateAvailabilitySchema = t.Object({
  isAvailable: t.Boolean(),
  availableFrom: t.Optional(t.String()),
});

export const bulkStatusUpdateSchema = t.Object({
  propertyIds: t.Array(t.String()),
  status: t.Union([
    t.Literal(PropertyStatus.DRAFT),
    t.Literal(PropertyStatus.ACTIVE),
    t.Literal(PropertyStatus.INACTIVE),
    t.Literal(PropertyStatus.LET),
    t.Literal(PropertyStatus.MAINTENANCE),
  ]),
});

export const moderationSchema = t.Object({
  reason: t.Optional(t.String()),
});
