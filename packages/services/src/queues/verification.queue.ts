import config from "@kaa/config/api";
import { Document, VerificationLog } from "@kaa/models";
import { DocumentStatus, type VerificationResult } from "@kaa/models/types";
import { createQueue, logger, redisClient, redisOptions } from "@kaa/utils";
import { Worker } from "bullmq";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { ocrService } from "../documents/ocr-service";
import { DocumentValidatorFactory } from "../documents/validators/document-validator-factory";

// Create rate limiter
export const verificationRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "verification_rate_limit",
  points: Number.parseInt(config.verificationRateLimit.points || "10", 10), // Number of points
  duration: Number.parseInt(config.verificationRateLimit.duration || "60", 10), // Per 60 seconds
});

// Create verification queue
export const documentVerificationQueue = createQueue("document-verification", {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
});

// Create worker - Process verification jobs
const worker = new Worker(
  "document-verification",
  async (job) => {
    logger.info(`Processing document verification job ${job.id}`);

    if (job.name === "verifyDocument") {
      const { documentId } = job.data;
      const startTime = Date.now();
      let result: VerificationResult | null = null;

      try {
        console.log(`Processing verification job for document ${documentId}`);

        // Fetch document from database
        const document = await Document.findById(documentId);
        if (!document) {
          throw new Error(`Document not found: ${documentId}`);
        }

        // Update document status to processing
        document.status = DocumentStatus.PROCESSING;
        await document.save();

        // Check rate limit for user
        try {
          await verificationRateLimiter.consume(document.tenant.toString());
          console.log(
            `Rate limit exceeded for user ${document.tenant.toString()}, delaying job`
          );
        } catch (error) {
          // Rate limit exceeded, delay the job
          console.log(
            `Rate limit exceeded for user ${document.tenant.toString()}, delaying job`
          );
          document.status = DocumentStatus.PENDING;
          await document.save();
          return Promise.reject(new Error("Rate limit exceeded"));
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

        // Validate document
        result = await validator.validate(documentData, {
          performOcr: true,
          checkExpiry: true,
          validateAddress: document.category === "address",
          validateIdentity: document.category === "identity",
          validateIncome: document.category === "income",
        });

        // Extract data
        const extractedData = await validator.extractData(documentData);

        // Check for fraud
        const fraudResult = await validator.detectFraud(documentData);

        // Update document with results
        document.status = result?.isValid
          ? DocumentStatus.VERIFIED
          : DocumentStatus.REJECTED;
        document.verifiedAt = new Date();
        document.rejectionReason = result?.isValid
          ? undefined
          : result?.message;
        document.metadata = {
          ...document.metadata,
          verificationResult: result as VerificationResult,
          extractedData,
          fraudDetection: fraudResult,
        };

        await document.save();

        // Log verification result
        await VerificationLog.create({
          documentId: document._id,
          timestamp: new Date(),
          result: {
            isValid: result?.isValid,
            confidence: result?.confidence,
          },
          processingTimeMs: Date.now() - startTime,
          metadata: {
            details: result?.details,
            fraudDetection: fraudResult,
          },
        });

        console.log(
          `Verification completed for document ${documentId}: ${result?.isValid ? "VERIFIED" : "REJECTED"}`
        );

        return {
          documentId,
          status: document.status,
          result,
        };
      } catch (error) {
        console.error(`Verification error for document ${documentId}:`, error);

        // Update document status to error
        try {
          const document = await Document.findById(documentId);
          if (document) {
            document.status = DocumentStatus.ERROR;
            document.rejectionReason =
              error instanceof Error ? error.message : "Unknown error";
            await document.save();
          }
        } catch (dbError) {
          console.error("Failed to update document status:", dbError);
        }

        // Log verification error
        try {
          await VerificationLog.create({
            documentId,
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
        } catch (logError) {
          console.error("Failed to log verification error:", logError);
        }

        throw error;
      }
    }

    logger.info(`Completed document verification job ${job.id}`);
  },
  {
    connection: redisOptions,
    concurrency: 5,
  }
);

// Handle completed jobs
worker.on("completed", (job, result) => {
  console.log(
    `Document verification job ${job.id} completed with result:`,
    result
  );
});

// Handle failed jobs
worker.on("failed", (job, error) => {
  console.error(
    `Document verification job ${job?.id} failed with error:`,
    error
  );
});

/**
 * Add a document to the verification queue
 * @param documentId ID of the document to verify
 * @param priority Priority of the job (higher number = higher priority)
 * @returns Job ID
 */
export const queueDocumentVerification = async (
  documentId: string,
  priority = 1
): Promise<string> => {
  try {
    // Add job to queue
    const job = await documentVerificationQueue.add(documentId, {
      priority,
      jobId: `doc-${documentId}-${Date.now()}`,
    });

    console.log(
      `Added document ${documentId} to verification queue with job ID ${job.id}`
    );

    return job.id?.toString() as string;
  } catch (error) {
    console.error(`Failed to queue document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Get the status of a verification job
 * @param jobId ID of the job
 * @returns Job status
 */
export const getVerificationJobStatus = async (
  jobId: string
): Promise<{
  status: string;
  progress: number;
  result?: {
    documentId: string;
    status: string;
    result: VerificationResult;
  };
}> => {
  try {
    const job = await documentVerificationQueue.getJob(jobId);

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const state = await job.getState();
    const progress = job.progress || 0;

    return {
      status: state,
      progress: Number(progress),
      result: job.returnvalue,
    };
  } catch (error) {
    console.error(`Failed to get job status for ${jobId}:`, error);
    throw error;
  }
};

export default worker;
