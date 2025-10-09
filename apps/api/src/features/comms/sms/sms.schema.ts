import { SmsPriority } from "@kaa/models/types";
import { t } from "elysia";

// Validation schemas
export const smsRecipientSchema = t.Object({
  phoneNumber: t.String({ pattern: "^\\+?[1-9]\\d{1,14}$" }),
  name: t.Optional(t.String()),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

export const sendSmsSchema = t.Object({
  /*to: t.Union([
    t.String({ pattern: "^\\+?[1-9]\\d{1,14}$" }),
    t.Array(t.String({ pattern: "^\\+?[1-9]\\d{1,14}$" })),
    t.Array(smsRecipientSchema),
  ]),*/
  to: t.Array(smsRecipientSchema),
  message: t.String({ minLength: 1, maxLength: 1600 }),
  type: t.Union([
    t.Literal("transactional"),
    t.Literal("promotional"),
    t.Literal("notification"),
    t.Literal("alert"),
    t.Literal("reminder"),
    t.Literal("verification"),
    t.Literal("bulk"),
  ]),
  priority: t.Optional(t.Enum(SmsPriority)),
  scheduledAt: t.Optional(t.String({ format: "date-time" })),
  settings: t.Optional(
    t.Object({
      enableDeliveryReports: t.Optional(t.Boolean()),
      maxRetries: t.Optional(t.Number({ minimum: 0, maximum: 10 })),
      retryInterval: t.Optional(t.Number({ minimum: 1, maximum: 60 })),
      provider: t.Optional(
        t.Union([
          t.Literal("africastalking"),
          t.Literal("twilio"),
          t.Literal("aws-sns"),
          t.Literal("mock"),
        ])
      ),
      webhookUrl: t.Optional(t.String({ format: "uri" })),
    })
  ),
});

export const sendSmsWithTemplateSchema = t.Object({
  to: t.Array(smsRecipientSchema),
  templateId: t.String(),
  data: t.Record(t.String(), t.Any()),
  type: t.Union([
    t.Literal("transactional"),
    t.Literal("promotional"),
    t.Literal("notification"),
    t.Literal("alert"),
    t.Literal("reminder"),
    t.Literal("verification"),
    t.Literal("bulk"),
  ]),
  priority: t.Optional(t.Enum(SmsPriority)),
  scheduledAt: t.Optional(t.String({ format: "date-time" })),
  settings: t.Optional(
    t.Object({
      enableDeliveryReports: t.Optional(t.Boolean()),
      maxRetries: t.Optional(t.Number({ minimum: 0, maximum: 10 })),
      retryInterval: t.Optional(t.Number({ minimum: 1, maximum: 60 })),
      provider: t.Optional(
        t.Union([
          t.Literal("africastalking"),
          t.Literal("twilio"),
          t.Literal("aws-sns"),
          t.Literal("mock"),
        ])
      ),
      webhookUrl: t.Optional(t.String({ format: "uri" })),
    })
  ),
});

export const bulkSmsSchema = t.Object({
  recipients: t.Array(smsRecipientSchema, { minItems: 1, maxItems: 10_000 }),
  templateId: t.String(),
  templateData: t.Record(t.String(), t.Any()),
  type: t.Union([
    t.Literal("transactional"),
    t.Literal("promotional"),
    t.Literal("notification"),
    t.Literal("alert"),
    t.Literal("reminder"),
    t.Literal("verification"),
    t.Literal("bulk"),
  ]),
  priority: t.Optional(t.Enum(SmsPriority)),
});

export const listSmsQuerySchema = t.Object({
  status: t.Optional(
    t.Union([
      t.Literal("pending"),
      t.Literal("queued"),
      t.Literal("sending"),
      t.Literal("sent"),
      t.Literal("delivered"),
      t.Literal("failed"),
      t.Literal("expired"),
    ])
  ),
  type: t.Optional(
    t.Union([
      t.Literal("transactional"),
      t.Literal("promotional"),
      t.Literal("notification"),
      t.Literal("alert"),
      t.Literal("reminder"),
      t.Literal("verification"),
      t.Literal("bulk"),
    ])
  ),
  startDate: t.Optional(t.String({ format: "date-time" })),
  endDate: t.Optional(t.String({ format: "date-time" })),
  phoneNumber: t.Optional(t.String()),
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  sortBy: t.Optional(t.String()),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
});

export const analyticsQuerySchema = t.Object({
  startDate: t.String({ format: "date-time" }),
  endDate: t.String({ format: "date-time" }),
  groupBy: t.Optional(
    t.Union([
      t.Literal("hour"),
      t.Literal("day"),
      t.Literal("week"),
      t.Literal("month"),
    ])
  ),
});
