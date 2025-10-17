/** biome-ignore-all lint/performance/useTopLevelRegex: ignore */
import * as fs from "node:fs";
import type { VerificationResult } from "@kaa/models/types";
import {
  BaseDocumentValidator,
  type DocumentData,
  type DocumentValidatorOptions,
  type FraudDetectionResult,
} from "./document-validator";

/**
 * Validator for payslips
 */
export class PayslipValidator extends BaseDocumentValidator {
  protected checkForSuspiciousPatterns(text: string): string[] {
    // Use the parent class implementation and add payslip-specific patterns
    const patterns = super.checkForSuspiciousPatterns(text);

    // Add payslip specific suspicious patterns
    const payslipPatterns = [
      { name: "mock_payslip", regex: /mock|dummy|test payslip/i },
      { name: "template", regex: /template|example payslip/i },
      { name: "round_amounts", regex: /\$\d+\.00|£\d+\.00|€\d+\.00/g }, // Suspicious round amounts
      { name: "training", regex: /training|practice|exercise/i },
    ];

    for (const pattern of payslipPatterns) {
      if (pattern.regex.test(text)) {
        patterns.push(pattern.name);
      }
    }

    return patterns;
  }
  async validate(
    document: DocumentData,
    _options?: DocumentValidatorOptions
  ): Promise<VerificationResult> {
    // Payslip specific validation
    const hasValidFormat = this.checkDocumentFormat(
      document.filePath,
      document.mimeType
    );
    const payslipData = this.extractPayslipData(document.extractedText);
    const isRecent = this.checkIsRecent(payslipData.payPeriod);
    const employerValid = await this.verifyEmployer(payslipData.employer);
    const taxDetailsValid = this.validateTaxDetails(document.extractedText);

    const checks = [
      { name: "format", passed: hasValidFormat },
      { name: "data", passed: payslipData.isValid },
      { name: "recent", passed: isRecent },
      { name: "employer", passed: employerValid },
      { name: "tax", passed: taxDetailsValid },
    ];

    const isValid = checks.every((check) => check.passed);
    const confidence = this.calculateConfidenceScore(
      checks.map((check) => check.passed)
    );

    return {
      isValid,
      confidence,
      details: {
        documentType: "Payslip",
        employer: payslipData.employer,
        payPeriod: payslipData.payPeriod,
        employerVerified: employerValid ? "Verified" : "Failed",
        taxDetailsValid: taxDetailsValid ? "Verified" : "Failed",
        recentDocument: isRecent ? "Recent (< 3 months)" : "Outdated",
      },
      message: this.generateVerificationMessage(checks),
    };
  }

  async extractData(document: DocumentData): Promise<Record<string, unknown>> {
    const payslipData = this.extractPayslipData(document.extractedText);

    return await Promise.resolve({
      fullName: payslipData.fullName,
      employer: payslipData.employer,
      payPeriod: payslipData.payPeriod,
      grossPay: payslipData.grossPay,
      netPay: payslipData.netPay,
      taxPaid: payslipData.taxPaid,
      nationalInsurance: payslipData.nationalInsurance,
      employeeNumber: payslipData.employeeNumber,
      taxCode: payslipData.taxCode,
      paymentMethod: payslipData.paymentMethod,
      deductions: payslipData.deductions,
    });
  }

  async detectFraud(document: DocumentData): Promise<FraudDetectionResult> {
    // Enhanced multi-layer fraud detection for payslips
    const detectionMethods: string[] = [];
    const warnings: string[] = [];
    let fraudScore = 0;
    let maxScore = 0;

    // Layer 1: Basic text pattern analysis from parent class
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

    // Layer 2: Payslip specific checks
    detectionMethods.push("payslip_validation");
    const employerValid = await this.verifyEmployer(
      this.extractPayslipData(document.extractedText).employer
    );
    if (!employerValid) {
      fraudScore += 50;
      warnings.push("Unrecognized or invalid employer");
    }
    maxScore += 50;

    const calculationsValid = this.validateCalculations(document.extractedText);
    if (!calculationsValid) {
      fraudScore += 60;
      warnings.push("Payslip calculations are inconsistent");
    }
    maxScore += 60;

    // Layer 3: Image manipulation detection
    detectionMethods.push("image_analysis");
    const imageManipulationDetected = await this.detectImageManipulation(
      document.filePath
    );
    if (imageManipulationDetected) {
      fraudScore += 100;
      warnings.push("Image manipulation detected");
    }
    maxScore += 100;

    // Layer 4: Template matching
    detectionMethods.push("template_matching");
    const templateMatch = await this.checkAgainstKnownTemplates(
      document.filePath
    );
    if (!templateMatch) {
      fraudScore += 40;
      warnings.push("Document does not match known valid templates");
    }
    maxScore += 40;

    // Layer 5: Tax code validation
    detectionMethods.push("tax_code_validation");
    const taxDetailsValid = this.validateTaxDetails(document.extractedText);
    if (!taxDetailsValid) {
      fraudScore += 45;
      warnings.push("Tax code or tax details appear invalid");
    }
    maxScore += 45;

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

    return {
      fraudDetected: normalizedScore > 0.5,
      confidenceScore:
        normalizedScore > 0.5 ? normalizedScore : 1 - normalizedScore,
      riskLevel,
      details: {
        imageManipulation: imageManipulationDetected
          ? "Detected"
          : "Not detected",
        employerValid,
        templateMatch,
        calculationsValid,
        taxDetailsValid,
        fraudScore,
        maxPossibleScore: maxScore,
        normalizedScore,
      },
      detectionMethods,
      warnings,
    };
  }

  private extractPayslipData(text: string): {
    isValid: boolean;
    fullName: string;
    employer: string;
    payPeriod: string;
    grossPay: string;
    netPay: string;
    taxPaid: string;
    nationalInsurance: string;
    employeeNumber: string;
    taxCode: string;
    paymentMethod: string;
    deductions: Record<string, string>;
  } {
    // Normalize text for consistent processing
    const normalizedText = this.normalizeText(text);

    // Split text into lines for more accurate extraction
    const lines = normalizedText
      .split("\n")
      .filter((line) => line.trim().length > 0);

    // Extract data using multiple approaches for better accuracy
    const extractedData = {
      fullName: this.extractFullName(normalizedText, lines),
      employer: this.extractEmployer(normalizedText, lines),
      payPeriod: this.extractPayPeriod(normalizedText, lines),
      grossPay: this.extractMonetaryValue(normalizedText, [
        "gross pay",
        "gross",
        "total pay",
        "total earnings",
      ]),
      netPay: this.extractMonetaryValue(normalizedText, [
        "net pay",
        "net",
        "take home",
        "take-home pay",
        "payment amount",
      ]),
      taxPaid: this.extractMonetaryValue(normalizedText, [
        "tax paid",
        "income tax",
        "paye",
        "tax deduction",
      ]),
      nationalInsurance: this.extractMonetaryValue(normalizedText, [
        "national insurance",
        "ni contribution",
        "ni",
      ]),
      employeeNumber: this.extractReferenceNumber(normalizedText, [
        "employee number",
        "employee no",
        "employee #",
        "payroll number",
        "staff id",
      ]),
      taxCode: this.extractTaxCode(normalizedText),
      paymentMethod: this.extractPaymentMethod(normalizedText),
      deductions: this.extractDeductions(normalizedText, lines),
    };

    // Validate the extracted data
    const isValid = this.validatePayslipData(extractedData);

    return {
      isValid,
      ...extractedData,
    };
  }

  /**
   * Normalize text by removing extra whitespace, standardizing separators, etc.
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, "\n") // Standardize line breaks
      .replace(/\t/g, " ") // Replace tabs with spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .replace(/([A-Za-z])\s*:\s*/g, "$1: ") // Standardize label format (e.g., "Name:")
      .replace(/£/g, "£") // Standardize currency symbols
      .replace(/€/g, "€")
      .replace(/\$/g, "$")
      .replace(/\n\s+/g, "\n"); // Remove leading spaces on new lines
  }

  /**
   * Extract full name using multiple patterns
   */
  private extractFullName(text: string, lines: string[]): string {
    // Try standard label patterns
    const namePatterns = [
      /employee\s*:?\s*([A-Za-z\s\-']+)/i,
      /name\s*:?\s*([A-Za-z\s\-']+)/i,
      /payslip\s+for\s*:?\s*([A-Za-z\s\-']+)/i,
      /employee\s+name\s*:?\s*([A-Za-z\s\-']+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match?.[1] && match[1].trim().length > 2) {
        return match[1].trim();
      }
    }

    // Look for name in specific positions (usually at the top)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      // Check if line contains only a name (no labels, just 2-3 words of text)
      const nameLine = lines[i]?.trim() ?? "";
      if (
        /^[A-Z][a-z]+\s+([A-Z][a-z]+\s*)+$/.test(nameLine) &&
        !nameLine.includes(":")
      ) {
        return nameLine;
      }
    }

    return "";
  }

  /**
   * Extract employer name using multiple patterns
   */
  private extractEmployer(text: string, lines: string[]): string {
    // Try standard label patterns
    const employerPatterns = [
      /employer\s*:?\s*([A-Za-z\s\-'&.,]+)/i,
      /company\s*:?\s*([A-Za-z\s\-'&.,]+)/i,
      /organization\s*:?\s*([A-Za-z\s\-'&.,]+)/i,
      /paid by\s*:?\s*([A-Za-z\s\-'&.,]+)/i,
    ];

    for (const pattern of employerPatterns) {
      const match = text.match(pattern);
      if (match?.[1] && match[1].trim().length > 2) {
        return match[1].trim();
      }
    }

    // Look for company name at the top of the document
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i]?.trim() ?? "";
      // Company names are often in all caps or title case at the top
      if (
        (/^[A-Z\s\-'&.,]+$/.test(line) ||
          /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(line)) &&
        !line.includes(":") &&
        !line.toLowerCase().includes("payslip") &&
        line.length > 3
      ) {
        return line;
      }
    }

    // Look for company logo text (often at the very top)
    if (lines.length > 0 && (lines[0] ?? "")?.trim()?.length > 2) {
      return lines[0]?.trim() ?? "";
    }

    return "";
  }

  /**
   * Extract pay period using multiple patterns
   */
  private extractPayPeriod(text: string, _lines: string[]): string {
    // Try standard label patterns
    const periodPatterns = [
      /pay\s*period\s*:?\s*([A-Za-z0-9\s\-.]+)/i,
      /period\s*:?\s*([A-Za-z0-9\s\-.]+)/i,
      /for\s*period\s*:?\s*([A-Za-z0-9\s\-.]+)/i,
      /pay\s*date\s*:?\s*([A-Za-z0-9\s\-.]+)/i,
      /payment\s*period\s*:?\s*([A-Za-z0-9\s\-.]+)/i,
      /month\s*ending\s*:?\s*([A-Za-z0-9\s\-.]+)/i,
    ];

    for (const pattern of periodPatterns) {
      const match = text.match(pattern);
      if (match?.[1] && match[1]?.trim()?.length > 2) {
        return match[1].trim();
      }
    }

    // Look for date ranges
    const dateRangePattern =
      /(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\s*(?:to|-|through)\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i;
    const dateRangeMatch = text.match(dateRangePattern);
    if (dateRangeMatch?.[1] && dateRangeMatch[2]) {
      return `${dateRangeMatch[1]} to ${dateRangeMatch[2]}`;
    }

    // Look for month and year format
    const monthYearPattern =
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i;
    const monthYearMatch = text.match(monthYearPattern);
    if (monthYearMatch?.[0]) {
      return monthYearMatch[0];
    }

    return "";
  }

  /**
   * Extract monetary values using multiple patterns
   */
  private extractMonetaryValue(text: string, labels: string[]): string {
    // Create a pattern that matches any of the provided labels
    const labelPattern = labels
      .map((label) => label.replace(/\s+/g, "\\s+"))
      .join("|");
    const pattern = new RegExp(
      `(?:${labelPattern})\\s*:?\\s*[$£€]?\\s*([\\d,]+\\.\\d{2})`,
      "i"
    );

    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1];
    }

    // Try alternative format (currency symbol first)
    const altPattern = new RegExp(
      `(?:${labelPattern})\\s*:?\\s*[$£€]([\\d,]+\\.\\d{2})`,
      "i"
    );
    const altMatch = text.match(altPattern);
    if (altMatch?.[1]) {
      return altMatch[1];
    }

    return "";
  }

  /**
   * Extract reference numbers (employee ID, etc.)
   */
  private extractReferenceNumber(text: string, labels: string[]): string {
    // Create a pattern that matches any of the provided labels
    const labelPattern = labels
      .map((label) => label.replace(/\s+/g, "\\s+"))
      .join("|");
    const pattern = new RegExp(
      `(?:${labelPattern})\\s*:?\\s*([A-Z0-9\\-]+)`,
      "i"
    );

    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1];
    }

    return "";
  }

  /**
   * Extract tax code using UK and international formats
   */
  private extractTaxCode(text: string): string {
    // UK tax code format (e.g., 1250L, K497, BR, NT, etc.)
    const ukTaxCodePattern = /tax\s*code\s*:?\s*([0-9]+[A-Z]+|[A-Z]+)/i;
    const ukMatch = text.match(ukTaxCodePattern);
    if (ukMatch?.[1]) {
      return ukMatch[1];
    }

    // US W-4 allowances
    const usW4Pattern = /allowances\s*:?\s*([0-9]+)/i;
    const usMatch = text.match(usW4Pattern);
    if (usMatch?.[1]) {
      return `W-4 ${usMatch[1]}`;
    }

    // Generic tax code pattern
    const genericPattern = /tax\s*(?:code|status|class)\s*:?\s*([A-Z0-9\-/]+)/i;
    const genericMatch = text.match(genericPattern);
    if (genericMatch?.[1]) {
      return genericMatch[1];
    }

    return "";
  }

  /**
   * Extract payment method
   */
  private extractPaymentMethod(text: string): string {
    const paymentMethodPatterns = [
      /payment\s*method\s*:?\s*([A-Za-z\s]+)/i,
      /paid\s*by\s*:?\s*([A-Za-z\s]+)/i,
      /method\s*of\s*payment\s*:?\s*([A-Za-z\s]+)/i,
    ];

    for (const pattern of paymentMethodPatterns) {
      const match = text.match(pattern);
      if (match?.[1] && match[1].trim().length > 2) {
        return match[1].trim();
      }
    }

    // Check for common payment methods
    const commonMethods = [
      "bank transfer",
      "direct deposit",
      "cheque",
      "check",
      "cash",
      "bacs",
    ];
    for (const method of commonMethods) {
      if (text.toLowerCase().includes(method)) {
        return method.charAt(0).toUpperCase() + method.slice(1);
      }
    }

    return "";
  }

  /**
   * Extract deductions with improved pattern matching
   */
  private extractDeductions(
    text: string,
    _lines: string[]
  ): Record<string, string> {
    const deductions: Record<string, string> = {};

    // Look for deduction section
    const deductionSectionPattern =
      /(?:deductions|contributions|withholdings)\s*:?\s*([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i;
    const sectionMatch = text.match(deductionSectionPattern);

    if (sectionMatch?.[1]) {
      const deductionSection = sectionMatch[1];
      const deductionLines = deductionSection.split("\n");

      for (const line of deductionLines) {
        // Match label and amount pattern
        const deductionMatch = line.match(
          /([A-Za-z\s\-&']+)\s*:?\s*[$£€]?\s*([\d,]+\.\d{2})/i
        );
        if (deductionMatch?.[1] && deductionMatch[2]) {
          const label = deductionMatch[1].trim();
          const amount = deductionMatch[2];

          // Skip if this is actually gross/net pay
          if (
            !["gross pay", "net pay", "total pay"].includes(label.toLowerCase())
          ) {
            deductions[label] = amount;
          }
        }
      }
    }

    // If no deduction section found, try to find individual deductions
    if (Object.keys(deductions).length === 0) {
      const deductionMatches = text.matchAll(
        /(?:deduction|contribution|withholding)\s*:?\s*([A-Za-z\s\-&']+)\s*:?\s*[$£€]?\s*([\d,]+\.\d{2})/gi
      );

      for (const match of deductionMatches) {
        if (match[1] && match[2]) {
          deductions[match[1].trim()] = match[2];
        }
      }
    }

    // Look for tabular data (common in payslips)
    if (Object.keys(deductions).length === 0) {
      const deductionLabels = [
        "pension",
        "retirement",
        "401k",
        "health insurance",
        "medical",
        "dental",
        "vision",
        "life insurance",
        "student loan",
        "garnishment",
        "union dues",
        "savings plan",
        "charitable",
        "donation",
      ];

      for (const label of deductionLabels) {
        const pattern = new RegExp(
          `${label.replace(/\s+/g, "\\s+")}\\s*[$£€]?\\s*([\\d,]+\\.\\d{2})`,
          "i"
        );
        const match = text.match(pattern);
        if (match?.[1]) {
          deductions[label] = match[1];
        }
      }
    }

    return deductions;
  }

  /**
   * Validate extracted payslip data
   */

  private validatePayslipData(data: Record<string, any>): boolean {
    // Check for minimum required fields
    const hasName = Boolean(data.fullName && data.fullName.length > 2);
    const hasEmployer = Boolean(data.employer && data.employer.length > 2);
    const hasPeriod = Boolean(data.payPeriod && data.payPeriod.length > 2);
    const hasGrossPay = Boolean(
      data.grossPay && /^[\d,]+\.\d{2}$/.test(data.grossPay)
    );
    const hasNetPay = Boolean(
      data.netPay && /^[\d,]+\.\d{2}$/.test(data.netPay)
    );

    // Basic validation: must have name, employer, period, and pay information
    const basicValidation =
      hasName && hasEmployer && hasPeriod && (hasGrossPay || hasNetPay);

    // Additional validation: net pay should be less than gross pay
    let payValidation = true;
    if (hasGrossPay && hasNetPay) {
      const grossValue = Number.parseFloat(data.grossPay.replace(/,/g, ""));
      const netValue = Number.parseFloat(data.netPay.replace(/,/g, ""));
      payValidation = netValue <= grossValue;
    }

    return basicValidation && payValidation;
  }

  private checkIsRecent(payPeriodStr: string): boolean {
    if (!payPeriodStr) return false;

    try {
      // Try to extract dates from the pay period string
      // Common formats: "April 2023", "01/04/2023 - 30/04/2023", "Apr 2023"

      // Try to match month and year format
      const monthYearMatch = payPeriodStr.match(
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i
      );
      if (monthYearMatch) {
        const month = this.getMonthNumber(monthYearMatch[1] ?? "");
        const year = Number.parseInt(monthYearMatch[2] ?? "", 10);

        const payDate = new Date(year, month, 1);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        return payDate > threeMonthsAgo;
      }

      // Try to match date range format
      const dateRangeMatch = payPeriodStr.match(
        /(\d{2})[/\-.](\d{2})[/\-.](\d{4})/
      );
      if (dateRangeMatch) {
        const day = Number.parseInt(dateRangeMatch[1] ?? "", 10);
        const month = Number.parseInt(dateRangeMatch[2] ?? "", 10) - 1;
        const year = Number.parseInt(dateRangeMatch[3] ?? "", 10);

        const payDate = new Date(year, month, day);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        return payDate > threeMonthsAgo;
      }

      // If we can't parse the date, assume it's not recent
      return false;
    } catch (error) {
      return false;
    }
  }

  private getMonthNumber(monthStr: string): number {
    const months: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };

    return months[monthStr.toLowerCase().substring(0, 3)] || 0;
  }

  private verifyEmployer(employer: string): boolean {
    // In a real implementation, this would check against:
    // 1. Companies House API (for UK)
    // 2. Business registration databases
    // 3. Known employer database
    // For this demo, we'll simulate this check
    return Boolean(employer && employer.length > 2);
  }

  private validateTaxDetails(text: string): boolean {
    // Check for presence of tax-related information
    const hasTaxCode = /tax code/i.test(text);
    const hasNationalInsurance = /national insurance|NI contribution/i.test(
      text
    );
    const hasTaxCalculation = /tax paid|income tax|PAYE/i.test(text);

    return hasTaxCode && hasNationalInsurance && hasTaxCalculation;
  }

  protected async detectImageManipulation(filePath: string): Promise<boolean> {
    // Enhanced image manipulation detection
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return false;
      }

      // In a real implementation, this would use image analysis to detect:
      // 1. Inconsistent fonts within the document
      // 2. Signs of digital manipulation (clone tool, etc.)
      // 3. Misaligned text or irregular spacing
      // 4. Inconsistent compression artifacts

      // For this demo, we'll simulate this check
      return await Promise.resolve(false);
    } catch (error) {
      console.error("Error checking for image manipulation:", error);
      return await Promise.resolve(false);
    }
  }

  protected async checkAgainstKnownTemplates(
    filePath: string
  ): Promise<boolean> {
    // Enhanced template matching
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return false;
      }

      // In a real implementation, this would:
      // 1. Compare the document layout against known templates for tax authorities
      // 2. Check for expected elements like logos, headers, footers
      // 3. Verify the document structure matches known valid tax return formats

      // For this demo, we'll simulate this check
      return await Promise.resolve(true);
    } catch (error) {
      console.error("Error checking against known templates:", error);
      return await Promise.resolve(false);
    }
  }

  private validateCalculations(text: string): boolean {
    // In a real implementation, this would:
    // 1. Extract gross pay, deductions, and net pay
    // 2. Verify that gross pay - deductions = net pay (within a small margin of error)
    // For this demo, we'll simulate this check

    try {
      const grossMatch = text.match(
        /(?:Gross pay|Gross|Total pay)[:]\s*[$£€]?\s*([0-9,]+\.[0-9]{2})/i
      );
      const netMatch = text.match(
        /(?:Net pay|Net|Take home)[:]\s*[$£€]?\s*([0-9,]+\.[0-9]{2})/i
      );

      if (!(grossMatch && netMatch)) return false;

      const grossPay = Number.parseFloat(
        grossMatch[1]?.replace(/,/g, "") ?? ""
      );
      const netPay = Number.parseFloat(netMatch[1]?.replace(/,/g, "") ?? "");

      // Net pay should be less than gross pay
      return netPay < grossPay;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Validator for employment contracts
 */
export class EmploymentContractValidator extends BaseDocumentValidator {
  protected checkForSuspiciousPatterns(text: string): string[] {
    // Use the parent class implementation and add contract-specific patterns
    const patterns = super.checkForSuspiciousPatterns(text);

    // Add employment contract specific suspicious patterns
    const contractPatterns = [
      {
        name: "mock_contract",
        regex: /mock|dummy|test contract|sample contract/i,
      },
      { name: "template", regex: /template|example contract/i },
      { name: "training", regex: /training|practice|exercise/i },
      { name: "lorem_ipsum", regex: /lorem ipsum|dummy text/i },
    ];

    for (const pattern of contractPatterns) {
      if (pattern.regex.test(text)) {
        patterns.push(pattern.name);
      }
    }

    return patterns;
  }
  async validate(
    document: DocumentData,
    options?: DocumentValidatorOptions
  ): Promise<VerificationResult> {
    // Employment contract specific validation
    const hasValidFormat = this.checkDocumentFormat(
      document.filePath,
      document.mimeType
    );
    const contractData = this.extractContractData(document.extractedText);
    const employerValid = await this.verifyEmployer(contractData.employer);
    const signatureValid = options?.signatureVerification
      ? await this.verifySignature(document.filePath)
      : true;

    const checks = [
      { name: "format", passed: hasValidFormat },
      { name: "data", passed: contractData.isValid },
      { name: "employer", passed: employerValid },
      { name: "signature", passed: signatureValid },
    ];

    const isValid = checks.every((check) => check.passed);
    const confidence = this.calculateConfidenceScore(
      checks.map((check) => check.passed)
    );

    return {
      isValid,
      confidence,
      details: {
        documentType: "Employment Contract",
        employer: contractData.employer,
        position: contractData.position,
        employerVerified: employerValid ? "Verified" : "Failed",
        signatureVerified: signatureValid ? "Verified" : "Failed",
        startDate: contractData.startDate,
      },
      message: this.generateVerificationMessage(checks),
    };
  }

  async extractData(document: DocumentData): Promise<Record<string, unknown>> {
    const contractData = this.extractContractData(document.extractedText);

    return await Promise.resolve({
      fullName: contractData.fullName,
      employer: contractData.employer,
      position: contractData.position,
      startDate: contractData.startDate,
      salary: contractData.salary,
      workingHours: contractData.workingHours,
      contractType: contractData.contractType,
      noticePeriod: contractData.noticePeriod,
      probationPeriod: contractData.probationPeriod,
      benefits: contractData.benefits,
    });
  }

  async detectFraud(document: DocumentData): Promise<FraudDetectionResult> {
    // Enhanced multi-layer fraud detection for employment contracts
    const detectionMethods: string[] = [];
    const warnings: string[] = [];
    let fraudScore = 0;
    let maxScore = 0;

    // Layer 1: Basic text pattern analysis from parent class
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

    // Layer 2: Contract specific checks
    detectionMethods.push("contract_validation");
    const employerValid = await this.verifyEmployer(
      this.extractContractData(document.extractedText).employer
    );
    if (!employerValid) {
      fraudScore += 50;
      warnings.push("Unrecognized or invalid employer");
    }
    maxScore += 50;

    // Layer 3: Signature verification
    detectionMethods.push("signature_verification");
    const signatureValid = await this.verifySignature(document.filePath);
    if (!signatureValid) {
      fraudScore += 80;
      warnings.push("Invalid or missing signature");
    }
    maxScore += 80;

    // Layer 4: Image manipulation detection
    detectionMethods.push("image_analysis");
    const imageManipulationDetected = await this.detectImageManipulation(
      document.filePath
    );
    if (imageManipulationDetected) {
      fraudScore += 100;
      warnings.push("Image manipulation detected");
    }
    maxScore += 100;

    // Layer 5: Template matching
    detectionMethods.push("template_matching");
    const templateMatch = await this.checkAgainstKnownTemplates(
      document.filePath
    );
    if (!templateMatch) {
      fraudScore += 40;
      warnings.push("Document does not match known valid templates");
    }
    maxScore += 40;

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

    return {
      fraudDetected: normalizedScore > 0.5,
      confidenceScore:
        normalizedScore > 0.5 ? normalizedScore : 1 - normalizedScore,
      riskLevel,
      details: {
        imageManipulation: imageManipulationDetected
          ? "Detected"
          : "Not detected",
        employerValid,
        templateMatch,
        signatureValid,
        fraudScore,
        maxPossibleScore: maxScore,
        normalizedScore,
      },
      detectionMethods,
      warnings,
    };
  }

  private extractContractData(text: string): {
    isValid: boolean;
    fullName: string;
    employer: string;
    position: string;
    startDate: string;
    salary: string;
    workingHours: string;
    contractType: string;
    noticePeriod: string;
    probationPeriod: string;
    benefits: string[];
  } {
    // Extract employment contract data using regex patterns
    // This is a simplified version - in a real implementation, this would be more robust
    const nameMatch = text.match(
      /(?:Employee|Name of employee)[:]\s*([A-Za-z\s]+)/i
    );
    const employerMatch = text.match(
      /(?:Employer|Company|Name of employer)[:]\s*([A-Za-z\s]+)/i
    );
    const positionMatch = text.match(
      /(?:Position|Job title|Role)[:]\s*([A-Za-z\s]+)/i
    );
    const startDateMatch = text.match(
      /(?:Start date|Commencement date)[:]\s*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i
    );
    const salaryMatch = text.match(
      /(?:Salary|Remuneration|Pay)[:]\s*[$£€]?\s*([0-9,]+(?:\.[0-9]{2})?)/i
    );
    const hoursMatch = text.match(
      /(?:Working hours|Hours of work)[:]\s*([0-9]+(?:\.[0-9]+)?(?:\s*hours)?(?:\s*per\s*week)?)/i
    );
    const contractTypeMatch = text.match(
      /(?:Contract type|Employment type)[:]\s*([A-Za-z\s]+)/i
    );
    const noticeMatch = text.match(
      /(?:Notice period|Notice)[:]\s*([A-Za-z0-9\s]+)/i
    );
    const probationMatch = text.match(
      /(?:Probation period|Probation)[:]\s*([A-Za-z0-9\s]+)/i
    );

    // Extract benefits
    const benefits: string[] = [];
    const benefitsSection = text.match(
      /(?:Benefits|Perks|Additional benefits)([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i
    );

    if (benefitsSection?.[1]) {
      const benefitLines = benefitsSection[1].split("\n");
      for (const line of benefitLines) {
        const trimmedLine = line.trim();
        if (
          trimmedLine &&
          !trimmedLine.startsWith("Benefits") &&
          !trimmedLine.includes(":")
        ) {
          benefits.push(trimmedLine);
        }
      }
    }

    // Check if we have the minimum required fields
    const isValid = Boolean(
      nameMatch && employerMatch && positionMatch && startDateMatch
    );

    return {
      isValid,
      fullName: nameMatch ? (nameMatch[1]?.trim() ?? "") : "",
      employer: employerMatch ? (employerMatch[1]?.trim() ?? "") : "",
      position: positionMatch ? (positionMatch[1]?.trim() ?? "") : "",
      startDate: startDateMatch ? (startDateMatch[1] ?? "") : "",
      salary: salaryMatch ? (salaryMatch[1] ?? "") : "",
      workingHours: hoursMatch ? (hoursMatch[1]?.trim() ?? "") : "",
      contractType: contractTypeMatch
        ? (contractTypeMatch[1]?.trim() ?? "")
        : "",
      noticePeriod: noticeMatch ? (noticeMatch[1]?.trim() ?? "") : "",
      probationPeriod: probationMatch ? (probationMatch[1]?.trim() ?? "") : "",
      benefits,
    };
  }

  private verifyEmployer(employer: string): boolean {
    // Similar to payslip implementation
    return Boolean(employer && employer.length > 2);
  }

  private async verifySignature(_filePath: string): Promise<boolean> {
    // In a real implementation, this would:
    // 1. Detect signatures in the document
    // 2. Verify that they are not copied/pasted
    // 3. Check for digital signatures if present
    // For this demo, we'll simulate this check
    return await Promise.resolve(true);
  }

  protected async detectImageManipulation(filePath: string): Promise<boolean> {
    // Enhanced image manipulation detection
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return await Promise.resolve(false);
      }

      // In a real implementation, this would use image analysis to detect:
      // 1. Inconsistent fonts within the document
      // 2. Signs of digital manipulation (clone tool, etc.)
      // 3. Misaligned text or irregular spacing
      // 4. Inconsistent compression artifacts

      // For this demo, we'll simulate this check
      return false;
    } catch (error) {
      console.error("Error checking for image manipulation:", error);
      return false;
    }
  }

  protected async checkAgainstKnownTemplates(
    filePath: string
  ): Promise<boolean> {
    // Enhanced template matching
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return await Promise.resolve(false);
      }

      // In a real implementation, this would:
      // 1. Compare the document layout against known templates for tax authorities
      // 2. Check for expected elements like logos, headers, footers
      // 3. Verify the document structure matches known valid tax return formats

      // For this demo, we'll simulate this check
      return true;
    } catch (error) {
      console.error("Error checking against known templates:", error);
      return false;
    }
  }
}

/**
 * Validator for tax returns
 */
export class TaxReturnValidator extends BaseDocumentValidator {
  protected checkForSuspiciousPatterns(text: string): string[] {
    // Use the parent class implementation and add tax return-specific patterns
    const patterns = super.checkForSuspiciousPatterns(text);

    // Add tax return specific suspicious patterns
    const taxReturnPatterns = [
      {
        name: "mock_tax_return",
        regex: /mock|dummy|test tax return|sample tax return/i,
      },
      { name: "template", regex: /template|example tax return/i },
      { name: "round_amounts", regex: /\$\d+\.00|£\d+\.00|€\d+\.00/g }, // Suspicious round amounts
      { name: "training", regex: /training|practice|exercise/i },
      { name: "unrealistic_income", regex: /\$\d{7,}|£\d{7,}|€\d{7,}/g }, // Unrealistically high income
    ];

    for (const pattern of taxReturnPatterns) {
      if (pattern.regex.test(text)) {
        patterns.push(pattern.name);
      }
    }

    return patterns;
  }
  async validate(
    document: DocumentData,
    _options?: DocumentValidatorOptions
  ): Promise<VerificationResult> {
    // Tax return specific validation
    const hasValidFormat = this.checkDocumentFormat(
      document.filePath,
      document.mimeType
    );
    const taxData = this.extractTaxReturnData(document.extractedText);
    const isRecent = this.checkIsRecent(taxData.taxYear);
    const calculationsValid = this.validateCalculations(document.extractedText);

    const checks = [
      { name: "format", passed: hasValidFormat },
      { name: "data", passed: taxData.isValid },
      { name: "recent", passed: isRecent },
      { name: "calculations", passed: calculationsValid },
    ];

    const isValid = checks.every((check) => check.passed);
    const confidence = this.calculateConfidenceScore(
      checks.map((check) => check.passed)
    );

    return await Promise.resolve({
      isValid,
      confidence,
      details: {
        documentType: "Tax Return",
        taxYear: taxData.taxYear,
        calculationsValid: calculationsValid ? "Verified" : "Failed",
        recentDocument: isRecent ? "Recent (< 18 months)" : "Outdated",
        totalIncome: taxData.totalIncome,
      },
      message: this.generateVerificationMessage(checks),
    });
  }

  async extractData(document: DocumentData): Promise<Record<string, unknown>> {
    const taxData = this.extractTaxReturnData(document.extractedText);

    return await Promise.resolve({
      fullName: taxData.fullName,
      taxYear: taxData.taxYear,
      totalIncome: taxData.totalIncome,
      taxPaid: taxData.taxPaid,
      nationalInsurance: taxData.nationalInsurance,
      taxRefNumber: taxData.taxRefNumber,
      filingDate: taxData.filingDate,
      incomeBreakdown: taxData.incomeBreakdown,
    });
  }

  async detectFraud(document: DocumentData): Promise<FraudDetectionResult> {
    // Enhanced multi-layer fraud detection for tax returns
    const detectionMethods: string[] = [];
    const warnings: string[] = [];
    let fraudScore = 0;
    let maxScore = 0;

    // Layer 1: Basic text pattern analysis from parent class
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

    // Layer 2: Tax return specific checks
    detectionMethods.push("tax_calculation_validation");
    const calculationsValid = this.validateCalculations(document.extractedText);
    if (!calculationsValid) {
      fraudScore += 60;
      warnings.push("Tax calculations are inconsistent");
    }
    maxScore += 60;

    // Layer 3: Data consistency check
    detectionMethods.push("data_consistency");
    const inconsistentData = this.checkDataConsistency(document.extractedText);
    if (inconsistentData) {
      fraudScore += 50;
      warnings.push("Data inconsistencies detected in tax return");
    }
    maxScore += 50;

    // Layer 4: Image manipulation detection
    detectionMethods.push("image_analysis");
    const imageManipulationDetected = await this.detectImageManipulation(
      document.filePath
    );
    if (imageManipulationDetected) {
      fraudScore += 100;
      warnings.push("Image manipulation detected");
    }
    maxScore += 100;

    // Layer 5: Template matching
    detectionMethods.push("template_matching");
    const templateMatch = await this.checkAgainstKnownTemplates(
      document.filePath
    );
    if (!templateMatch) {
      fraudScore += 40;
      warnings.push("Document does not match known valid templates");
    }
    maxScore += 40;

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

    return {
      fraudDetected: normalizedScore > 0.5,
      confidenceScore:
        normalizedScore > 0.5 ? normalizedScore : 1 - normalizedScore,
      riskLevel,
      details: {
        imageManipulation: imageManipulationDetected
          ? "Detected"
          : "Not detected",
        calculationsValid,
        templateMatch,
        dataConsistency: inconsistentData
          ? "Inconsistencies found"
          : "Consistent",
        fraudScore,
        maxPossibleScore: maxScore,
        normalizedScore,
      },
      detectionMethods,
      warnings,
    };
  }

  private extractTaxReturnData(text: string): {
    isValid: boolean;
    fullName: string;
    taxYear: string;
    totalIncome: string;
    taxPaid: string;
    nationalInsurance: string;
    taxRefNumber: string;
    filingDate: string;
    incomeBreakdown: Record<string, string>;
  } {
    // Extract tax return data using regex patterns
    // This is a simplified version - in a real implementation, this would be more robust
    const nameMatch = text.match(/(?:Name|Taxpayer)[:]\s*([A-Za-z\s]+)/i);
    const taxYearMatch =
      text.match(/(?:Tax year|Year)[:]\s*([0-9]{4}(?:\s*\/\s*[0-9]{2,4})?)/i) ||
      text.match(/(?:Tax year|Year)[:]\s*([A-Za-z0-9\s\-/]+)/i);
    const incomeMatch = text.match(
      /(?:Total income|Income)[:]\s*[$£€]?\s*([0-9,]+\.[0-9]{2})/i
    );
    const taxMatch = text.match(
      /(?:Tax paid|Income tax paid)[:]\s*[$£€]?\s*([0-9,]+\.[0-9]{2})/i
    );
    const niMatch = text.match(
      /(?:National Insurance|NI contribution)[:]\s*[$£€]?\s*([0-9,]+\.[0-9]{2})/i
    );
    const refMatch = text.match(
      /(?:Tax reference|UTR|Unique taxpayer reference)[:]\s*([A-Z0-9]+)/i
    );
    const filingMatch = text.match(
      /(?:Filing date|Date filed|Submission date)[:]\s*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i
    );

    // Extract income breakdown
    const incomeBreakdown: Record<string, string> = {};
    const incomeMatches = text.matchAll(
      /(?:Income from|Earnings from)[:]\s*([A-Za-z\s]+)[:]\s*[$£€]?\s*([0-9,]+\.[0-9]{2})/gi
    );

    for (const match of incomeMatches) {
      if (match[1] && match[2]) {
        incomeBreakdown[match[1].trim()] = match[2];
      }
    }

    // Check if we have the minimum required fields
    const isValid = Boolean(
      nameMatch && taxYearMatch && incomeMatch && taxMatch
    );

    return {
      isValid,
      fullName: nameMatch ? (nameMatch[1]?.trim() ?? "") : "",
      taxYear: taxYearMatch ? (taxYearMatch[1]?.trim() ?? "") : "",
      totalIncome: incomeMatch ? (incomeMatch[1] ?? "") : "",
      taxPaid: taxMatch ? (taxMatch[1] ?? "") : "",
      nationalInsurance: niMatch ? (niMatch[1] ?? "") : "",
      taxRefNumber: refMatch ? (refMatch[1] ?? "") : "",
      filingDate: filingMatch ? (filingMatch[1] ?? "") : "",
      incomeBreakdown,
    };
  }

  private checkIsRecent(taxYearStr: string): boolean {
    if (!taxYearStr) return false;

    try {
      // Try to extract year from tax year string
      // Common formats: "2022/23", "2022-2023", "2022"

      // Try to match year/year format (e.g., 2022/23)
      const yearYearMatch = taxYearStr.match(/(\d{4})\s*\/\s*(\d{2})/);
      if (yearYearMatch) {
        const startYear = Number.parseInt(yearYearMatch[1] ?? "", 10);

        // Tax returns are typically for the previous year
        // Allow up to 18 months from the end of the tax year
        const currentYear = new Date().getFullYear();
        return startYear >= currentYear - 2;
      }

      // Try to match year-year format (e.g., 2022-2023)
      const yearRangeMatch = taxYearStr.match(/(\d{4})\s*-\s*(\d{4})/);
      if (yearRangeMatch) {
        const endYear = Number.parseInt(yearRangeMatch[2] ?? "", 10);

        // Allow up to 18 months from the end of the tax year
        const currentYear = new Date().getFullYear();
        return endYear >= currentYear - 2;
      }

      // Try to match single year format (e.g., 2022)
      const singleYearMatch = taxYearStr.match(/(\d{4})/);
      if (singleYearMatch) {
        const year = Number.parseInt(singleYearMatch[1] ?? "", 10);

        // Allow up to 18 months from the end of the tax year
        const currentYear = new Date().getFullYear();
        return year >= currentYear - 2;
      }

      // If we can't parse the year, assume it's not recent
      return false;
    } catch (error) {
      return false;
    }
  }

  private validateCalculations(text: string): boolean {
    // In a real implementation, this would:
    // 1. Extract income, deductions, and tax paid
    // 2. Verify that the tax calculations are correct based on tax bands
    // For this demo, we'll simulate this check

    try {
      const incomeMatch = text.match(
        /(?:Total income|Income)[:]\s*[$£€]?\s*([0-9,]+\.[0-9]{2})/i
      );
      const taxMatch = text.match(
        /(?:Tax paid|Income tax paid)[:]\s*[$£€]?\s*([0-9,]+\.[0-9]{2})/i
      );

      if (!(incomeMatch && taxMatch)) return false;

      const totalIncome = Number.parseFloat(
        incomeMatch[1]?.replace(/,/g, "") ?? ""
      );
      const taxPaid = Number.parseFloat(taxMatch[1]?.replace(/,/g, "") ?? "");

      // Tax paid should be less than total income
      return taxPaid < totalIncome;
    } catch (error) {
      return false;
    }
  }

  protected async detectImageManipulation(filePath: string): Promise<boolean> {
    // Enhanced image manipulation detection
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return await Promise.resolve(false);
      }

      // In a real implementation, this would use image analysis to detect:
      // 1. Inconsistent fonts within the document
      // 2. Signs of digital manipulation (clone tool, etc.)
      // 3. Misaligned text or irregular spacing
      // 4. Inconsistent compression artifacts

      // For this demo, we'll simulate this check
      return await Promise.resolve(false);
    } catch (error) {
      console.error("Error checking for image manipulation:", error);
      return await Promise.resolve(false);
    }
  }

  protected async checkAgainstKnownTemplates(
    filePath: string
  ): Promise<boolean> {
    // Enhanced template matching
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return await Promise.resolve(false);
      }

      // In a real implementation, this would:
      // 1. Compare the document layout against known templates for tax authorities
      // 2. Check for expected elements like logos, headers, footers
      // 3. Verify the document structure matches known valid tax return formats

      // For this demo, we'll simulate this check
      return await Promise.resolve(true);
    } catch (error) {
      console.error("Error checking against known templates:", error);
      return await Promise.resolve(false);
    }
  }

  protected checkDataConsistency(text: string): boolean {
    // Enhanced data consistency check
    try {
      // Extract relevant data for consistency checks
      const taxData = this.extractTaxReturnData(text);

      // Check 1: If we have income breakdown, verify it matches total income
      if (
        taxData.totalIncome &&
        Object.keys(taxData.incomeBreakdown).length > 0
      ) {
        const totalIncome = Number.parseFloat(
          taxData.totalIncome.replace(/,/g, "")
        );
        let sumOfIncomes = 0;

        // biome-ignore lint/suspicious/useGuardForIn: ignore
        for (const source in taxData.incomeBreakdown) {
          sumOfIncomes += Number.parseFloat(
            taxData.incomeBreakdown[source]?.replace(/,/g, "") ?? ""
          );
        }

        // Allow for small rounding differences (0.5% tolerance)
        const tolerance = totalIncome * 0.005;
        if (Math.abs(totalIncome - sumOfIncomes) > tolerance) {
          return true; // Inconsistency detected
        }
      }

      // Check 2: Verify tax paid is reasonable based on income
      if (taxData.totalIncome && taxData.taxPaid) {
        const totalIncome = Number.parseFloat(
          taxData.totalIncome.replace(/,/g, "")
        );
        const taxPaid = Number.parseFloat(taxData.taxPaid.replace(/,/g, ""));

        // Tax paid should be less than income and typically not more than 50% of income
        if (taxPaid > totalIncome || taxPaid > totalIncome * 0.5) {
          return true; // Inconsistency detected
        }
      }

      // No inconsistencies found
      return false;
    } catch (error) {
      console.error("Error checking data consistency:", error);
      return false; // Default to no inconsistencies if we can't check
    }
  }
}
