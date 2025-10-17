/** biome-ignore-all lint/performance/useTopLevelRegex: <explanation> */
import type { VerificationResult } from "@kaa/models/types";
import axios from "axios";
import {
  BaseDocumentValidator,
  type DocumentData,
  type DocumentValidatorOptions,
  type FraudDetectionResult,
} from "./document-validator";

/**
 * Validator for utility bills
 */
export class UtilityBillValidator extends BaseDocumentValidator {
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
  async validate(
    document: DocumentData,
    options?: DocumentValidatorOptions
  ): Promise<VerificationResult> {
    // Utility bill specific validation
    const hasValidFormat = this.checkDocumentFormat(
      document.filePath,
      document.mimeType
    );
    const billData = this.extractBillData(document.extractedText);
    const isRecent = this.checkIsRecent(billData.issueDate);
    const addressValid = options?.validateAddress
      ? await this.verifyAddress(billData.address)
      : true;

    const checks = [
      { name: "format", passed: hasValidFormat },
      { name: "data", passed: billData.isValid },
      { name: "recent", passed: isRecent },
      { name: "address", passed: addressValid },
    ];

    const isValid = checks.every((check) => check.passed);
    const confidence = this.calculateConfidenceScore(
      checks.map((check) => check.passed)
    );

    return {
      isValid,
      confidence,
      details: {
        documentType: "Utility Bill",
        provider: billData.provider,
        addressMatch: addressValid ? "Verified" : "Failed",
        issueDate: isRecent ? "Recent (< 3 months)" : "Outdated",
        issuerVerified: billData.isValid,
      },
      message: this.generateVerificationMessage(checks),
    };
  }

  async extractData(document: DocumentData): Promise<Record<string, unknown>> {
    const billData = await this.extractBillData(document.extractedText);

    return {
      fullName: billData.fullName,
      address: {
        line1: billData.address.line1,
        line2: billData.address.line2,
        city: billData.address.city,
        postalCode: billData.address.postalCode,
        country: billData.address.country,
      },
      issueDate: billData.issueDate,
      provider: billData.provider,
      accountNumber: billData.accountNumber,
      billAmount: billData.billAmount,
      billPeriod: billData.billPeriod,
    };
  }

  async detectFraud(document: DocumentData): Promise<FraudDetectionResult> {
    // Enhanced multi-layer fraud detection for utility bills
    const detectionMethods: string[] = [];
    const warnings: string[] = [];
    let fraudScore = 0;
    let maxScore = 0;

    // Layer 1: Basic text pattern analysis from parent class
    detectionMethods.push("text_pattern_analysis");
    const suspiciousPatterns = super.checkForSuspiciousPatterns(
      document.extractedText
    );
    if (suspiciousPatterns.length > 0) {
      fraudScore += suspiciousPatterns.length * 25; // Each pattern adds 25 points
      warnings.push(
        `Suspicious text patterns detected: ${suspiciousPatterns.join(", ")}`
      );
    }
    maxScore += 75; // Max 3 patterns * 25 points

    // Layer 2: Utility bill specific checks
    detectionMethods.push("utility_bill_validation");
    const providerValid = this.validateUtilityProvider(document.extractedText);
    if (!providerValid) {
      fraudScore += 50;
      warnings.push("Unrecognized or invalid utility provider");
    }
    maxScore += 50;

    const templateMatch = await this.checkAgainstKnownTemplates(
      document.filePath
    );
    if (templateMatch) {
      fraudScore += 75;
      warnings.push("Document matches known fraudulent template");
    }
    maxScore += 75;

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

    // Layer 4: Date validation
    detectionMethods.push("date_validation");
    const dateIssues = this.validateBillDates(document.extractedText);
    if (dateIssues.length > 0) {
      fraudScore += dateIssues.length * 30;
      warnings.push(`Date issues detected: ${dateIssues.join(", ")}`);
    }
    maxScore += 60; // Max 2 date issues * 30 points

    // Layer 4: Template matching
    detectionMethods.push("template_matching");
    const fileTemplateMatch = await this.checkAgainstKnownTemplatesFile(
      document.filePath
    );
    if (!fileTemplateMatch) {
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
        providerValid,
        templateMatch,
        dateIssues: dateIssues.length > 0 ? dateIssues.join(", ") : null,
        fraudScore,
        maxPossibleScore: maxScore,
        normalizedScore,
      },
      detectionMethods,
      warnings,
    };
  }

  private extractBillData(text: string): {
    isValid: boolean;
    fullName: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      postalCode: string;
      country: string;
    };
    issueDate: string;
    provider: string;
    accountNumber: string;
    billAmount: string;
    billPeriod: string;
  } {
    // Extract utility bill data using regex patterns
    // This is a simplified version - in a real implementation, this would be more robust
    const nameMatch = text.match(
      /(?:Customer|Name|Bill to)[:]\s*([A-Za-z\s]+)/i
    );

    // Address extraction - this is simplified
    const addressLines = text.match(
      /(?:Address|Bill to address)[:]\s*([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i
    );
    let line1 = "";
    let line2 = "";
    let city = "";
    let postalCode = "";
    let country = "";

    if (addressLines?.[1]) {
      const lines = addressLines[1].trim().split("\n") as string[];
      if (lines.length >= 1) line1 = lines[0]?.trim() ?? "";
      if (lines.length >= 2) line2 = lines[1]?.trim() ?? "";

      // Try to extract city, postal code, country from the last line
      if (lines.length >= 3) {
        const lastLine = lines.at(-1) as string;
        const cityMatch = lastLine.match(/([A-Za-z\s]+),/) as RegExpMatchArray;
        const postalMatch = lastLine.match(
          /([A-Z0-9\s]+)$/
        ) as RegExpMatchArray;

        if (cityMatch) city = cityMatch[1]?.trim() ?? "";
        if (postalMatch) postalCode = postalMatch[1]?.trim() ?? "";

        // Assume country based on postal code format
        if (postalCode.match(/^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/)) {
          country = "United Kingdom";
        } else {
          country = "Unknown";
        }
      }
    }

    const dateMatch = text.match(
      /(?:Date|Bill date|Issue date)[:]\s*(\d{2}[/.-]\d{2}[/.-]\d{4})/i
    );
    const providerMatch =
      text.match(/(?:Provider|Company|Supplier)[:]\s*([A-Za-z\s]+)/i) ||
      text.match(/^([A-Za-z\s]+)(?=\s+BILL|\s+INVOICE)/im);
    const accountMatch = text.match(
      /(?:Account|Customer|Reference)(?:\s+number|\s+#|No)[:]\s*([A-Z0-9]+)/i
    );
    const amountMatch = text.match(
      /(?:Amount|Total|Due)[:]\s*[$£€]?\s*([0-9]+\.[0-9]{2})/i
    );
    const periodMatch = text.match(
      /(?:Period|Billing period|For period)[:]\s*([A-Za-z0-9\s-]+)/i
    );

    // Check if we have the minimum required fields
    const isValid = Boolean(
      nameMatch && addressLines && dateMatch && providerMatch
    );

    return {
      isValid,
      fullName: nameMatch ? (nameMatch[1]?.trim() ?? "") : "",
      address: {
        line1,
        line2,
        city,
        postalCode,
        country,
      },
      issueDate: dateMatch ? (dateMatch[1] ?? "") : "",
      provider: providerMatch ? (providerMatch[1]?.trim() ?? "") : "",
      accountNumber: accountMatch ? (accountMatch[1] ?? "") : "",
      billAmount: amountMatch ? (amountMatch[1] ?? "") : "",
      billPeriod: periodMatch ? (periodMatch[1]?.trim() ?? "") : "",
    };
  }

  private checkIsRecent(issueDateStr: string): boolean {
    if (!issueDateStr) return false;

    try {
      // Parse the issue date (assuming format DD/MM/YYYY)
      const parts = issueDateStr.split(/[/.-]/) as string[];
      if (parts.length !== 3) return false;

      const issueDate = new Date(
        Number.parseInt(parts[2] ?? "0", 10), // Year
        Number.parseInt(parts[1] ?? "0", 10) - 1, // Month (0-based)
        Number.parseInt(parts[0] ?? "0", 10) // Day
      );

      // Check if the bill is less than 3 months old
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      return issueDate > threeMonthsAgo;
    } catch (error) {
      return false;
    }
  }

  private async verifyAddress(address: {
    line1: string;
    line2: string;
    city: string;
    postalCode: string;
    country: string;
  }): Promise<boolean> {
    // In a real implementation, this would call an address verification API
    // For this demo, we'll simulate this check
    try {
      if (
        process.env.ADDRESS_VERIFICATION_API_URL &&
        process.env.ADDRESS_VERIFICATION_API_KEY
      ) {
        const response = await axios.post(
          process.env.ADDRESS_VERIFICATION_API_URL,
          {
            address,
            apiKey: process.env.ADDRESS_VERIFICATION_API_KEY,
          }
        );

        return response.data.verified === true;
      }

      // Fallback to basic validation if no API is configured
      return Boolean(
        address.line1 &&
          address.city &&
          address.postalCode &&
          this.validatePostalCode(address.postalCode, address.country)
      );
    } catch (error) {
      console.error("Address verification error:", error);
      // Fallback to basic validation
      return Boolean(address.line1 && address.city && address.postalCode);
    }
  }

  private validatePostalCode(postalCode: string, country: string): boolean {
    // Validate postal code format based on country
    if (country === "United Kingdom") {
      // UK postal code format
      return /^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/.test(postalCode);
    }
    if (country === "United States") {
      // US ZIP code format
      return /^\d{5}(-\d{4})?$/.test(postalCode);
    }

    // Default validation - just check if it's not empty
    return Boolean(postalCode);
  }

  protected async detectImageManipulation(_filePath: string): Promise<boolean> {
    // Similar to passport implementation
    return await Promise.resolve(false);
  }

  /**
   * Verify the provider of the utility bill
   * @param provider - The provider of the utility bill
   * @returns true if the provider is known, false otherwise
   */
  verifyProvider(provider: string): boolean {
    // In a real implementation, this would check against a database of known utility providers
    // For this demo, we'll simulate this check with a list of common providers
    const knownProviders = [
      "British Gas",
      "EDF Energy",
      "E.ON",
      "Scottish Power",
      "SSE",
      "Bulb",
      "Octopus Energy",
      "Thames Water",
      "Anglian Water",
      "BT",
      "Sky",
      "Virgin Media",
    ];

    return knownProviders.some((knownProvider) =>
      provider.toLowerCase().includes(knownProvider.toLowerCase())
    );
  }

  protected async checkAgainstKnownTemplates(
    _filePath: string
  ): Promise<boolean> {
    // In a real implementation, this would:
    // 1. Compare the document layout against known templates for major utility providers
    // 2. Check for expected elements like logos, headers, footers
    // For this demo, we'll simulate this check
    return await Promise.resolve(true);
  }

  protected async checkAgainstKnownTemplatesFile(
    _filePath: string
  ): Promise<boolean> {
    // In a real implementation, this would:
    // 1. Compare the document layout against known templates for major utility providers
    // 2. Check for expected elements like logos, headers, footers
    // For this demo, we'll simulate this check
    return await Promise.resolve(true);
  }

  protected checkForSuspiciousPatterns(text: string): string[] {
    // Use the parent class implementation and add utility-bill specific patterns
    const patterns = super.checkForSuspiciousPatterns(text);

    // Add utility bill specific suspicious patterns
    const billPatterns = [
      { name: "mock_bill", regex: /mock|dummy|test bill/i },
      { name: "template", regex: /template|example bill/i },
    ];

    for (const pattern of billPatterns) {
      if (pattern.regex.test(text)) {
        patterns.push(pattern.name);
      }
    }

    return patterns;
  }

  protected validateUtilityProvider(text: string): boolean {
    // In a real implementation, this would check against a database of known utility providers
    // For this demo, we'll simulate this check with a list of common providers
    const knownProviders = [
      "British Gas",
      "EDF Energy",
      "E.ON",
      "Scottish Power",
      "SSE",
      "Bulb",
      "Octopus Energy",
      "Thames Water",
      "Anglian Water",
      "BT",
      "Sky",
      "Virgin Media",
    ];

    return knownProviders.some((knownProvider) =>
      text.toLowerCase().includes(knownProvider.toLowerCase())
    );
  }

  protected validateBillDates(text: string): string[] {
    const issues: string[] = [];

    // Extract bill date
    const billDateMatch = text.match(
      /(?:bill|statement)\s+date[:\s]\s*([^\n]+)/i
    );
    const billDate = billDateMatch ? new Date(billDateMatch[1] ?? "") : null;

    // Check if bill date is in the future
    if (billDate && !Number.isNaN(billDate.getTime())) {
      const now = new Date();
      if (billDate > now) {
        issues.push("future_bill_date");
      }

      // Check if bill is too old (more than 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      if (billDate < threeMonthsAgo) {
        issues.push("bill_too_old");
      }
    }

    return issues;
  }
}

/**
 * Validator for bank statements
 */
export class BankStatementValidator extends BaseDocumentValidator {
  protected checkForSuspiciousPatterns(text: string): string[] {
    // Use the parent class implementation and add bank-statement specific patterns
    const patterns = super.checkForSuspiciousPatterns(text);

    // Add bank statement specific suspicious patterns
    const bankPatterns = [
      { name: "mock_statement", regex: /mock|dummy|test statement/i },
      { name: "template", regex: /template|example statement/i },
      {
        name: "suspicious_balance",
        regex: /balance[:\s]\s*[$£€]?\s*9+\.\d{2}/i,
      }, // Suspicious repeating digits
    ];

    for (const pattern of bankPatterns) {
      if (pattern.regex.test(text)) {
        patterns.push(pattern.name);
      }
    }

    return patterns;
  }

  protected validateBankName(text: string): boolean {
    // In a real implementation, this would check against a database of known banks
    // For this demo, we'll simulate this check with a list of common banks
    const knownBanks = [
      "HSBC",
      "Barclays",
      "Lloyds",
      "NatWest",
      "Santander",
      "RBS",
      "Halifax",
      "Nationwide",
      "TSB",
      "Metro Bank",
      "First Direct",
      "Bank of Scotland",
    ];

    return knownBanks.some((knownBank) =>
      text.toLowerCase().includes(knownBank.toLowerCase())
    );
  }

  protected checkAgainstKnownTemplatesText(_text: string): boolean {
    // In a real implementation, this would check against known fraudulent templates
    // For this demo, we'll simulate this check
    return false;
  }

  protected validateBalanceConsistency(text: string): boolean {
    // Extract opening and closing balances
    const openingBalanceMatch = text.match(
      /opening\s+balance[:\s]\s*[\u00a3$\u20ac]?\s*(\d+[,\d]*\.?\d*)/i
    );
    const closingBalanceMatch = text.match(
      /closing\s+balance[:\s]\s*[\u00a3$\u20ac]?\s*(\d+[,\d]*\.?\d*)/i
    );

    if (openingBalanceMatch && closingBalanceMatch) {
      // Parse balances to numbers
      const openingBalance = Number.parseFloat(
        openingBalanceMatch[1]?.replace(/,/g, "") ?? ""
      );
      const closingBalance = Number.parseFloat(
        closingBalanceMatch[1]?.replace(/,/g, "") ?? ""
      );

      // Check if closing balance is consistent with opening balance
      // In a real implementation, this would also consider transactions
      return !(Number.isNaN(openingBalance) || Number.isNaN(closingBalance));
    }

    return true; // If we can't find both balances, assume it's valid
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
  async validate(
    document: DocumentData,
    options?: DocumentValidatorOptions
  ): Promise<VerificationResult> {
    // Bank statement specific validation
    const hasValidFormat = this.checkDocumentFormat(
      document.filePath,
      document.mimeType
    );
    const statementData = await this.extractStatementData(
      document.extractedText
    );
    const isRecent = this.checkIsRecent(statementData.statementDate);
    const bankValid = await this.verifyBank(statementData.bankName);
    const addressValid = options?.validateAddress
      ? await this.verifyAddress(statementData.address)
      : true;

    const checks = [
      { name: "format", passed: hasValidFormat },
      { name: "data", passed: statementData.isValid },
      { name: "recent", passed: isRecent },
      { name: "bank", passed: bankValid },
      { name: "address", passed: addressValid },
    ];

    const isValid = checks.every((check) => check.passed);
    const confidence = this.calculateConfidenceScore(
      checks.map((check) => check.passed)
    );

    return {
      isValid,
      confidence,
      details: {
        documentType: "Bank Statement",
        bank: statementData.bankName,
        addressMatch: addressValid ? "Verified" : "Failed",
        statementDate: isRecent ? "Recent (< 3 months)" : "Outdated",
        bankVerified: bankValid,
      },
      message: this.generateVerificationMessage(checks),
    };
  }

  async extractData(document: DocumentData): Promise<Record<string, unknown>> {
    const statementData = await this.extractStatementData(
      document.extractedText
    );

    return {
      fullName: statementData.fullName,
      address: {
        line1: statementData.address.line1,
        line2: statementData.address.line2,
        city: statementData.address.city,
        postalCode: statementData.address.postalCode,
        country: statementData.address.country,
      },
      statementDate: statementData.statementDate,
      bankName: statementData.bankName,
      accountNumber: statementData.accountNumber,
      sortCode: statementData.sortCode,
      balance: statementData.balance,
      statementPeriod: statementData.statementPeriod,
    };
  }

  async detectFraud(document: DocumentData): Promise<FraudDetectionResult> {
    // Enhanced multi-layer fraud detection for bank statements
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

    // Layer 2: Bank statement specific checks
    detectionMethods.push("bank_statement_validation");
    const bankNameValid = this.validateBankName(document.extractedText);
    if (!bankNameValid) {
      fraudScore += 50;
      warnings.push("Unrecognized or invalid bank name");
    }
    maxScore += 50;

    const templateMatch = this.checkAgainstKnownTemplatesText(
      document.extractedText
    );
    if (templateMatch) {
      fraudScore += 75;
      warnings.push("Document matches known fraudulent template");
    }
    maxScore += 75;

    const transactionsValid = this.validateTransactions(document.extractedText);
    if (!transactionsValid) {
      fraudScore += 60;
      warnings.push("Transaction data appears to be manipulated");
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

    // Layer 4: Balance consistency check
    detectionMethods.push("balance_validation");
    const balanceConsistent = this.validateBalanceConsistency(
      document.extractedText
    );
    if (!balanceConsistent) {
      fraudScore += 80;
      warnings.push("Opening/closing balance inconsistency detected");
    }
    maxScore += 80;

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
        bankValid: bankNameValid,
        templateMatch,
        transactionsValid,
        balanceConsistent,
        fraudScore,
        maxPossibleScore: maxScore,
        normalizedScore,
      },
      detectionMethods,
      warnings,
    };
  }

  private extractStatementData(text: string): {
    isValid: boolean;
    fullName: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      postalCode: string;
      country: string;
    };
    statementDate: string;
    bankName: string;
    accountNumber: string;
    sortCode: string;
    balance: string;
    statementPeriod: string;
  } {
    // Extract bank statement data using regex patterns
    // This is a simplified version - in a real implementation, this would be more robust
    const nameMatch = text.match(
      /(?:Customer|Name|Account holder)[:]\s*([A-Za-z\s]+)/i
    ) as RegExpMatchArray;

    // Address extraction - similar to utility bill
    const addressLines = text.match(
      /(?:Address|Statement address)[:]\s*([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i
    ) as RegExpMatchArray;
    let line1 = "";
    let line2 = "";
    let city = "";
    let postalCode = "";
    let country = "";

    // biome-ignore lint/complexity/useOptionalChain: ignore
    if (addressLines && addressLines[1]) {
      const lines = addressLines[1].trim().split("\n") as string[];
      if (lines.length >= 1) line1 = lines[0]?.trim() ?? "";
      if (lines.length >= 2) line2 = lines[1]?.trim() ?? "";

      // Try to extract city, postal code, country from the last line
      if (lines.length >= 3) {
        const lastLine = lines.at(-1) as string;
        const cityMatch = lastLine.match(/([A-Za-z\s]+),/) as RegExpMatchArray;
        const postalMatch = lastLine.match(
          /([A-Z0-9\s]+)$/
        ) as RegExpMatchArray;

        if (cityMatch) city = cityMatch[1]?.trim() ?? "";
        if (postalMatch) postalCode = postalMatch[1]?.trim() ?? "";

        // Assume country based on postal code format
        if (postalCode.match(/^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/)) {
          country = "United Kingdom";
        } else {
          country = "Unknown";
        }
      }
    }

    const dateMatch = text.match(
      /(?:Statement date|Date|As of)[:]\s*(\d{2}[/.-]\d{2}[/.-]\d{4})/i
    ) as RegExpMatchArray;
    const bankMatch =
      text.match(/^([A-Za-z\s]+)(?=\s+Bank|\s+Statement)/im) ||
      text.match(/(?:Bank|Financial institution)[:]\s*([A-Za-z\s]+)/i);
    const accountMatch = text.match(
      /(?:Account|Account number)(?:\s+number|\s+#|No)[:]\s*([*xX0-9]+)/i
    );
    const sortCodeMatch = text.match(
      /(?:Sort code|Routing number)[:]\s*(\d{2}-\d{2}-\d{2})/i
    );
    const balanceMatch = text.match(
      /(?:Balance|Current balance|Closing balance)[:]\s*[$£€]?\s*([0-9,]+\.[0-9]{2})/i
    );
    const periodMatch = text.match(
      /(?:Statement period|Period|For period)[:]\s*([A-Za-z0-9\s-]+)/i
    );

    // Check if we have the minimum required fields
    const isValid = Boolean(
      nameMatch && addressLines && dateMatch && bankMatch && accountMatch
    );

    return {
      isValid,
      fullName: nameMatch ? (nameMatch[1]?.trim() ?? "") : "",
      address: {
        line1,
        line2,
        city,
        postalCode,
        country,
      },
      statementDate: dateMatch ? (dateMatch[1] ?? "") : "",
      bankName: bankMatch ? (bankMatch[1]?.trim() ?? "") : "",
      accountNumber: accountMatch ? (accountMatch[1] ?? "") : "",
      sortCode: sortCodeMatch ? (sortCodeMatch[1] ?? "") : "",
      balance: balanceMatch ? (balanceMatch[1] ?? "") : "",
      statementPeriod: periodMatch ? (periodMatch[1]?.trim() ?? "") : "",
    };
  }

  private checkIsRecent(statementDateStr: string): boolean {
    // Similar to utility bill implementation
    if (!statementDateStr) return false;

    try {
      // Parse the statement date (assuming format DD/MM/YYYY)
      const parts = statementDateStr.split(/[/.-]/) as string[];
      if (parts.length !== 3) return false;

      const statementDate = new Date(
        Number.parseInt(parts[2] ?? "0", 10), // Year
        Number.parseInt(parts[1] ?? "0", 10) - 1, // Month (0-based)
        Number.parseInt(parts[0] ?? "0", 10) // Day
      );

      // Check if the statement is less than 3 months old
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      return statementDate > threeMonthsAgo;
    } catch (error) {
      return false;
    }
  }

  private verifyBank(bankName: string): boolean {
    // In a real implementation, this would check against a database of known banks
    // For this demo, we'll simulate this check with a list of common banks
    const knownBanks = [
      "Barclays",
      "HSBC",
      "Lloyds",
      "NatWest",
      "Santander",
      "Halifax",
      "Nationwide",
      "Royal Bank of Scotland",
      "TSB",
      "Metro Bank",
      "Monzo",
      "Starling Bank",
    ];

    return knownBanks.some((knownBank) =>
      bankName.toLowerCase().includes(knownBank.toLowerCase())
    );
  }

  private async verifyAddress(address: {
    line1: string;
    line2: string;
    city: string;
    postalCode: string;
    country: string;
  }): Promise<boolean> {
    // Similar to utility bill implementation
    return await Promise.resolve(
      Boolean(address.line1 && address.city && address.postalCode)
    );
  }

  protected async detectImageManipulation(_filePath: string): Promise<boolean> {
    // Similar to passport implementation
    return await Promise.resolve(false);
  }

  protected async checkAgainstKnownTemplates(
    _filePath: string
  ): Promise<boolean> {
    // Similar to utility bill implementation
    return await Promise.resolve(true);
  }

  private validateTransactions(text: string): boolean {
    // In a real implementation, this would:
    // 1. Extract transaction data from the statement
    // 2. Check for suspicious patterns (e.g., identical amounts, round numbers)
    // 3. Verify that debits and credits balance correctly
    // For this demo, we'll simulate this check

    // Check if the text contains a transaction section
    const hasTransactionSection = /transactions|payments|debits|credits/i.test(
      text
    );

    // Check if there are date patterns in the text that look like transaction dates
    const hasTransactionDates =
      /\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{2}\.\d{2}\.\d{4}/g.test(text);

    // Check if there are amount patterns that look like transaction amounts
    const hasTransactionAmounts =
      /\$\d+\.\d{2}|£\d+\.\d{2}|€\d+\.\d{2}|\d+\.\d{2}/g.test(text);

    return (
      hasTransactionSection && hasTransactionDates && hasTransactionAmounts
    );
  }
}
