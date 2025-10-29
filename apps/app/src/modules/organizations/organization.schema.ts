import * as z from "zod";

// Schema for organization address
export const organizationAddressSchema = z.object({
  country: z.string().min(1, "Country is required"),
  county: z.string().min(1, "County is required"),
  town: z.string().min(1, "Town is required"),
  street: z.string().min(1, "Street is required"),
  postalCode: z.string().optional(),
});

// Schema for organization creation
export const createOrganizationFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["landlord", "property_manager", "agency", "other"]),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  address: organizationAddressSchema,
  registrationNumber: z.string().optional(),
  kraPin: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
});

// Schema for organization update
export const updateOrganizationFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  type: z.enum(["landlord", "property_manager", "agency", "other"]).optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: organizationAddressSchema.partial().optional(),
  registrationNumber: z.string().optional(),
  kraPin: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  id: z.string().optional(), // For edit mode
});

// Type for create form values
export type CreateOrganizationFormValues = z.infer<
  typeof createOrganizationFormSchema
>;

// Type for update form values
export type UpdateOrganizationFormValues = z.infer<
  typeof updateOrganizationFormSchema
>;
