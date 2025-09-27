import { t } from "elysia";

// Template engine types
export const templateEngineSchema = t.Union([
  t.Literal("handlebars"),
  t.Literal("mjml"),
  t.Literal("ejs"),
  t.Literal("pug"),
  t.Literal("nunjucks"),
  t.Literal("raw"),
]);

// Template format types
export const templateFormatSchema = t.Union([
  t.Literal("html"),
  t.Literal("text"),
  t.Literal("sms"),
  t.Literal("email"),
  t.Literal("json"),
  t.Literal("markdown"),
]);

// Template category types
export const templateCategorySchema = t.Union([
  t.Literal("email"),
  t.Literal("sms"),
  t.Literal("push"),
  t.Literal("document"),
  t.Literal("report"),
  t.Literal("notification"),
  t.Literal("transactional"),
  t.Literal("other"),
  // Add SMS-specific categories
  t.Literal("welcome"),
  t.Literal("payment"),
  t.Literal("reminder"),
  t.Literal("verification"),
  t.Literal("maintenance"),
  t.Literal("marketing"),
]);

// Template Variable Schema
export const TemplateVariableSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  type: t.Union([
    t.Literal("string"),
    t.Literal("number"),
    t.Literal("boolean"),
    t.Literal("date"),
    t.Literal("array"),
    t.Literal("object"),
  ]),
  required: t.Boolean({ default: false }),
  defaultValue: t.Optional(t.Any()),
  description: t.String({ minLength: 1, maxLength: 500 }),
  validation: t.Optional(
    t.Object({
      pattern: t.Optional(t.String()),
      min: t.Optional(t.Number()),
      max: t.Optional(t.Number()),
      options: t.Optional(t.Array(t.Any())),
      format: t.Optional(
        t.Union([t.Literal("email"), t.Literal("url"), t.Literal("phone")])
      ),
    })
  ),
  examples: t.Optional(t.Array(t.Any())),
});

// SMS Metadata Schema
export const SMSMetadataSchema = t.Object({
  maxLength: t.Optional(t.Number({ minimum: 1, maximum: 1600 })),
  encoding: t.Optional(t.Union([t.Literal("GSM_7BIT"), t.Literal("UCS2")])),
  segments: t.Optional(t.Number()),
  actualLength: t.Optional(t.Number()),
  cost: t.Optional(t.Number()),
});

// Template Create Schema
export const TemplateCreateSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.String({ minLength: 1, maxLength: 1000 }),
  category: templateCategorySchema,
  type: t.String({ minLength: 1, maxLength: 100 }),
  subject: t.String({ minLength: 1, maxLength: 500 }),
  content: t.String({ minLength: 1 }),
  version: t.Optional(t.Number()),
  variables: t.Array(TemplateVariableSchema),
  engine: templateEngineSchema,
  format: t.Optional(templateFormatSchema),
  theme: t.Optional(t.String({ maxLength: 50 })),
  tags: t.Optional(t.Array(t.String({ maxLength: 50 }))),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  // Add SMS-specific metadata
  smsMetadata: t.Optional(SMSMetadataSchema),
});

// Template Update Schema
export const TemplateUpdateSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.String({ minLength: 1, maxLength: 1000 })),
  category: templateCategorySchema,
  type: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  subject: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  content: t.Optional(t.String({ minLength: 1 })),
  variables: t.Optional(t.Array(TemplateVariableSchema)),
  engine: templateEngineSchema,
  format: t.Optional(templateFormatSchema),
  theme: t.Optional(t.String({ maxLength: 50 })),
  isActive: t.Optional(t.Boolean()),
  tags: t.Optional(t.Array(t.String({ maxLength: 50 }))),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  // Add SMS-specific metadata
  smsMetadata: t.Optional(SMSMetadataSchema),
});

// Template List Query Schema
export const TemplateListQuerySchema = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  search: t.Optional(t.String({ maxLength: 255 })),
  category: t.Optional(templateCategorySchema),
  type: t.Optional(t.String({ maxLength: 100 })),
  engine: t.Optional(templateEngineSchema),
  isActive: t.Optional(t.Boolean()),
  tags: t.Optional(t.Array(t.String({ maxLength: 50 }))),
  sortBy: t.Optional(
    t.Union(
      [
        t.Literal("name"),
        t.Literal("createdAt"),
        t.Literal("updatedAt"),
        t.Literal("category"),
        t.Literal("type"),
        t.Literal("usage.count"),
      ],
      { default: "createdAt" }
    )
  ),
  sortOrder: t.Optional(
    t.Union([t.Literal("asc"), t.Literal("desc")], { default: "desc" })
  ),
});

// Template Render Request Schema
export const TemplateRenderRequestSchema = t.Object({
  templateId: t.Optional(t.String({ pattern: "^[0-9a-fA-F]{24}$" })),
  data: t.Record(t.String(), t.Any()),
  options: t.Optional(
    t.Object({
      format: t.Optional(templateFormatSchema),
      theme: t.Optional(t.String({ maxLength: 50 })),
      language: t.Optional(t.String({ maxLength: 10 })),
    })
  ),
});

// Batch Render Request Schema
export const BatchRenderRequestSchema = t.Object({
  templates: t.Array(
    t.Object({
      templateId: t.String({ pattern: "^[0-9a-fA-F]{24}$" }),
      data: t.Record(t.String(), t.Any()),
    }),
    { minItems: 1, maxItems: 10 }
  ),
  options: t.Optional(
    t.Object({
      format: t.Optional(templateFormatSchema),
      theme: t.Optional(t.String({ maxLength: 50 })),
      language: t.Optional(t.String({ maxLength: 10 })),
    })
  ),
});

// Template Preview Request Schema
export const TemplatePreviewRequestSchema = t.Object({
  templateId: t.Optional(t.String({ pattern: "^[0-9a-fA-F]{24}$" })),
  content: t.Optional(t.String({ minLength: 1 })),
  engine: t.Optional(templateEngineSchema),
  data: t.Record(t.String(), t.Any()),
  sampleData: t.Optional(t.Boolean()),
  options: t.Optional(
    t.Object({
      format: t.Optional(templateFormatSchema),
      theme: t.Optional(t.String()),
      language: t.Optional(t.String()),
      maxLength: t.Optional(t.Number()),
      truncateMessage: t.Optional(t.String()),
      validateData: t.Optional(t.Boolean()),
      timeout: t.Optional(t.Number()),
    })
  ),
});

// Template test request schema
export const templateTestRequestSchema = t.Object({
  data: t.Optional(t.Record(t.String(), t.Any())),
  recipients: t.Optional(
    t.Array(
      t.Union([
        t.String({ format: "email" }),
        t.Object({
          email: t.Optional(t.String({ format: "email" })),
          phoneNumber: t.Optional(t.String()),
          name: t.Optional(t.String()),
          metadata: t.Optional(t.Record(t.String(), t.Any())),
        }),
      ])
    )
  ),
});

// Template ID Params Schema
export const TemplateIdParamsSchema = t.Object({
  id: t.String({ pattern: "^[0-9a-fA-F]{24}$" }),
});

// Rendering List Query Schema
export const RenderingListQuerySchema = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
});

// Response Schemas
export const TemplateResponseSchema = t.Object({
  _id: t.String(),
  name: t.String(),
  description: t.String(),
  category: templateCategorySchema,
  type: t.String(),
  subject: t.String(),
  content: t.String(),
  variables: t.Array(TemplateVariableSchema),
  engine: templateEngineSchema,
  format: templateFormatSchema,
  theme: t.Optional(t.String()),
  versions: t.Array(t.Any()), // TemplateVersion array
  version: t.Number(),
  isActive: t.Boolean(),
  tags: t.Array(t.String()),
  metadata: t.Record(t.String(), t.Any()),
  usage: t.Object({
    count: t.Number(),
    lastUsedAt: t.Optional(t.String()),
    averageRenderTime: t.Optional(t.Number()),
  }),
  createdBy: t.Any(),
  updatedBy: t.Any(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const TemplateListResponseSchema = t.Object({
  templates: t.Array(TemplateResponseSchema),
  pagination: t.Object({
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    pages: t.Number(),
  }),
});

export const TemplateRenderingResponseSchema = t.Object({
  _id: t.String(),
  templateId: t.String(),
  templateVersion: t.Number(),
  status: t.Union([
    t.Literal("pending"),
    t.Literal("processing"),
    t.Literal("completed"),
    t.Literal("failed"),
  ]),
  input: t.Record(t.String(), t.Any()),
  output: t.Optional(
    t.Object({
      content: t.String(),
      metadata: t.Object({
        renderTime: t.Number(),
        size: t.Number(),
        format: t.String(),
      }),
    })
  ),
  error: t.Optional(
    t.Object({
      code: t.String(),
      message: t.String(),
      stack: t.String(),
    })
  ),
  metadata: t.Object({
    userId: t.String(),
    requestId: t.String(),
    ipAddress: t.String(),
    userAgent: t.String(),
  }),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const RenderingListResponseSchema = t.Object({
  renderings: t.Array(TemplateRenderingResponseSchema),
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  totalPages: t.Number(),
});

export const TemplatePreviewResponseSchema = t.Object({
  subject: t.String(),
  content: t.String(),
  metadata: t.Object({
    renderTime: t.Number(),
    size: t.Number(),
    format: templateFormatSchema,
    engine: templateEngineSchema,
    truncated: t.Optional(t.Boolean()),
    variablesUsed: t.Optional(t.Array(t.String())),
    validationErrors: t.Optional(t.Array(t.String())),
  }),
  sampleData: t.Optional(t.Record(t.String(), t.Any())),
});

export const CategoriesResponseSchema = t.Array(templateCategorySchema);
export const TypesResponseSchema = t.Array(t.String());

export const templateTestResponseSchema = t.Object({
  message: t.String(),
  preview: TemplateRenderingResponseSchema,
  recipients: t.Array(t.Any()),
});

export const variableTypesResponseSchema = t.Array(
  t.Union([
    t.Literal("string"),
    t.Literal("number"),
    t.Literal("boolean"),
    t.Literal("date"),
    t.Literal("array"),
    t.Literal("object"),
  ])
);

export const enginesResponseSchema = t.Array(templateEngineSchema);

export const cacheStatsResponseSchema = t.Object({
  size: t.Number(),
  keys: t.Array(t.String()),
});

// File Import/Export Schemas
export const FileImportRequestSchema = t.Object({
  category: t.Optional(t.String()),
  overwrite: t.Optional(t.Boolean({ default: false })),
  directory: t.Optional(t.String()),
});

export const FileExportRequestSchema = t.Object({
  templateIds: t.Optional(t.Array(t.String())),
  category: t.Optional(t.String()),
  format: t.Optional(templateFormatSchema),
});

export const FileImportResponseSchema = t.Object({
  success: t.Number(),
  failed: t.Number(),
  errors: t.Array(t.String()),
  importedTemplates: t.Array(t.String()),
});

export const FileExportResponseSchema = t.Object({
  exportedCount: t.Number(),
  filePath: t.String(),
  format: t.String(),
});

// Cache Management Schemas
export const CacheStatsResponseSchema = t.Object({
  size: t.Number(),
  keys: t.Array(t.String()),
  memoryUsage: t.Optional(t.Number()),
  hitRate: t.Optional(t.Number()),
});

// SMS Preview Schema
export const SMSPreviewResponseSchema = t.Object({
  rendered: t.String(),
  segments: t.Number(),
  length: t.Number(),
  encoding: t.String(),
  cost: t.Optional(t.Number()),
  metadata: t.Record(t.String(), t.Any()),
});

// Usage Tracking Schema
export const UsageTrackingSchema = t.Object({
  usageCount: t.Number(),
  lastUsedAt: t.Optional(t.String()),
  usageHistory: t.Optional(
    t.Array(
      t.Object({
        date: t.String(),
        userId: t.String(),
        context: t.String(),
      })
    )
  ),
});
