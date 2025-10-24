import type { IExecuteReportRequest, ReportPriority } from "@kaa/models/types";
import { reportsService } from "@kaa/services";
import { type Job, type JobProgress, Queue, Worker } from "bullmq";
import { Types } from "mongoose";

// Redis connection configuration
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
};

// Queue for report generation jobs
export const reportQueue = new Queue("reports", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
});

// Job data interface
export interface ReportJobData extends IExecuteReportRequest {
  executedBy?: string;
  priority?: ReportPriority;
}

// Add report to queue
export async function queueReportGeneration(
  jobData: ReportJobData
): Promise<Job<ReportJobData>> {
  const priority = getPriorityValue(jobData.priority);

  return await reportQueue.add("generate-report", jobData, {
    priority,
    jobId: `report-${jobData.reportId}-${Date.now()}`,
  });
}

// Convert priority string to number
function getPriorityValue(priority?: string): number {
  switch (priority) {
    case "urgent":
      return 1;
    case "high":
      return 5;
    case "normal":
      return 10;
    case "low":
      return 15;
    default:
      return 10;
  }
}

// Worker to process report generation
export const reportWorker = new Worker<ReportJobData>(
  "reports",
  async (job: Job<ReportJobData>) => {
    const { reportId, executedBy, format, parameters, recipients } = job.data;

    console.log(
      `[Report Worker] Processing job ${job.id} for report ${reportId}`
    );

    // Update progress
    await job.updateProgress(10);

    try {
      // Execute report through service
      const userId = executedBy
        ? Types.ObjectId.createFromHexString(executedBy)
        : undefined;

      await job.updateProgress(20);

      const result = await reportsService.executeReport(
        {
          reportId,
          format,
          parameters,
          recipients,
          priority: job.data.priority as any,
        },
        userId
      );

      await job.updateProgress(90);

      if (!result.success) {
        throw new Error(result.error?.message || "Report generation failed");
      }

      await job.updateProgress(100);

      console.log(
        `[Report Worker] Completed job ${job.id} for report ${reportId}`
      );

      return result.data;
    } catch (error) {
      console.error(`[Report Worker] Error in job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: Number.parseInt(
      process.env.REPORT_WORKER_CONCURRENCY || "5",
      10
    ),
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60_000, // per 60 seconds
    },
  }
);

// Worker event handlers
reportWorker.on("completed", (job: Job) => {
  console.log(`[Report Worker] Job ${job.id} completed successfully`);
});

reportWorker.on("failed", (job: Job | undefined, error: Error) => {
  console.error(`[Report Worker] Job ${job?.id} failed:`, error.message);
});

reportWorker.on("progress", (job: Job, progress: JobProgress) => {
  console.log(`[Report Worker] Job ${job.id} progress: ${progress}%`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Report Worker] Received SIGTERM, shutting down gracefully...");
  await reportWorker.close();
  await reportQueue.close();
});

process.on("SIGINT", async () => {
  console.log("[Report Worker] Received SIGINT, shutting down gracefully...");
  await reportWorker.close();
  await reportQueue.close();
});

// Queue helper functions
export async function getJobStatus(jobId: string): Promise<any> {
  const job = await reportQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress,
    state,
    attemptsMade: job.attemptsMade,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
    failedReason: job.failedReason,
  };
}

export async function cancelJob(jobId: string): Promise<boolean> {
  const job = await reportQueue.getJob(jobId);
  if (!job) {
    return false;
  }

  await job.remove();
  return true;
}

export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    reportQueue.getWaitingCount(),
    reportQueue.getActiveCount(),
    reportQueue.getCompletedCount(),
    reportQueue.getFailedCount(),
    reportQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}
