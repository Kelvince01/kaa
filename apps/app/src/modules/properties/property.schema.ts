import { FurnishedStatus, PropertyCondition } from "@kaa/models/types";
import { z } from "zod";

// Enhanced validation schemas for property creation

// Address schema with improved validation
const addressSchema = z.object({
  street: z
    .string()
    .min(3, "Street address must be at least 3 characters")
    .max(200),
  city: z.string().min(2, "City must be at least 2 characters").max(100),
  county: z.string().min(2, "County is required").max(100),
  constituency: z.string().optional(),
  postalCode: z.string().min(5, "Valid postal code required").max(10),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  neighborhood: z.string().optional(),
  landmark: z.string().optional(),
});

// Media schema with enhanced validation
const mediaSchema = z.object({
  photos: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().url(),
        caption: z.string().optional(),
        isPrimary: z.boolean(),
        order: z.number().min(0),
        alt: z.string().optional(),
        size: z.number().positive().optional(),
        dimensions: z
          .object({
            width: z.number().positive(),
            height: z.number().positive(),
          })
          .optional(),
      })
    )
    .min(1, "At least one photo is required")
    .max(20, "Maximum 20 photos allowed"),
  videos: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().url(),
        thumbnail: z.string().url().optional(),
        duration: z.number().positive().optional(),
        caption: z.string().optional(),
      })
    )
    .max(5, "Maximum 5 videos allowed"),
  virtualTour: z
    .object({
      url: z.string().url(),
      provider: z.enum(["matterport", "360", "custom"]),
    })
    .optional(),
});

// Features schema with comprehensive options
const featuresSchema = z.object({
  amenities: z.array(
    z.enum([
      "parking",
      "garden",
      "balcony",
      "terrace",
      "pool",
      "gym",
      "security",
      "elevator",
      "aircon",
      "heating",
      "fireplace",
      "storage",
      "laundry",
      "dishwasher",
      "microwave",
      "wifi",
      "cable",
      "pets_allowed",
      "smoking_allowed",
    ])
  ),
  accessibility: z.array(
    z.enum([
      "wheelchair_accessible",
      "ramp_access",
      "wide_doorways",
      "accessible_bathroom",
      "elevator_access",
      "accessible_parking",
      "visual_aids",
      "hearing_aids",
    ])
  ),
  safety: z.array(
    z.enum([
      "smoke_detector",
      "carbon_monoxide_detector",
      "security_system",
      "deadbolt",
      "window_locks",
      "security_cameras",
      "gated_community",
      "doorman",
    ])
  ),
  appliances: z.array(
    z.enum([
      "refrigerator",
      "stove",
      "oven",
      "microwave",
      "dishwasher",
      "washer",
      "dryer",
      "air_conditioner",
      "heater",
      "garbage_disposal",
    ])
  ),
  utilities: z.object({
    electricity: z.enum(["included", "separate", "prepaid"]),
    water: z.enum(["included", "separate", "prepaid"]),
    gas: z.enum(["included", "separate", "prepaid", "na"]),
    internet: z.enum(["included", "separate", "na"]),
    cable: z.enum(["included", "separate", "na"]),
    maintenance: z.enum(["included", "separate"]),
  }),
});

// Pricing schema with market validation
const pricingSchema = z
  .object({
    rentAmount: z
      .number()
      .positive("Rent amount must be positive")
      .min(1000, "Minimum rent is KES 1,000"),
    currency: z.enum(["KES", "USD", "EUR"]),
    paymentFrequency: z.enum(["monthly", "weekly", "daily"]),
    securityDeposit: z
      .number()
      .min(0, "Security deposit cannot be negative")
      .optional(),
    maintenanceFee: z
      .number()
      .min(0, "Maintenance fee cannot be negative")
      .optional(),
    utilitiesCost: z
      .number()
      .min(0, "Utilities cost cannot be negative")
      .optional(),
    negotiable: z.boolean(),
    minimumStay: z
      .number()
      .min(1, "Minimum stay must be at least 1 day")
      .max(365, "Maximum stay cannot exceed 1 year")
      .optional(),
    maximumStay: z.number().min(1).max(3650).optional(),
    advancePayment: z
      .number()
      .min(0, "Advance payment cannot be negative")
      .max(12, "Maximum 12 months advance"),
  })
  .refine(
    (data) => {
      if (data.maximumStay && data.minimumStay) {
        return data.maximumStay >= data.minimumStay;
      }
      return true;
    },
    {
      message: "Maximum stay must be greater than minimum stay",
      path: ["maximumStay"],
    }
  );

// Basic info schema with enhanced validation
const basicInfoSchema = z
  .object({
    title: z
      .string()
      .min(10, "Title must be at least 10 characters")
      .max(100, "Title cannot exceed 100 characters")
      .refine((title) => title.split(" ").length >= 3, {
        message: "Title should contain at least 3 words",
      }),
    description: z
      .string()
      .min(50, "Description must be at least 50 characters")
      .max(2000, "Description cannot exceed 2000 characters")
      .refine((desc) => desc.split(" ").length >= 10, {
        message: "Description should contain at least 10 words",
      }),
    type: z.enum([
      "apartment",
      "house",
      "condo",
      "townhouse",
      "studio",
      "loft",
      "villa",
      "penthouse",
      "duplex",
      "maisonette",
      "bedsitter",
      "single_room",
    ]),
    listingType: z.enum(["rent", "sale", "lease"]),
    availableFrom: z
      .date()
      .min(new Date(), "Available date cannot be in the past"),
    availableUntil: z.date().optional(),
    furnished: z.enum(Object.values(FurnishedStatus)),
    petPolicy: z.enum(["allowed", "not_allowed", "negotiable"]),
    smokingPolicy: z.enum(["allowed", "not_allowed", "outside_only"]),
    tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
    reference: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.availableUntil) {
        return data.availableUntil > data.availableFrom;
      }
      return true;
    },
    {
      message: "Available until date must be after available from date",
      path: ["availableUntil"],
    }
  );

// Details schema with comprehensive property details
const detailsSchema = z
  .object({
    bedrooms: z
      .number()
      .min(0, "Bedrooms cannot be negative")
      .max(20, "Maximum 20 bedrooms"),
    bathrooms: z
      .number()
      .min(0, "Bathrooms cannot be negative")
      .max(20, "Maximum 20 bathrooms"),
    area: z
      .object({
        value: z.number().positive("Area must be positive"),
        unit: z.enum(["sqft", "sqm"]),
      })
      .optional(),
    floor: z
      .number()
      .min(-5, "Floor cannot be below -5")
      .max(200, "Floor cannot exceed 200")
      .optional(),
    totalFloors: z
      .number()
      .min(1, "Total floors must be at least 1")
      .max(200, "Maximum 200 floors")
      .optional(),
    yearBuilt: z
      .number()
      .min(1800, "Year built cannot be before 1800")
      .max(
        new Date().getFullYear() + 2,
        "Year built cannot be more than 2 years in the future"
      )
      .optional(),
    condition: z.enum(Object.values(PropertyCondition)),
    orientation: z
      .enum([
        "north",
        "south",
        "east",
        "west",
        "northeast",
        "northwest",
        "southeast",
        "southwest",
      ])
      .optional(),
    view: z.array(
      z.enum([
        "city",
        "ocean",
        "mountain",
        "garden",
        "pool",
        "courtyard",
        "street",
      ])
    ),
    parking: z
      .object({
        spaces: z
          .number()
          .min(0, "Parking spaces cannot be negative")
          .max(20, "Maximum 20 parking spaces"),
        type: z
          .enum([
            "garage",
            "carport",
            "street",
            "driveway",
            "covered",
            "uncovered",
          ])
          .optional(),
        cost: z.number().min(0, "Parking cost cannot be negative").optional(),
      })
      .optional(),
    storage: z
      .object({
        available: z.boolean(),
        size: z.string().optional(),
        location: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.totalFloors && data.floor !== undefined) {
        return data.floor <= data.totalFloors;
      }
      return true;
    },
    {
      message: "Floor cannot exceed total floors",
      path: ["floor"],
    }
  );

// Availability schema for rental scheduling
const availabilitySchema = z.object({
  status: z.enum(["available", "occupied", "maintenance", "pending"]),
  showingSchedule: z
    .object({
      days: z.array(
        z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ])
      ),
      timeSlots: z.array(
        z.object({
          start: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
          end: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
        })
      ),
      timezone: z.string(),
    })
    .optional(),
  instantBooking: z.boolean(),
  minimumNotice: z
    .number()
    .min(0, "Minimum notice cannot be negative")
    .max(72, "Maximum 72 hours notice"),
  maximumBookingsPerDay: z
    .number()
    .min(1, "At least 1 booking per day")
    .max(20, "Maximum 20 bookings per day"),
});

// Contact schema for property inquiries
const contactSchema = z.object({
  preferredContact: z.enum(["phone", "email", "whatsapp", "in_app"]),
  phoneNumber: z.string().min(10, "Valid phone number required").max(15),
  whatsappNumber: z.string().optional(),
  showingInstructions: z
    .string()
    .max(500, "Instructions cannot exceed 500 characters")
    .optional(),
  responseTime: z.enum([
    "immediate",
    "within_hour",
    "within_day",
    "within_week",
  ]),
  languages: z.array(
    z.enum(["english", "swahili", "french", "arabic", "spanish"])
  ),
});

// Main property schema
export const propertyFormSchema = z.object({
  basic: basicInfoSchema,
  location: addressSchema,
  details: detailsSchema,
  features: featuresSchema,
  media: mediaSchema,
  pricing: pricingSchema,
  availability: availabilitySchema,
  contact: contactSchema,
  metadata: z
    .object({
      source: z.enum(["manual", "import", "api"]),
      createdBy: z.string().optional(),
      lastModifiedBy: z.string().optional(),
      version: z.number(),
      draft: z.boolean(),
    })
    .optional(),
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;

// Individual step schemas for validation
export const stepSchemas = {
  basic: basicInfoSchema,
  location: addressSchema,
  details: detailsSchema,
  features: featuresSchema,
  media: mediaSchema,
  pricing: pricingSchema,
  availability: availabilitySchema,
  contact: contactSchema,
};

// Validation helpers
export const validateStep = (stepId: keyof typeof stepSchemas, data: any) => {
  const schema = stepSchemas[stepId];
  return schema.safeParse(data);
};

export const getStepProgress = (
  stepId: keyof typeof stepSchemas,
  data: any
) => {
  const result = validateStep(stepId, data);
  if (result.success) return 100;

  // Calculate partial completion based on filled fields
  const schema = stepSchemas[stepId];
  const shape = schema.shape;
  const totalFields = Object.keys(shape).length;
  const filledFields = Object.keys(data || {}).filter((key) => {
    const value = data[key];
    return value !== undefined && value !== null && value !== "";
  }).length;

  return Math.round((filledFields / totalFields) * 100);
};

// Default form values
export const defaultPropertyFormValues: Partial<PropertyFormData> = {
  basic: {
    title: "",
    description: "",
    type: "apartment" as any,
    listingType: "rent" as const,
    availableFrom: new Date(),
    furnished: FurnishedStatus.UNFURNISHED,
    petPolicy: "not_allowed" as const,
    smokingPolicy: "not_allowed" as const,
    tags: [],
    reference: "",
  },
  features: {
    amenities: [],
    accessibility: [],
    safety: [],
    appliances: [],
    utilities: {
      electricity: "separate",
      water: "separate",
      gas: "separate",
      internet: "separate",
      cable: "separate",
      maintenance: "included",
    },
  },
  pricing: {
    rentAmount: 0,
    currency: "KES" as const,
    paymentFrequency: "monthly" as const,
    negotiable: false,
    advancePayment: 1,
  },
  details: {
    bedrooms: 1,
    bathrooms: 1,
    condition: PropertyCondition.GOOD,
    view: [],
  },
  availability: {
    status: "available",
    instantBooking: false,
    minimumNotice: 24,
    maximumBookingsPerDay: 5,
  },
  contact: {
    preferredContact: "phone" as const,
    phoneNumber: "",
    responseTime: "within_hour" as const,
    languages: ["english"] as const,
  },
  metadata: {
    source: "manual",
    version: 1,
    draft: true,
  },
};
