import type { ObjectId } from "mongoose";
import type { BaseDocument } from "./base.type";

export type TemplateVariableType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "array"
  | "object";
export type TemplateEngineType =
  | "handlebars"
  | "mjml"
  | "ejs"
  | "pug"
  | "nunjucks"
  | "raw";
export type TemplateFormat =
  | "html"
  | "text"
  | "sms"
  | "email"
  | "json"
  | "pdf"
  | "docx"
  | "xlsx"
  | "markdown";
export type TemplateCategory =
  | "email"
  | "sms"
  | "push"
  | "document"
  | "notification"
  | "transactional"
  | "report"
  | "other"
  | "marketing"
  | "welcome"
  | "payment"
  | "reminder"
  | "verification"
  | "maintenance";

export type ITemplateVariable = {
  name: string;
  type: TemplateVariableType;
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: any[];
    format?: "email" | "url" | "phone";
  };
};

export type TemplateVersion = {
  version: number;
  content: string;
  variables: ITemplateVariable[];
  createdAt: Date;
  createdBy?: string;
  comment?: string;
  isActive: boolean;
};

export type TemplateTheme = {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    muted: string;
    success: string;
    warning: string;
    error: string;
    [key: string]: string;
  };
  fonts: {
    primary: string;
    heading: string;
    mono: string;
    [key: string]: string;
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
    [key: string]: string;
  };
  borderRadius: string;
  [key: string]: any;
};

export type ITemplate = BaseDocument & {
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  type: string;
  subject: string;
  content: string;
  variables: ITemplateVariable[];
  engine: TemplateEngineType;
  format: TemplateFormat;
  version: number;
  versions: TemplateVersion[];
  isActive: boolean;
  isDefault: boolean;
  tags: string[];

  // SMS specific settings
  maxLength?: number;
  encoding?: "GSM_7BIT" | "UCS2";

  // Usage tracking
  usageCount: number;
  lastUsedAt?: Date;

  usageHistory?: Array<{
    date: Date;
    userId: ObjectId;
    context: string;
  }>;
  usage: {
    count: number;
    lastUsedAt?: Date;
    averageRenderTime?: number;
  };

  // Multi-language support
  translations: {
    [language: string]: {
      subject: string;
      textContent?: string;
      htmlContent?: string;
    };
  };
  defaultLanguage: "en" | "sw";

  // Metadata
  metadata?: Record<string, any>;
  createdBy?: ObjectId;
  updatedBy?: ObjectId;

  incrementUsage: () => Promise<void>;
};

export type TemplateRenderRequest = {
  templateId?: string;
  template?: ITemplate;
  data: Record<string, any>;
  options?: TemplateRenderOptions;
};

export type TemplatePreviewRequest = {
  templateId?: string;
  template?: ITemplate;
  data?: Record<string, any>;
  sampleData?: boolean; // Generate sample data from variables
  options?: TemplateRenderOptions;
};

export type TemplateValidationResult = {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
};

export type TemplateRenderOptions = {
  format?: TemplateFormat;
  theme?: string;
  language?: string;
  maxLength?: number; // For SMS
  truncateMessage?: string; // For SMS truncation
  validateData?: boolean;
  timeout?: number; // Render timeout in ms
};

export type ITemplateRenderingMetadata = {
  renderTime: number;
  size: number;
  format: TemplateFormat;
  engine: TemplateEngineType;
  truncated?: boolean;
};

export type ITemplateRenderingOutput = {
  content: string;
  subject?: string;
  metadata: ITemplateRenderingMetadata;
};

export type ITemplateRenderingError = {
  code: string;
  message: string;
  stack: string;
};

export type ITemplateRenderingRequestMetadata = {
  userId: ObjectId;
  requestId: string;
  ipAddress: string;
  userAgent: string;
};

export type ITemplateRendering = {
  _id: ObjectId;
  templateId: ObjectId;
  templateVersion: number;
  status: "pending" | "processing" | "completed" | "failed";
  input: Record<string, any>;
  output?: ITemplateRenderingOutput;
  error?: ITemplateRenderingError;
  metadata: ITemplateRenderingRequestMetadata;
  createdAt: Date;
  updatedAt: Date;
};

export type ITemplateRenderRequest = {
  templateId?: string;
  template?: ITemplate;
  data: Record<string, any>;
  options?: TemplateRenderOptions;
};

export type TemplateRenderResult = {
  content: string;
  subject?: string;
  metadata: {
    renderTime: number;
    size: number;
    format: TemplateFormat;
    engine: TemplateEngineType;
    truncated?: boolean;
    variablesUsed?: string[];
    validationErrors?: string[];
    segments?: number;
    encoding?: "GSM_7BIT" | "UCS2";
    cost?: number;
    length?: number;
  };
};

export type IBatchRenderRequest = {
  templates: Array<{
    templateId: string;
    data: Record<string, any>;
  }>;
  options?: {
    format?: TemplateFormat;
    theme?: string;
    language?: string;
  };
};

export type ITemplatePreviewRequest = {
  templateId?: string;
  content?: string;
  engine?: TemplateEngineType;
  sampleData?: boolean;
  data?: Record<string, any>;
  options?: TemplateRenderOptions;
};

export type ITemplateCreateRequest = {
  name: string;
  slug?: string;
  description: string;
  category: TemplateCategory;
  type: string;
  subject: string;
  content: string;
  variables: ITemplateVariable[];
  version?: number;
  versions?: TemplateVersion[];
  engine: TemplateEngineType;
  format?: TemplateFormat;
  theme?: string;
  tags?: string[];
  // Multi-language
  translations?: {
    [language: string]: {
      subject: string;
      textContent?: string;
      htmlContent?: string;
    };
  };
  defaultLanguage?: "en" | "sw";
  metadata?: Record<string, any>;
};

export interface ITemplateUpdateRequest
  extends Partial<ITemplateCreateRequest> {
  isActive?: boolean;
}

export type ITemplateListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: string;
  engine?: string;
  isActive?: boolean;
  tags?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type TemplateTestRequest = {
  templateId: string;
  recipients: string[];
  data?: Record<string, any>;
  options?: TemplateRenderOptions;
};

export type BatchTemplateRenderRequest = {
  templates: Array<{
    templateId?: string;
    template?: ITemplate;
    data: Record<string, any>;
    options?: TemplateRenderOptions;
  }>;
};

export type BatchTemplateRenderResult = {
  results: TemplateRenderResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    averageRenderTime: number;
  };
};

// Template inheritance and composition
export type TemplateInheritance = {
  parentTemplateId?: string;
  overrides?: {
    subject?: string;
    content?: string;
    variables?: Partial<ITemplateVariable>[];
    theme?: string;
  };
  mergeStrategy?: "replace" | "merge" | "append";
};

// A/B Testing
export type TemplateVariant = {
  id: string;
  name: string;
  template: ITemplate;
  weight: number; // Percentage of traffic (0-100)
  isActive: boolean;
  metrics?: {
    sent: number;
    delivered: number;
    opened?: number;
    clicked?: number;
    converted?: number;
  };
};

export type TemplateABTest = {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  variants: TemplateVariant[];
  goal: "open" | "click" | "convert" | "deliver";
  duration: number; // days
  status: "draft" | "running" | "completed" | "stopped";
  startedAt?: Date;
  endedAt?: Date;
  winner?: string; // variant id
  createdBy?: string;
};
