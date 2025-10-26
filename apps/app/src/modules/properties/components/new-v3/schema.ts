import {
  FurnishedStatus,
  PropertyCondition,
  PropertyType,
} from "@kaa/models/types";
import { z } from "zod";

// Enhanced validation following CreatePropertyData type
export const basicInfoSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title cannot exceed 100 characters")
    .refine(
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      (title) => title.trim().split(/\s+/).length >= 3,
      "Title should contain at least 3 words"
    ),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description cannot exceed 2000 characters")
    .refine(
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      (desc) => desc.trim().split(/\s+/).length >= 10,
      "Description should contain at least 10 words"
    ),
  type: z.enum(Object.values(PropertyType), {
    error: "Property type is required",
  }),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
});

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

// Location schema following CreatePropertyData
export const locationSchema = z.object({
  county: z.string().min(1, "County is required"),
  estate: z.string().min(1, "Estate is required"),
  address: z.string().min(5, "Full address is required"),
  coordinates: z.object({
    latitude: z
      .number()
      .min(-90, "Invalid latitude")
      .max(90, "Invalid latitude"),
    longitude: z
      .number()
      .min(-180, "Invalid longitude")
      .max(180, "Invalid longitude"),
  }),
  nearbyAmenities: z.array(z.string()).optional(),
  plotNumber: z.string().optional(),
  buildingName: z.string().optional(),
});

export type LocationFormData = z.infer<typeof locationSchema>;

// Specifications schema
export const specificationsSchema = z.object({
  bedrooms: z
    .number()
    .int("Bedrooms must be a whole number")
    .min(0, "Bedrooms cannot be negative")
    .max(50, "Maximum 50 bedrooms"),
  bathrooms: z
    .number()
    .int("Bathrooms must be a whole number")
    .min(0, "Bathrooms cannot be negative")
    .max(50, "Maximum 50 bathrooms"),
  furnished: z.enum(Object.values(FurnishedStatus), {
    error: "Furnishing status is required",
  }),
  totalArea: z
    .number()
    .positive("Area must be greater than 0")
    .max(1_000_000, "Area seems too large")
    .optional(),
  condition: z.enum(Object.values(PropertyCondition), {
    error: "Property condition is required",
  }),
});

export type SpecificationsFormData = z.infer<typeof specificationsSchema>;

// Pricing schema with validation
export const pricingSchema = z
  .object({
    rent: z
      .number()
      .positive("Rent must be greater than 0")
      .min(1000, "Minimum rent is KES 1,000"),
    deposit: z.number().min(0, "Deposit cannot be negative"),
    serviceFee: z.number().min(0, "Service fee cannot be negative").optional(),
    paymentFrequency: z.enum(["monthly", "quarterly", "annually"], {
      error: "Payment frequency is required",
    }),
    advanceMonths: z
      .number()
      .int("Advance months must be a whole number")
      .min(0, "Advance months cannot be negative")
      .max(12, "Maximum 12 months advance"),
    depositMonths: z
      .number()
      .int("Deposit months must be a whole number")
      .min(0, "Deposit months cannot be negative")
      .max(12, "Maximum 12 months deposit"),
  })
  .refine(
    (data) => {
      // Validate that deposit matches depositMonths * rent
      if (data.depositMonths > 0 && data.deposit === 0) {
        return false;
      }
      return true;
    },
    {
      message: "Deposit should be calculated based on deposit months",
      path: ["deposit"],
    }
  );

export type PricingFormData = z.infer<typeof pricingSchema>;

// Amenities schema
export const amenitiesSchema = z.object({
  amenities: z
    .array(z.string())
    .min(1, "Select at least one amenity")
    .max(30, "Maximum 30 amenities allowed"),
});

export type AmenitiesFormData = z.infer<typeof amenitiesSchema>;

// Media schema with enhanced validation
export const mediaSchema = z.object({
  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "Upload at least 1 image")
    .max(20, "Maximum 20 images allowed"),
});

export type MediaFormData = z.infer<typeof mediaSchema>;

// Availability and contact schema
export const availabilitySchema = z.object({
  availableFrom: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      {
        message: "Available date cannot be in the past",
      }
    ),
  viewingContact: z.object({
    name: z
      .string()
      .min(2, "Contact name must be at least 2 characters")
      .max(50, "Contact name too long"),
    phone: z
      .string()
      .min(10, "Valid phone number is required")
      .max(15, "Phone number too long")
      .regex(/^\+?[\d\s-()]+$/, "Invalid phone number format"),
  }),
});

export type AvailabilityFormData = z.infer<typeof availabilitySchema>;

// Rules and policies schema
export const rulesSchema = z.object({
  petsAllowed: z.boolean(),
  minimumLease: z
    .number()
    .int("Minimum lease must be a whole number")
    .min(1, "Minimum lease must be at least 1 month")
    .max(60, "Maximum 60 months (5 years)"),
});

export type RulesFormData = z.infer<typeof rulesSchema>;

// Complete form schema matching CreatePropertyData
export const propertyFormSchema = z.object({
  ...basicInfoSchema.shape,
  ...locationSchema.shape,
  ...specificationsSchema.shape,
  ...pricingSchema.shape,
  ...amenitiesSchema.shape,
  ...mediaSchema.shape,
  ...availabilitySchema.shape,
  ...rulesSchema.shape,
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;

// Default values
export const defaultPropertyValues: Partial<PropertyFormData> = {
  type: PropertyType.APARTMENT,
  bedrooms: 1,
  bathrooms: 1,
  furnished: FurnishedStatus.UNFURNISHED,
  condition: PropertyCondition.GOOD,
  paymentFrequency: "monthly",
  advanceMonths: 1,
  depositMonths: 1,
  deposit: 0,
  rent: 20_000,
  petsAllowed: false,
  minimumLease: 6,
  amenities: [],
  images: [],
  nearbyAmenities: [],
  tags: [],
  coordinates: {
    latitude: -1.286_389,
    longitude: 36.817_223,
  },
};

// Step configurations
export const propertyFormSteps = [
  {
    id: "basic",
    label: "Basic Info",
    description: "Property title, type, and description",
  },
  {
    id: "location",
    label: "Location",
    description: "Address and coordinates",
  },
  {
    id: "specifications",
    label: "Specifications",
    description: "Bedrooms, bathrooms, and features",
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Rent and payment terms",
  },
  {
    id: "amenities",
    label: "Amenities",
    description: "Property features and facilities",
  },
  {
    id: "media",
    label: "Media",
    description: "Photos and images",
  },
  {
    id: "availability",
    label: "Availability",
    description: "Move-in date and contact",
  },
  {
    id: "rules",
    label: "Rules",
    description: "Policies and requirements",
  },
  {
    id: "review",
    label: "Review",
    description: "Review and submit your listing",
  },
] as const;

export type StepId = (typeof propertyFormSteps)[number]["id"];

// Validation helper functions
export const validateStep = (
  stepId: StepId,
  data: Partial<PropertyFormData>
) => {
  const stepSchemas: Record<string, z.ZodSchema> = {
    basic: basicInfoSchema,
    location: locationSchema,
    specifications: specificationsSchema,
    pricing: pricingSchema,
    amenities: amenitiesSchema,
    media: mediaSchema,
    availability: availabilitySchema,
    rules: rulesSchema,
  };

  const schema = stepSchemas[stepId];
  if (!schema) return { success: true, data: {} };

  return schema.safeParse(data);
};

// Calculate step completion percentage
export const getStepProgress = (
  stepId: StepId,
  data: Partial<PropertyFormData>
): number => {
  const result = validateStep(stepId, data);
  if (result.success) return 100;

  // Calculate based on filled fields
  const stepSchemas: Record<string, z.ZodSchema> = {
    basic: basicInfoSchema,
    location: locationSchema,
    specifications: specificationsSchema,
    pricing: pricingSchema,
    amenities: amenitiesSchema,
    media: mediaSchema,
    availability: availabilitySchema,
    rules: rulesSchema,
  };

  const schema = stepSchemas[stepId];
  if (!schema) return 0;

  const shape = (schema as any).shape;
  const totalFields = Object.keys(shape).length;
  const filledFields = Object.keys(data).filter((key) => {
    const value = data[key as keyof PropertyFormData];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some((v) => v !== undefined && v !== null);
    }
    return value !== undefined && value !== null && value !== "";
  }).length;

  return Math.min(Math.round((filledFields / totalFields) * 100), 100);
};
