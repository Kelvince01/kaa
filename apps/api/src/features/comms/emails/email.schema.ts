import { type Static, t } from "elysia";

export const emailStatusSchema = t.Union([
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

export const emailPrioritySchema = t.Union([
  t.Literal("low"),
  t.Literal("normal"),
  t.Literal("high"),
  t.Literal("urgent"),
]);

export const emailCategorySchema = t.Union([
  t.Literal("authentication"),
  t.Literal("transactional"),
  t.Literal("notification"),
  t.Literal("marketing"),
  t.Literal("support"),
]);

export const emailAttachmentTypeSchema = t.Union([
  t.Literal("pdf"),
  t.Literal("image"),
  t.Literal("document"),
  t.Literal("receipt"),
  t.Literal("contract"),
  t.Literal("invoice"),
]);

export const bounceTypeSchema = t.Union([
  t.Literal("hard"),
  t.Literal("soft"),
  t.Literal("temporary"),
]);

export const emailLanguageSchema = t.Union([t.Literal("en"), t.Literal("sw")]);

// Email settings schema
export const emailSettingsSchema = t.Object({
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

// Email context schema
export const emailContextSchema = t.Object({
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

// Email content schema
export const emailContentSchema = t.Object({
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

// Recipient schema
export const emailRecipientSchema = t.Object({
  email: t.Optional(t.String({ format: "email" })),
  name: t.Optional(t.String()),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

export const emailAttachmentSchema = t.Object({
  filename: t.String(),
  content: t.ArrayBuffer(),
});

export const basicEmailSchema = t.Object({
  to: t.Array(t.String()),
  subject: t.String(),
  content: t.String(),
  headers: t.Optional(t.Object({})),
  tags: t.Optional(t.Array(t.String())),
  cc: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  bcc: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  replyTo: t.Optional(t.String()),
  attachments: t.Optional(t.Array(emailAttachmentSchema)),
  metadata: t.Optional(t.Object({})),
  priority: t.Optional(emailPrioritySchema),
  category: t.Optional(emailCategorySchema),
  settings: t.Optional(
    t.Object({
      enableDeliveryReports: t.Optional(t.Boolean()),
      maxRetries: t.Optional(t.Number()),
      retryInterval: t.Optional(t.Number()),
      provider: t.Optional(t.String()),
    })
  ),
});

export const sendEmailSchema = t.Object({
  ...basicEmailSchema.properties,
  html: t.Optional(t.String()),
  text: t.Optional(t.String()),
});

export const sendEmailWithTemplateSchema = t.Object({
  ...basicEmailSchema.properties,
  templateId: t.String(),
  template: t.Optional(t.Object({})),
  data: t.Optional(t.Object({})),
  userId: t.String(),
  requestMetadata: t.Object({
    requestId: t.String(),
    ipAddress: t.String(),
    userAgent: t.String(),
  }),
});

export const sendBulkEmailSchema = t.Object({
  recipients: t.Array(t.String()),
  subject: t.String(),
  content: t.String(),
  priority: t.Optional(emailPrioritySchema),
  category: t.Optional(emailCategorySchema),
  settings: t.Optional(
    t.Object({
      enableDeliveryReports: t.Optional(t.Boolean()),
      maxRetries: t.Optional(t.Number()),
      retryInterval: t.Optional(t.Number()),
      provider: t.Optional(t.String()),
    })
  ),
});

export const sendBulkEmailWithTemplateSchema = t.Object({
  recipients: t.Array(t.String()),
  templateId: t.String(),
  data: t.Optional(t.Object({})),
  metadata: t.Optional(t.Object({})),
  priority: t.Optional(emailPrioritySchema),
  category: t.Optional(emailCategorySchema),
  settings: t.Optional(
    t.Object({
      enableDeliveryReports: t.Optional(t.Boolean()),
      maxRetries: t.Optional(t.Number()),
      retryInterval: t.Optional(t.Number()),
      provider: t.Optional(t.String()),
    })
  ),
});

export const queryEmailsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  subject: t.Optional(t.String()),
  content: t.Optional(t.String()),
  recipients: t.Optional(t.Array(t.String())),
  templateId: t.Optional(t.String()),
  data: t.Optional(t.Object({})),
  metadata: t.Optional(t.Object({})),
  priority: t.Optional(emailPrioritySchema),
  category: t.Optional(emailCategorySchema),
  status: t.Optional(emailStatusSchema),
  startDate: t.Optional(t.String({ format: "date-time" })),
  endDate: t.Optional(t.String({ format: "date-time" })),
  sortBy: t.Optional(
    t.Union([
      t.Literal("createdAt"),
      t.Literal("sentAt"),
      t.Literal("status"),
      t.Literal("category"),
      t.Literal("priority"),
    ])
  ),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
});

// Get email params schema
export const getEmailParamsSchema = t.Object({
  id: t.String(),
});

// Get bulk email params schema
export const getBulkEmailParamsSchema = t.Object({
  id: t.String(),
});

// Email webhook payload schema
export const emailWebhookSchema = t.Object({
  messageId: t.Optional(t.String()),
  emailId: t.Optional(t.String()),
  recipient: t.Optional(t.Union([t.String(), emailRecipientSchema])),
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
  provider: t.Optional(t.Union([t.String(), t.Array(t.String())])),
});

// Response schemas
export const emailResponseSchema = t.Object({
  id: t.String(),
  status: emailStatusSchema,
  priority: emailPrioritySchema,
  to: t.Any(), // Can be string, array of strings, or array of recipients
  content: t.Any(),
  template: t.Optional(t.String()),
  provider: t.String(),
  providerMessageId: t.Optional(t.String()),
  scheduledAt: t.Optional(t.String()),
  sentAt: t.Optional(t.String()),
  deliveredAt: t.Optional(t.String()),
  cost: t.Optional(t.Number()),
  deliveryStatus: t.Optional(t.Any()),
  context: emailContextSchema,
  settings: emailSettingsSchema,
  error: t.Optional(t.Any()),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
});

// Bulk communication recipient schema
export const bulkRecipientSchema = t.Object({
  email: t.Optional(t.String({ format: "email" })),
  name: t.Optional(t.String()),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

export const bulkEmailResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  priority: emailPrioritySchema,
  recipients: t.Array(bulkRecipientSchema),
  template: t.Optional(t.String()),
  settings: emailSettingsSchema,
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
  emailIds: t.Array(t.String()),
  context: emailContextSchema,
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
  totalEmails: t.Number(),
  sentToday: t.Number(),
  sentThisMonth: t.Number(),
  deliveredThisMonth: t.Number(),
  failedThisMonth: t.Number(),
  deliveryRate: t.Number(),
  failureRate: t.Number(),
  totalCost: t.Number(),
  averageCostPerMessage: t.Number(),
});

export type SendEmailBasic = Static<typeof basicEmailSchema>;
export type SendEmail = Static<typeof sendEmailSchema>;
export type SendEmailWithTemplate = Static<typeof sendEmailWithTemplateSchema>;
export type SendBulkEmail = Static<typeof sendBulkEmailSchema>;
export type SendBulkEmailWithTemplate = Static<
  typeof sendBulkEmailWithTemplateSchema
>;
export type QueryEmails = Static<typeof queryEmailsSchema>;
