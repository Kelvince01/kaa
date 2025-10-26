import {
  type CreatePropertyData,
  FurnishedStatus,
  PropertyCondition,
  PropertyType,
} from "@kaa/models/types";
import { z } from "zod";

/**
 * Schema for Property Creation Form V4
 * Strictly follows CreatePropertyData from @packages/models/src/types/property.type.ts
 */

// Step 1: Basic Information
export const basicInfoSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  type: z.string() as z.ZodType<PropertyType>,
  furnished: z.enum(Object.values(FurnishedStatus), {
    error: "Furnished status is required",
  }),
  tags: z.array(z.string()).optional(),
});

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

// Step 2: Location Details
export const locationSchema = z.object({
  county: z.string().min(1, "County is required"),
  estate: z.string().min(1, "Estate/Neighborhood is required"),
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
  bedrooms: z.number().int().min(0, "Bedrooms cannot be negative").max(50),
  bathrooms: z.number().int().min(0, "Bathrooms cannot be negative").max(50),
  totalArea: z.number().positive("Area must be positive").optional(),
  condition: z.enum(Object.values(PropertyCondition), {
    error: "Property condition is required",
  }),
});

export type SpecificationsFormData = z.infer<typeof specificationsSchema>;

// Step 4: Pricing Information
export const pricingSchema = z.object({
  rent: z.number().positive("Rent must be greater than 0"),
  deposit: z.number().min(0, "Deposit cannot be negative"),
  serviceFee: z.number().min(0, "Service fee cannot be negative").optional(),
  paymentFrequency: z.enum(["monthly", "quarterly", "annually"]),
  advanceMonths: z
    .number()
    .int()
    .min(0, "Advance months cannot be negative")
    .max(12, "Maximum 12 months advance"),
  depositMonths: z
    .number()
    .int()
    .min(0, "Deposit months cannot be negative")
    .max(12, "Maximum 12 months deposit"),
});

export type PricingFormData = z.infer<typeof pricingSchema>;

// Step 5: Amenities
export const amenitiesSchema = z.object({
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
});

export type AmenitiesFormData = z.infer<typeof amenitiesSchema>;

// Step 6: Media Upload
export const mediaSchema = z.object({
  images: z
    .array(z.string().url("Must be a valid URL"))
    .min(1, "Upload at least 1 image")
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
    .max(60, "Maximum lease period is 60 months"),
});

export type RulesFormData = z.infer<typeof rulesSchema>;

// Complete form schema matching CreatePropertyData exactly
export const propertyFormSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(2000),
  type: z.enum(Object.values(PropertyType), {
    error: "Property type is required",
  }),
  county: z.string().min(1),
  estate: z.string().min(1),
  address: z.string().min(5),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  nearbyAmenities: z.array(z.string()).optional(),
  plotNumber: z.string().optional(),
  buildingName: z.string().optional(),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().int().min(0).max(50),
  furnished: z.enum(Object.values(FurnishedStatus), {
    error: "Furnished status is required",
  }),
  totalArea: z.number().positive().optional(),
  condition: z.enum(Object.values(PropertyCondition), {
    error: "Property condition is required",
  }),
  rent: z.number().positive(),
  deposit: z.number().min(0),
  serviceFee: z.number().min(0).optional(),
  paymentFrequency: z.enum(["monthly", "quarterly", "annually"]),
  advanceMonths: z.number().int().min(0).max(12),
  depositMonths: z.number().int().min(0).max(12),
  amenities: z.array(z.string()).min(1),
  images: z.array(z.string().url()).min(1).max(20),
  availableFrom: z.string().optional(),
  viewingContact: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
  }),
  petsAllowed: z.boolean(),
  minimumLease: z.number().int().min(1).max(60),
  tags: z.array(z.string()).optional(),
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;

// Transform form data to CreatePropertyData format
export function transformToCreatePropertyData(
  formData: PropertyFormData
): CreatePropertyData {
  return {
    title: formData.title,
    description: formData.description,
    type: formData.type,
    county: formData.county,
    estate: formData.estate,
    address: formData.address,
    coordinates: formData.coordinates,
    nearbyAmenities: formData.nearbyAmenities,
    plotNumber: formData.plotNumber,
    buildingName: formData.buildingName,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    furnished: formData.furnished,
    totalArea: formData.totalArea,
    condition: formData.condition,
    rent: formData.rent,
    deposit: formData.deposit,
    serviceFee: formData.serviceFee,
    paymentFrequency: formData.paymentFrequency,
    advanceMonths: formData.advanceMonths,
    depositMonths: formData.depositMonths,
    amenities: formData.amenities,
    images: formData.images,
    availableFrom: formData.availableFrom,
    viewingContact: formData.viewingContact,
    petsAllowed: formData.petsAllowed,
    minimumLease: formData.minimumLease,
    tags: formData.tags,
  };
}

// Default values for the form
export const defaultPropertyValues: PropertyFormData = {
  title: "",
  description: "",
  type: PropertyType.APARTMENT,
  county: "",
  estate: "",
  address: "",
  coordinates: {
    latitude: -1.286_389,
    longitude: 36.817_223,
  },
  bedrooms: 1,
  bathrooms: 1,
  furnished: FurnishedStatus.UNFURNISHED,
  condition: PropertyCondition.GOOD,
  rent: 0,
  deposit: 0,
  paymentFrequency: "monthly",
  advanceMonths: 1,
  depositMonths: 1,
  amenities: [],
  images: [],
  viewingContact: {
    name: "",
    phone: "",
  },
  petsAllowed: false,
  minimumLease: 6,
  tags: [],
};

// Step configuration for the stepper
export const propertyFormSteps = [
  {
    id: "basic",
    label: "Basic Info",
    description: "Property title and description",
    icon: "📝",
  },
  {
    id: "location",
    label: "Location",
    description: "Where is your property?",
    icon: "📍",
  },
  {
    id: "specifications",
    label: "Specifications",
    description: "Property details",
    icon: "🏠",
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Rental terms",
    icon: "💰",
  },
  {
    id: "amenities",
    label: "Amenities",
    description: "Available facilities",
    icon: "⭐",
  },
  {
    id: "media",
    label: "Media",
    description: "Photos and videos",
    icon: "📸",
  },
  {
    id: "availability",
    label: "Availability",
    description: "Contact info",
    icon: "📅",
  },
  {
    id: "rules",
    label: "Rules",
    description: "Policies",
    icon: "📋",
  },
  {
    id: "review",
    label: "Review",
    description: "Final review",
    icon: "✅",
  },
] as const;

export type StepId = (typeof propertyFormSteps)[number]["id"];

// Individual step schemas for validation
export const stepSchemas = {
  basic: basicInfoSchema,
  location: locationSchema,
  specifications: specificationsSchema,
  pricing: pricingSchema,
  amenities: amenitiesSchema,
  media: mediaSchema,
  availability: availabilitySchema,
  rules: rulesSchema,
};
