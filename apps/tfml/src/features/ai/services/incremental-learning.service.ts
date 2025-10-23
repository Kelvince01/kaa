import fs from "node:fs";
import path from "node:path";
import { logger } from "@kaa/utils";
import * as tf from "@tensorflow/tfjs-node";
import type { Row } from "../providers/training-data.provider";

export type IncrementalLearningConfig = {
  batchSize?: number;
  learningRate?: number;
  epochs?: number;
  validationSplit?: number;
  updateFrequency?: number; // Update model after N samples
  minSamplesForUpdate?: number;
  maxBufferSize?: number;
};

export type IncrementalUpdate = {
  samplesProcessed: number;
  loss: number;
  metrics?: any;
  epochs?: number;
  timestamp: Date;
};

export class IncrementalLearningService {
  private readonly updateBuffers: Map<string, Row[]> = new Map();
  private readonly updateHistory: Map<string, IncrementalUpdate[]> = new Map();
  private readonly isUpdating: Map<string, boolean> = new Map();

  /**
   * Add new samples for incremental learning
   */
  async addSamples(
    modelId: string,
    samples: Row[],
    config: IncrementalLearningConfig = {}
  ): Promise<void> {
    const { updateFrequency = 100, maxBufferSize = 1000 } = config;

    // Get or create buffer for this model
    let buffer = this.updateBuffers.get(modelId) || [];
    buffer = [...buffer, ...samples];

    // Limit buffer size to prevent memory issues
    if (buffer.length > maxBufferSize) {
      buffer = buffer.slice(-maxBufferSize);
    }

    this.updateBuffers.set(modelId, buffer);

    // Check if we should trigger an update
    if (buffer.length >= updateFrequency && !this.isUpdating.get(modelId)) {
      await this.performIncrementalUpdate(modelId, buffer, config);
      this.updateBuffers.set(modelId, []); // Clear buffer after update
    }
  }

  /**
   * Perform incremental model update
   */
  private async performIncrementalUpdate(
    modelId: string,
    samples: Row[],
    config: IncrementalLearningConfig
  ): Promise<IncrementalUpdate> {
    const {
      batchSize = 32,
      learningRate = 0.0001,
      epochs = 1,
      validationSplit = 0.2,
    } = config;

    this.isUpdating.set(modelId, true);

    try {
      logger.info("Starting incremental update", {
        modelId,
        samples: samples.length,
      });

      // Load model and metadata
      const modelPath = this.getModelPath(modelId);
      const model = await tf.loadLayersModel(`file://${modelPath}`);

      // Load preprocessing metadata
      const prepPath = path.join(path.dirname(modelPath), "prep.json");
      const prepMetadata = await this.loadPreprocessingMetadata(prepPath);

      if (!prepMetadata) {
        throw new Error("Preprocessing metadata not found");
      }

      // Prepare data using saved preprocessing pipeline
      const { features, target, modelType } = prepMetadata;

      // Split samples for validation
      const valSize = Math.floor(samples.length * validationSplit);
      const trainSamples = samples.slice(0, -valSize);
      const valSamples = samples.slice(-valSize);

      // Prepare tensors
      const trainData = await this.prepareTensors(trainSamples, prepMetadata);
      const valData =
        valSamples.length > 0
          ? await this.prepareTensors(valSamples, prepMetadata)
          : null;

      // Recompile model with new learning rate for fine-tuning
      model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: this.getLossFunction(modelType),
        metrics: this.getMetrics(modelType),
      });

      // Perform incremental training
      const history = await model.fit(trainData.xs, trainData.ys, {
        epochs,
        batchSize: Math.min(batchSize, trainSamples.length),
        validationData: valData ? [valData.xs, valData.ys] : undefined,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.debug("Incremental learning epoch", {
              modelId,
              epoch: epoch + 1,
              loss: logs?.loss,
              valLoss: logs?.val_loss,
            });
          },
        },
      });

      // Save updated model
      await model.save(`file://${modelPath}`);

      // Clean up tensors
      trainData.xs.dispose();
      trainData.ys.dispose();
      valData?.xs.dispose();
      valData?.ys.dispose();

      // Record update
      const update: IncrementalUpdate = {
        samplesProcessed: samples.length,
        loss: history.history.loss.at(-1) as number,
        metrics: history.history,
        timestamp: new Date(),
      };

      // Store update history
      const history_ = this.updateHistory.get(modelId) || [];
      history_.push(update);
      this.updateHistory.set(modelId, history_);

      logger.info("Incremental update completed", {
        modelId,
        samplesProcessed: samples.length,
        finalLoss: update.loss,
      });

      return update;
    } catch (error) {
      logger.error("Incremental update failed", { modelId, error });
      throw error;
    } finally {
      this.isUpdating.set(modelId, false);
    }
  }

  /**
   * Prepare tensors from samples using preprocessing metadata
   */
  private prepareTensors(
    samples: Row[],
    metadata: any
  ): { xs: tf.Tensor; ys: tf.Tensor } {
    const {
      features,
      target,
      featureTypes,
      categoryMaps,
      normalization,
      modelType,
    } = metadata;

    // Transform features
    const featureVectors = samples.map((sample) => {
      const vec: number[] = [];

      for (const feature of features) {
        const value = sample[feature];
        const fType = featureTypes[feature];

        if (fType === "numeric") {
          vec.push(typeof value === "number" ? value : 0);
        } else if (fType === "boolean") {
          vec.push(value ? 1 : 0);
        } else if (fType === "categorical" && categoryMaps[feature]) {
          // One-hot encoding
          const categories = categoryMaps[feature];
          const idx = categories.indexOf(String(value));
          for (let i = 0; i < categories.length; i++) {
            vec.push(i === idx ? 1 : 0);
          }
        } else {
          // Default fallback
          vec.push(typeof value === "string" ? value.length : 0);
        }
      }

      // Apply normalization
      return vec.map((v, i) => {
        const stats = normalization[i];
        return stats ? (v - stats.mean) / stats.std : v;
      });
    });

    // Transform targets
    const targetValues = samples.map((sample) => {
      const value = sample[target];
      if (modelType === "classification") {
        // Assume numeric class indices for now
        return typeof value === "number" ? value : 0;
      }
      return typeof value === "number" ? value : 0;
    });

    // Create tensors
    const xs = tf.tensor2d(featureVectors);
    let ys: tf.Tensor;

    if (modelType === "classification") {
      // One-hot encode for classification
      const numClasses = metadata.labelDim || Math.max(...targetValues) + 1;
      ys = tf.oneHot(tf.tensor1d(targetValues, "int32"), numClasses);
    } else {
      ys = tf.tensor1d(targetValues);
    }

    return { xs, ys };
  }

  /**
   * Get model path
   */
  private getModelPath(modelId: string): string {
    const modelsRoot =
      process.env.MODEL_DIR || path.resolve(process.cwd(), "models");
    // For simplicity, assume version 1.0.0 - in production, fetch from database
    return path.join(modelsRoot, modelId, "1.0.0", "model.json");
  }

  /**
   * Load preprocessing metadata
   */
  private async loadPreprocessingMetadata(prepPath: string): Promise<any> {
    try {
      const content = await fs.promises.readFile(prepPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      logger.error("Failed to load preprocessing metadata", {
        prepPath,
        error,
      });
      return null;
    }
  }

  /**
   * Get appropriate loss function for model type
   */
  private getLossFunction(modelType: string): string {
    switch (modelType) {
      case "classification":
        return "categoricalCrossentropy";
      case "regression":
        return "meanSquaredError";
      default:
        return "binaryCrossentropy";
    }
  }

  /**
   * Get appropriate metrics for model type
   */
  private getMetrics(modelType: string): string[] {
    switch (modelType) {
      case "classification":
        return ["accuracy"];
      case "regression":
        return ["mae"];
      default:
        return ["accuracy"];
    }
  }

  /**
   * Get update history for a model
   */
  getUpdateHistory(modelId: string): IncrementalUpdate[] {
    return this.updateHistory.get(modelId) || [];
  }

  /**
   * Clear buffer for a model
   */
  clearBuffer(modelId: string): void {
    this.updateBuffers.delete(modelId);
  }

  /**
   * Get buffer size for a model
   */
  getBufferSize(modelId: string): number {
    return this.updateBuffers.get(modelId)?.length || 0;
  }

  /**
   * Force an update with current buffer
   */
  async forceUpdate(
    modelId: string,
    config: IncrementalLearningConfig = {}
  ): Promise<IncrementalUpdate | null> {
    const buffer = this.updateBuffers.get(modelId);
    if (!buffer || buffer.length === 0) {
      logger.warn("No samples in buffer for forced update", { modelId });
      return null;
    }

    const update = await this.performIncrementalUpdate(modelId, buffer, config);
    this.updateBuffers.set(modelId, []); // Clear buffer
    return update;
  }
}

export const incrementalLearningService = new IncrementalLearningService();
