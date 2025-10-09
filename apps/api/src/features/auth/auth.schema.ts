import { t } from "elysia";

// User parameter validation
export const userParamsSchema = t.Object({
  id: t.String(),
});

// Verification status update schema
export const verificationStatusSchema = t.Object({
  emailVerified: t.Optional(t.Date()),
  phoneVerified: t.Optional(t.Date()),
  identityVerified: t.Optional(t.Date()),
  kycStatus: t.Optional(
    t.Enum({
      pending: "pending",
      submitted: "submitted",
      verified: "verified",
      rejected: "rejected",
    })
  ),
  rejectionReason: t.Optional(t.String()),
});

export const LoginUserResponseSchema = t.Object({
  user: t.Object({
    id: t.String(),
    username: t.String(),
    firstName: t.String(),
    lastName: t.String(),
    email: t.String(),
    memberId: t.Optional(t.String()),
    avatar: t.Optional(t.String()),
    role: t.String(),
    phone: t.Optional(t.String()),
    address: t.Optional(
      t.Object({
        type: t.Union([
          t.Literal("residential"),
          t.Literal("work"),
          t.Literal("postal"),
        ]),
        estate: t.Optional(t.String()),
        line1: t.Optional(t.String()),
        town: t.Optional(t.String()),
        postalCode: t.Optional(t.String()),
        county: t.String(),
        country: t.String(),
        directions: t.Optional(t.String()),
        coordinates: t.Optional(
          t.Object({
            latitude: t.Number(),
            longitude: t.Number(),
          })
        ),
        isPrimary: t.Boolean(),
      })
    ),
    status: t.Enum({
      active: "active",
      inactive: "inactive",
      suspended: "suspended",
      pending: "pending",
    }),
    isActive: t.Boolean(),
    isVerified: t.Boolean(),
    lastLoginAt: t.Optional(t.Date()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  }),
  tokens: t.Object({
    access_token: t.String(),
    refresh_token: t.String(),
  }),
  message: t.String(),
});

export const LoginTwoFactorSchema = t.Object({
  status: t.Literal("success"),
  message: t.String(),
  requiresTwoFactor: t.Boolean(),
  userId: t.String(),
});

export const RegisterUserRequestSchema = t.Object({
  username: t.String(),
  email: t.String(),
  password: t.String(),
  firstName: t.String(),
  lastName: t.String(),
  role: t.String(),
  phone: t.String(),
  avatar: t.Optional(t.String()),
  isVerified: t.Optional(t.Boolean()),
  isActive: t.Optional(t.Boolean()),
  status: t.Optional(
    t.Enum({
      active: "active",
      inactive: "inactive",
      suspended: "suspended",
      pending: "pending",
    })
  ),
  acceptTerms: t.Boolean(),
});

export const RegisterUserResponseSchema = t.Object({
  id: t.String(),
  username: t.String(),
});

export const ApiKeyRequestSchema = t.Object({
  name: t.String(),
  permissions: t.Array(t.String()),
  expiresAt: t.Date(),
  rateLimit: t.Object({
    requests: t.Number(),
    window: t.Number(),
  }),
});

export const ApiKeyUpdateRequestSchema = t.Object({
  name: t.Optional(t.String()),
  permissions: t.Optional(t.Array(t.String())),
  expiresAt: t.Optional(t.Date()),
  rateLimit: t.Optional(
    t.Object({
      requests: t.Number(),
      window: t.Number(),
    })
  ),
});

export const ApiKeyResponseSchema = t.Object({
  apiKey: t.String(),
  key: t.String(),
});

export const ApiKeyBaseResponseSchema = t.Object({
  name: t.String(),
  permissions: t.Array(t.String()),
  expiresAt: t.Optional(t.Date()),
  rateLimit: t.Optional(
    t.Object({
      requests: t.Number(),
      window: t.Number(),
    })
  ),
});
