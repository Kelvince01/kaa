import { Template } from "@kaa/models";
import type {
  ITemplate,
  ITemplateVariable,
  TemplateEngineType,
  TemplateFormat,
  TemplateRenderOptions,
  TemplateRenderRequest,
  TemplateRenderResult,
  TemplateValidationResult,
} from "@kaa/models/types";
import { logger } from "@kaa/utils";
import Handlebars from "handlebars";
import { DateTime } from "luxon";
import mjml2html from "mjml";
import type { MJMLParsingOptions } from "mjml-core";
import type mongoose from "mongoose";

export interface MJMLCompileOptions extends MJMLParsingOptions {
  theme?: string;
  minify?: boolean;
  prettify?: boolean;
  inlineCSS?: boolean;
}

export type MJMLTemplate = {
  name: string;
  content: string;
  variables: Record<string, any>;
  theme?: string;
  category: string;
  description?: string;
};

export function unescapeMJML(escaped: string) {
  return escaped
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, `'`)
    .replace(/&amp;/g, "&");
}

// biome-ignore lint/complexity/noStaticOnlyClass: false positive
export class TemplateEngine {
  private static handlebarsCompiled = new Map<
    string,
    Handlebars.TemplateDelegate
  >();
  private static readonly themesCache = new Map<string, any>();
  private static readonly compiledTemplates: Map<
    string,
    HandlebarsTemplateDelegate
  > = new Map();

  /**
   * Initialize template engines and register helpers
   */
  static initialize() {
    TemplateEngine.registerHandlebarsHelpers();
    TemplateEngine.loadThemes();
  }

  /**
   * Register Handlebars helpers
   */
  private static registerHandlebarsHelpers() {
    // Date formatting helpers
    Handlebars.registerHelper(
      "formatDate",
      (date: Date | string, _format = "PP") => {
        try {
          const dateObj = typeof date === "string" ? new Date(date) : date;
          return new Intl.DateTimeFormat("en-KE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(dateObj);
        } catch {
          return date;
        }
      }
    );

    Handlebars.registerHelper("formatDateTime", (date: Date | string) => {
      try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return DateTime.fromJSDate(dateObj).toLocaleString(
          DateTime.DATETIME_MED
        );
      } catch {
        return date;
      }
    });

    // Currency formatting
    Handlebars.registerHelper(
      "formatCurrency",
      (amount: number, currency = "KES") => {
        try {
          return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency,
          }).format(amount);
        } catch {
          return `${currency} ${amount}`;
        }
      }
    );

    // Conditional equality helper
    Handlebars.registerHelper("eq", (a: any, b: any) => a === b);

    // Conditional not equality helper
    Handlebars.registerHelper("ne", (a: any, b: any) => a !== b);

    // Greater than helper
    Handlebars.registerHelper("gt", (a: number, b: number) => a > b);

    // Less than helper
    Handlebars.registerHelper("lt", (a: number, b: number) => a < b);

    // Math operations
    Handlebars.registerHelper("add", (a: number, b: number) => a + b);
    Handlebars.registerHelper("subtract", (a: number, b: number) => a - b);
    Handlebars.registerHelper("multiply", (a: number, b: number) => a * b);
    Handlebars.registerHelper("divide", (a: number, b: number) =>
      b !== 0 ? a / b : 0
    );

    // String operations
    Handlebars.registerHelper(
      "uppercase",
      (str: string) => str?.toUpperCase() || ""
    );
    Handlebars.registerHelper(
      "lowercase",
      (str: string) => str?.toLowerCase() || ""
    );
    Handlebars.registerHelper("capitalize", (str: string) => {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Array length helper
    Handlebars.registerHelper("length", (array: any[]) => array?.length || 0);

    // JSON stringify helper
    Handlebars.registerHelper("json", (context: any) =>
      JSON.stringify(context)
    );

    // Array helpers
    Handlebars.registerHelper("join", (array: any[], separator = ", ") =>
      Array.isArray(array) ? array.join(separator) : ""
    );

    // Default value helper
    Handlebars.registerHelper(
      "default",
      (value: any, defaultValue: any) => value || defaultValue
    );

    // Currency formatting helper
    Handlebars.registerHelper(
      "currency",
      (amount: number, currency = "USD") => {
        if (typeof amount !== "number") return amount;
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
        }).format(amount);
      }
    );

    // Truncate text helper
    Handlebars.registerHelper(
      "truncate",
      (str: string, length = 100, suffix = "...") => {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
      }
    );

    // SMS-specific helpers
    Handlebars.registerHelper("smsLimit", (str: string, limit = 160) => {
      if (!str || str.length <= limit) return str;
      return `${str.substring(0, limit - 3)}...`;
    });

    Handlebars.registerHelper(
      "smsSegment",
      (str: string, encoding = "GSM_7BIT") => {
        const maxLength = encoding === "GSM_7BIT" ? 160 : 70;
        const segments = Math.ceil(str.length / maxLength);
        return segments;
      }
    );

    Handlebars.registerHelper(
      "smsCost",
      (str: string, costPerSegment = 0.01, encoding = "GSM_7BIT") => {
        const maxLength = encoding === "GSM_7BIT" ? 160 : 70;
        const segments = Math.ceil(str.length / maxLength);
        return (segments * costPerSegment).toFixed(2);
      }
    );

    // Phone number formatting helper
    Handlebars.registerHelper(
      "formatPhone",
      (phone: string, format = "international") => {
        if (!phone) return "";

        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, "");

        switch (format) {
          case "international":
            return digits.startsWith("254") ? `+${digits}` : `+254${digits}`;
          case "local":
            return digits.startsWith("254") ? `0${digits.slice(3)}` : digits;
          case "e164":
            return `+${digits}`;
          default:
            return phone;
        }
      }
    );

    // URL shortening helper for SMS
    Handlebars.registerHelper("shortUrl", (url: string, maxLength = 20) => {
      if (!url || url.length <= maxLength) return url;

      // Simple URL shortening (in production, use a proper URL shortener)
      // biome-ignore lint/performance/useTopLevelRegex: false positive
      const domain = url.replace(/^https?:\/\//, "").split("/")[0] as string;
      const path = url.split("/").slice(1).join("/");

      if (domain?.length + 3 <= maxLength) {
        return `${domain}/${path.substring(0, maxLength - domain?.length - 1)}`;
      }

      return `${domain?.substring(0, maxLength - 3)}...`;
    });
  }

  /**
   * Load available themes
   */
  static loadThemes(): void {
    // Default theme
    const defaultTheme = {
      name: "default",
      colors: {
        primary: "#4CAF50",
        secondary: "#2196F3",
        background: "#ffffff",
        text: "#333333",
        muted: "#666666",
        success: "#4CAF50",
        warning: "#FF9800",
        error: "#F44336",
        accent: "#9C27B0",
      },
      fonts: {
        primary: "Inter, Arial, sans-serif",
        heading: "Inter, Arial, sans-serif",
        mono: "JetBrains Mono, monospace",
      },
      spacing: {
        small: "8px",
        medium: "16px",
        large: "24px",
        xl: "32px",
      },
      borderRadius: "8px",
    };

    // Kaa brand theme
    const kaaTheme = {
      name: "kaa",
      colors: {
        primary: "#0066cc",
        secondary: "#4CAF50",
        background: "#ffffff",
        text: "#2c3e50",
        muted: "#7f8c8d",
        success: "#27ae60",
        warning: "#f39c12",
        error: "#e74c3c",
        accent: "#8e44ad",
      },
      fonts: {
        primary: "Inter, Arial, sans-serif",
        heading: "Inter, Arial, sans-serif",
        mono: "JetBrains Mono, monospace",
      },
      spacing: {
        small: "12px",
        medium: "24px",
        large: "36px",
        xl: "48px",
      },
      borderRadius: "8px",
    };

    TemplateEngine.themesCache.set("default", defaultTheme);
    TemplateEngine.themesCache.set("kaa", kaaTheme);

    logger.info(`Loaded ${TemplateEngine.themesCache.size} template themes`);
  }

  /**
   * Apply theme variables to template content
   */
  private static applyTheme(
    templateContent: string,
    themeName: string
  ): string {
    const theme = TemplateEngine.themesCache.get(themeName);
    if (!theme) {
      logger.warn(`Theme "${themeName}" not found, using default`);
      return templateContent;
    }

    let processedContent = templateContent;

    // Replace theme variables
    for (const [category, values] of Object.entries(theme)) {
      if (typeof values === "object" && values !== null) {
        for (const [key, value] of Object.entries(
          values as Record<string, any>
        )) {
          const regex = new RegExp(`{{theme\\.${category}\\.${key}}}`, "g");
          processedContent = processedContent.replace(regex, value);
        }
      } else {
        const regex = new RegExp(`{{theme\\.${category}}}`, "g");
        processedContent = processedContent.replace(regex, values as string);
      }
    }

    return processedContent;
  }

  /**
   * Render template with the specified engine
   */
  static async render(
    request: TemplateRenderRequest
  ): Promise<TemplateRenderResult> {
    const startTime = Date.now();

    try {
      let subject = "";
      let content = "";

      if (!(request.template || request.templateId)) {
        throw new Error("Either template or templateId must be provided");
      }

      // Get template from database if templateId provided
      let template = request.template;
      if (request.templateId && !template) {
        template = (await Template.findById(
          request.templateId as string
        )) as ITemplate;
        if (!template) {
          throw new Error(`Template with ID ${request.templateId} not found`);
        }
      }

      if (!template) {
        throw new Error("Template not found");
      }

      // Validate template data
      if (request.options?.validateData !== false) {
        const validation = TemplateEngine.validateTemplateData(
          template.variables,
          request.data
        );
        if (!validation.isValid) {
          throw new Error(
            `Template validation failed: ${validation.errors.map((error) => error.message).join(", ")}`
          );
        }
      }

      // Apply default values for missing variables
      const enrichedData = { ...request.data };
      for (const variable of template.variables) {
        if (
          enrichedData[variable.name] === undefined &&
          variable.defaultValue !== undefined
        ) {
          enrichedData[variable.name] = variable.defaultValue;
        }
      }

      content = template.content;

      switch (template.engine) {
        case "handlebars": {
          const result = await TemplateEngine.renderHandlebars(
            template,
            enrichedData
          );

          subject = result.subject;
          content = result.content;
          break;
        }
        case "mjml": {
          // MJML templates need to be converted to HTML first
          const result = TemplateEngine.compileMJMLTemplate(
            template,
            request.options
          );
          const subjectTemplate = Handlebars.compile(template.subject);
          const compiledTemplate = Handlebars.compile(result.html);
          subject = subjectTemplate(enrichedData);
          content = compiledTemplate(enrichedData);
          break;
        }
        case "raw":
          // For raw templates, just return the content as-is
          content = template.content;
          break;
        case "ejs":
        case "pug":
        case "nunjucks":
          throw new Error(
            `Template engine ${template.engine} is not yet implemented`
          );
        default:
          throw new Error(`Unsupported template engine: ${template.engine}`);
      }

      // Apply format-specific processing
      content = TemplateEngine.applyFormatProcessing(
        content,
        template.format,
        request.options || {}
      );

      // Update template usage
      await TemplateEngine.incrementUsage(
        (template._id as mongoose.Types.ObjectId).toString()
      );

      const renderTime = Date.now() - startTime;
      const size = Buffer.byteLength(content, "utf8");
      const result = {
        subject,
        content,
        metadata: {
          renderTime,
          size,
          format: template.format,
          engine: template.engine,
          truncated: request.options?.maxLength
            ? content.length > request.options.maxLength
            : false,
        },
      };

      // Add SMS-specific metadata if format is SMS
      if (request.options?.format === "sms") {
        const smsMetadata = TemplateEngine.calculateSMSMetadata(
          content,
          template.metadata
        );
        return { ...result, metadata: smsMetadata };
      }

      return result;
    } catch (error) {
      throw new Error(`Template rendering failed: ${(error as Error).message}`);
    }
  }

  /**
   * Render template content directly (for preview)
   */
  static renderContent(
    template: ITemplate,
    data: Record<string, any>
  ): Promise<TemplateRenderResult> {
    const startTime = Date.now();

    try {
      let renderedSubject = "";
      let renderedContent = "";

      switch (template.engine) {
        case "handlebars": {
          const subjectTemplate = Handlebars.compile(template.subject);
          const contentTemplate = Handlebars.compile(template.content);
          renderedSubject = subjectTemplate(data);
          renderedContent = contentTemplate(data);
          break;
        }
        case "mjml": {
          const result = TemplateEngine.compileMJMLTemplate(template, {});
          const subjectTemplate = Handlebars.compile(template.subject);
          const compiledTemplate = Handlebars.compile(result.html);
          renderedContent = compiledTemplate(data);
          renderedSubject = subjectTemplate(data);
          break;
        }
        case "ejs":
        case "pug":
        case "nunjucks":
          throw new Error(
            `Template engine ${template.engine} is not yet implemented`
          );
        default:
          throw new Error(`Unsupported template engine: ${template.engine}`);
      }

      const renderTime = Date.now() - startTime;
      return Promise.resolve({
        subject: renderedSubject,
        content: renderedContent,
        metadata: {
          renderTime,
          size: Buffer.byteLength(renderedContent, "utf8"),
          format: template.format,
          engine: template.engine,
          truncated: false,
        },
      });
    } catch (error) {
      throw new Error(`Template rendering failed: ${(error as Error).message}`);
    }
  }

  /**
   * Render Handlebars template
   */
  private static renderHandlebars(
    template: ITemplate,
    data: Record<string, any>
  ): Promise<{ subject: string; content: string }> {
    try {
      // Compile templates with caching
      const subjectKey = `${template._id}_subject_v${template.version}`;
      const contentKey = `${template._id}_content_v${template.version}`;

      let subjectTemplate = TemplateEngine.handlebarsCompiled.get(subjectKey);
      if (!subjectTemplate) {
        subjectTemplate = Handlebars.compile(template.subject);
        TemplateEngine.handlebarsCompiled.set(subjectKey, subjectTemplate);
      }

      let contentTemplate = TemplateEngine.handlebarsCompiled.get(contentKey);
      if (!contentTemplate) {
        contentTemplate = Handlebars.compile(template.content);
        TemplateEngine.handlebarsCompiled.set(contentKey, contentTemplate);
      }

      // Render templates
      const subject = subjectTemplate(data);
      const content = contentTemplate(data);

      return Promise.resolve({ subject, content });
    } catch (error) {
      throw new Error(
        `Handlebars rendering failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Compile MJML template with theme and options
   */
  private static compileMJMLTemplate(
    template: ITemplate,
    options: MJMLCompileOptions = {}
  ): { html: string; errors: any[] } {
    try {
      let content = unescapeMJML(template.content);

      // Apply theme variables if specified
      if (options.theme && template.engine !== "raw") {
        content = TemplateEngine.applyTheme(content, options.theme);
      }

      // Compile MJML to HTML
      const mjmlOptions: MJMLParsingOptions = {
        validationLevel: options.validationLevel || "soft",
        fonts: options.fonts || {
          "Dm Sans":
            "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap",
          Inter:
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        },
        minify: options.minify,
        beautify: options.prettify,
        ...options,
      };

      const result = mjml2html(content, mjmlOptions);

      if (result.errors.length > 0) {
        logger.warn(
          `MJML compilation warnings for template ${template.name}:`,
          result.errors
        );
      }

      // Save compiled template for caching
      if (result.html && !result.errors.length) {
        const cacheKey = `${template._id}_${options.theme || "default"}`;
        TemplateEngine.compiledTemplates.set(
          cacheKey,
          Handlebars.compile(result.html)
        );
      }

      return result;
    } catch (error) {
      logger.error(`Error compiling MJML template "${template.name}":`, error);
      return {
        html: "",
        errors: [{ message: (error as Error).message }],
      };
    }
  }

  /**
   * Compile and cache a template
   */
  static compileTemplate(template: ITemplate): Handlebars.TemplateDelegate {
    const cacheKey = `${template.name}_${template.version}`;

    if (TemplateEngine.handlebarsCompiled.has(cacheKey)) {
      // biome-ignore lint/style/noNonNullAssertion: template is cached
      return TemplateEngine.handlebarsCompiled.get(cacheKey)!;
    }

    let compiledTemplate: Handlebars.TemplateDelegate;

    switch (template.engine) {
      case "handlebars":
        compiledTemplate = Handlebars.compile(template.content);
        break;
      case "mjml": {
        // MJML templates need to be converted to HTML first
        const { html, errors } = mjml2html(template.content, {
          validationLevel: "soft",
        });
        if (errors.length > 0) {
          logger.warn(
            `MJML compilation warnings for template ${template.name}:`,
            errors
          );
        }
        compiledTemplate = Handlebars.compile(html);
        break;
      }
      case "raw":
        compiledTemplate = () => template.content;
        break;
      default:
        throw new Error(`Unsupported template engine: ${template.engine}`);
    }

    TemplateEngine.compiledTemplates.set(cacheKey, compiledTemplate);
    return compiledTemplate;
  }

  /**
   * Apply format-specific processing
   */
  static applyFormatProcessing(
    content: string,
    format: TemplateFormat,
    options: TemplateRenderOptions
  ): string {
    switch (format.toLowerCase()) {
      case "sms":
        return TemplateEngine.processSmsFormat(content, options);
      case "text":
        return content.replace(/<[^>]*>/g, ""); // Strip HTML tags
      case "html":
      case "email":
        return content; // No additional processing needed
      case "json":
        return JSON.stringify({ content });
      default:
        return content;
    }
  }

  /**
   * Process SMS format with length limits
   */
  private static processSmsFormat(
    content: string,
    options: TemplateRenderOptions
  ): string {
    // Strip HTML tags and normalize whitespace
    let smsContent = content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Apply SMS length limit (default 160 characters)
    const maxLength = options.maxLength || 160;
    if (smsContent.length > maxLength) {
      const truncateMessage = options.truncateMessage || "...";
      smsContent =
        smsContent.substring(0, maxLength - truncateMessage.length) +
        truncateMessage;
    }

    return smsContent;
  }

  /**
   * Validate template syntax
   */
  static validateTemplate(
    content: string,
    subject: string,
    engine: TemplateEngineType
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      switch (engine) {
        case "handlebars":
          try {
            Handlebars.compile(subject);
            Handlebars.compile(content);
          } catch (error) {
            errors.push(`Handlebars syntax error: ${(error as Error).message}`);
          }
          break;
        case "mjml":
          try {
            mjml2html(content, { validationLevel: "soft" });
          } catch (error) {
            errors.push(`MJML syntax error: ${(error as Error).message}`);
          }
          break;
        case "ejs":
        case "pug":
        case "nunjucks":
          errors.push(
            `Template engine ${engine} validation is not yet implemented`
          );
          break;
        default:
          errors.push(`Unsupported template engine: ${engine}`);
      }
    } catch (error) {
      errors.push(`Template validation failed: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get sample data for template variables
   */
  static generateSampleData(
    variables: Array<{ name: string; type: string; defaultValue?: any }>
  ): Record<string, any> {
    const sampleData: Record<string, any> = {};

    for (const variable of variables) {
      if (variable.defaultValue !== undefined) {
        sampleData[variable.name] = variable.defaultValue;
      } else {
        switch (variable.type) {
          case "string":
            sampleData[variable.name] = `Sample ${variable.name}`;
            break;
          case "number":
            sampleData[variable.name] = 42;
            break;
          case "boolean":
            sampleData[variable.name] = true;
            break;
          case "date":
            sampleData[variable.name] = new Date().toISOString();
            break;
          case "array":
            sampleData[variable.name] = ["Item 1", "Item 2", "Item 3"];
            break;
          case "object":
            sampleData[variable.name] = {
              id: 1,
              name: "Sample Object",
              value: "Sample Value",
            };
            break;
          default:
            sampleData[variable.name] = `Sample ${variable.name}`;
        }
      }
    }

    return sampleData;
  }

  /**
   * Validate template variables against provided data
   */
  static validateTemplateData(
    variables: ITemplateVariable[],
    data: Record<string, any>
  ): TemplateValidationResult {
    const errors: TemplateValidationResult["errors"] = [];
    const warnings: TemplateValidationResult["warnings"] = [];

    for (const variable of variables) {
      const value = data[variable.name];

      // Check required fields
      if (
        variable.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push({
          field: variable.name,
          message: `Required variable '${variable.name}' is missing`,
          code: "REQUIRED_FIELD_MISSING",
        });
        continue;
      }

      // Skip validation if value is undefined/null and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      switch (variable.type) {
        case "string":
          if (typeof value !== "string") {
            errors.push({
              field: variable.name,
              message: `Variable '${variable.name}' must be a string`,
              code: "INVALID_TYPE",
            });
          }
          break;
        case "number":
          if (typeof value !== "number" || Number.isNaN(value)) {
            errors.push({
              field: variable.name,
              message: `Variable '${variable.name}' must be a valid number`,
              code: "INVALID_TYPE",
            });
          }
          break;
        case "boolean":
          if (typeof value !== "boolean") {
            errors.push({
              field: variable.name,
              message: `Variable '${variable.name}' must be a boolean`,
              code: "INVALID_TYPE",
            });
          }
          break;
        case "date":
          if (!(value instanceof Date) && Number.isNaN(Date.parse(value))) {
            errors.push({
              field: variable.name,
              message: `Variable '${variable.name}' must be a valid date`,
              code: "INVALID_TYPE",
            });
          }
          break;
        case "array":
          if (!Array.isArray(value)) {
            errors.push({
              field: variable.name,
              message: `Variable '${variable.name}' must be an array`,
              code: "INVALID_TYPE",
            });
          }
          break;
        case "object":
          if (typeof value !== "object" || Array.isArray(value)) {
            errors.push({
              field: variable.name,
              message: `Variable '${variable.name}' must be an object`,
              code: "INVALID_TYPE",
            });
          }
          break;
        default:
          break;
      }

      // Additional validation rules
      if (variable.validation) {
        const { pattern, min, max, options } = variable.validation;

        if (pattern && typeof value === "string") {
          const regex = new RegExp(pattern);
          if (!regex.test(value)) {
            errors.push({
              field: variable.name,
              message: `Variable '${variable.name}' does not match required pattern`,
              code: "PATTERN_MISMATCH",
            });
          }
        }

        if (min !== undefined && typeof value === "number" && value < min) {
          errors.push({
            field: variable.name,
            message: `Variable '${variable.name}' must be at least ${min}`,
            code: "MIN_VALUE_VIOLATION",
          });
        }

        if (max !== undefined && typeof value === "number" && value > max) {
          errors.push({
            field: variable.name,
            message: `Variable '${variable.name}' must be at most ${max}`,
            code: "MAX_VALUE_VIOLATION",
          });
        }

        if (
          options &&
          Array.isArray(options) &&
          !options.includes(value) &&
          options.length > 0
        ) {
          errors.push({
            field: variable.name,
            message: `Variable '${variable.name}' must be one of: ${options.join(", ")}`,
            code: "INVALID_OPTION",
          });
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Calculate SMS-specific metadata
   */
  static calculateSMSMetadata(content: string, templateMetadata?: any): any {
    const encoding = templateMetadata?.encoding || "GSM_7BIT";
    const maxLength = encoding === "GSM_7BIT" ? 160 : 70;
    const concatenatedLength = encoding === "GSM_7BIT" ? 153 : 67;

    let segments = 1;
    if (content.length > maxLength) {
      segments = Math.ceil(content.length / concatenatedLength);
    }

    // Calculate cost (example: $0.01 per segment)
    const cost = segments * 0.01;

    return {
      length: content.length,
      segments,
      encoding,
      maxLength,
      cost,
      isOverLimit: content.length > maxLength,
      concatenatedLength,
    };
  }

  /**
   * Increment template usage count
   */
  static async incrementUsage(templateId: string): Promise<void> {
    try {
      await Template.findByIdAndUpdate(templateId, {
        $inc: { "usage.count": 1 },
        $set: { "usage.lastUsedAt": new Date() },
      });
    } catch (error) {
      logger.error(
        `Failed to increment usage for template ${templateId}:`,
        error
      );
    }
  }

  /**
   * Clear compiled template cache
   */
  static clearCache(templateId?: string, version?: number) {
    if (templateId && version) {
      TemplateEngine.handlebarsCompiled.delete(
        `${templateId}_subject_v${version}`
      );
      TemplateEngine.handlebarsCompiled.delete(
        `${templateId}_content_v${version}`
      );
    } else {
      TemplateEngine.handlebarsCompiled.clear();
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    keys: string[];
    memoryUsage?: number;
  } {
    const keys = Array.from(TemplateEngine.handlebarsCompiled.keys());

    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const [key, template] of TemplateEngine.handlebarsCompiled) {
      memoryUsage += key.length * 2; // String overhead
      memoryUsage += 100; // Template function overhead (rough estimate)
    }

    return {
      size: TemplateEngine.handlebarsCompiled.size,
      keys,
      memoryUsage,
    };
  }
}

// Initialize the engine
TemplateEngine.initialize();
