import { t } from "elysia";

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
        line1: t.String(),
        town: t.String(),
        postalCode: t.String(),
        county: t.String(),
        country: t.String(),
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
    lastLoginAt: t.Date(),
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
