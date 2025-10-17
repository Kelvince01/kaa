/** biome-ignore-all lint/performance/useTopLevelRegex: ignore */
import * as fs from "node:fs";
import * as path from "node:path";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import config from "@kaa/config/api";
import { PDFParse } from "pdf-parse";
import type { DocumentData } from "./validators/document-validator";

/**
 * Service for performing OCR (Optical Character Recognition) on document images
 */
export class OCRService {
  private readonly client: ImageAnnotatorClient;

  constructor() {
    try {
      // Initialize the Google Cloud Vision client
      // If credentials path is provided in env, use it, otherwise use default auth
      if (config.google.cloud_credentials_path) {
        this.client = new ImageAnnotatorClient({
          keyFilename: config.google.cloud_credentials_path,
        });
      } else {
        this.client = new ImageAnnotatorClient();
      }
    } catch (error) {
      console.error("Failed to initialize Google Cloud Vision client:", error);
      throw new Error("OCR service initialization failed");
    }
  }

  /**
   * Extract text from an image file using OCR
   * @param filePath Path to the image file
   * @returns Extracted text from the image
   */
  async extractTextFromImage(filePath: string): Promise<string> {
    try {
      // Read the file
      const fileContent = fs.readFileSync(filePath);

      // Perform text detection
      const [result] = await this.client.textDetection(fileContent);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        return "";
      }

      // The first annotation contains the entire extracted text
      return detections[0]?.description || "";
    } catch (error) {
      console.error("OCR text extraction error:", error);
      throw new Error("Failed to extract text from image");
    }
  }

  /**
   * Extract text from a PDF file
   * @param filePath Path to the PDF file
   * @returns Extracted text from the PDF
   */
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      // Read the PDF file
      const dataBuffer = fs.readFileSync(filePath);

      // Parse the PDF content
      const pdfData = new PDFParse({
        data: dataBuffer,
        // max: 0, // No page limit
      });

      const textResult = await pdfData.getText();
      pdfData.destroy();

      // Return the extracted text
      return textResult.text || "";
    } catch (error) {
      console.error("PDF text extraction error:", error);
      throw new Error("Failed to extract text from PDF");
    }
  }

  /**
   * Extract text from a document file based on its mime type
   * @param filePath Path to the document file
   * @param mimeType MIME type of the document
   * @returns Extracted text from the document
   */
  async extractText(filePath: string, mimeType: string): Promise<string> {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Extract text based on mime type
    if (mimeType.startsWith("image/")) {
      return await this.extractTextFromImage(filePath);
    }
    if (mimeType === "application/pdf") {
      return await this.extractTextFromPDF(filePath);
    }
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  /**
   * Process a document for OCR and prepare it for validation
   * @param filePath Path to the document file
   * @param documentType Type of document
   * @param mimeType MIME type of the document
   * @returns Document data with extracted text
   */
  async processDocument(
    filePath: string,
    documentType: string,
    mimeType: string
  ): Promise<DocumentData> {
    try {
      // Extract text from the document
      const extractedText = await this.extractText(filePath, mimeType);

      // Return document data with extracted text
      return {
        documentType,
        extractedText,
        filePath,
        mimeType,
        metadata: {
          fileName: path.basename(filePath),
          fileSize: fs.statSync(filePath).size,
          extractionTimestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Document processing error:", error);
      throw new Error("Failed to process document");
    }
  }

  /**
   * Detect document type from image content
   * This uses a combination of OCR and pattern matching to identify document types
   * @param filePath Path to the document file
   * @returns Detected document type
   */
  async detectDocumentType(filePath: string): Promise<string> {
    try {
      // Read the file
      const fileContent = fs.readFileSync(filePath);
      const mimeType = this.getMimeType(filePath);

      // Extract text from the document
      let extractedText = "";
      if (mimeType.startsWith("image/")) {
        // Use Google Cloud Vision for images
        const [result] = await this.client.documentTextDetection(fileContent);
        const fullTextAnnotation = result.fullTextAnnotation;
        extractedText = fullTextAnnotation ? fullTextAnnotation.text || "" : "";
      } else if (mimeType === "application/pdf") {
        // Use PDF parser for PDFs
        extractedText = await this.extractTextFromPDF(filePath);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Define patterns for different document types
      const documentPatterns = [
        {
          type: "passport",
          patterns: [
            /passport/i,
            /nationality/i,
            /date of (issue|expiry)/i,
            /passport no/i,
          ],
        },
        {
          type: "driver's license",
          patterns: [
            /driver'?s licen[cs]e/i,
            /driving licen[cs]e/i,
            /(class|type):/i,
            /licen[cs]e no/i,
          ],
        },
        {
          type: "id card",
          patterns: [/identity card/i, /id card/i, /identification/i],
        },
        {
          type: "utility bill",
          patterns: [
            /utility/i,
            /bill/i,
            /statement/i,
            /account no/i,
            /electricity|gas|water|phone|internet/i,
          ],
        },
        {
          type: "bank statement",
          patterns: [
            /bank/i,
            /statement/i,
            /account/i,
            /balance/i,
            /transaction/i,
          ],
        },
        {
          type: "payslip",
          patterns: [
            /pay\s?slip/i,
            /salary/i,
            /wage/i,
            /earning/i,
            /gross pay/i,
            /net pay/i,
          ],
        },
        {
          type: "employment contract",
          patterns: [
            /employment/i,
            /contract/i,
            /agreement/i,
            /position/i,
            /salary/i,
          ],
        },
        {
          type: "tax return",
          patterns: [/tax/i, /return/i, /income/i, /revenue/i, /irs|hmrc/i],
        },
      ];

      // Score each document type based on pattern matches
      const scores = documentPatterns.map((docType) => {
        const matchCount = docType.patterns.filter((pattern) =>
          pattern.test(extractedText)
        ).length;
        const score = matchCount / docType.patterns.length;
        return { type: docType.type, score };
      });

      // Sort by score (highest first)
      scores.sort((a, b) => b.score - a.score);

      // If the highest score is above a threshold, return that document type
      if (scores.length > 0 && (scores[0]?.score as any) >= 0.5) {
        return scores[0]?.type || "";
      }

      // If no clear match, use image classification for images
      if (mimeType.startsWith("image/")) {
        try {
          // Use Google Cloud Vision's label detection as a fallback
          const [labelResult] = await this.client.labelDetection(fileContent);
          const labels = labelResult.labelAnnotations || [];

          // Check for document-related labels
          const documentLabels = labels.filter((label) =>
            /document|passport|license|card|bill|statement|certificate/i.test(
              label.description || ""
            )
          );

          if (documentLabels.length > 0) {
            // Return the highest confidence document label
            return documentLabels[0]?.description?.toLowerCase() || "document";
          }
        } catch (labelError) {
          console.error("Label detection error:", labelError);
          // Continue to generic fallback
        }
      }

      // Fallback to generic document type
      return "document";
    } catch (error) {
      console.error("Document type detection error:", error);
      return "unknown";
    }
  }

  /**
   * Get MIME type from file path
   * @param filePath Path to the file
   * @returns MIME type
   */
  private getMimeType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".tiff": "image/tiff",
      ".tif": "image/tiff",
      ".bmp": "image/bmp",
      ".gif": "image/gif",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }

  /**
   * Simulate OCR for testing purposes when Google Cloud Vision is not available
   * @param filePath Path to the document file
   * @param documentType Type of document
   * @returns Simulated document data
   */
  simulateOCR(filePath: string, documentType: string): DocumentData {
    // Generate simulated text based on document type
    let simulatedText = "";

    if (documentType.toLowerCase().includes("passport")) {
      simulatedText = `
        PASSPORT
        Surname: SMITH
        Given names: JOHN JAMES
        Nationality: BRITISH
        Date of birth: 15/03/1985
        Place of birth: LONDON
        Date of issue: 01/01/2018
        Date of expiry: 01/01/2028
        Passport No: 123456789
        Sex: M
        P<GBRSMITH<<JOHN<JAMES<<<<<<<<<<<<<<<<<<<<<<
        1234567897GBR8503156M2801014<<<<<<<<<<<<<<04
      `;
    } else if (documentType.toLowerCase().includes("driver")) {
      simulatedText = `
        DRIVING LICENCE
        Name: JANE WILSON
        Address: 123 MAIN STREET, LONDON, SW1A 1AA
        DOB: 23/05/1990
        Issue Date: 10/06/2015
        Expiry Date: 23/05/2025
        Licence No: WILSO905235JA9XYZ
        Class: B
      `;
    } else if (
      documentType.toLowerCase().includes("utility") ||
      documentType.toLowerCase().includes("bill")
    ) {
      simulatedText = `
        British Gas
        UTILITY BILL
        Customer: ROBERT BROWN
        Account No: 1234567890
        Bill date: 15/03/2023
        Bill period: 15/02/2023 - 14/03/2023
        Address: 45 PARK AVENUE, MANCHESTER, M1 3FG
        Amount due: £78.45
      `;
    } else if (documentType.toLowerCase().includes("bank")) {
      simulatedText = `
        HSBC
        BANK STATEMENT
        Name: SARAH JOHNSON
        Account No: ****7890
        Sort code: 40-05-12
        Statement date: 31/03/2023
        Statement period: 01/03/2023 - 31/03/2023
        Address: 78 HIGH STREET, BIRMINGHAM, B1 2DE
        Balance: £3,245.67
      `;
    } else if (documentType.toLowerCase().includes("payslip")) {
      simulatedText = `
        ACME CORPORATION
        PAYSLIP
        Employee: MICHAEL TAYLOR
        Employee No: EMP12345
        Pay period: March 2023
        Tax code: 1257L
        Gross pay: £2,500.00
        Tax paid: £358.33
        National Insurance: £214.32
        Net pay: £1,927.35
      `;
    } else {
      simulatedText = `
        DOCUMENT
        This is a simulated document for testing purposes.
        Date: 01/04/2023
        Reference: REF12345
      `;
    }

    // Return simulated document data
    return {
      documentType,
      extractedText: simulatedText,
      filePath,
      mimeType:
        path.extname(filePath) === ".pdf" ? "application/pdf" : "image/jpeg",
      metadata: {
        fileName: path.basename(filePath),
        fileSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
        extractionTimestamp: new Date().toISOString(),
        simulated: true,
      },
    };
  }
}

// Export a singleton instance
export const ocrService = new OCRService();
