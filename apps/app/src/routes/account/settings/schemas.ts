import { z } from "zod";

// Profile settings schema
export const profileSettingsSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
  phone: z.string().optional(),
  address: z
    .object({
      line1: z.string().optional(),
      city: z.string().optional(),
      county: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
});

// Security settings schema
export const securitySettingsSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Two-factor authentication schema
export const twoFactorSchema = z.object({
  enabled: z.boolean(),
});

// Notification settings schema
export const notificationSettingsSchema = z.object({
  emailNotifications: z.object({
    marketing: z.boolean(),
    updates: z.boolean(),
    security: z.boolean(),
    billing: z.boolean(),
  }),
  pushNotifications: z.object({
    enabled: z.boolean(),
    marketing: z.boolean(),
    updates: z.boolean(),
    security: z.boolean(),
  }),
  smsNotifications: z.object({
    enabled: z.boolean(),
    security: z.boolean(),
    billing: z.boolean(),
  }),
});

// Privacy settings schema
export const privacySettingsSchema = z.object({
  dataRetention: z.enum(["1_year", "2_years", "5_years", "indefinite"]),
  profileVisibility: z.enum(["public", "private", "friends_only"]),
  dataSharing: z.object({
    analytics: z.boolean(),
    marketing: z.boolean(),
    thirdParty: z.boolean(),
  }),
  cookiePreferences: z.object({
    necessary: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
});

// Payment settings schema
export const paymentMethodSchema = z.object({
  type: z.enum(["card", "bank_account", "paypal"]),
  isDefault: z.boolean(),
  card: z
    .object({
      cardNumber: z.string().min(1, "Card number is required"),
      expiryDate: z.string().min(1, "Expiry date is required"),
      cvv: z.string().min(3, "CVV must be at least 3 digits"),
      cardholderName: z.string().min(1, "Cardholder name is required"),
    })
    .optional(),
  billingAddress: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

export const paymentSettingsSchema = z.object({
  paymentMethods: z.array(paymentMethodSchema),
  defaultPaymentMethod: z.string().optional(),
  billingEmail: z.string().email("Invalid email address"),
});

// TypeScript types derived from schemas
export type ProfileSettingsData = z.infer<typeof profileSettingsSchema>;
export type SecuritySettingsData = z.infer<typeof securitySettingsSchema>;
export type TwoFactorData = z.infer<typeof twoFactorSchema>;
export type NotificationSettingsData = z.infer<
  typeof notificationSettingsSchema
>;
export type PrivacySettingsData = z.infer<typeof privacySettingsSchema>;
export type PaymentMethodData = z.infer<typeof paymentMethodSchema>;
export type PaymentSettingsData = z.infer<typeof paymentSettingsSchema>;
