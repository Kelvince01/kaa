import {
  FurnishedStatus,
  PropertyCondition,
  PropertyType,
} from "@kaa/models/types";
import { z } from "zod";

// Step 1: Basic Information
export const basicInfoSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000),
  type: z.enum(Object.values(PropertyType)),
  tags: z.array(z.string()).optional(),
});

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

// Step 2: Location Details
export const locationSchema = z.object({
  county: z.string().min(1, "County is required"),
  estate: z.string().min(1, "Estate is required"),
  address: z.string().min(5, "Address is required"),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  nearbyAmenities: z.array(z.string()).optional(),
  plotNumber: z.string().optional(),
  buildingName: z.string().optional(),
});

export type LocationFormData = z.infer<typeof locationSchema>;

// Step 3: Property Specifications
export const specificationsSchema = z.object({
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().int().min(0).max(50),
  furnished: z.enum(Object.values(FurnishedStatus), {
    error: "Furnished status is required",
  }),
  totalArea: z.number().positive().optional(),
  condition: z.enum(Object.values(PropertyCondition), {
    error: "Property condition is required",
  }),
});

export type SpecificationsFormData = z.infer<typeof specificationsSchema>;

// Step 4: Pricing Information
export const pricingSchema = z.object({
  rent: z.number().positive("Rent must be greater than 0"),
  deposit: z.number().min(0, "Deposit cannot be negative"),
  serviceFee: z.number().min(0).optional(),
  paymentFrequency: z.enum(["monthly", "quarterly", "annually"]),
  advanceMonths: z.number().int().min(0).max(12),
  depositMonths: z.number().int().min(0).max(12),
});

export type PricingFormData = z.infer<typeof pricingSchema>;

// Step 5: Amenities & Features
export const amenitiesSchema = z.object({
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
});

export type AmenitiesFormData = z.infer<typeof amenitiesSchema>;

// Step 6: Media Upload
export const mediaSchema = z.object({
  images: z
    .array(z.string())
    .min(3, "Upload at least 3 images")
    .max(20, "Maximum 20 images allowed"),
});

export type MediaFormData = z.infer<typeof mediaSchema>;

// Step 7: Availability & Contact
export const availabilitySchema = z.object({
  availableFrom: z.string().optional(),
  viewingContact: z.object({
    name: z.string().min(2, "Contact name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
  }),
});

export type AvailabilityFormData = z.infer<typeof availabilitySchema>;

// Step 8: Rules & Policies
export const rulesSchema = z.object({
  petsAllowed: z.boolean(),
  minimumLease: z
    .number()
    .int()
    .min(1, "Minimum lease must be at least 1 month")
    .max(60),
});

export type RulesFormData = z.infer<typeof rulesSchema>;

// Complete form schema combining all steps
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

// Default values for the form
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
  petsAllowed: false,
  minimumLease: 6,
  amenities: [],
  images: [],
  nearbyAmenities: [],
  tags: [],
};

// Step configuration for the stepper
export const propertyFormSteps = [
  {
    id: "basic",
    label: "Basic Info",
    description: "Property title and description",
    schema: basicInfoSchema,
  },
  {
    id: "location",
    label: "Location",
    description: "Where is the property located?",
    schema: locationSchema,
  },
  {
    id: "specifications",
    label: "Specifications",
    description: "Property details and features",
    schema: specificationsSchema,
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Rental and payment terms",
    schema: pricingSchema,
  },
  {
    id: "amenities",
    label: "Amenities",
    description: "Available facilities",
    schema: amenitiesSchema,
  },
  {
    id: "media",
    label: "Media",
    description: "Photos and videos",
    schema: mediaSchema,
  },
  {
    id: "availability",
    label: "Availability",
    description: "When and how to view",
    schema: availabilitySchema,
  },
  {
    id: "rules",
    label: "Rules",
    description: "Policies and requirements",
    schema: rulesSchema,
  },
] as const;

export type StepId = (typeof propertyFormSteps)[number]["id"];
