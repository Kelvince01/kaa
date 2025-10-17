import { Document, VerificationFeedback, VerificationLog } from "@kaa/models";
import type { IDocument, VerificationResult } from "@kaa/models/types";
import { DocumentCategory, DocumentStatus } from "@kaa/models/types";
import type mongoose from "mongoose";
import {
  getVerificationJobStatus,
  queueDocumentVerification,
} from "../queues/verification.queue";
import { ocrService } from "./ocr-service";
import { DocumentValidatorFactory } from "./validators/document-validator-factory";

/**
 * Document Verification Service
 * Provides methods for automated document validation and verification
 */
class DocumentVerificationService {
  /**
   * Verify a document
   * @param documentId ID of the document to verify
   * @param priority Priority of the verification job (higher number = higher priority)
   * @returns Job ID for tracking the verification process
   */
  async verifyDocument(documentId: string, priority = 1): Promise<string> {
    try {
      // Find the document
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Update document status to pending
      document.status = DocumentStatus.PENDING;
      await document.save();

      // Queue the document for verification
      const jobId = await queueDocumentVerification(documentId, priority);

      return jobId;
    } catch (error) {
      console.error(
        `Failed to queue document ${documentId} for verification:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get the status of a verification job
   * @param jobId ID of the verification job
   * @returns Job status
   */
  async getVerificationStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    result?: {
      documentId: string;
      status: string;
      result: VerificationResult;
    };
  }> {
    try {
      return await getVerificationJobStatus(jobId);
    } catch (error) {
      console.error(
        `Failed to get verification status for job ${jobId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create a new document
   * @param documentData Document data
   * @param autoVerify Whether to automatically verify the document after creation
   * @returns Created document and verification job ID if autoVerify is true
   */
  async createDocument(
    documentData: Partial<IDocument>,
    autoVerify = false
  ): Promise<{ document: IDocument; verificationJobId?: string }> {
    try {
      const document = new Document(documentData);
      await document.save();

      let verificationJobId: string | undefined;

      if (autoVerify) {
        verificationJobId = await this.verifyDocument(document._id.toString());
      }

      return { document, verificationJobId };
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  /**
   * Get documents by user ID
   * @param userId User ID
   * @param status Optional status filter
   * @returns List of documents
   */
  async getDocumentsByUser(
    userId: mongoose.Types.ObjectId | string,
    status?: DocumentStatus
  ): Promise<IDocument[]> {
    try {
      const query: {
        user: mongoose.Types.ObjectId | string;
        status?: DocumentStatus;
      } = { user: userId };
      if (status) {
        query.status = status;
      }

      return await Document.find(query).sort({ uploadedAt: -1 });
    } catch (error) {
      console.error(`Error fetching documents for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process a document immediately (synchronous verification)
   * @param documentId ID of the document to verify
   * @returns Verification result
   */
  async processDocumentSync(documentId: string): Promise<VerificationResult> {
    try {
      // Find the document
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Update document status to processing
      document.status = DocumentStatus.PROCESSING;
      await document.save();

      const startTime = Date.now();
      let result: VerificationResult;

      try {
        // Process document with OCR
        const documentData = await ocrService.processDocument(
          document.file,
          document.type,
          document.mimeType
        );

        // Get appropriate validator
        const validator = DocumentValidatorFactory.createValidator(
          document.type,
          document.category
        );

        // Validate document
        result = await validator.validate(documentData, {
          performOcr: true,
          checkExpiry: true,
          validateAddress: document.category === DocumentCategory.ADDRESS,
          validateIdentity: document.category === DocumentCategory.IDENTITY,
          validateIncome: document.category === DocumentCategory.INCOME,
        });

        // Extract data
        const extractedData = await validator.extractData(documentData);

        // Check for fraud
        const fraudResult = await validator.detectFraud(documentData);

        // Update document with results
        document.status = result.isValid
          ? DocumentStatus.VERIFIED
          : DocumentStatus.REJECTED;
        document.verifiedAt = new Date();
        document.rejectionReason = result.isValid ? undefined : result.message;
        document.metadata = {
          ...document.metadata,
          verificationResult: result,
          extractedData,
          fraudDetection: fraudResult,
        };

        await document.save();

        // Log verification result
        await VerificationLog.create({
          documentId: document._id,
          timestamp: new Date(),
          result: {
            isValid: result.isValid,
            confidence: result.confidence,
          },
          processingTimeMs: Date.now() - startTime,
          metadata: {
            details: result.details,
            fraudDetection: fraudResult,
          },
        });
      } catch (error) {
        console.error(
          `Verification processing error for document ${documentId}:`,
          error
        );

        // Update document status to error
        document.status = DocumentStatus.ERROR;
        document.rejectionReason =
          error instanceof Error ? error.message : "Unknown error";
        await document.save();

        // Create a default error result
        result = {
          isValid: false,
          confidence: 0,
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
          message: "Document verification failed due to processing error",
        };

        // Log verification error
        await VerificationLog.create({
          documentId: document._id,
          timestamp: new Date(),
          result: {
            isValid: false,
            confidence: 0,
          },
          processingTimeMs: Date.now() - startTime,
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }

      return result;
    } catch (error) {
      console.error(`Verification error for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Extract data from a document
   * @param documentId ID of the document to extract data from
   * @returns Extracted data
   */
  async extractDocumentData(
    documentId: string
  ): Promise<Record<string, unknown>> {
    try {
      // Find the document
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Check if document has already been processed and has extracted data
      if (
        document.metadata?.extractedData &&
        Object.keys(document.metadata.extractedData).length > 0
      ) {
        return document.metadata.extractedData as Record<string, unknown>;
      }

      // Process document with OCR
      const documentData = await ocrService.processDocument(
        document.file,
        document.type,
        document.mimeType
      );

      // Get appropriate validator
      const validator = DocumentValidatorFactory.createValidator(
        document.type,
        document.category
      );

      // Extract data
      const extractedData = await validator.extractData(documentData);

      // Update document with extracted data if not already processed
      if (
        document.status !== DocumentStatus.VERIFIED &&
        document.status !== DocumentStatus.REJECTED
      ) {
        document.metadata = {
          ...document.metadata,
          extractedData,
        };
        await document.save();
      }

      return extractedData;
    } catch (error) {
      console.error(`Data extraction error for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Submit feedback on a document verification result
   * @param documentId ID of the document
   * @param feedback Feedback data
   * @returns Created feedback record
   */
  async submitVerificationFeedback(
    documentId: string,
    feedback: {
      isCorrect: boolean;
      actualStatus: string;
      comments?: string;
    }
  ) {
    try {
      // Find the document
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Create feedback record
      const feedbackRecord = await VerificationFeedback.create({
        documentId: document._id,
        timestamp: new Date(),
        feedback,
        reviewStatus: "pending",
      });

      return feedbackRecord;
    } catch (error) {
      console.error(
        `Failed to submit feedback for document ${documentId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get verification logs for a document
   * @param documentId ID of the document
   * @returns Verification logs
   */
  async getVerificationLogs(documentId: string) {
    try {
      return await VerificationLog.find({ documentId }).sort({ timestamp: -1 });
    } catch (error) {
      console.error(
        `Failed to get verification logs for document ${documentId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Calculate overall verification progress for a user
   * @param userId User ID
   * @returns Progress percentage (0-100)
   */
  async calculateVerificationProgress(userId: string): Promise<number> {
    try {
      // Get all user documents
      const documents = await Document.find({ user: userId });

      if (documents.length === 0) {
        return 0;
      }

      // Count verified documents
      const verifiedCount = documents.filter(
        (doc) => doc.status === DocumentStatus.VERIFIED
      ).length;

      // Calculate progress percentage
      return Math.round((verifiedCount / documents.length) * 100);
    } catch (error) {
      console.error("Error calculating verification progress:", error);
      return 0;
    }
  }

  /**
   * Get verification status for a user across document categories
   * @param userId User ID
   * @returns Verification status by category
   */

  async getUserVerificationStatus(
    userId: string
  ): Promise<Record<string, any>> {
    try {
      // Get all user documents
      const documents = await Document.find({ user: userId });

      // Initialize results object with all categories

      const result: Record<string, any> = {
        identity: { verified: false },
        address: { verified: false },
        income: { verified: false },
        employment: { verified: false },
        // Add other categories as needed
      };

      // Check verification status for each category
      for (const doc of documents) {
        if (doc.status === DocumentStatus.VERIFIED && doc.category) {
          result[doc.category.toLowerCase()] = {
            verified: true,
            documentId: doc._id,
            verifiedAt: doc.verifiedAt,
          };
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting user verification status:", error);
      throw error;
    }
  }
}

export const documentVerificationService = new DocumentVerificationService();
