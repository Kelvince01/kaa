/** biome-ignore-all lint/performance/useTopLevelRegex: ignore */
import * as fs from "node:fs";
import * as path from "node:path";
import type { VerificationResult } from "@kaa/models/types";

export type DocumentValidatorOptions = {
  performOcr?: boolean;
  checkExpiry?: boolean;
  validateAddress?: boolean;
  validateIdentity?: boolean;
  validateIncome?: boolean;
  faceMatching?: boolean;
  signatureVerification?: boolean;
  fraudDetectionLevel?: "basic" | "standard" | "enhanced";
  validateConsistency?: boolean;
  validateMetadata?: boolean;
};

export type DocumentData = {
  documentType: string;
  extractedText: string;
  filePath: string;
  mimeType: string;
  metadata?: Record<string, unknown>;
  imageData?: Buffer;
};

export type FraudDetectionResult = {
  fraudDetected: boolean;
  confidenceScore: number;
  riskLevel: "low" | "medium" | "high";
  details: Record<string, unknown>;
  detectionMethods: string[];
  warnings: string[];
};

/**
 * Base interface for all document validators
 */
export type DocumentValidator = {
  validate(
    document: DocumentData,
    options?: DocumentValidatorOptions
  ): Promise<VerificationResult>;
  extractData(document: DocumentData): Promise<Record<string, unknown>>;
  detectFraud(document: DocumentData): Promise<FraudDetectionResult>;
};

/**
 * Base class for document validators with common functionality
 */
export abstract class BaseDocumentValidator implements DocumentValidator {
  protected checkForSuspiciousPatterns(text: string): string[] {
    const suspiciousPatterns: string[] = [];

    // Enhanced list of common fraud indicators in text
    const patterns = [
      { name: "edited", regex: /photoshop|edited|modified|manipulated/i },
      { name: "fake", regex: /fake|false|counterfeit|forged|not genuine/i },
      { name: "sample", regex: /sample|specimen|example|template|draft/i },
      { name: "copy", regex: /copy|duplicate|reproduction|not original/i },
      { name: "invalid", regex: /invalid|void|not valid|expired|cancelled/i },
      { name: "test", regex: /test|testing|demo|simulation/i },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        suspiciousPatterns.push(pattern.name);
      }
    }

    return suspiciousPatterns;
  }
  protected calculateConfidenceScore(checks: boolean[]): number {
    if (checks.length === 0) return 0;
    const passedChecks = checks.filter((check) => check).length;
    return Number((passedChecks / checks.length).toFixed(2));
  }

  protected generateVerificationMessage(
    checks: { name: string; passed: boolean }[]
  ): string {
    const failedChecks = checks.filter((check) => !check.passed);

    if (failedChecks.length === 0) {
      return "Document verified successfully.";
    }

    const failedCheckNames = failedChecks.map((check) => check.name).join(", ");
    return `Document verification failed: ${failedCheckNames} check(s) failed.`;
  }

  protected checkDocumentFormat(_filePath: string, mimeType: string): boolean {
    // Check if the file is a valid document format
    const validMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/tiff",
    ];

    return validMimeTypes.includes(mimeType);
  }

  abstract validate(
    document: DocumentData,
    options?: DocumentValidatorOptions
  ): Promise<VerificationResult>;
  abstract extractData(
    document: DocumentData
  ): Promise<Record<string, unknown>>;
  abstract detectFraud(document: DocumentData): Promise<FraudDetectionResult>;
}

/**
 * Generic document validator for fallback
 */
export class GenericDocumentValidator extends BaseDocumentValidator {
  async validate(
    document: DocumentData,
    options?: DocumentValidatorOptions
  ): Promise<VerificationResult> {
    // Basic checks that apply to all documents
    const hasValidFormat = this.checkDocumentFormat(
      document.filePath,
      document.mimeType
    );
    const hasText = document.extractedText.length > 0;

    // Enhanced validation checks
    const checks = [
      { name: "format", passed: hasValidFormat },
      { name: "content", passed: hasText },
    ];

    // Add consistency check if requested
    if (options?.validateConsistency) {
      const consistencyValid = this.checkDataConsistency(
        document.extractedText
      );
      checks.push({ name: "consistency", passed: consistencyValid });
    }

    // Add metadata validation if requested
    if (options?.validateMetadata && document.filePath) {
      const metadataValid = this.validateFileMetadata(document.filePath);
      checks.push({ name: "metadata", passed: metadataValid });
    }

    const isValid = checks.every((check) => check.passed);
    const confidence = await Promise.resolve(
      this.calculateConfidenceScore(checks.map((check) => check.passed))
    );

    return {
      isValid,
      confidence,
      details: {
        documentType: document.documentType,
        formatValid: hasValidFormat,
        contentDetected: hasText,
        checksPerformed: checks.map((c) => c.name).join(","),
        checkResultsJson: JSON.stringify(
          Object.fromEntries(checks.map((c) => [c.name, c.passed]))
        ),
      },
      message: this.generateVerificationMessage(checks),
    };
  }

  async extractData(document: DocumentData): Promise<Record<string, unknown>> {
    // Enhanced generic extraction
    const extractedData: Record<string, unknown> = {
      documentType: document.documentType,
      textLength: document.extractedText.length,
      mimeType: document.mimeType,
    };

    // Try to extract dates from the document
    const dates = this.extractDates(document.extractedText);
    if (dates.length > 0) {
      extractedData.dates = dates;

      // Try to identify issue date and expiry date
      const issueDate = this.identifyIssueDate(document.extractedText, dates);
      const expiryDate = this.identifyExpiryDate(document.extractedText, dates);

      if (issueDate) extractedData.issueDate = issueDate;
      if (expiryDate) extractedData.expiryDate = expiryDate;
    }

    // Try to extract names
    const names = this.extractNames(document.extractedText);
    if (names.length > 0) {
      extractedData.names = names;
      if (names.length === 1) {
        extractedData.fullName = names[0];
      }
    }

    return await Promise.resolve(extractedData);
  }

  async detectFraud(document: DocumentData): Promise<FraudDetectionResult> {
    // Enhanced multi-layer fraud detection
    const detectionMethods: string[] = [];
    const warnings: string[] = [];
    let fraudScore = 0;
    let maxScore = 0;

    // Layer 1: Text pattern analysis
    detectionMethods.push("text_pattern_analysis");
    const suspiciousPatterns = this.checkForSuspiciousPatterns(
      document.extractedText
    );
    if (suspiciousPatterns.length > 0) {
      fraudScore += suspiciousPatterns.length * 25; // Each pattern adds 25 points
      warnings.push(
        `Suspicious text patterns detected: ${suspiciousPatterns.join(", ")}`
      );
    }
    maxScore += 75; // Max 3 patterns * 25 points

    // Layer 2: Consistency checks
    detectionMethods.push("consistency_check");
    const consistencyIssues = this.checkConsistencyIssues(
      document.extractedText
    );
    if (consistencyIssues.length > 0) {
      fraudScore += consistencyIssues.length * 20; // Each issue adds 20 points
      warnings.push(
        `Consistency issues detected: ${consistencyIssues.join(", ")}`
      );
    }
    maxScore += 60; // Max 3 issues * 20 points

    // Layer 3: File metadata analysis (if file exists)
    if (fs.existsSync(document.filePath)) {
      detectionMethods.push("metadata_analysis");
      const metadataIssues = this.checkFileMetadataForFraud(document.filePath);
      if (metadataIssues.length > 0) {
        fraudScore += metadataIssues.length * 30; // Each issue adds 30 points
        warnings.push(`Metadata issues detected: ${metadataIssues.join(", ")}`);
      }
      maxScore += 90; // Max 3 issues * 30 points
    }

    // Calculate normalized confidence score (0-1)
    const normalizedScore =
      maxScore > 0 ? Math.min(fraudScore / maxScore, 1) : 0;

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low";
    if (normalizedScore >= 0.7) {
      riskLevel = "high";
    } else if (normalizedScore >= 0.3) {
      riskLevel = "medium";
    }

    return await Promise.resolve({
      fraudDetected: normalizedScore > 0.5,
      confidenceScore:
        normalizedScore > 0.5 ? normalizedScore : 1 - normalizedScore,
      riskLevel,
      details: {
        suspiciousPatterns,
        consistencyIssues,
        fraudScore,
        maxPossibleScore: maxScore,
        normalizedScore,
      },
      detectionMethods,
      warnings,
    });
  }

  // Using the checkDocumentFormat method from BaseDocumentValidator

  // Override the parent method to add more specific patterns
  protected checkForSuspiciousPatterns(text: string): string[] {
    // Use the parent implementation first
    const suspiciousPatterns = super.checkForSuspiciousPatterns(text);

    // Add generic document specific patterns
    const genericPatterns = [
      { name: "generic_template", regex: /generic|standard|default/i },
      { name: "watermark", regex: /watermark|draft copy/i },
    ];

    for (const pattern of genericPatterns) {
      if (pattern.regex.test(text)) {
        suspiciousPatterns.push(pattern.name);
      }
    }

    return suspiciousPatterns;
  }

  protected checkConsistencyIssues(text: string): string[] {
    const issues: string[] = [];

    // Check for date inconsistencies
    const dates = this.extractDates(text);
    if (dates.length >= 2) {
      // Check for future dates (except expiry dates)
      const now = new Date();
      for (const date of dates) {
        const dateObj = new Date(date);
        if (
          dateObj > now &&
          !text.toLowerCase().includes("expiry") &&
          !text.toLowerCase().includes("expiration")
        ) {
          issues.push("future_date_detected");
          break;
        }
      }

      // Check for impossible date sequences
      const issueDateText = text.match(
        /(?:issue|issued|issuance)\s+date[:\s]\s*([^\n]+)/i
      );
      const expiryDateText = text.match(
        /(?:expiry|expiration|expires)\s+date[:\s]\s*([^\n]+)/i
      );

      if (issueDateText && expiryDateText) {
        const issueDate = new Date(issueDateText[1] ?? "");
        const expiryDate = new Date(expiryDateText[1] ?? "");

        if (
          !(
            Number.isNaN(issueDate?.getTime?.()) ||
            Number.isNaN(expiryDate?.getTime?.())
          ) &&
          issueDate > expiryDate
        ) {
          issues.push("issue_date_after_expiry_date");
        }
      }
    }

    // Check for inconsistent names
    const names = this.extractNames(text);
    if (names.length > 1) {
      // Check if multiple different names appear in contexts that suggest they should be the same person
      const nameContexts = [
        { pattern: /name[:\s]\s*([^\n]+)/i, group: "holder" },
        { pattern: /holder[:\s]\s*([^\n]+)/i, group: "holder" },
        { pattern: /issued to[:\s]\s*([^\n]+)/i, group: "holder" },
      ];

      const namesByContext: Record<string, Set<string>> = {};

      for (const context of nameContexts) {
        const matches = text.match(context.pattern);
        if (matches?.[1]) {
          if (namesByContext[context.group] === undefined) {
            namesByContext[context.group] = new Set();
          }
          namesByContext[context.group]?.add(matches[1]?.trim() ?? "");
        }
      }

      // Check if we have multiple different names in the same context group
      for (const [group, namesSet] of Object.entries(namesByContext)) {
        if (namesSet.size > 1) {
          issues.push(`inconsistent_names_in_${group}_context`);
        }
      }
    }

    return issues;
  }

  protected checkFileMetadataForFraud(filePath: string): string[] {
    const issues: string[] = [];

    try {
      // Check file creation and modification dates
      const stats = fs.statSync(filePath);
      const creationTime = stats.birthtime;
      const modificationTime = stats.mtime;

      // If modification time is significantly different from creation time
      const timeDiff = Math.abs(
        modificationTime.getTime() - creationTime.getTime()
      );
      if (timeDiff > 24 * 60 * 60 * 1000) {
        // More than 24 hours difference
        issues.push("file_modified_after_creation");
      }

      // Check file extension vs actual content type (basic check)
      const extension = path.extname(filePath).toLowerCase();
      const fileSize = stats.size;

      // Very basic size checks for common formats
      if (extension === ".pdf" && fileSize < 10_000) {
        issues.push("suspiciously_small_pdf");
      }

      if ((extension === ".jpg" || extension === ".jpeg") && fileSize < 5000) {
        issues.push("suspiciously_small_image");
      }
    } catch (error) {
      console.error("Error checking file metadata:", error);
    }

    return issues;
  }

  protected validateFileMetadata(filePath: string): boolean {
    // Check if the file metadata is valid
    const issues = this.checkFileMetadataForFraud(filePath);
    return issues.length === 0;
  }

  protected checkDataConsistency(text: string): boolean {
    // Check if the data in the document is consistent
    const issues = this.checkConsistencyIssues(text);
    return issues.length === 0;
  }

  protected extractDates(text: string): string[] {
    const dates: string[] = [];
    // Common date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.
    const datePatterns = [
      /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/g, // DD/MM/YYYY or MM/DD/YYYY
      /\b(\d{4}[/.-]\d{1,2}[/.-]\d{1,2})\b/g, // YYYY-MM-DD
      /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/gi, // 01 Jan 2020
    ];

    for (const pattern of datePatterns) {
      let currentMatch: RegExpExecArray | null = pattern.exec(text);
      while (currentMatch !== null) {
        dates.push(currentMatch?.[1] || "");
        currentMatch = pattern.exec(text);
      }
    }

    return dates;
  }

  protected extractNames(text: string): string[] {
    const names: string[] = [];
    // Look for name patterns
    const namePatterns = [
      /name[:\s]\s*([^\n]+)/i,
      /holder[:\s]\s*([^\n]+)/i,
      /issued to[:\s]\s*([^\n]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        names.push(match[1]?.trim() || "");
      }
    }

    return names;
  }

  protected identifyIssueDate(text: string, _dates: string[]): string | null {
    // Look for issue date context
    const issueDateMatch = text.match(
      /(?:issue|issued|issuance)\s+date[:\s]\s*([^\n]+)/i
    );
    if (issueDateMatch?.[1]) {
      return issueDateMatch[1]?.trim() || "";
    }

    return null;
  }

  protected identifyExpiryDate(text: string, _dates: string[]): string | null {
    // Look for expiry date context
    const expiryDateMatch = text.match(
      /(?:expiry|expiration|expires)\s+date[:\s]\s*([^\n]+)/i
    );
    if (expiryDateMatch?.[1]) {
      return expiryDateMatch[1]?.trim() || "";
    }

    return null;
  }
}
