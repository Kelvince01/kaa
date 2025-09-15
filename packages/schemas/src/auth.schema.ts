import { z } from "zod";

export const LoginUserRequestSchema = z.object({
  email: z.string().default("user@example.com"),
  password: z.string().default("Password123!"),
});

export const LoginUserResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    memberId: z.optional(z.string()),
    avatar: z.optional(z.string()),
    role: z.string(),
    phone: z.optional(z.string()),
    address: z.optional(
      z.object({
        line1: z.string(),
        town: z.string(),
        postalCode: z.string(),
        county: z.string(),
        country: z.string(),
      })
    ),
    status: z.enum(["active", "inactive", "suspended", "pending"]),
    isActive: z.boolean(),
    isVerified: z.boolean(),
    lastLoginAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  tokens: z.object({
    access_token: z.string(),
    refresh_token: z.string(),
  }),
  message: z.string(),
});

export const LoginTwoFactorSchema = z.object({
  status: z.literal("success"),
  message: z.string(),
  requiresTwoFactor: z.boolean(),
  userId: z.string(),
});

export const RegisterUserRequestSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  phone: z.string(),
  avatar: z.optional(z.string()),
  isVerified: z.optional(z.boolean()),
  isActive: z.optional(z.boolean()),
  status: z.optional(z.enum(["active", "inactive", "suspended", "pending"])),
});

export const RegisterUserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export const VerifyUserRequestSchema = z.object({
  token: z.string(),
});

export const ForgotPasswordRequestSchema = z.object({
  email: z.string(),
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string(),
  password: z.string(),
});

export const ApiKeyRequestSchema = z.object({
  name: z.string(),
  permissions: z.array(z.string()),
  expiresAt: z.date(),
  rateLimit: z.object({
    requests: z.number(),
    window: z.number(),
  }),
});

export const ApiKeyUpdateRequestSchema = z.object({
  name: z.optional(z.string()),
  permissions: z.optional(z.array(z.string())),
  expiresAt: z.optional(z.date()),
  rateLimit: z.optional(
    z.object({
      requests: z.number(),
      window: z.number(),
    })
  ),
});

export const ApiKeyResponseSchema = z.object({
  apiKey: z.string(),
  key: z.string(),
});

export const ApiKeyUsageSchema = z.object({
  totalRequests: z.number(),
  lastRequest: z.date(),
  lastUsedAt: z.date(),
  rateLimit: z.object({
    requests: z.number(),
    window: z.number(),
  }),
});

export const ApiKeyBaseResponseSchema = z.object({
  name: z.string(),
  permissions: z.array(z.string()),
  expiresAt: z.optional(z.date()),
  rateLimit: z.optional(
    z.object({
      requests: z.number(),
      window: z.number(),
    })
  ),
});

export type RegisterUserRequest = z.infer<typeof RegisterUserRequestSchema>;
export type RegisterUserResponse = z.infer<typeof RegisterUserResponseSchema>;

export type LoginUserRequest = z.infer<typeof LoginUserRequestSchema>;
export type LoginUserResponse = z.infer<typeof LoginUserResponseSchema>;

export type LoginTwoFactorRequest = z.infer<typeof LoginTwoFactorSchema>;

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export type ApiKeyRequest = z.infer<typeof ApiKeyRequestSchema>;
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;
