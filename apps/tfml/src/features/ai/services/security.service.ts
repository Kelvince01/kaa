/** biome-ignore-all lint/performance/useTopLevelRegex: ignore */
import crypto from "node:crypto";
import { logger } from "@kaa/utils/logger";
import { aiConfig } from "../ai.config";
import type { DataSchema } from "./data-pipeline.service";

export type SanitizedInput = {
  data: Record<string, any>;
  sanitizationLog: SanitizationAction[];
  riskScore: number;
};

export type SanitizationAction = {
  field: string;
  action: "sanitized" | "blocked" | "transformed" | "validated";
  originalValue?: any;
  newValue?: any;
  reason: string;
};

export type AdversarialDetectionResult = {
  isAdversarial: boolean;
  confidence: number;
  detectionMethod: string;
  suspiciousFeatures: string[];
  riskLevel: "low" | "medium" | "high";
};

export type AnonymizedData = {
  data: Record<string, any>;
  anonymizationMap: Record<string, string>;
  privacyLevel: "basic" | "enhanced" | "strict";
};

export type InputValidationRule = {
  field: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  constraints?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowedValues?: any[];
    customValidator?: (value: any) => boolean;
  };
  sanitization?: {
    trim?: boolean;
    lowercase?: boolean;
    removeHtml?: boolean;
    removeScripts?: boolean;
    escapeSpecialChars?: boolean;
  };
};

export type SecurityConfig = {
  maxInputSize: number;
  allowedFileTypes: string[];
  rateLimiting: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
  adversarialDetection: {
    enabled: boolean;
    threshold: number;
    methods: ("statistical" | "gradient" | "reconstruction")[];
  };
  dataPrivacy: {
    enableAnonymization: boolean;
    retentionPeriod: number; // days
    encryptSensitiveFields: boolean;
  };
  auditLogging: {
    enabled: boolean;
    logLevel: "basic" | "detailed" | "full";
    retentionPeriod: number; // days
  };
};

export class MLSecurityService {
  private readonly validationRules: Map<string, InputValidationRule[]> =
    new Map();
  private readonly encryptionKey: Buffer;
  private readonly securityConfig: SecurityConfig;
  private auditLog: Array<{ timestamp: Date; event: string; details: any }> =
    [];

  constructor(config?: Partial<SecurityConfig>) {
    this.securityConfig = {
      maxInputSize: config?.maxInputSize || aiConfig.security.maxInputSize,
      allowedFileTypes:
        config?.allowedFileTypes || aiConfig.security.allowedFileTypes,
      rateLimiting: {
        maxRequestsPerMinute: config?.rateLimiting?.maxRequestsPerMinute || 60,
        maxRequestsPerHour: config?.rateLimiting?.maxRequestsPerHour || 1000,
      },
      adversarialDetection: {
        enabled: config?.adversarialDetection?.enabled ?? true,
        threshold: config?.adversarialDetection?.threshold || 0.7,
        methods: config?.adversarialDetection?.methods || [
          "statistical",
          "reconstruction",
        ],
      },
      dataPrivacy: {
        enableAnonymization: config?.dataPrivacy?.enableAnonymization ?? true,
        retentionPeriod: config?.dataPrivacy?.retentionPeriod || 90,
        encryptSensitiveFields:
          config?.dataPrivacy?.encryptSensitiveFields ?? true,
      },
      auditLogging: {
        enabled: config?.auditLogging?.enabled ?? true,
        logLevel: config?.auditLogging?.logLevel || "detailed",
        retentionPeriod: config?.auditLogging?.retentionPeriod || 365,
      },
    };

    // Generate or load encryption key
    this.encryptionKey = this.generateEncryptionKey();
  }

  /**
   * Validate and sanitize ML model inputs
   */
  validateAndSanitize(input: any, modelId: string): SanitizedInput {
    const startTime = Date.now();
    const sanitizationLog: SanitizationAction[] = [];
    let riskScore = 0;

    try {
      // Check input size
      const inputSize = JSON.stringify(input).length;
      if (inputSize > this.securityConfig.maxInputSize) {
        throw new Error(
          `Input size ${inputSize} exceeds maximum allowed ${this.securityConfig.maxInputSize}`
        );
      }

      // Get validation rules for this model
      const rules = this.validationRules.get(modelId) || [];
      const sanitizedData: Record<string, any> = {};

      // Process each field
      for (const [field, value] of Object.entries(input)) {
        const rule = rules.find((r) => r.field === field);

        if (rule) {
          const { sanitizedValue, actions, risk } = this.sanitizeField(
            field,
            value,
            rule
          );
          sanitizedData[field] = sanitizedValue;
          sanitizationLog.push(...actions);
          riskScore += risk;
        } else {
          // No rule defined - apply basic sanitization
          const { sanitizedValue, actions, risk } = this.basicSanitization(
            field,
            value
          );
          sanitizedData[field] = sanitizedValue;
          sanitizationLog.push(...actions);
          riskScore += risk;
        }
      }

      // Validate required fields
      for (const rule of rules) {
        if (rule.required && !(rule.field in input)) {
          sanitizationLog.push({
            field: rule.field,
            action: "blocked",
            reason: "Required field missing",
          });
          riskScore += 10;
        }
      }

      // Normalize risk score (0-100)
      riskScore = Math.min(100, Math.max(0, riskScore));

      const result: SanitizedInput = {
        data: sanitizedData,
        sanitizationLog,
        riskScore,
      };

      // Log security event
      this.logSecurityEvent("input_sanitization", {
        modelId,
        inputSize,
        riskScore,
        actionsCount: sanitizationLog.length,
        processingTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error("Input validation failed", { modelId, error });

      this.logSecurityEvent("input_validation_error", {
        modelId,
        error: (error as Error).message,
        processingTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Detect adversarial inputs using multiple methods
   */
  detectAdversarialInputs(
    input: any,
    modelId?: string
  ): AdversarialDetectionResult {
    if (!this.securityConfig.adversarialDetection.enabled) {
      return {
        isAdversarial: false,
        confidence: 0,
        detectionMethod: "disabled",
        suspiciousFeatures: [],
        riskLevel: "low",
      };
    }

    const startTime = Date.now();
    const methods = this.securityConfig.adversarialDetection.methods;
    const results: Array<{
      method: string;
      score: number;
      features: string[];
    }> = [];

    try {
      // Statistical anomaly detection
      if (methods.includes("statistical")) {
        const statResult = this.detectStatisticalAnomalies(input);
        results.push({
          method: "statistical",
          score: statResult.score,
          features: statResult.suspiciousFeatures,
        });
      }

      // Gradient-based detection (simplified)
      if (methods.includes("gradient")) {
        const gradResult = this.detectGradientAnomalies(input);
        results.push({
          method: "gradient",
          score: gradResult.score,
          features: gradResult.suspiciousFeatures,
        });
      }

      // Reconstruction-based detection
      if (methods.includes("reconstruction")) {
        const reconResult = this.detectReconstructionAnomalies(input);
        results.push({
          method: "reconstruction",
          score: reconResult.score,
          features: reconResult.suspiciousFeatures,
        });
      }

      // Combine results
      const avgScore =
        results.reduce((sum, r) => sum + r.score, 0) / results.length;
      const allSuspiciousFeatures = [
        ...new Set(results.flatMap((r) => r.features)),
      ];
      const bestMethod = results.reduce((best, current) =>
        current.score > best.score ? current : best
      ).method;

      const isAdversarial =
        avgScore > this.securityConfig.adversarialDetection.threshold;
      const riskLevel: "low" | "medium" | "high" =
        avgScore > 0.8 ? "high" : avgScore > 0.5 ? "medium" : "low";

      const result: AdversarialDetectionResult = {
        isAdversarial,
        confidence: avgScore,
        detectionMethod: bestMethod,
        suspiciousFeatures: allSuspiciousFeatures,
        riskLevel,
      };

      // Log security event
      this.logSecurityEvent("adversarial_detection", {
        modelId,
        isAdversarial,
        confidence: avgScore,
        riskLevel,
        methods: methods.join(","),
        processingTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error("Adversarial detection failed", { modelId, error });

      return {
        isAdversarial: false,
        confidence: 0,
        detectionMethod: "error",
        suspiciousFeatures: [],
        riskLevel: "low",
      };
    }
  }

  /**
   * Anonymize sensitive data for privacy protection
   */
  anonymizeData(
    data: Record<string, any>,
    privacyLevel: "basic" | "enhanced" | "strict" = "basic"
  ): AnonymizedData {
    const anonymizedData: Record<string, any> = {};
    const anonymizationMap: Record<string, string> = {};

    // Define sensitive field patterns
    const sensitivePatterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[+]?[1-9][\d]{0,15}$/,
      ssn: /^\d{3}-?\d{2}-?\d{4}$/,
      creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
      name: /^[a-zA-Z\s]{2,50}$/,
    };

    for (const [field, value] of Object.entries(data)) {
      if (typeof value === "string") {
        let isAnonymized = false;

        // Check for sensitive patterns
        for (const [pattern, regex] of Object.entries(sensitivePatterns)) {
          if (regex.test(value)) {
            const anonymized = this.anonymizeValue(
              value,
              pattern,
              privacyLevel
            );
            anonymizedData[field] = anonymized.value;
            anonymizationMap[field] = anonymized.method;
            isAnonymized = true;
            break;
          }
        }

        // Check for sensitive field names
        if (!isAnonymized && this.isSensitiveFieldName(field)) {
          const anonymized = this.anonymizeValue(
            value,
            "sensitive_field",
            privacyLevel
          );
          anonymizedData[field] = anonymized.value;
          anonymizationMap[field] = anonymized.method;
          isAnonymized = true;
        }

        if (!isAnonymized) {
          anonymizedData[field] = value;
        }
      } else {
        anonymizedData[field] = value;
      }
    }

    this.logSecurityEvent("data_anonymization", {
      fieldsAnonymized: Object.keys(anonymizationMap).length,
      privacyLevel,
      totalFields: Object.keys(data).length,
    });

    return {
      data: anonymizedData,
      anonymizationMap,
      privacyLevel,
    };
  }

  /**
   * Encrypt sensitive model data
   */
  encryptSensitiveData(data: any): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      this.encryptionKey,
      "test-iv"
    );

    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
    };
  }

  /**
   * Decrypt sensitive model data
   */
  decryptSensitiveData(encrypted: string, _iv: string): any {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      this.encryptionKey,
      "test-iv"
    );

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  }

  /**
   * Configure validation rules for a model
   */
  configureValidationRules(
    modelId: string,
    rules: InputValidationRule[]
  ): void {
    this.validationRules.set(modelId, rules);

    this.logSecurityEvent("validation_rules_configured", {
      modelId,
      rulesCount: rules.length,
    });

    logger.info("Validation rules configured", {
      modelId,
      rulesCount: rules.length,
    });
  }

  /**
   * Generate validation rules from data schema
   */
  generateValidationRulesFromSchema(schema: DataSchema): InputValidationRule[] {
    const rules: InputValidationRule[] = [];

    for (const feature of schema.features) {
      const rule: InputValidationRule = {
        field: feature.name,
        type: this.mapSchemaTypeToValidationType(feature.type),
        required: feature.required,
      };

      // Add constraints
      if (feature.constraints) {
        rule.constraints = {
          min: feature.constraints.min,
          max: feature.constraints.max,
          minLength: feature.constraints.minLength,
          maxLength: feature.constraints.maxLength,
          pattern: feature.constraints.pattern
            ? new RegExp(feature.constraints.pattern)
            : undefined,
          allowedValues: feature.constraints.allowedValues,
        };
      }

      // Add sanitization rules
      if (feature.type === "text") {
        rule.sanitization = {
          trim: true,
          removeHtml: true,
          removeScripts: true,
          escapeSpecialChars: true,
        };
      }

      rules.push(rule);
    }

    return rules;
  }

  /**
   * Get security audit log
   */
  getAuditLog(
    limit = 100
  ): Array<{ timestamp: Date; event: string; details: any }> {
    return this.auditLog
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): any {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const recentEvents = this.auditLog.filter(
      (log) => log.timestamp.getTime() > hourAgo
    );
    const dailyEvents = this.auditLog.filter(
      (log) => log.timestamp.getTime() > dayAgo
    );

    const eventCounts = this.auditLog.reduce(
      (counts, log) => {
        counts[log.event] = (counts[log.event] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );

    return {
      totalEvents: this.auditLog.length,
      recentEvents: recentEvents.length,
      dailyEvents: dailyEvents.length,
      eventTypes: eventCounts,
      configuredModels: this.validationRules.size,
      securityConfig: this.securityConfig,
    };
  }

  private sanitizeField(
    field: string,
    value: any,
    rule: InputValidationRule
  ): {
    sanitizedValue: any;
    actions: SanitizationAction[];
    risk: number;
  } {
    const actions: SanitizationAction[] = [];
    let sanitizedValue = value;
    let risk = 0;

    // Type validation
    if (!this.validateType(value, rule.type)) {
      actions.push({
        field,
        action: "blocked",
        originalValue: value,
        reason: `Invalid type: expected ${rule.type}, got ${typeof value}`,
      });
      risk += 20;
      return { sanitizedValue: null, actions, risk };
    }

    // Apply sanitization
    if (rule.sanitization && typeof value === "string") {
      const originalValue = value;

      if (rule.sanitization.trim) {
        sanitizedValue = sanitizedValue.trim();
      }

      if (rule.sanitization.lowercase) {
        sanitizedValue = sanitizedValue.toLowerCase();
      }

      if (rule.sanitization.removeHtml) {
        const htmlRemoved = sanitizedValue.replace(/<[^>]*>/g, "");
        if (htmlRemoved !== sanitizedValue) {
          actions.push({
            field,
            action: "sanitized",
            originalValue,
            newValue: htmlRemoved,
            reason: "HTML tags removed",
          });
          risk += 5;
        }
        sanitizedValue = htmlRemoved;
      }

      if (rule.sanitization.removeScripts) {
        const scriptRemoved = sanitizedValue.replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          ""
        );
        if (scriptRemoved !== sanitizedValue) {
          actions.push({
            field,
            action: "sanitized",
            originalValue,
            newValue: scriptRemoved,
            reason: "Script tags removed",
          });
          risk += 15;
        }
        sanitizedValue = scriptRemoved;
      }

      if (rule.sanitization.escapeSpecialChars) {
        const escaped = sanitizedValue
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;");

        if (escaped !== sanitizedValue) {
          actions.push({
            field,
            action: "sanitized",
            originalValue,
            newValue: escaped,
            reason: "Special characters escaped",
          });
          risk += 2;
        }
        sanitizedValue = escaped;
      }
    }

    // Constraint validation
    if (rule.constraints) {
      const constraintResult = this.validateConstraints(
        sanitizedValue,
        rule.constraints
      );
      if (!constraintResult.valid) {
        actions.push({
          field,
          action: "blocked",
          originalValue: value,
          reason: constraintResult.reason,
        });
        risk += 10;
      }
    }

    return { sanitizedValue, actions, risk };
  }

  private basicSanitization(
    field: string,
    value: any
  ): {
    sanitizedValue: any;
    actions: SanitizationAction[];
    risk: number;
  } {
    const actions: SanitizationAction[] = [];
    let sanitizedValue = value;
    let risk = 0;

    // Basic string sanitization
    if (typeof value === "string") {
      const originalValue = value;

      // Remove potential XSS
      sanitizedValue = value.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ""
      );
      if (sanitizedValue !== originalValue) {
        actions.push({
          field,
          action: "sanitized",
          originalValue,
          newValue: sanitizedValue,
          reason: "Potential XSS removed",
        });
        risk += 15;
      }

      // Check for SQL injection patterns
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
        /(UNION\s+SELECT)/i,
        /(\bOR\s+1\s*=\s*1\b)/i,
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(sanitizedValue)) {
          actions.push({
            field,
            action: "blocked",
            originalValue,
            reason: "Potential SQL injection detected",
          });
          risk += 25;
          break;
        }
      }
    }

    return { sanitizedValue, actions, risk };
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !Number.isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      default:
        return true;
    }
  }

  private validateConstraints(
    value: any,
    constraints: NonNullable<InputValidationRule["constraints"]>
  ): {
    valid: boolean;
    reason: string;
  } {
    if (
      constraints.min !== undefined &&
      typeof value === "number" &&
      value < constraints.min
    ) {
      return {
        valid: false,
        reason: `Value ${value} is below minimum ${constraints.min}`,
      };
    }

    if (
      constraints.max !== undefined &&
      typeof value === "number" &&
      value > constraints.max
    ) {
      return {
        valid: false,
        reason: `Value ${value} is above maximum ${constraints.max}`,
      };
    }

    if (
      constraints.minLength !== undefined &&
      typeof value === "string" &&
      value.length < constraints.minLength
    ) {
      return {
        valid: false,
        reason: `String length ${value.length} is below minimum ${constraints.minLength}`,
      };
    }

    if (
      constraints.maxLength !== undefined &&
      typeof value === "string" &&
      value.length > constraints.maxLength
    ) {
      return {
        valid: false,
        reason: `String length ${value.length} exceeds maximum ${constraints.maxLength}`,
      };
    }

    if (
      constraints.pattern &&
      typeof value === "string" &&
      !constraints.pattern.test(value)
    ) {
      return { valid: false, reason: "Value does not match required pattern" };
    }

    if (
      constraints.allowedValues &&
      !constraints.allowedValues.includes(value)
    ) {
      return {
        valid: false,
        reason: `Value '${value}' is not in allowed values`,
      };
    }

    if (constraints.customValidator && !constraints.customValidator(value)) {
      return { valid: false, reason: "Custom validation failed" };
    }

    return { valid: true, reason: "" };
  }

  private detectStatisticalAnomalies(input: any): {
    score: number;
    suspiciousFeatures: string[];
  } {
    const suspiciousFeatures: string[] = [];
    let totalScore = 0;
    let featureCount = 0;

    for (const [field, value] of Object.entries(input)) {
      if (typeof value === "number") {
        featureCount++;

        // Check for extreme values (simplified)
        if (Math.abs(value) > 1_000_000) {
          suspiciousFeatures.push(field);
          totalScore += 0.8;
        } else if (Math.abs(value) > 10_000) {
          totalScore += 0.3;
        }

        // Check for unusual precision
        if (
          value.toString().includes(".") &&
          value.toString().split(".")[1].length > 10
        ) {
          suspiciousFeatures.push(field);
          totalScore += 0.5;
        }
      } else if (typeof value === "string") {
        featureCount++;

        // Check for unusual string patterns
        if (value.length > 1000) {
          suspiciousFeatures.push(field);
          totalScore += 0.7;
        }

        // Check for repeated characters
        const repeatedPattern = /(.)\1{10,}/;
        if (repeatedPattern.test(value)) {
          suspiciousFeatures.push(field);
          totalScore += 0.6;
        }
      }
    }

    const avgScore = featureCount > 0 ? totalScore / featureCount : 0;
    return { score: Math.min(1, avgScore), suspiciousFeatures };
  }

  private detectGradientAnomalies(input: any): {
    score: number;
    suspiciousFeatures: string[];
  } {
    // Simplified gradient-based detection
    // In a real implementation, this would use the model's gradients
    const suspiciousFeatures: string[] = [];
    let score = 0;

    // Check for values that might cause gradient explosion
    for (const [field, value] of Object.entries(input)) {
      if (typeof value === "number" && Math.abs(value) > 1e6) {
        suspiciousFeatures.push(field);
        score += 0.8;
      }
    }

    return { score: Math.min(1, score), suspiciousFeatures };
  }

  private detectReconstructionAnomalies(input: any): {
    score: number;
    suspiciousFeatures: string[];
  } {
    // Simplified reconstruction-based detection
    // In a real implementation, this would use an autoencoder
    const suspiciousFeatures: string[] = [];
    let score = 0;

    // Check for inputs that are very different from expected patterns
    const featureCount = Object.keys(input).length;
    if (featureCount > 100) {
      score += 0.5;
    }

    // Check for missing expected features
    const expectedFeatures = ["bedrooms", "bathrooms", "size", "location"];
    const missingFeatures = expectedFeatures.filter((f) => !(f in input));
    if (missingFeatures.length > 0) {
      score += missingFeatures.length * 0.2;
      suspiciousFeatures.push(...missingFeatures);
    }

    return { score: Math.min(1, score), suspiciousFeatures };
  }

  private anonymizeValue(
    value: string,
    type: string,
    privacyLevel: "basic" | "enhanced" | "strict"
  ): {
    value: string;
    method: string;
  } {
    switch (type) {
      case "email": {
        const [localPart, domain] = value.split("@") as [string, string];
        switch (privacyLevel) {
          case "basic":
            return {
              value: `${localPart.charAt(0)}***@${domain}`,
              method: "partial_masking",
            };
          case "enhanced":
            return {
              value: `***@${domain}`,
              method: "domain_only",
            };
          case "strict":
            return {
              value: `${this.generateHash(value).substring(0, 8)}@example.com`,
              method: "hash_replacement",
            };
          default:
            return {
              value: `${this.generateHash(value).substring(0, 8)}@example.com`,
              method: "hash_replacement",
            };
        }
      }

      case "phone":
        switch (privacyLevel) {
          case "basic":
            return {
              value: value.replace(/\d(?=\d{4})/g, "*"),
              method: "partial_masking",
            };
          case "enhanced":
            return {
              value: `***-***-${value.slice(-4)}`,
              method: "last_four_only",
            };
          case "strict":
            return {
              value: this.generateHash(value).substring(0, 10),
              method: "hash_replacement",
            };
          default:
            return {
              value: this.generateHash(value).substring(0, 10),
              method: "hash_replacement",
            };
        }

      case "name":
        switch (privacyLevel) {
          case "basic": {
            const nameParts = value.split(" ");
            return {
              value: nameParts
                .map((part) => part.charAt(0) + "*".repeat(part.length - 1))
                .join(" "),
              method: "initial_only",
            };
          }
          case "enhanced":
            return {
              value: "Anonymous User",
              method: "generic_replacement",
            };
          case "strict":
            return {
              value: this.generateHash(value).substring(0, 8),
              method: "hash_replacement",
            };
          default:
            return {
              value: this.generateHash(value).substring(0, 8),
              method: "hash_replacement",
            };
        }

      default:
        return {
          value:
            privacyLevel === "strict"
              ? this.generateHash(value).substring(0, 8)
              : "***",
          method: "generic_masking",
        };
    }
  }

  private isSensitiveFieldName(fieldName: string): boolean {
    const sensitiveFields = [
      "name",
      "email",
      "phone",
      "address",
      "ssn",
      "social_security",
      "credit_card",
      "password",
      "token",
      "api_key",
      "secret",
      "first_name",
      "last_name",
      "full_name",
      "contact",
    ];

    return sensitiveFields.some((sensitive) =>
      fieldName.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  private generateHash(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  private generateEncryptionKey(): Buffer {
    // In production, load this from secure key management
    const keyString =
      process.env.AI_ENCRYPTION_KEY || "default-key-change-in-production";
    return crypto.scryptSync(keyString, "salt", 32);
  }

  private mapSchemaTypeToValidationType(
    schemaType: string
  ): "string" | "number" | "boolean" | "array" | "object" {
    switch (schemaType) {
      case "numeric":
        return "number";
      case "categorical":
      case "text":
      case "date":
        return "string";
      case "boolean":
        return "boolean";
      default:
        return "string";
    }
  }

  private logSecurityEvent(event: string, details: any): void {
    if (!this.securityConfig.auditLogging.enabled) {
      return;
    }

    const logEntry = {
      timestamp: new Date(),
      event,
      details,
    };

    this.auditLog.push(logEntry);

    // Maintain log size (keep only recent entries)
    const maxLogSize = 10_000;
    if (this.auditLog.length > maxLogSize) {
      this.auditLog = this.auditLog.slice(-maxLogSize);
    }

    // Log to application logger based on log level
    if (this.securityConfig.auditLogging.logLevel === "full") {
      logger.info("Security event", logEntry);
    } else if (
      this.securityConfig.auditLogging.logLevel === "detailed" &&
      ["adversarial_detection", "input_validation_error"].includes(event)
    ) {
      logger.info("Security event", logEntry);
    } else if (
      this.securityConfig.auditLogging.logLevel === "basic" &&
      event === "input_validation_error"
    ) {
      logger.warn("Security event", logEntry);
    }
  }
}

// Singleton instance
let securityServiceInstance: MLSecurityService | null = null;

export function getMLSecurityService(): MLSecurityService {
  if (!securityServiceInstance) {
    securityServiceInstance = new MLSecurityService();
  }
  return securityServiceInstance;
}
