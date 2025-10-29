import * as z from "zod";

// Schema for member settings
const memberSettingsSchema = z.object({
  theme: z.string().optional(),
  maxUsers: z.number().min(1, "Maximum users must be at least 1"),
  features: z.array(z.string()),
  customBranding: z.boolean(),
  allowInvites: z.boolean(),
  requireEmailVerification: z.boolean(),
  twoFactorRequired: z.boolean(),
});

// Schema for member creation
export const createMemberFormSchema = z.object({
  user: z.string().min(1, "User is required"),
  organization: z.string().min(1, "Organization is required"),
  role: z.string().min(1, "Role is required"),
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  plan: z.enum(["free", "starter", "professional", "enterprise"]).optional(),
});

// Schema for member update
export const updateMemberFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  domain: z.string().url("Invalid domain URL").optional().or(z.literal("")),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  plan: z.enum(["free", "starter", "professional", "enterprise"]).optional(),
  isActive: z.boolean().optional(),
  settings: memberSettingsSchema.partial().optional(),
  id: z.string().optional(), // For edit mode
});

// Type for create form values
export type CreateMemberFormValues = z.infer<typeof createMemberFormSchema>;

// Type for update form values
export type UpdateMemberFormValues = z.infer<typeof updateMemberFormSchema>;
