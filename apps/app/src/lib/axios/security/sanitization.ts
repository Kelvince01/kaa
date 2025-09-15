export type SanitizationConfig = {
  enableInputSanitization: boolean;
  enableOutputSanitization: boolean;
  allowedHtmlTags: string[];
  maxStringLength: number;
  maxObjectDepth: number;
};

export class DataSanitizer {
  private readonly config: SanitizationConfig;

  constructor(config: SanitizationConfig) {
    this.config = config;
  }

  sanitizeRequest(data: any): any {
    if (!this.config.enableInputSanitization) return data;
    return this.sanitizeValue(data, 0);
  }

  sanitizeResponse(data: any): any {
    if (!this.config.enableOutputSanitization) return data;
    return this.sanitizeValue(data, 0);
  }

  private sanitizeValue(value: any, depth: number): any {
    if (depth > this.config.maxObjectDepth) {
      throw new Error(
        `Object depth exceeds maximum allowed: ${this.config.maxObjectDepth}`
      );
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {
      return this.sanitizeString(value);
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item, depth + 1));
    }

    if (typeof value === "object") {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeValue(val, depth + 1);
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(str: string): string {
    if (str.length > this.config.maxStringLength) {
      throw new Error(
        `String length exceeds maximum allowed: ${this.config.maxStringLength}`
      );
    }

    // Remove potentially dangerous characters
    let sanitized = str
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/data:/gi, "") // Remove data: protocol
      .replace(/vbscript:/gi, "") // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .trim();

    // If HTML is allowed, only keep whitelisted tags
    if (this.config.allowedHtmlTags.length > 0) {
      sanitized = this.sanitizeHtml(sanitized);
    }

    return sanitized;
  }

  private sanitizeHtml(html: string): string {
    if (this.config.allowedHtmlTags.length === 0) {
      return html.replace(/<[^>]*>/g, ""); // Strip all HTML
    }

    // Simple HTML sanitization - in production, use DOMPurify or similar
    const allowedTagsRegex = new RegExp(
      `<(?!/?(?:${this.config.allowedHtmlTags.join("|")})\\b)[^>]*>`,
      "gi"
    );

    return html.replace(allowedTagsRegex, "");
  }

  validateRequestSize(data: any): boolean {
    const serialized = JSON.stringify(data);
    const sizeInBytes = new Blob([serialized]).size;
    const maxSize = 10 * 1024 * 1024; // 10MB limit

    return sizeInBytes <= maxSize;
  }

  detectSuspiciousPatterns(data: any): string[] {
    const suspiciousPatterns = [
      /script\s*:/gi,
      /javascript\s*:/gi,
      /data\s*:/gi,
      /vbscript\s*:/gi,
      /<script/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\s*\(/gi,
      /function\s*\(/gi,
      /setTimeout/gi,
      /setInterval/gi,
    ];

    const issues: string[] = [];
    const serialized = JSON.stringify(data);

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(serialized)) {
        issues.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }

    return issues;
  }
}
