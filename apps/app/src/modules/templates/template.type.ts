export type TemplateVariable = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "array" | "object";
  required?: boolean;
  defaultValue?: any;
  description: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: any[];
  };
};

export type SMSMetadata = {
  maxLength?: number;
  encoding?: "GSM_7BIT" | "UCS2";
  segments?: number;
  actualLength?: number;
  cost?: number;
};

export type TemplateCreateInput = {
  name: string;
  slug: string;
  description: string;
  category:
    | "email"
    | "document"
    | "report"
    | "notification"
    | "other"
    | "welcome"
    | "payment"
    | "reminder"
    | "verification"
    | "maintenance"
    | "marketing";
  type: string;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  engine?: "handlebars" | "ejs" | "pug" | "nunjucks" | "mjml";
  format?: "html" | "pdf" | "text" | "docx" | "xlsx" | "markdown";
  tags?: string[];
  metadata?: Record<string, any>;
  smsMetadata?: SMSMetadata;
};

export type TemplateUpdateInput = {
  name?: string;
  slug?: string;
  description?: string;
  category?:
    | "email"
    | "document"
    | "report"
    | "notification"
    | "other"
    | "welcome"
    | "payment"
    | "reminder"
    | "verification"
    | "maintenance"
    | "marketing";
  type?: string;
  subject?: string;
  content?: string;
  variables?: TemplateVariable[];
  engine?: "handlebars" | "ejs" | "pug" | "nunjucks" | "mjml";
  format?: "html" | "pdf" | "text" | "docx" | "xlsx" | "markdown";
  isActive?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  smsMetadata?: SMSMetadata;
};

export type TemplateType = {
  _id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  engine: string;
  format: string;
  version: number;
  isActive: boolean;
  tags: string[];
  metadata: Record<string, any>;
  smsMetadata?: SMSMetadata;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type TemplateListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: string;
  engine?: string;
  isActive?: boolean;
  tags?: string[];
  sortBy?: "name" | "createdAt" | "updatedAt" | "category" | "type";
  sortOrder?: "asc" | "desc";
};

export type TemplateListResponse = {
  templates: TemplateType[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type TemplateRenderRequest = {
  templateId?: string;
  data: Record<string, any>;
  options?: {
    format?: "html" | "pdf" | "text" | "docx" | "xlsx" | "markdown";
    theme?: string;
    language?: string;
  };
};

export type TemplateRenderResponse = {
  _id: string;
  templateId: string;
  templateVersion: number;
  status: "pending" | "processing" | "completed" | "failed";
  input: Record<string, any>;
  output?: {
    content: string;
    metadata: {
      renderTime: number;
      size: number;
      format: string;
    };
  };
  error?: {
    code: string;
    message: string;
    stack: string;
  };
  metadata: {
    userId: string;
    requestId: string;
    ipAddress: string;
    userAgent: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type TemplatePreviewRequest = {
  templateId?: string;
  content?: string;
  engine?: "handlebars" | "ejs" | "pug" | "nunjucks" | "mjml";
  data: Record<string, any>;
};

export type TemplatePreviewResponse = {
  subject: string;
  content: string;
  metadata: {
    renderTime: number;
    size: number;
    format: string;
    engine: string;
    truncated: boolean;
  };
};

export type BatchRenderRequest = {
  templates: Array<{
    templateId: string;
    data: Record<string, any>;
  }>;
  options?: {
    format?: "html" | "pdf" | "text" | "docx" | "xlsx" | "markdown";
    theme?: string;
    language?: string;
  };
};

export type SMSPreviewResponse = {
  rendered: string;
  segments: number;
  length: number;
  encoding: string;
  cost?: number;
  metadata: Record<string, any>;
};

export type UsageTrackingResponse = {
  usageCount: number;
  lastUsedAt?: string;
  usageHistory?: Array<{
    date: string;
    userId: string;
    context: string;
  }>;
};

export type FileImportRequest = {
  category?: string;
  overwrite?: boolean;
  directory?: string;
};

export type FileExportRequest = {
  templateIds?: string[];
  category?: string;
  format?: "json" | "hbs" | "ejs" | "pug";
};

export type FileImportResponse = {
  success: number;
  failed: number;
  errors: string[];
  importedTemplates: string[];
};

export type FileExportResponse = {
  exportedCount: number;
  filePath: string;
  format: string;
};

export type CacheStatsResponse = {
  size: number;
  keys: string[];
  memoryUsage?: number;
  hitRate?: number;
};

export type CategoriesResponse = string[];
export type TypesResponse = string[];
