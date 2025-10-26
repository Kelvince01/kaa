import {
  WebhookContentType,
  WebhookEnvironment,
  WebhookEventType,
  WebhookMethod,
  WebhookPriority,
  WebhookStatus,
} from "@kaa/models/types";
import { t } from "elysia";

// Validation Schemas
export const webhookEventSchema = t.Object({
  type: t.Enum(WebhookEventType),
  resourceId: t.String({ minLength: 1 }),
  resourceType: t.String({ minLength: 1 }),
  data: t.Record(t.String(), t.Any()),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  source: t.String({ minLength: 1 }),
  version: t.String({ minLength: 1 }),
  correlationId: t.Optional(t.String()),
});

export const createWebhookSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String({ maxLength: 1000 })),
  url: t.String({ format: "uri" }),
  //   method: t.Optional(t.Enum(WebhookMethod), { default: WebhookMethod.POST }),
  method: t.Optional(t.Enum(WebhookMethod)),
  events: t.Array(t.Enum(WebhookEventType), { minItems: 1 }),
  //   environment: t.Optional(t.Enum(WebhookEnvironment), {
  //     default: WebhookEnvironment.PRODUCTION,
  //   }),
  environment: t.Optional(t.Enum(WebhookEnvironment)),
  //   priority: t.Optional(t.Enum(WebhookPriority), {
  //     default: WebhookPriority.MEDIUM,
  //   }),
  priority: t.Optional(t.Enum(WebhookPriority)),
  //   contentType: t.Optional(t.Enum(WebhookContentType), {
  //     default: WebhookContentType.JSON,
  //   }),
  contentType: t.Optional(t.Enum(WebhookContentType)),
  //   timeout: t.Optional(t.Number({ minimum: 1000, maximum: 120_000 }), {
  //     default: 15_000,
  //   }),
  timeout: t.Optional(t.Number({ minimum: 1000, maximum: 120_000 })),
  headers: t.Optional(t.Record(t.String(), t.String())),
  tags: t.Optional(t.Array(t.String(), { maxItems: 10 })),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

// updateWebhookSchema = Partial<createWebhookSchema> without "events"
export const updateWebhookSchema = t.Omit(t.Partial(createWebhookSchema), [
  "events",
]);

export const queryUserWebhooksSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  status: t.Optional(t.Enum(WebhookStatus)),
  events: t.Optional(t.Array(t.Enum(WebhookEventType))),
});
