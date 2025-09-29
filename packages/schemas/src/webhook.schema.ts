import {
  WebhookContentType,
  WebhookEnvironment,
  WebhookEventType,
  WebhookMethod,
  WebhookPriority,
  WebhookStatus,
} from "@kaa/models/types";
import { z } from "zod";

// Validation Schemas
export const webhookEventSchema = z.object({
  type: z.enum(WebhookEventType),
  resourceId: z.string().min(1),
  resourceType: z.string().min(1),
  data: z.record(z.string(), z.any()),
  metadata: z.record(z.string(), z.any()).optional(),
  source: z.string().min(1),
  version: z.string().min(1),
  correlationId: z.string().optional(),
});

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  url: z.url(),
  method: z.enum(WebhookMethod).default(WebhookMethod.POST),
  events: z.array(z.enum(WebhookEventType)).min(1),
  environment: z
    .enum(WebhookEnvironment)
    .default(WebhookEnvironment.PRODUCTION),
  priority: z.enum(WebhookPriority).default(WebhookPriority.MEDIUM),
  contentType: z.enum(WebhookContentType).default(WebhookContentType.JSON),
  timeout: z.number().min(1000).max(120_000).default(15_000),
  headers: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).max(10).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const updateWebhookSchema = createWebhookSchema.partial().omit({
  events: true,
});

export const queryUserWebhooksSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  status: z.enum(WebhookStatus).optional(),
  events: z.array(z.enum(WebhookEventType)).optional(),
});
