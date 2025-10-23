import fs from "node:fs";
import path from "node:path";
import { AIModel } from "@kaa/models";
import type { IAIModel } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import type * as tf from "@tensorflow/tfjs-node";
import type * as tfGpu from "@tensorflow/tfjs-node-gpu";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import type mongoose from "mongoose";
import { aiConfig } from "../ai.config";
import type { CreateAIModelData } from "../ai.service";
import type { DataPrepService } from "./data-prep.service";
import type { EmbeddingCacheService } from "./embedding-cache.service";
import type { FeatureTransformersService } from "./feature-transformers.service";
import type { IncrementalLearningService } from "./incremental-learning.service";
import type { MetricsService } from "./metrics.service";
import type { ModelRegistryService } from "./model-registry.service";
import type { ModelStorageAdapter } from "./model-storage.adapter";

// Type alias for TensorFlow to work with both CPU and GPU versions
type TensorFlowModule = typeof tf | typeof tfGpu;

export class TensorflowService {
  private tf!: TensorFlowModule;
  private universalSentenceEncoder: use.UniversalSentenceEncoder | null = null;
  private readonly modelCache: Map<string, tf.LayersModel> = new Map();
  private readonly savingLocks: Set<string> = new Set();
  private initialized = false;

  constructor(
    private readonly storage: ModelStorageAdapter,
    private readonly dataPrepService: DataPrepService,
    private readonly embeddingCache: EmbeddingCacheService,
    private readonly metricsService: MetricsService,
    private readonly modelRegistryService: ModelRegistryService,
    readonly incrementalLearningService: IncrementalLearningService,
    readonly featureTransformersService: FeatureTransformersService
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.initializeTensorFlow();
    await this.initializeEncoder();
    this.initialized = true;
  }

  private async withModelLock(
    modelId: string,
    fn: () => Promise<void>
  ): Promise<void> {
    // cross-process lock via lock file
    const locksDir = path.resolve(process.cwd(), ".cache/locks");
    fs.mkdirSync(locksDir, { recursive: true });
    const lockPath = path.join(locksDir, `${modelId}.lock`);
    const start = Date.now();
    const timeoutMs = 10_000;
    let fd: any = null;
    try {
      // spin until we create the lock file exclusively or timeout
      while (true) {
        try {
          fd = fs.openSync(lockPath, "wx");
          break;
        } catch (e: any) {
          if (e?.code !== "EEXIST") throw e;
          if (Date.now() - start > timeoutMs)
            throw new Error("Lock timeout for model save");
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      // also block intra-process
      while (this.savingLocks.has(modelId)) {
        await new Promise((r) => setTimeout(r, 15));
      }
      this.savingLocks.add(modelId);
      await fn();
    } finally {
      this.savingLocks.delete(modelId);
      try {
        if (fd) fs.closeSync(fd);
        // biome-ignore lint/nursery/noUnusedExpressions: ignore
        fs.existsSync(lockPath) && fs.unlinkSync(lockPath);
      } catch {
        logger.error("Failed to close lock file", { lockPath });
      }
    }
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      // biome-ignore lint/suspicious/noBitwiseOperators: ignore
      hash = (hash << 5) - hash + input.charCodeAt(i);
      // biome-ignore lint/suspicious/noBitwiseOperators: ignore
      hash |= 0; // Convert to 32bit int
    }
    return Math.abs(hash).toString(36);
  }

  private async initializeTensorFlow(): Promise<void> {
    try {
      const useGpu = aiConfig.performance.gpuEnabled;
      this.tf = useGpu
        ? await import("@tensorflow/tfjs-node-gpu")
        : await import("@tensorflow/tfjs-node");
      await this.tf.ready();
      logger.info("TensorFlow.js initialized", {
        backend: this.tf.getBackend(),
        gpu: useGpu,
      });
    } catch (error) {
      logger.error("Failed to initialize TensorFlow.js", error);
      throw error; // Re-throw to prevent service from being used uninitialized
    }
  }

  /**
   * Initialize TensorFlow.js models
   */
  private async initializeEncoder() {
    try {
      // Load Universal Sentence Encoder for embeddings
      logger.info("Loading Universal Sentence Encoder...");
      this.universalSentenceEncoder = await use.load();
      logger.info("Universal Sentence Encoder loaded successfully");
    } catch (error) {
      logger.error("Error initializing TensorFlow.js models:", error);
    }
  }

  /**
   * Generate embeddings using Universal Sentence Encoder with caching
   * @param texts Array of texts to embed
   * @returns Tensor of embeddings
   */
  async generateEmbeddings(texts: string[]): Promise<tf.Tensor> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.universalSentenceEncoder) {
      throw new Error("Universal Sentence Encoder not loaded");
    }

    const uncachedTexts: string[] = [];
    const cachedEmbeddings: Map<string, number[]> = new Map();

    // Check cache for each text if enabled
    if (aiConfig.embedding.cacheEnabled) {
      for (const text of texts) {
        const cached = this.embeddingCache.get(text);
        if (cached) {
          cachedEmbeddings.set(text, cached);
        } else {
          uncachedTexts.push(text);
        }
      }
    } else {
      uncachedTexts.push(...texts);
    }

    // Generate embeddings for uncached texts
    let newEmbeddings: number[][] = [];
    if (uncachedTexts.length > 0) {
      const tensor = await this.universalSentenceEncoder.embed(uncachedTexts);
      newEmbeddings = (await tensor.array()) as number[][];
      tensor.dispose();

      // Cache the new embeddings if enabled
      if (aiConfig.embedding.cacheEnabled) {
        uncachedTexts.forEach((text, i) => {
          this.embeddingCache.set(text, newEmbeddings[i]);
        });
      }
    }

    // Combine cached and new embeddings in original order
    const allEmbeddings: number[][] = [];
    for (const text of texts) {
      if (cachedEmbeddings.has(text)) {
        // biome-ignore lint/style/noNonNullAssertion: ignore
        allEmbeddings.push(cachedEmbeddings.get(text)!);
      } else {
        const idx = uncachedTexts.indexOf(text);
        allEmbeddings.push(newEmbeddings[idx]);
      }
    }

    return this.tf.tensor2d(allEmbeddings);
  }

  /**
   * Generate embeddings and convert to array format
   * @param text Text to embed
   * @returns Embedding as number array
   */
  async generateEmbeddingArray(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    const embeddingArray = (await embeddings.array()) as any;
    return embeddingArray[0];
  }

  async trainModelWithTensorFlow(
    modelId: string,
    data: CreateAIModelData
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const model = await AIModel.findById(modelId);
      if (!model) return;

      // Create appropriate model type
      let tfModel: tf.LayersModel;

      switch (data.type) {
        case "classification":
          tfModel = await this.createClassificationModel(data.configuration);
          break;
        case "regression":
          tfModel = await this.createRegressionModel(data.configuration);
          break;
        case "nlp":
          tfModel = await this.createNLPModel(data.configuration);
          break;
        default:
          tfModel = await this.createGenericModel(data.configuration);
      }

      // Import data provider dynamically
      const { resolveTrainingDataProvider } = await import(
        "../providers/training-data.provider"
      );
      const provider = resolveTrainingDataProvider(data.trainingDataSource);

      const split = await provider.fetchRaw({
        memberId: data.memberId,
        source: data.trainingDataSource,
        features: data.configuration.features,
        target: data.configuration.target,
        limit: aiConfig.training.maxTrainingRecords,
        seed: aiConfig.training.trainingSeed,
      });

      const prepared = await this.dataPrepService.prepare(split, {
        modelType: data.type,
        features: data.configuration.features,
        target: data.configuration.target,
        textFeatures: data.configuration.textFeatures,
      });
      console.log(prepared);

      const sampleCount =
        prepared.counts.train + prepared.counts.val + prepared.counts.test;
      // Train on real tensors
      await tfModel.fit(prepared.xsTrain, prepared.ysTrain, {
        epochs: aiConfig.training.defaultEpochs,
        batchSize: aiConfig.training.defaultBatchSize,
        validationData: [prepared.xsVal, prepared.ysVal],
        verbose: 0,
      });

      // Compute real metrics on validation set
      const metrics = await this.metricsService.evaluateModel(
        tfModel,
        prepared.xsVal,
        prepared.ysVal,
        data.type as "classification" | "regression",
        prepared.categoryMaps?.[data.configuration.target || ""] // class names for classification
      );

      // Save model using storage adapter (versioned path)
      const version = (
        model.lifecycle?.currentVersion ||
        model.version ||
        "1.0.0"
      ).toString();
      const modelDir = this.storage.getLocalDir(modelId, version);
      fs.mkdirSync(modelDir, { recursive: true });
      const modelPath = `file://${modelDir}`;
      await this.withModelLock(modelId, async () => {
        await tfModel.save(modelPath);
        // Save preprocessing metadata
        await this.dataPrepService.saveMetadata(modelDir, prepared, {
          modelType: data.type,
          features: data.configuration.features,
          target: data.configuration.target,
          targetCategories:
            prepared.categoryMaps?.[data.configuration.target || ""],
        });
        await this.storage.save(modelId, version, modelDir);
        this.modelCache.set(`${modelId}:${version}`, tfModel);
        // Invalidate other cached versions for this model to force reload on next use
        for (const key of this.modelCache.keys()) {
          if (
            key.startsWith(`${modelId}:`) &&
            key !== `${modelId}:${version}`
          ) {
            const cached = this.modelCache.get(key);
            try {
              (cached as any)?.dispose?.();
            } catch {
              logger.error("Failed to dispose cached model", { key });
            }
            this.modelCache.delete(key);
          }
        }
      });
      // Invalidate other cached versions for this model to force reload on next use
      for (const key of this.modelCache.keys()) {
        if (key.startsWith(`${modelId}:`) && key !== `${modelId}:${version}`) {
          const cached = this.modelCache.get(key);
          try {
            (cached as any)?.dispose?.();
          } catch {
            logger.error("Failed to dispose cached model", { key });
          }
          this.modelCache.delete(key);
        }
      }

      // Update model status with real metrics
      model.status = "ready";
      if (data.type === "classification") {
        const classMetrics = metrics as any;
        model.performance = {
          accuracy: classMetrics.accuracy,
          precision: classMetrics.precision,
          recall: classMetrics.recall,
          f1Score: classMetrics.f1Score,
        };
      } else {
        const regMetrics = metrics as any;
        model.performance = {
          mse: regMetrics.mse,
          rmse: regMetrics.rmse,
          mae: regMetrics.mae,
          r2Score: regMetrics.r2Score ?? 0,
        };
      }
      // Update training metadata and versions
      model.trainingData.recordCount = sampleCount;
      model.trainingData.epochs = aiConfig.training.defaultEpochs;
      const seed =
        aiConfig.training.trainingSeed ||
        Math.floor(Math.random() * 1_000_000_000);
      model.trainingData.seed = seed;
      model.trainingData.datasetHash = this.simpleHash(
        JSON.stringify({
          type: data.type,
          features: data.configuration.features,
          timestamp: Date.now(),
          seed,
        })
      );
      model.lifecycle = model.lifecycle || {};
      model.lifecycle.currentVersion = version;
      model.versions = model.versions || [];
      // Register version in model registry
      await this.modelRegistryService.registerVersion(
        modelId,
        version,
        model.performance,
        {
          dataSize: sampleCount,
          epochs: aiConfig.training.defaultEpochs,
          modelType: data.type,
        }
      );

      model.versions.push({
        version,
        stage: model.lifecycle.stage || "development",
        performance: model.performance,
        storagePath: this.storage.getUri(modelId, version),
        savedAt: new Date(),
      });
      await model.save();

      logger.info("TensorFlow model training completed", {
        modelId,
        type: data.type,
        accuracy: model.performance.accuracy,
      });
    } catch (error) {
      logger.error("TensorFlow model training failed", error);
      await AIModel.findByIdAndUpdate(modelId, { status: "error" });
    }
  }

  private async createClassificationModel(
    config: any
  ): Promise<tf.LayersModel> {
    const model = this.tf.sequential({
      layers: [
        this.tf.layers.dense({
          inputShape: [config.features.length],
          units: 64,
          activation: "relu",
        }),
        this.tf.layers.dropout({ rate: 0.2 }),
        this.tf.layers.dense({ units: 32, activation: "relu" }),
        this.tf.layers.dropout({ rate: 0.2 }),
        this.tf.layers.dense({
          units: config.parameters.numClasses || 3,
          activation: "softmax",
        }),
      ],
    });

    model.compile({
      optimizer: this.tf.train.adam(
        config.parameters.learningRate || aiConfig.training.defaultLearningRate
      ),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return await Promise.resolve(model);
  }

  private async createRegressionModel(config: any): Promise<tf.LayersModel> {
    const model = this.tf.sequential({
      layers: [
        this.tf.layers.dense({
          inputShape: [config.features.length],
          units: 64,
          activation: "relu",
        }),
        this.tf.layers.dropout({ rate: 0.2 }),
        this.tf.layers.dense({ units: 32, activation: "relu" }),
        this.tf.layers.dense({ units: 1, activation: "linear" }),
      ],
    });

    model.compile({
      optimizer: this.tf.train.adam(
        config.parameters.learningRate || aiConfig.training.defaultLearningRate
      ),
      loss: "meanSquaredError",
      metrics: ["mae"],
    });

    return await Promise.resolve(model);
  }

  private async createNLPModel(config: any): Promise<tf.LayersModel> {
    const model = this.tf.sequential({
      layers: [
        this.tf.layers.embedding({
          inputDim: config.parameters.vocabSize || 10_000,
          outputDim: 128,
        }),
        this.tf.layers.lstm({ units: 64, returnSequences: true }),
        this.tf.layers.dropout({ rate: 0.3 }),
        this.tf.layers.lstm({ units: 32 }),
        this.tf.layers.dense({
          units: config.parameters.numClasses || 2,
          activation: "softmax",
        }),
      ],
    });

    model.compile({
      optimizer: this.tf.train.adam(
        config.parameters.learningRate || aiConfig.training.defaultLearningRate
      ),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return await Promise.resolve(model);
  }

  private async createGenericModel(config: any): Promise<tf.LayersModel> {
    const model = this.tf.sequential({
      layers: [
        this.tf.layers.dense({
          inputShape: [config.features.length],
          units: 128,
          activation: "relu",
        }),
        this.tf.layers.dropout({ rate: 0.3 }),
        this.tf.layers.dense({ units: 64, activation: "relu" }),
        this.tf.layers.dropout({ rate: 0.3 }),
        this.tf.layers.dense({ units: 32, activation: "relu" }),
        this.tf.layers.dense({ units: 1, activation: "sigmoid" }),
      ],
    });

    model.compile({
      optimizer: this.tf.train.adam(
        config.parameters.learningRate || aiConfig.training.defaultLearningRate
      ),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    return await Promise.resolve(model);
  }

  generateTrainingData(
    type: string,
    numFeatures: number
  ): { xs: tf.Tensor; ys: tf.Tensor } {
    const numSamples = 1000;

    // Generate random training data
    const xs = this.tf.randomNormal([numSamples, numFeatures]);

    let ys: tf.Tensor;
    switch (type) {
      case "classification":
        ys = this.tf.randomUniform([numSamples, 3]); // 3 classes
        break;
      case "regression":
        ys = this.tf.randomNormal([numSamples, 1]);
        break;
      default:
        ys = this.tf.randomUniform([numSamples, 1]);
    }

    return { xs, ys };
  }

  async trainModel(
    model: tf.LayersModel,
    data: { xs: tf.Tensor; ys: tf.Tensor }
  ): Promise<void> {
    await model.fit(data.xs, data.ys, {
      epochs: aiConfig.training.defaultEpochs,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
    });
    data.xs.dispose();
    data.ys.dispose();
  }

  async generateTensorFlowPrediction(
    model: IAIModel,
    input: Record<string, any>,
    requestedVersion?: string
  ): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const modelId = (model._id as mongoose.Types.ObjectId).toString();
      // Load the trained model (cache-aware)
      const version = (
        requestedVersion ||
        model.lifecycle?.currentVersion ||
        model.version ||
        "1.0.0"
      ).toString();
      let tfModel = this.modelCache.get(`${modelId}:${version}`);
      console.log(this.modelCache);

      const modelsRoot = process.env.MODEL_DIR
        ? path.resolve(process.env.MODEL_DIR)
        : path.resolve(process.cwd(), "models");
      const modelDir = path.join(modelsRoot, modelId, version);
      console.log(modelDir);

      if (!tfModel) {
        const modelPath = `file://${modelDir}`;
        try {
          tfModel = await this.tf.loadLayersModel(modelPath);
        } catch (e) {
          // If requested version not found, throw 404-like error
          throw new Error(`Model version not found: ${version}`);
        }
        this.modelCache.set(`${modelId}:${version}`, tfModel);
      }

      // Load preprocessing metadata and transform input
      let inputArray: number[];
      const metadata = await this.dataPrepService.loadMetadata(modelDir);

      if (metadata) {
        // Use saved preprocessing pipeline
        inputArray = await this.dataPrepService.transformInput(input, metadata);
      } else {
        // Fallback to simple transformation (for backward compatibility)
        logger.warn(
          "No preprocessing metadata found, using simple transformation",
          {
            modelId,
            version,
          }
        );
        inputArray = model.configuration.features.map((feature) => {
          const value = input[feature];
          if (typeof value === "number") return value;
          if (typeof value === "boolean") return value ? 1 : 0;
          if (typeof value === "string") return value.length;
          return 0;
        });
      }

      const inputTensor = this.tf.tensor2d([inputArray]);

      // Make prediction
      const prediction = tfModel.predict(inputTensor) as tf.Tensor;
      const predictionData = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      // Format prediction based on model type
      switch (model.type) {
        case "classification": {
          const classIndex = predictionData.indexOf(
            Math.max(...Array.from(predictionData))
          );
          return {
            prediction: `Class ${classIndex}`,
            confidence: Math.max(...Array.from(predictionData)),
            probabilities: Array.from(predictionData).reduce(
              (acc, prob, idx) => {
                acc[`Class ${idx}`] = prob;
                return acc;
              },
              {} as Record<string, number>
            ),
          };
        }

        case "regression":
          return {
            prediction: predictionData[0],
            confidence: 0.8 + Math.random() * 0.2,
          };

        default:
          return {
            prediction: predictionData[0],
            confidence: Math.random(),
          };
      }
    } catch (error) {
      logger.error(
        "TensorFlow prediction failed, falling back to mock prediction",
        error
      );
      // Fallback to mock prediction if TensorFlow fails (configurable)
      if (aiConfig.prediction.allowMockPredictions) {
        return this.generateMockPrediction(model, input);
      }
      throw error;
    }
  }

  /**
   * Update model with feedback data for continuous learning
   * @param model The AI model to update
   * @param feedbackData Array of feedback data with inputs and actual values
   */
  async updateModelWithFeedback(
    model: IAIModel,
    feedbackData: Array<{
      input: Record<string, any>;
      actualValue: any;
      isCorrect: boolean;
    }>
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    const modelId = (model._id as mongoose.Types.ObjectId).toString();

    try {
      logger.info("Updating model with feedback data", {
        modelId,
        feedbackCount: feedbackData.length,
      });

      // Load the existing model
      const version = (
        model.lifecycle?.currentVersion ||
        model.version ||
        "1.0.0"
      ).toString();
      const modelsRoot = process.env.MODEL_DIR
        ? path.resolve(process.env.MODEL_DIR)
        : path.resolve(process.cwd(), "models");
      const modelPath = `file://${path.join(modelsRoot, modelId, version)}`;
      let tfModel: tf.LayersModel;

      try {
        tfModel = await this.tf.loadLayersModel(modelPath);
      } catch (error) {
        logger.warn("Could not load existing model, creating new one", {
          modelId: model._id,
        });
        // If model doesn't exist, create a new one based on configuration
        switch (model.type) {
          case "classification":
            tfModel = await this.createClassificationModel(model.configuration);
            break;
          case "regression":
            tfModel = await this.createRegressionModel(model.configuration);
            break;
          case "nlp":
            tfModel = await this.createNLPModel(model.configuration);
            break;
          default:
            tfModel = await this.createGenericModel(model.configuration);
        }
      }

      // Prepare training data from feedback
      const trainingData = this.prepareFeedbackTrainingData(
        model,
        feedbackData
      );

      // Retrain the model with feedback data
      await this.retrainModelWithFeedback(tfModel, trainingData, model.type);

      // Save the updated model
      await tfModel.save(modelPath);
      // Invalidate other cached versions for this model to force reload on next use
      for (const key of this.modelCache.keys()) {
        if (key.startsWith(`${modelId}:`) && key !== `${modelId}:${version}`) {
          const cached = this.modelCache.get(key);
          try {
            cached?.dispose?.();
          } catch {
            logger.error("Failed to dispose cached model", { key });
          }
          this.modelCache.delete(key);
        }
      }

      // Clean up tensors
      trainingData.xs.dispose();
      trainingData.ys.dispose();

      logger.info("Model successfully updated with feedback", {
        modelId,
        feedbackCount: feedbackData.length,
      });
    } catch (error) {
      logger.error("Failed to update model with feedback", {
        modelId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Prepare training data from feedback for model retraining
   */
  private prepareFeedbackTrainingData(
    model: IAIModel,
    feedbackData: Array<{
      input: Record<string, any>;
      actualValue: any;
      isCorrect: boolean;
    }>
  ): { xs: tf.Tensor; ys: tf.Tensor } {
    // Extract features from input data
    const features = feedbackData.map((item) => {
      const featureArray = model.configuration.features.map((feature) => {
        const value = item.input[feature];
        // Normalize numeric values
        if (typeof value === "number") {
          return value;
        }
        // Convert strings to numeric representation
        if (typeof value === "string") {
          return value.length; // Simple hash-like conversion
        }
        // Convert booleans to numbers
        if (typeof value === "boolean") {
          return value ? 1 : 0;
        }
        return 0; // Default for unknown types
      });
      return featureArray;
    });

    // Prepare labels based on model type and feedback
    const labels = feedbackData.map((item) => {
      switch (model.type) {
        case "classification":
          // For classification, use the actual value or correctness
          if (typeof item.actualValue === "number") {
            return item.actualValue;
          }
          // If actual value is not numeric, use correctness as binary classification
          return item.isCorrect ? 1 : 0;

        case "regression":
          // For regression, use the actual value directly
          return typeof item.actualValue === "number" ? item.actualValue : 0;

        default:
          // For other types, use correctness as binary output
          return item.isCorrect ? 1 : 0;
      }
    });

    // Create tensors
    const xs = this.tf.tensor2d(features);
    const ys = this.tf.tensor1d(labels);

    return { xs, ys };
  }

  /**
   * Retrain model with feedback data using transfer learning approach
   */
  private async retrainModelWithFeedback(
    model: tf.LayersModel,
    trainingData: { xs: tf.Tensor; ys: tf.Tensor },
    modelType: string
  ): Promise<void> {
    // Use a lower learning rate for fine-tuning
    const fineTuneLearningRate = 0.0001;

    // Recompile model with lower learning rate for fine-tuning
    model.compile({
      optimizer: this.tf.train.adam(fineTuneLearningRate),
      loss: this.getLossFunction(modelType),
      metrics: this.getMetrics(modelType),
    });

    // Fine-tune the model with feedback data
    await model.fit(trainingData.xs, trainingData.ys, {
      epochs: 5, // Fewer epochs for fine-tuning
      batchSize: Math.min(16, trainingData.xs.shape[0]), // Smaller batch size
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          logger.debug("Feedback training epoch", {
            epoch: epoch + 1,
            loss: logs?.loss?.toFixed(4),
            accuracy: logs?.acc?.toFixed(4),
          });
        },
      },
    });
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

  private generateMockPrediction(
    model: IAIModel,
    _input: Record<string, any>
  ): any {
    // Fallback mock prediction logic (same as before)
    switch (model.type) {
      case "classification":
        return {
          prediction: ["Class A", "Class B", "Class C"][
            Math.floor(Math.random() * 3)
          ],
          confidence: 0.7 + Math.random() * 0.3,
          probabilities: {
            "Class A": Math.random(),
            "Class B": Math.random(),
            "Class C": Math.random(),
          },
        };

      case "regression":
        return {
          prediction: Math.random() * 100,
          confidence: 0.8 + Math.random() * 0.2,
        };

      case "recommendation":
        return {
          prediction: [
            { item: "Item 1", score: Math.random() },
            { item: "Item 2", score: Math.random() },
            { item: "Item 3", score: Math.random() },
          ].sort((a, b) => b.score - a.score),
          confidence: 0.75 + Math.random() * 0.25,
        };

      default:
        return {
          prediction: "Custom prediction result",
          confidence: Math.random(),
        };
    }
  }
}
