import z from "zod";

export const propertyFormSchema = z.object({
  basic: z.object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(100, "Title must be less than 100 characters"),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters"),
    type: z.string().min(1, "Property type is required"),
    listingType: z.enum(["rent", "sale"]).default("rent").optional(),
  }),
  details: z.object({
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    size: z.number().optional(),
  }),
  pricing: z.object({
    rentAmount: z.number().positive("Rent amount must be greater than 0"),
    currency: z.enum(["KES", "USD"]),
    paymentFrequency: z.enum([
      "monthly",
      "quarterly",
      "annually",
      "daily",
      "weekly",
    ]),
    securityDeposit: z.number().min(0, "Security deposit cannot be negative"),
    serviceCharge: z
      .number()
      .min(0, "Service charge cannot be negative")
      .optional(),
    utilitiesIncluded: z.array(z.string()),
    negotiable: z.boolean(),

    // depositType: z.enum(["per_night", "per_week", "per_month", "per_year"]),
    // securityDepositType: z.enum(["per_night", "per_week", "per_month", "per_year"]),
    // cleaningFee: z.number().positive("Cleaning fee must be greater than 0"),
  }),
  location: z.object({
    county: z.string().min(1, "County is required"),
    constituency: z.string().optional(),
    country: z.string().optional(),
    address: z.object({
      line1: z.string().min(1, "Address line 1 is required"),
      line2: z.string().optional(),
      town: z.string().min(1, "Town is required"),
      postalCode: z.string().min(1, "Postal code is required"),
    }),
    geolocation: z
      .object({
        coordinates: z
          .array(z.number())
          .length(2, "Coordinates must be an array of two numbers"),
      })
      .optional(),
  }),
  media: z.object({
    photos: z
      .array(
        z.object({
          id: z.string().optional(),
          url: z.url("Must be a valid URL"),
          caption: z.string().optional(),
          isPrimary: z.boolean(),
          tags: z.array(z.string()).optional(),
          quality: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        })
      )
      .min(1, "At least one photo is required"),
    virtualTour: z.string().optional(), // url
    floorPlan: z
      .object({
        id: z.string().optional(),
        // url: z.url("Must be a valid URL").optional(),
        url: z.string().optional(),
        caption: z.string().optional(),
      })
      .optional(),
    epcImage: z
      .object({
        id: z.string().optional(),
        url: z.string().optional(), // url
        caption: z.string().optional(),
        rating: z.string().optional(),
      })
      .optional(),
    videos: z
      .array(
        z.object({
          id: z.string().optional(),
          url: z.string().optional(), // url
          thumbnail: z.string().optional(),
        })
      )
      .optional(),
  }),
  availability: z.object({
    availableFrom: z.date().optional(),
    availableTo: z.date().optional(),
    noticePeriod: z.number().optional(),
  }),
  features: z.object({
    amenities: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          icon: z.string().optional(),
        })
      )
      .optional(),
    features: z.array(z.string()).optional(),
    furnished: z.boolean().optional(),
    parking: z.boolean().optional(),
  }),
  published: z.boolean().optional(),
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;
