import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logger } from "@kaa/utils";
import Handlebars from "handlebars";
import mjml2html from "mjml";
import type { MJMLParsingOptions } from "mjml-core";

export type MJMLTheme = {
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
  };
  fonts: {
    primary: string;
    heading: string;
    mono: string;
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: string;
};

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

class MJMLService {
  private readonly themes: Map<string, MJMLTheme> = new Map();
  private readonly templates: Map<string, string> = new Map();
  private readonly compiledTemplates: Map<string, HandlebarsTemplateDelegate> =
    new Map();
  private readonly templatesDir = path.join(__dirname, "../templates");
  private readonly themesDir = path.join(__dirname, "../themes");
  private readonly distDir = path.join(__dirname, "../../dist/templates");

  constructor() {
    this.initializeDirectories();
    this.loadThemes();
    this.loadTemplates();
    this.registerHandlebarsHelpers();
  }

  /**
   * Initialize required directories
   */
  private initializeDirectories(): void {
    const dirs = [this.themesDir, this.distDir];
    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Load all available themes
   */
  private loadThemes(): void {
    // Default theme
    const defaultTheme: MJMLTheme = {
      name: "default",
      colors: {
        primary: "#4CAF50",
        secondary: "#2196F3",
        background: "#f5f5f5",
        text: "#333333",
        muted: "#999999",
        success: "#4CAF50",
        warning: "#FF9800",
        error: "#F44336",
      },
      fonts: {
        primary: "Dm Sans, Arial, sans-serif",
        heading: "Dm Sans, Arial, sans-serif",
        mono: "Monaco, Consolas, monospace",
      },
      spacing: {
        small: "10px",
        medium: "20px",
        large: "30px",
      },
      borderRadius: "5px",
    };

    this.themes.set("default", defaultTheme);

    // Kaa brand theme
    const kaaBrandTheme: MJMLTheme = {
      name: "kaa-brand",
      colors: {
        primary: "#0066cc",
        secondary: "#4CAF50",
        background: "#ffffff",
        text: "#2c3e50",
        muted: "#7f8c8d",
        success: "#27ae60",
        warning: "#f39c12",
        error: "#e74c3c",
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
      },
      borderRadius: "8px",
    };

    this.themes.set("kaa-brand", kaaBrandTheme);

    logger.info(`Loaded ${this.themes.size} MJML themes`);
  }

  /**
   * Load all MJML templates
   */
  private loadTemplates(): void {
    try {
      const templateFiles = [
        // Auth email templates
        "verification",
        "password-reset",
        "welcome",
        "notification",
        "incident-notification",
        // Booking email templates
        "booking-notification",
        "booking-status-update",
        "booking-cancellation",
        // Payment email templates
        "payment-reminder",
        "payment-receipt",
        "payment-overdue",
        // Reports email templates
        "monthly-report",
        // Reference email templates
        "reference-request",
        "reference-reminder",
        "reference-completed",
        "reference-declined",
        "reference-provider-welcome",
        "reference-tenant-verification-status",
        "tenant-verification-complete",
        "tenant-verification-update",
      ];

      for (const templateName of templateFiles) {
        const filePath = path.join(this.templatesDir, `${templateName}.mjml`);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, "utf8");
          this.templates.set(templateName, content);
        }
      }

      logger.info(`Loaded ${this.templates.size} MJML templates`);
    } catch (error) {
      logger.error("Error loading MJML templates:", error);
      throw error;
    }
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper(
      "formatDate",
      (date: Date, _format = "YYYY-MM-DD") => {
        if (!date) return "";
        return new Date(date).toLocaleDateString();
      }
    );

    // Currency formatting helper
    Handlebars.registerHelper(
      "formatCurrency",
      (amount: number, currency = "KES") => {
        if (typeof amount !== "number") return amount;
        return new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency,
        }).format(amount);
      }
    );

    // Conditional helper
    Handlebars.registerHelper("ifEquals", (a: any, b: any, options: any) =>
      a === b ? options.fn(this) : options.inverse(this)
    );

    // URL generation helper
    Handlebars.registerHelper(
      "generateUrl",
      (path: string, baseUrl?: string) => {
        const base = baseUrl || process.env.APP_URL || "https://app.kaapro.dev";
        return `${base}${path.startsWith("/") ? path : `/${path}`}`;
      }
    );

    // Theme color helper
    Handlebars.registerHelper(
      "themeColor",
      (colorName: string, themeName = "default") => {
        const theme = this.themes.get(themeName);
        return (
          theme?.colors[colorName as keyof typeof theme.colors] || "#000000"
        );
      }
    );
  }

  /**
   * Compile MJML template with theme and options
   */
  compileTemplate(
    templateName: string,
    options: MJMLCompileOptions = {}
  ): { html: string; errors: any[] } {
    try {
      const template = this.templates.get(templateName);
      if (!template) {
        throw new Error(`Template "${templateName}" not found`);
      }

      // Apply theme variables if specified
      let processedTemplate = template;
      if (options.theme) {
        processedTemplate = this.applyTheme(template, options.theme);
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

      const result = mjml2html(processedTemplate, mjmlOptions);

      // Save compiled template for caching
      if (result.html && !result.errors.length) {
        const cacheKey = `${templateName}_${options.theme || "default"}`;
        this.compiledTemplates.set(cacheKey, Handlebars.compile(result.html));
      }

      return result;
    } catch (error) {
      logger.error(`Error compiling MJML template "${templateName}":`, error);
      return {
        html: "",
        errors: [{ message: (error as Error).message }],
      };
    }
  }

  /**
   * Apply theme variables to template
   */
  private applyTheme(template: string, themeName: string): string {
    const theme = this.themes.get(themeName);
    if (!theme) {
      logger.warn(`Theme "${themeName}" not found, using default`);
      return template;
    }

    let processedTemplate = template;

    // Replace theme variables
    for (const [key, value] of Object.entries(theme.colors)) {
      const regex = new RegExp(`{{theme\\.colors\\.${key}}}`, "g");
      processedTemplate = processedTemplate.replace(regex, value);
    }

    for (const [key, value] of Object.entries(theme.fonts)) {
      const regex = new RegExp(`{{theme\\.fonts\\.${key}}}`, "g");
      processedTemplate = processedTemplate.replace(regex, value);
    }

    for (const [key, value] of Object.entries(theme.spacing)) {
      const regex = new RegExp(`{{theme\\.spacing\\.${key}}}`, "g");
      processedTemplate = processedTemplate.replace(regex, value);
    }

    // Replace border radius
    processedTemplate = processedTemplate.replace(
      /{{theme\.borderRadius}}/g,
      theme.borderRadius
    );

    return processedTemplate;
  }

  /**
   * Render template with data
   */
  renderTemplate(
    templateName: string,
    data: Record<string, any> = {},
    options: MJMLCompileOptions = {}
  ): { html: string; errors: any[] } {
    try {
      const cacheKey = `${templateName}_${options.theme || "default"}`;
      let compiledTemplate = this.compiledTemplates.get(cacheKey);

      if (!compiledTemplate) {
        const result = this.compileTemplate(templateName, options);
        if (result.errors.length > 0) {
          return result;
        }
        compiledTemplate = Handlebars.compile(result.html);
        this.compiledTemplates.set(cacheKey, compiledTemplate);
      }

      const html = compiledTemplate(data);
      return { html, errors: [] };
    } catch (error) {
      logger.error(`Error rendering template "${templateName}":`, error);
      return {
        html: "",
        errors: [{ message: (error as Error).message }],
      };
    }
  }

  /**
   * Validate MJML template
   */
  validateTemplate(templateName: string): { isValid: boolean; errors: any[] } {
    try {
      const template = this.templates.get(templateName);
      if (!template) {
        return {
          isValid: false,
          errors: [{ message: `Template "${templateName}" not found` }],
        };
      }

      const result = mjml2html(template, { validationLevel: "strict" });
      return {
        isValid: result.errors.length === 0,
        errors: result.errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: (error as Error).message }],
      };
    }
  }

  /**
   * Get all available templates
   */
  getTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get all available themes
   */
  getThemes(): MJMLTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Add a new theme
   */
  addTheme(theme: MJMLTheme): void {
    this.themes.set(theme.name, theme);
    logger.info(`Added theme: ${theme.name}`);
  }

  /**
   * Save template to file
   */
  saveTemplate(name: string, content: string): void {
    const filePath = path.join(this.templatesDir, `${name}.mjml`);
    writeFileSync(filePath, content, "utf8");
    this.templates.set(name, content);
    logger.info(`Saved template: ${name}`);
  }

  /**
   * Hot reload template
   */
  reloadTemplate(templateName: string): void {
    try {
      const filePath = path.join(this.templatesDir, `${templateName}.mjml`);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, "utf8");
        this.templates.set(templateName, content);
        // Clear compiled cache
        this.compiledTemplates.forEach((_, key) => {
          if (key.startsWith(templateName)) {
            this.compiledTemplates.delete(key);
          }
        });
        logger.info(`Reloaded template: ${templateName}`);
      }
    } catch (error) {
      logger.error(`Error reloading template "${templateName}":`, error);
    }
  }

  /**
   * Preview template in browser format
   */
  previewTemplate(
    templateName: string,
    data: Record<string, any> = {},
    options: MJMLCompileOptions = {}
  ): string {
    const result = this.renderTemplate(templateName, data, options);
    if (result.errors.length > 0) {
      return `<h1>Template Error</h1><pre>${JSON.stringify(result.errors, null, 2)}</pre>`;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Email Preview - ${templateName}</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
        .preview-container { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #ddd; }
        .preview-header { padding: 10px; background: #333; color: white; font-size: 14px; }
        .preview-content { padding: 0; }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            Email Preview: ${templateName} ${options.theme ? `(Theme: ${options.theme})` : ""}
        </div>
        <div class="preview-content">
            ${result.html}
        </div>
    </div>
</body>
</html>`;
  }
}

export default new MJMLService();
