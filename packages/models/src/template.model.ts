import mongoose, { Schema } from "mongoose";
import type {
  ITemplate,
  ITemplateRendering,
  ITemplateRenderingError,
  ITemplateRenderingOutput,
  ITemplateRenderingRequestMetadata,
  ITemplateVariable,
  TemplateVersion,
} from "./types/template.type";

// Template Variable Schema
const templateVariableSchema = new Schema<ITemplateVariable>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["string", "number", "boolean", "date", "array", "object"],
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    defaultValue: Schema.Types.Mixed,
    description: {
      type: String,
      required: true,
    },
    validation: {
      pattern: String,
      min: Number,
      max: Number,
      options: [Schema.Types.Mixed],
    },
  },
  { _id: false }
);

const templateVersionSchema = new Schema<TemplateVersion>(
  {
    version: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    variables: [templateVariableSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comment: {
      type: String,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { _id: false }
);

// Template Schema
const templateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["email", "document", "report", "notification", "other"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    variables: [templateVariableSchema],
    engine: {
      type: String,
      enum: ["handlebars", "ejs", "pug", "nunjucks", "mjml"],
      default: "handlebars",
      index: true,
    },
    format: {
      type: String,
      enum: [
        "html",
        "text",
        "sms",
        "email",
        "json",
        "pdf",
        "docx",
        "xlsx",
        "markdown",
      ],
      default: "html",
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    versions: [templateVersionSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    maxLength: {
      type: Number,
      required: true,
      default: 160,
      min: 1,
      max: 1600,
    },
    encoding: {
      type: String,
      enum: ["GSM_7BIT", "UCS2"],
      default: "GSM_7BIT",
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsedAt: Date,
    usageHistory: [
      {
        date: Date,
        userId: Schema.Types.ObjectId,
        context: String,
      },
    ],
    usage: {
      count: {
        type: Number,
        default: 0,
      },
      lastUsedAt: Date,
      averageRenderTime: Number,
    },

    // Multi-language support
    translations: {
      type: Map,
      of: {
        subject: {
          type: String,
          required: true,
          maxlength: 998,
        },
        textContent: {
          type: String,
          maxlength: 100_000,
        },
        htmlContent: {
          type: String,
          maxlength: 500_000,
        },
      },
      default: () => new Map(),
    },
    defaultLanguage: {
      type: String,
      enum: ["en", "sw"],
      required: true,
      default: "en",
    },

    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: "templates",
  }
);

// Template Rendering Metadata Schema
const templateRenderingMetadataSchema =
  new Schema<ITemplateRenderingRequestMetadata>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      requestId: {
        type: String,
        required: true,
        index: true,
      },
      ipAddress: {
        type: String,
        required: true,
      },
      userAgent: {
        type: String,
        required: true,
      },
    },
    { _id: false }
  );

// Template Rendering Output Schema
const templateRenderingOutputSchema = new Schema<ITemplateRenderingOutput>(
  {
    content: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
    },
    metadata: {
      renderTime: {
        type: Number,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      format: {
        type: String,
        enum: ["html", "pdf", "text", "docx", "xlsx", "markdown"],
        default: "html",
      },
    },
  },
  { _id: false }
);

// Template Rendering Error Schema
const templateRenderingErrorSchema = new Schema<ITemplateRenderingError>(
  {
    code: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    stack: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Template Rendering Schema
const templateRenderingSchema = new Schema<ITemplateRendering>(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      required: true,
      index: true,
    },
    templateVersion: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    input: {
      type: Map,
      of: Schema.Types.Mixed,
      required: true,
    },
    output: templateRenderingOutputSchema,
    error: templateRenderingErrorSchema,
    metadata: {
      type: templateRenderingMetadataSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "template_renderings",
  }
);

// Indexes for performance
templateSchema.index({ name: 1, category: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ createdBy: 1, isActive: 1 });
templateSchema.index({ usageCount: -1 });
templateSchema.index({ createdAt: -1 });

// Increment usage count when template is used
templateSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

/**
 * Get template content for language
 */
templateSchema.methods.getContentForLanguage = function (
  language: "en" | "sw"
) {
  if (language === "sw" && this.translations.has("sw")) {
    return this.translations.get("sw");
  }

  return {
    subject: this.subject,
    textContent: this.textContent,
    htmlContent: this.htmlContent,
  };
};

// Static method to find active templates
templateSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to find by category
templateSchema.statics.findByCategory = function (category: string) {
  return this.find({ category, isActive: true });
};

templateRenderingSchema.index({ templateId: 1, status: 1 });
templateRenderingSchema.index({ "metadata.userId": 1, createdAt: -1 });
templateRenderingSchema.index({ createdAt: -1 });

// Create and export models
export const Template = mongoose.model<ITemplate>("Template", templateSchema);
export const TemplateRendering = mongoose.model<ITemplateRendering>(
  "TemplateRendering",
  templateRenderingSchema
);
