import { t } from "elysia";

// Communication types
export const communicationTypeSchema = t.Union([
  t.Literal("email"),
  t.Literal("sms"),
  t.Literal("push"),
  t.Literal("webhook"),
]);

export const communicationStatusSchema = t.Union([
  t.Literal("pending"),
  t.Literal("queued"),
  t.Literal("sending"),
  t.Literal("sent"),
  t.Literal("delivered"),
  t.Literal("failed"),
  t.Literal("bounced"),
  t.Literal("expired"),
  t.Literal("cancelled"),
]);

export const communicationPrioritySchema = t.Union([
  t.Literal("low"),
  t.Literal("normal"),
  t.Literal("high"),
  t.Literal("urgent"),
]);

// Recipient schema
export const recipientSchema = t.Object({
  email: t.Optional(t.String({ format: "email" })),
  phoneNumber: t.Optional(t.String()),
  name: t.Optional(t.String()),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

// Communication context schema
export const communicationContextSchema = t.Object({
  userId: t.Optional(t.String()),
  orgId: t.Optional(t.String()),
  campaignId: t.Optional(t.String()),
  propertyId: t.Optional(t.String()),
  unitId: t.Optional(t.String()),
  tenantId: t.Optional(t.String()),
  requestId: t.Optional(t.String()),
  ipAddress: t.Optional(t.String()),
  userAgent: t.Optional(t.String()),
  source: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String())),
});

// Communication content schema
export const communicationContentSchema = t.Object({
  subject: t.Optional(t.String()),
  body: t.String(),
  html: t.Optional(t.String()),
  text: t.Optional(t.String()),
  segments: t.Optional(t.Number()),
  encoding: t.Optional(t.Union([t.Literal("GSM_7BIT"), t.Literal("UCS2")])),
  attachments: t.Optional(
    t.Array(
      t.Object({
        filename: t.String(),
        content: t.String(), // Base64 encoded
        type: t.Optional(t.String()),
      })
    )
  ),
});

// Template schema for communication
export const communicationTemplateSchema = t.Object({
  templateId: t.Optional(t.String()),
  template: t.Optional(t.Any()), // Inline template object
  data: t.Optional(t.Record(t.String(), t.Any())),
  options: t.Optional(
    t.Object({
      maxLength: t.Optional(t.Number()),
      truncateMessage: t.Optional(t.String()),
      theme: t.Optional(t.String()),
      language: t.Optional(t.String()),
    })
  ),
});

// Communication settings schema
export const communicationSettingsSchema = t.Object({
  enableDeliveryReports: t.Optional(t.Boolean()),
  maxRetries: t.Optional(t.Number()),
  retryInterval: t.Optional(t.Number()),
  timeout: t.Optional(t.Number()),
  provider: t.Optional(t.String()),
  webhookUrl: t.Optional(t.String()),
  tracking: t.Optional(
    t.Object({
      enabled: t.Optional(t.Boolean()),
      pixel: t.Optional(t.Boolean()),
      links: t.Optional(t.Boolean()),
    })
  ),
});

// Send communication schema
export const sendCommunicationSchema = t.Object({
  type: communicationTypeSchema,
  to: t.Union([t.String(), t.Array(t.String()), t.Array(recipientSchema)]),
  templateId: t.Optional(t.String()),
  template: t.Optional(t.Any()),
  data: t.Optional(t.Record(t.String(), t.Any())),
  content: t.Optional(communicationContentSchema),
  priority: t.Optional(communicationPrioritySchema),
  scheduledAt: t.Optional(t.String({ format: "date-time" })),
  context: t.Optional(communicationContextSchema),
  settings: t.Optional(communicationSettingsSchema),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

// Bulk communication recipient schema
export const bulkRecipientSchema = t.Object({
  email: t.Optional(t.String({ format: "email" })),
  phoneNumber: t.Optional(t.String()),
  name: t.Optional(t.String()),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

// Send bulk communication schema
export const sendBulkCommunicationSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  type: communicationTypeSchema,
  recipients: t.Array(bulkRecipientSchema, { minItems: 1 }),
  templateId: t.Optional(t.String()),
  template: t.Optional(t.Any()),
  data: t.Optional(t.Record(t.String(), t.Any())),
  priority: t.Optional(communicationPrioritySchema),
  scheduledAt: t.Optional(t.String({ format: "date-time" })),
  context: t.Optional(communicationContextSchema),
  settings: t.Optional(communicationSettingsSchema),
});

// List communications query schema
export const listCommunicationsQuerySchema = t.Object({
  type: t.Optional(communicationTypeSchema),
  status: t.Optional(
    t.Union([communicationStatusSchema, t.Array(communicationStatusSchema)])
  ),
  startDate: t.Optional(t.String({ format: "date-time" })),
  endDate: t.Optional(t.String({ format: "date-time" })),
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  sortBy: t.Optional(
    t.Union([
      t.Literal("createdAt"),
      t.Literal("sentAt"),
      t.Literal("status"),
      t.Literal("type"),
      t.Literal("priority"),
    ])
  ),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
});

// Get communication params schema
export const getCommunicationParamsSchema = t.Object({
  id: t.String(),
});

// Get bulk communication params schema
export const getBulkCommunicationParamsSchema = t.Object({
  id: t.String(),
});

// Communication webhook payload schema
export const communicationWebhookSchema = t.Object({
  messageId: t.Optional(t.String()),
  communicationId: t.Optional(t.String()),
  recipient: t.Optional(t.Union([t.String(), recipientSchema])),
  status: t.Optional(t.String()),
  event_type: t.Optional(t.String()),
  type: t.Optional(t.String()),
  error: t.Optional(
    t.Object({
      code: t.String(),
      message: t.String(),
    })
  ),
  cost: t.Optional(t.Union([t.String(), t.Number()])),
  networkCode: t.Optional(t.String()),
  timestamp: t.Optional(t.Union([t.String(), t.Number()])),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

// Analytics query schema
export const analyticsQuerySchema = t.Object({
  startDate: t.Optional(t.String({ format: "date-time" })),
  endDate: t.Optional(t.String({ format: "date-time" })),
  type: t.Optional(communicationTypeSchema),
  provider: t.Optional(t.Union([t.String(), t.Array(t.String())])),
});

// Response schemas
export const communicationResponseSchema = t.Object({
  id: t.String(),
  type: communicationTypeSchema,
  status: communicationStatusSchema,
  priority: communicationPrioritySchema,
  to: t.Any(), // Can be string, array of strings, or array of recipients
  content: t.Any(),
  template: t.Optional(communicationTemplateSchema),
  provider: t.String(),
  providerMessageId: t.Optional(t.String()),
  scheduledAt: t.Optional(t.String()),
  sentAt: t.Optional(t.String()),
  deliveredAt: t.Optional(t.String()),
  cost: t.Optional(t.Number()),
  deliveryStatus: t.Optional(t.Any()),
  context: communicationContextSchema,
  settings: communicationSettingsSchema,
  error: t.Optional(t.Any()),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
});

export const bulkCommunicationResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  type: communicationTypeSchema,
  priority: communicationPrioritySchema,
  recipients: t.Array(bulkRecipientSchema),
  template: t.Optional(communicationTemplateSchema),
  settings: communicationSettingsSchema,
  status: t.Union([
    t.Literal("draft"),
    t.Literal("scheduled"),
    t.Literal("sending"),
    t.Literal("completed"),
    t.Literal("failed"),
    t.Literal("cancelled"),
  ]),
  progress: t.Object({
    total: t.Number(),
    sent: t.Number(),
    delivered: t.Number(),
    failed: t.Number(),
    pending: t.Number(),
    percentage: t.Number(),
  }),
  scheduledAt: t.Optional(t.String()),
  startedAt: t.Optional(t.String()),
  completedAt: t.Optional(t.String()),
  communicationIds: t.Array(t.String()),
  context: communicationContextSchema,
  createdBy: t.Optional(t.String()),
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
});

export const analyticsResponseSchema = t.Object({
  period: t.Object({
    start: t.String(),
    end: t.String(),
  }),
  totals: t.Object({
    total: t.Number(),
    delivered: t.Number(),
    failed: t.Number(),
    bounced: t.Number(),
    pending: t.Number(),
    deliveryRate: t.Number(),
    failureRate: t.Number(),
    bounceRate: t.Number(),
    averageDeliveryTime: t.Optional(t.Number()),
    averageCost: t.Optional(t.Number()),
  }),
  byType: t.Record(t.String(), t.Any()),
  byStatus: t.Record(t.String(), t.Number()),
  byProvider: t.Record(t.String(), t.Any()),
  trends: t.Object({
    hourly: t.Array(
      t.Object({
        hour: t.String(),
        sent: t.Number(),
        delivered: t.Number(),
        failed: t.Number(),
      })
    ),
    daily: t.Array(
      t.Object({
        date: t.String(),
        sent: t.Number(),
        delivered: t.Number(),
        failed: t.Number(),
      })
    ),
  }),
  costs: t.Object({
    total: t.Number(),
    byProvider: t.Record(t.String(), t.Number()),
    byType: t.Record(t.String(), t.Number()),
    averagePerMessage: t.Number(),
  }),
  performance: t.Object({
    averageSendTime: t.Number(),
    averageRenderTime: t.Number(),
    queueWaitTime: t.Number(),
    successRate: t.Number(),
  }),
});

export const statsResponseSchema = t.Object({
  totalCommunications: t.Number(),
  sentToday: t.Number(),
  sentThisMonth: t.Number(),
  deliveredThisMonth: t.Number(),
  failedThisMonth: t.Number(),
  deliveryRate: t.Number(),
  failureRate: t.Number(),
  totalCost: t.Number(),
  averageCostPerMessage: t.Number(),
});
