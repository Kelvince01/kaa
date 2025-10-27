import { AIModel, Prediction } from "@kaa/models";
import { createQueue, redisOptions } from "@kaa/utils/bull";
import { logger } from "@kaa/utils/logger";
import { Worker } from "bullmq";
import type mongoose from "mongoose";
import type { CreateAIModelData } from "./ai.service";
import { diContainer, ensureInitialized } from "./services/di-container";
import type { IncrementalLearningService } from "./services/incremental-learning.service";
import type { ModelRegistryService } from "./services/model-registry.service";
import type { TensorflowService } from "./services/tensorflow.service";

// Create queue for AI training
export const aiTrainingQueue = createQueue("ai-training");

// Initialize services once
let servicesInitialized = false;
let tensorflowService: TensorflowService;
let incrementalLearningService: IncrementalLearningService;
let modelRegistryService: ModelRegistryService;

async function initializeServices() {
  if (!servicesInitialized) {
    await ensureInitialized();
    tensorflowService = diContainer.tensorflowService;
    incrementalLearningService = diContainer.incrementalLearningService;
    modelRegistryService = diContainer.modelRegistryService;
    servicesInitialized = true;
    logger.info("AI queue services initialized");
  }
}

// Worker to process AI training jobs with enhanced orchestration
const worker = new Worker(
  "ai-training",
  async (job) => {
    // Ensure services are initialized
    await initializeServices();

    logger.info(`Processing AI training job ${job.id}`, { name: job.name });

    try {
      if (job.name === "train-model") {
        const { modelId, data } = job.data as {
          modelId: string;
          data: CreateAIModelData;
        };

        // Train model with enhanced features
        await tensorflowService.trainModelWithTensorFlow(modelId, data);

        // Register initial version in model registry
        const model = await AIModel.findById(modelId);
        if (model) {
          await modelRegistryService.registerVersion(
            modelId,
            model.version || "1.0.0",
            model.performance || {},
            {
              modelType: data.type,
              dataSize: model.trainingData?.recordCount || 0,
              epochs: model.trainingData?.epochs || 10,
            }
          );

          // Setup incremental learning if enabled
          if (data.incrementalLearning) {
            logger.info(`Setting up incremental learning for model ${modelId}`);
          }
        }
      } else if (job.name === "feedback-retrain") {
        const { predictionId } = job.data as { predictionId: string };
        const prediction = await Prediction.findById(predictionId);
        if (!prediction) {
          logger.warn(
            `Prediction ${predictionId} not found for feedback retrain`
          );
          return;
        }

        const model = await AIModel.findById(prediction.modelId);
        if (!model) {
          logger.warn(
            `Model ${prediction.modelId} not found for feedback retrain`
          );
          return;
        }

        // Use incremental learning service for feedback updates
        const sample = {
          ...prediction.input,
          [model.configuration.target || "output"]:
            prediction.feedback?.actualValue,
        };

        await incrementalLearningService.addSamples(
          (model._id as mongoose.Types.ObjectId).toString(),
          [sample],
          {
            updateFrequency: 10, // Update after 10 feedback samples
            learningRate: 0.0001,
            epochs: 1,
            validationSplit: 0.2,
          }
        );
      } else if (job.name === "incremental-update") {
        const { modelId } = job.data as { modelId: string };

        // Force incremental update
        const result = await incrementalLearningService.forceUpdate(modelId);

        if (result) {
          logger.info(`Incremental update completed for model ${modelId}`, {
            loss: result.loss,
            metrics: result.metrics,
          });

          // Update model registry with new metrics
          const model = await AIModel.findById(modelId);
          if (model && result.metrics) {
            await modelRegistryService.registerVersion(
              modelId,
              model.version || "1.0.0",
              result.metrics,
              {
                modelType: model.type,
                dataSize: model.trainingData?.recordCount || 0,
                epochs: result.epochs || 1,
                isIncremental: true,
              }
            );
          }
        }
      } else if (job.name === "archive-versions") {
        const { modelId, keepCount = 5 } = job.data as {
          modelId: string;
          keepCount?: number;
        };

        // Archive old model versions
        const archivedCount = await modelRegistryService.archiveOldVersions(
          modelId,
          keepCount
        );
        logger.info(
          `Archived ${archivedCount} old versions for model ${modelId}`
        );
      } else {
        logger.warn(`Unknown job type: ${job.name}`);
      }

      logger.info(`Completed AI training job ${job.id}`, { name: job.name });
    } catch (error) {
      logger.error(`AI training job ${job.id} failed:`, error);
      throw error; // Re-throw to mark job as failed
    }
  },
  {
    connection: redisOptions,
    concurrency: 2,
  }
);

worker.on("completed", (job) => {
  logger.info(`AI training job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
  logger.error(`AI training job ${job?.id} failed:`, error);
});

export default worker;
