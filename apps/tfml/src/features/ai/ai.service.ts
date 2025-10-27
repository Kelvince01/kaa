import { AIModel, Prediction, Recommendation } from "@kaa/models";
import type { IAIModel, IPrediction } from "@kaa/models/types";
import { checkPermission } from "@kaa/services/permissions";
import { AppError, NotFoundError } from "@kaa/utils/errors";
import { logger } from "@kaa/utils/logger";
import type { FilterQuery } from "mongoose";
import mongoose from "mongoose";
import prom from "prom-client";
import { aiTrainingQueue } from "./ai.queue";
// Import interfaces
import type {
  AIHealthStatus,
  AIServiceInterface,
  BatchPredictionRequest,
  BatchPredictionResponse,
  CreateModelRequest,
  DriftReport,
  HealthStatus,
  ListOptions,
  ModelMetrics,
  ModelResponse,
  PaginatedResponse,
  PredictionRequest,
  PredictionResponse,
} from "./interfaces/ai-service.interface";
import { AI_PERMISSIONS } from "./permissions";
import {
  getAutoMLService,
  getHyperparameterOptimizer,
} from "./services/automl.service";
import type { DataPrepService } from "./services/data-prep.service";
import { getModelDeploymentService } from "./services/deployment.service";
import { diContainer, ensureInitialized } from "./services/di-container";
import type { EmbeddingCacheService } from "./services/embedding-cache.service";
import type { FeatureTransformersService } from "./services/feature-transformers.service";
import type { IncrementalLearningService } from "./services/incremental-learning.service";
import type { MetricsService } from "./services/metrics.service";
import { getModelMonitoringService } from "./services/model-monitoring.service";
import type {
  ModelRegistryService,
  ModelStage,
} from "./services/model-registry.service";
import type { ModelStorageAdapter } from "./services/model-storage.adapter";
// Import new services
import { getModelPool } from "./services/persistent-model-pool.service";
import { getMLSecurityService } from "./services/security.service";
import type { TensorflowService } from "./services/tensorflow.service";

// Legacy interface for backward compatibility
export interface CreateAIModelData extends CreateModelRequest {}

/**
 * Enhanced AI Service with comprehensive ML capabilities
 */
export class AIService implements AIServiceInterface {
  // Services from DI container
  private tensorflowService!: TensorflowService;
  private dataPrepService!: DataPrepService;
  private embeddingCache!: EmbeddingCacheService;
  private metricsService!: MetricsService;
  private modelRegistryService!: ModelRegistryService;
  private incrementalLearningService!: IncrementalLearningService;
  private featureTransformersService!: FeatureTransformersService;
  private storageAdapter!: ModelStorageAdapter;

  // Enhanced services
  private readonly modelPool = getModelPool();
  private readonly monitoringService = getModelMonitoringService();
  private readonly securityService = getMLSecurityService();
  private readonly deploymentService = getModelDeploymentService();
  private readonly autoMLService = getAutoMLService();
  readonly hyperparameterOptimizer = getHyperparameterOptimizer();

  // Metrics
  private readonly predictionLatency = new prom.Histogram({
    name: "ai_prediction_latency_seconds",
    help: "Latency of AI predictions",
    labelNames: ["model_type"],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  });
  private readonly predictionCounter = new prom.Counter({
    name: "ai_predictions_total",
    help: "Total AI predictions",
    labelNames: ["model_type", "status"],
  });
  private readonly trainingCounter = new prom.Counter({
    name: "ai_training_jobs_total",
    help: "Total AI training jobs enqueued",
    labelNames: ["model_type"],
  });

  private initialized = false;

  /**
   * Initialize the service with dependency injection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure DI container is initialized
    await ensureInitialized();

    // Get services from DI container
    this.tensorflowService = diContainer.tensorflowService;
    this.dataPrepService = diContainer.dataPrepService;
    this.embeddingCache = diContainer.embeddingCache;
    this.metricsService = diContainer.metricsService;
    this.modelRegistryService = diContainer.modelRegistryService;
    this.incrementalLearningService = diContainer.incrementalLearningService;
    this.featureTransformersService = diContainer.featureTransformersService;
    this.storageAdapter = diContainer.storageAdapter;

    this.initialized = true;
    logger.info("AI Service initialized");
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("AIService not initialized. Call initialize() first.");
    }
  }

  private generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  /**
   * List AI models with enhanced filtering and pagination
   */
  async listModels(
    memberId: string,
    options: ListOptions = {}
  ): Promise<PaginatedResponse<IAIModel>> {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const filter: FilterQuery<IAIModel> = {};

    if (memberId) filter.memberId = new mongoose.Types.ObjectId(memberId);

    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortBy]: sortDirection };

    const [items, total] = await Promise.all([
      AIModel.find(filter).sort(sortObj).skip(skip).limit(limit),
      AIModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { total, pages: Math.ceil(total / limit), page, limit },
    };
  }

  /**
   * Create and train a model with all enhancements
   */
  async createModel(data: CreateModelRequest): Promise<ModelResponse> {
    await this.initialize();

    try {
      // Validate and sanitize input data
      const sanitizedData = this.securityService.validateAndSanitize(
        data,
        "model_creation"
      );
      if (sanitizedData.riskScore > 50) {
        logger.warn("High risk model creation attempt", {
          riskScore: sanitizedData.riskScore,
        });
      }

      // Generate unique slug
      const baseSlug = this.generateSlugFromName(data.name);
      let slug = baseSlug;
      let suffix = 1;
      while (
        await AIModel.exists({ memberId: data.memberId || undefined, slug })
      ) {
        slug = `${baseSlug}-${suffix++}`;
      }

      // Create model document
      const model = new AIModel({
        ...data,
        slug,
        version: "1.0.0",
        status: "training",
        trainingData: {
          source: data.trainingDataSource,
          recordCount: 0,
          lastTrained: new Date(),
        },
        lifecycle: {
          stage: "development",
          currentVersion: "1.0.0",
        },
      });

      await model.save();

      const modelId = (model._id as mongoose.Types.ObjectId).toString();

      // Setup security validation rules
      if (data.configuration.features) {
        const validationRules =
          this.securityService.generateValidationRulesFromSchema({
            features: data.configuration.features.map((f) => ({
              name: f,
              type: "numeric",
              required: true,
            })),
          });
        this.securityService.configureValidationRules(modelId, validationRules);
      }

      // Setup feature transformers if provided
      if (data.transformers) {
        this.featureTransformersService.createPipeline(
          modelId,
          data.transformers
        );
      }

      // Setup incremental learning if enabled
      if (data.incrementalLearning) {
        logger.info(`Incremental learning enabled for model ${modelId}`);
      }

      // Register model version in registry
      await this.modelRegistryService.registerVersion(
        modelId,
        "1.0.0",
        {},
        {
          modelType: data.type,
          dataSize: 0,
          epochs: 0,
        }
      );

      // Configure monitoring
      this.monitoringService.configureDriftDetection(modelId, {
        threshold: 0.1,
        windowSize: 1000,
        features: data.configuration.features,
        method: "psi",
      });

      // Start training process via background queue
      await aiTrainingQueue.add("train-model", {
        modelId,
        data,
      });

      this.trainingCounter.labels(data.type).inc();

      logger.info("AI model created", {
        extra: {
          modelId: model._id,
          name: data.name,
          type: data.type,
          transformers: !!data.transformers,
          incrementalLearning: !!data.incrementalLearning,
        },
      });

      return {
        id: modelId,
        model,
        status: "created",
        message: "Model created successfully and training started",
      };
    } catch (error) {
      logger.error("Failed to create AI model", error);
      throw error;
    }
  }

  /**
   * Make prediction with enhanced security and monitoring
   */
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    await this.initialize();

    try {
      const startTime = Date.now();

      // Enhanced security validation
      const sanitizedInput = this.securityService.validateAndSanitize(
        request.input,
        request.modelId
      );
      if (sanitizedInput.riskScore > 70) {
        throw new AppError("Input rejected due to high security risk");
      }

      // Detect adversarial inputs
      const adversarialResult = this.securityService.detectAdversarialInputs(
        request.input,
        request.modelId
      );
      if (
        adversarialResult.isAdversarial &&
        adversarialResult.riskLevel === "high"
      ) {
        throw new AppError("Adversarial input detected");
      }

      // Resolve model and version from A/B test if applicable
      let effectiveModelId = request.modelId;
      let effectiveVersion = request.version;

      if (request.abTestId) {
        const route = this.modelRegistryService.routeABTest(request.abTestId);
        const testConfig = this.modelRegistryService.getABTestResults(
          request.abTestId
        );

        if (testConfig) {
          if (route === "A") {
            [effectiveModelId, effectiveVersion] =
              testConfig.config.modelA.split(":");
          } else {
            [effectiveModelId, effectiveVersion] =
              testConfig.config.modelB.split(":");
          }
        }
      }

      // Load model
      const model = await AIModel.findOne({
        _id: effectiveModelId,
        memberId: request.memberId,
      });

      if (!model) {
        throw new NotFoundError("AI model not found or not accessible");
      }

      if (model.status !== "ready") {
        throw new AppError("Model is not ready for predictions");
      }

      // Apply feature transformers if configured
      let transformedInput = request.input;
      try {
        transformedInput = this.featureTransformersService.applyPipeline(
          effectiveModelId,
          request.input
        );
      } catch (error) {
        // No pipeline configured, use original input
        logger.debug("No feature transformer pipeline found", {
          modelId: effectiveModelId,
        });
      }

      // Use sanitized input from security service
      const finalInput = sanitizedInput.data;

      // Resolve version
      let resolvedVersion = effectiveVersion;
      if (
        !resolvedVersion &&
        request.stage &&
        Array.isArray((model as any).versions)
      ) {
        const versions = ((model as any).versions as any[]).filter(
          (v) => v.stage === request.stage
        );
        if (versions.length > 0) {
          versions.sort(
            (a, b) =>
              new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
          );
          resolvedVersion = versions[0].version;
        }
      }
      if (!resolvedVersion) {
        resolvedVersion =
          model.lifecycle?.currentVersion || model.version || "1.0.0";
      }

      // Generate prediction using TensorFlow service with model pool
      const predictionResult =
        await this.tensorflowService.generateTensorFlowPrediction(
          model,
          finalInput,
          resolvedVersion
        );

      // Create prediction record
      const prediction = new Prediction({
        modelId: model._id,
        memberId: request.memberId,
        userId: request.userId,
        input: finalInput,
        output: predictionResult,
        confidence: predictionResult.confidence || 0,
        modelVersion: resolvedVersion,
        processingTime: Date.now() - startTime,
      });

      await prediction.save();

      // Record A/B test result if applicable
      if (request.abTestId) {
        const route = this.modelRegistryService.routeABTest(request.abTestId);
        this.modelRegistryService.recordABTestResult(request.abTestId, route, {
          confidence: predictionResult.confidence,
          timestamp: new Date(),
        });
      }

      // Track metrics
      const duration = (Date.now() - startTime) / 1000;
      this.predictionLatency.labels(model.type).observe(duration);
      this.predictionCounter.labels(model.type, "success").inc();

      logger.info("Prediction made successfully", {
        extra: {
          modelId: model._id,
          predictionId: prediction._id,
          processingTime: prediction.processingTime,
          confidence: predictionResult.confidence,
        },
      });

      const response: PredictionResponse = {
        id: (prediction._id as mongoose.Types.ObjectId).toString(),
        data: predictionResult,
        confidence: predictionResult.confidence,
        modelVersion: resolvedVersion,
        processingTime: prediction.processingTime,
        metadata: {
          securityRiskScore: sanitizedInput.riskScore,
          adversarialDetection: adversarialResult,
          sanitizationActions: sanitizedInput.sanitizationLog.length,
        },
      };

      return response;
    } catch (error) {
      this.predictionCounter.labels("unknown", "error").inc();
      logger.error("Prediction failed", error);
      throw error;
    }
  }

  /**
   * Submit feedback and trigger incremental learning
   */
  async submitFeedback(
    predictionId: string,
    feedback: {
      actualValue: any;
      isCorrect: boolean;
      feedback?: string;
      providedBy: string;
    },
    triggerIncremental = true
  ): Promise<void> {
    await this.initialize();

    try {
      // Update prediction with feedback
      const prediction = await Prediction.findByIdAndUpdate(
        predictionId,
        {
          "feedback.actualValue": feedback.actualValue,
          "feedback.isCorrect": feedback.isCorrect,
          "feedback.comments": feedback.feedback,
          "feedback.providedAt": new Date(),
          "feedback.providedBy": feedback.providedBy,
        },
        { new: true }
      );

      if (!prediction) {
        throw new NotFoundError("Prediction not found");
      }

      // Update model feedback array
      const model = await AIModel.findByIdAndUpdate(
        prediction.modelId,
        {
          $push: {
            feedback: {
              predictionId: prediction._id,
              input: prediction.input,
              expectedOutput: feedback.actualValue,
              actualOutput: prediction.output,
              isCorrect: feedback.isCorrect,
              timestamp: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!model) {
        throw new NotFoundError("Model not found");
      }

      // Trigger incremental learning if enabled
      if (triggerIncremental && model.configuration.incrementalLearning) {
        const sample = {
          ...prediction.input,
          [model.configuration.target as string]: feedback.actualValue,
        };

        await this.incrementalLearningService.addSamples(
          (model._id as mongoose.Types.ObjectId).toString(),
          [sample],
          {
            updateFrequency: 50,
            learningRate: 0.0001,
            epochs: 1,
          }
        );
      }

      logger.info("Feedback submitted", {
        extra: {
          predictionId,
          modelId: prediction.modelId,
          isCorrect: feedback.isCorrect,
          incrementalLearning: triggerIncremental,
        },
      });
    } catch (error) {
      logger.error("Failed to submit feedback", error);
      throw error;
    }
  }

  /**
   * Promote model through stages
   */
  async promoteModel(
    modelId: string,
    version: string,
    toStage: ModelStage
  ): Promise<void> {
    await this.initialize();

    try {
      await this.modelRegistryService.promoteModel(modelId, version, toStage);

      // Update model in database
      await AIModel.findByIdAndUpdate(modelId, {
        "lifecycle.stage": toStage,
        "lifecycle.currentVersion": version,
      });

      logger.info("Model promoted", { modelId, version, toStage });
    } catch (error) {
      logger.error("Failed to promote model", {
        modelId,
        version,
        toStage,
        error,
      });
      throw error;
    }
  }

  /**
   * Start A/B test
   */
  startABTest(
    testId: string,
    modelA: string,
    modelB: string,
    trafficSplit = 50,
    minSamples = 100
  ): void {
    this.ensureInitialized();

    this.modelRegistryService.startABTest(testId, {
      modelA,
      modelB,
      trafficSplit,
      minSamples,
    });

    logger.info("A/B test started", {
      testId,
      modelA,
      modelB,
      trafficSplit,
    });
  }

  /**
   * Get A/B test results
   */
  getABTestResults(testId: string): any {
    this.ensureInitialized();
    return this.modelRegistryService.getABTestResults(testId);
  }

  /**
   * Stop A/B test
   */
  stopABTest(testId: string): any {
    this.ensureInitialized();

    const results = this.modelRegistryService.stopABTest(testId);

    if (results?.winner) {
      logger.info("A/B test completed", {
        testId,
        winner: results.winner,
        confidence: results.confidence,
      });
    }

    return results;
  }

  /**
   * Calculate feature importance
   */
  async calculateFeatureImportance(
    modelId: string,
    sampleData?: Record<string, any>[],
    memberId?: string
  ): Promise<Record<string, number>> {
    await this.initialize();

    try {
      const model = await AIModel.findById(modelId);
      if (!model) throw new Error("Model not found");

      const testData = sampleData || [];

      if (testData.length === 0) {
        logger.warn("No test data provided for feature importance calculation");
        return {};
      }

      const importance =
        await this.featureTransformersService.calculateFeatureImportance(
          modelId,
          async (features) => {
            const prediction = await this.makePrediction({
              modelId,
              input: features,
              memberId: memberId || model.memberId?.toString() || "",
            });
            return prediction.data.confidence || 0;
          },
          testData,
          model.type === "classification" ? "higher" : "lower"
        );

      return importance;
    } catch (error) {
      logger.error("Failed to calculate feature importance", {
        modelId,
        error,
      });
      throw error;
    }
  }

  /**
   * Warm up embedding cache
   */
  async warmUpEmbeddingCache(texts: string[]): Promise<void> {
    await this.initialize();

    await this.embeddingCache.warmUp(
      texts,
      async (text) => await this.tensorflowService.generateEmbeddingArray(text)
    );

    const stats = this.embeddingCache.getStats();
    logger.info("Embedding cache warmed up", stats);
  }

  /**
   * Get cache statistics
   */
  getEmbeddingCacheStats(): any {
    this.ensureInitialized();
    return this.embeddingCache.getStats();
  }

  /**
   * Force incremental update
   */
  async forceIncrementalUpdate(modelId: string): Promise<any> {
    await this.initialize();
    return await this.incrementalLearningService.forceUpdate(modelId);
  }

  /**
   * Get incremental learning history
   */
  getIncrementalHistory(modelId: string): any[] {
    this.ensureInitialized();
    return this.incrementalLearningService.getUpdateHistory(modelId);
  }

  /**
   * Archive old model versions
   */
  async archiveOldVersions(modelId: string, keepCount = 5): Promise<number> {
    await this.initialize();
    return await this.modelRegistryService.archiveOldVersions(
      modelId,
      keepCount
    );
  }

  /**
   * Get best performing version
   */
  async getBestVersion(modelId: string, metric = "accuracy"): Promise<any> {
    await this.initialize();
    return await this.modelRegistryService.getBestVersion(modelId, metric);
  }

  /**
   * List all available transformers
   */
  listTransformers(): any[] {
    this.ensureInitialized();
    return this.featureTransformersService.listTransformers();
  }

  /**
   * Register custom transformer
   */
  registerCustomTransformer(
    name: string,
    description: string,
    transformCode: string,
    inputType: "numeric" | "string" | "boolean" | "date" | "any" = "any",
    outputDimension: number | "variable" = 1
  ): void {
    this.ensureInitialized();

    this.featureTransformersService.createCustomTransformer(
      name,
      description,
      transformCode,
      inputType,
      outputDimension
    );

    logger.info("Custom transformer registered", { name });
  }

  /**
   * Batch prediction with enhanced security and monitoring
   */
  async batchPredict(
    request: BatchPredictionRequest
  ): Promise<BatchPredictionResponse> {
    await this.initialize();

    const startTime = Date.now();
    const predictions: PredictionResponse[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    try {
      // Validate batch size
      if (request.inputs.length > 100) {
        throw new AppError("Batch size exceeds maximum limit of 100");
      }

      // Process each input
      for (let i = 0; i < request.inputs.length; i++) {
        try {
          const predictionRequest: PredictionRequest = {
            modelId: request.modelId,
            input: request.inputs[i],
            memberId: request.memberId,
            userId: request.userId,
            version: request.version,
            stage: request.stage,
          };

          const prediction = await this.predict(predictionRequest);
          predictions.push(prediction);
        } catch (error) {
          errors.push({
            index: i,
            error: (error as Error).message,
          });
        }
      }

      const totalProcessingTime = Date.now() - startTime;

      logger.info("Batch prediction completed", {
        modelId: request.modelId,
        totalInputs: request.inputs.length,
        successCount: predictions.length,
        errorCount: errors.length,
        totalProcessingTime,
      });

      return {
        predictions,
        totalProcessingTime,
        successCount: predictions.length,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error("Batch prediction failed", {
        modelId: request.modelId,
        error,
      });
      throw error;
    }
  }

  /**
   * Stream predictions for real-time use cases
   */
  async *streamPredict(
    request: PredictionRequest
  ): AsyncGenerator<PredictionResponse> {
    await this.initialize();

    // For demo purposes, yield a single prediction
    // In production, this would handle streaming data
    const prediction = await this.predict(request);
    yield prediction;
  }

  /**
   * Rollback model to previous version
   */
  async rollbackModel(modelId: string, targetVersion: string): Promise<void> {
    await this.initialize();

    try {
      await this.deploymentService.rollback(modelId, targetVersion);

      // Update model status
      await AIModel.findByIdAndUpdate(modelId, {
        "lifecycle.currentVersion": targetVersion,
        "lifecycle.lastUpdated": new Date(),
      });

      logger.info("Model rolled back successfully", { modelId, targetVersion });
    } catch (error) {
      logger.error("Model rollback failed", { modelId, targetVersion, error });
      throw error;
    }
  }

  /**
   * Archive model
   */
  async archiveModel(modelId: string): Promise<void> {
    await this.initialize();

    try {
      await AIModel.findByIdAndUpdate(modelId, {
        status: "archived",
        "lifecycle.stage": "archived",
        "lifecycle.lastUpdated": new Date(),
      });

      logger.info("Model archived successfully", { modelId });
    } catch (error) {
      logger.error("Model archival failed", { modelId, error });
      throw error;
    }
  }

  /**
   * Trigger incremental learning
   */
  async triggerIncrementalLearning(modelId: string): Promise<void> {
    await this.initialize();

    try {
      await this.incrementalLearningService.forceUpdate(modelId);
      logger.info("Incremental learning triggered", { modelId });
    } catch (error) {
      logger.error("Incremental learning failed", { modelId, error });
      throw error;
    }
  }

  /**
   * Get model metrics with enhanced monitoring
   */
  async getModelMetrics(modelId: string): Promise<ModelMetrics> {
    await this.initialize();

    try {
      // Get recent predictions for metrics calculation
      const recentPredictions = await Prediction.find({ modelId })
        .sort({ createdAt: -1 })
        .limit(1000);

      const metrics =
        await this.monitoringService.trackPredictionQuality(recentPredictions);

      logger.debug("Model metrics retrieved", {
        modelId,
        predictionCount: recentPredictions.length,
      });

      return metrics;
    } catch (error) {
      logger.error("Failed to get model metrics", { modelId, error });
      throw error;
    }
  }

  /**
   * Get model health status
   */
  async getModelHealth(modelId: string): Promise<HealthStatus> {
    await this.initialize();

    try {
      const health = await this.monitoringService.getModelHealth(modelId);
      logger.debug("Model health checked", { modelId, status: health.status });
      return health;
    } catch (error) {
      logger.error("Failed to get model health", { modelId, error });
      throw error;
    }
  }

  /**
   * Detect model drift
   */
  async detectModelDrift(modelId: string): Promise<DriftReport> {
    await this.initialize();

    try {
      // Get recent prediction inputs for drift detection
      const recentPredictions = await Prediction.find({ modelId })
        .sort({ createdAt: -1 })
        .limit(1000);

      const recentInputs = recentPredictions.map((p) => p.input);
      const driftReport = await this.monitoringService.detectDrift(
        modelId,
        recentInputs
      );

      logger.info("Model drift detection completed", {
        modelId,
        isDrifting: driftReport.isDrifting,
        driftScore: driftReport.driftScore,
      });

      return driftReport;
    } catch (error) {
      logger.error("Failed to detect model drift", { modelId, error });
      throw error;
    }
  }

  /**
   * Deploy model with advanced strategies
   */
  async deployModel(
    modelId: string,
    version: string,
    stage: "development" | "staging" | "production" | "archived",
    strategy: "blue_green" | "canary" | "rolling" | "immediate" = "immediate"
  ): Promise<string> {
    await this.initialize();

    try {
      const deploymentConfig = {
        strategy,
        healthChecks: [
          {
            type: "custom" as const,
            timeout: 5000,
            interval: 30_000,
            retries: 3,
            successThreshold: 2,
            failureThreshold: 3,
          },
        ],
        rollback: {
          enabled: true,
          autoRollback: strategy !== "immediate",
          triggers: [
            {
              metric: "error_rate",
              threshold: 0.05,
              duration: 300,
              operator: "gt" as const,
            },
          ],
          maxRollbackAttempts: 3,
        },
        monitoring: {
          metricsEnabled: true,
          alerting: {
            enabled: true,
            channels: ["email" as const],
            thresholds: {
              errorRate: 0.05,
              latency: 1000,
              throughput: 10,
            },
          },
          logging: {
            level: "info" as const,
            structured: true,
            retention: 30,
          },
        },
        resources: {
          cpu: { request: "100m", limit: "500m" },
          memory: { request: "256Mi", limit: "1Gi" },
          replicas: { min: 1, max: 3, target: 1 },
        },
      };

      const deploymentId = await this.deploymentService.deployModel(
        modelId,
        version,
        stage,
        deploymentConfig
      );

      logger.info("Model deployment started", {
        modelId,
        version,
        stage,
        strategy,
        deploymentId,
      });

      return deploymentId;
    } catch (error) {
      logger.error("Model deployment failed", {
        modelId,
        version,
        stage,
        strategy,
        error,
      });
      throw error;
    }
  }

  /**
   * Auto-train model using AutoML
   */
  async autoTrainModel(
    dataset: any,
    task:
      | "classification"
      | "regression"
      | "clustering"
      | "time_series"
      | "nlp",
    constraints: {
      maxTrainingTime: number;
      maxTrials: number;
      earlyStoppingPatience: number;
      validationSplit: number;
    }
  ): Promise<any> {
    await this.initialize();

    try {
      const bestModel = await this.autoMLService.autoTrain(dataset, task, {
        ...constraints,
        resourceLimits: {
          maxMemoryMB: 2048,
          maxCpuCores: 4,
        },
      });

      logger.info("AutoML training completed", {
        task,
        finalScore: bestModel.params.score,
        totalTrials: bestModel.params.trialHistory.length,
      });

      return bestModel;
    } catch (error) {
      logger.error("AutoML training failed", { task, error });
      throw error;
    }
  }

  /**
   * Get comprehensive service statistics
   */
  getServiceStats(): any {
    this.ensureInitialized();

    return {
      modelPool: this.modelPool.getPoolStats(),
      monitoring: this.monitoringService.getMonitoringStats(),
      security: this.securityService.getSecurityStats(),
      deployment: this.deploymentService.getDeploymentStats(),
      embeddingCache: this.embeddingCache.getStats(),
      incremental: this.incrementalLearningService.getUpdateHistory("all"),
    };
  }

  /**
   * Evaluate model on test data
   */
  async evaluateModel(
    modelId: string,
    testData: { features: Record<string, any>[]; labels: any[] },
    version?: string
  ): Promise<any> {
    await this.initialize();

    try {
      const model = await AIModel.findById(modelId);
      if (!model) throw new Error("Model not found");

      // Load TensorFlow model
      const modelVersion =
        version || model.lifecycle?.currentVersion || "1.0.0";
      const tfModel: any = await this.storageAdapter.fetch(
        modelId,
        modelVersion
      );

      // Prepare test tensors using data prep service
      const tf = await import("@tensorflow/tfjs-node");
      const xTest = tf.tensor2d(
        testData.features.map((f) =>
          model.configuration.features.map((feat) => f[feat] || 0)
        )
      );

      const yTest =
        model.type === "classification"
          ? tf.oneHot(
              tf.tensor1d(testData.labels, "int32"),
              model.configuration.parameters.numClasses || 2
            )
          : tf.tensor1d(testData.labels);

      // Evaluate
      const metrics = await this.metricsService.evaluateModel(
        tfModel,
        xTest,
        yTest,
        model.type as "classification" | "regression"
      );

      // Clean up
      xTest.dispose();
      yTest.dispose();

      return metrics;
    } catch (error) {
      logger.error("Failed to evaluate model", { modelId, error });
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async makePrediction(request: PredictionRequest): Promise<any> {
    const response = await this.predict(request);
    return {
      id: response.id,
      data: response.data,
      confidence: response.confidence,
      modelVersion: response.modelVersion,
      processingTime: response.processingTime,
    };
  }

  /**
   * Update model with enhanced validation
   */
  async updateModel(
    modelId: string,
    updates: Partial<IAIModel>
  ): Promise<IAIModel> {
    await this.initialize();

    try {
      // Validate updates
      if (updates.configuration?.features) {
        const validationRules =
          this.securityService.generateValidationRulesFromSchema({
            features: updates.configuration.features.map((f) => ({
              name: f,
              type: "numeric",
              required: true,
            })),
          });
        this.securityService.configureValidationRules(modelId, validationRules);
      }

      const model = await AIModel.findByIdAndUpdate(
        modelId,
        { $set: updates },
        { new: true }
      );

      if (!model) {
        throw new NotFoundError("Model not found");
      }

      logger.info("Model updated", { modelId, updates: Object.keys(updates) });
      return model;
    } catch (error) {
      logger.error("Failed to update model", { modelId, error });
      throw error;
    }
  }

  /**
   * Update model training data
   */
  async updateModelTrainingData(
    modelId: string,
    trainingData: Partial<IAIModel["trainingData"]>
  ): Promise<IAIModel> {
    const model = await AIModel.findByIdAndUpdate(
      modelId,
      { $set: { trainingData } },
      { new: true }
    );

    if (!model) {
      throw new NotFoundError("Model not found");
    }

    return model;
  }

  /**
   * Get model by ID
   */
  async getModel(modelId: string, memberId?: string): Promise<IAIModel> {
    const filter: FilterQuery<IAIModel> = { _id: modelId };
    if (memberId) filter.memberId = memberId;

    const model = await AIModel.findOne(filter);

    if (!model) {
      throw new NotFoundError("Model not found");
    }

    return model;
  }

  /**
   * Delete model
   */
  async deleteModel(
    modelId: string,
    memberId: string,
    userId: string
  ): Promise<void> {
    // Check permissions
    const hasPermission = await checkPermission({
      userId,
      memberId,
      permission: AI_PERMISSIONS.DELETE_MODEL,
    });

    if (!hasPermission) {
      throw new AppError("Insufficient permissions to delete AI models");
    }

    const model = await AIModel.findOneAndDelete({ _id: modelId, memberId });

    if (!model) {
      throw new NotFoundError("Model not found");
    }

    // Clean up associated data
    await Prediction.deleteMany({ modelId });
    await Recommendation.deleteMany({ modelId });

    logger.info("Model deleted", { modelId, memberId });
  }

  /**
   * Get model predictions history
   */
  async getModelPredictions(
    modelId: string,
    memberId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    items: IPrediction[];
    pagination: { total: number; pages: number; page: number; limit: number };
  }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const filter = { modelId, memberId };

    const [items, total] = await Promise.all([
      Prediction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Prediction.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { total, pages: Math.ceil(total / limit), page, limit },
    };
  }

  /**
   * Get overall AI service health status
   */
  async getHealthStatus(): Promise<AIHealthStatus> {
    await this.initialize();

    try {
      // Check services
      const databaseHealthy = mongoose.connection.readyState === 1;
      const redisHealthy = true; // Assume healthy; implement redis ping if available
      const tensorflowHealthy = true; // Assume healthy; add tfjs check if needed
      const queuesHealthy = true; // Assume healthy; check aiTrainingQueue if possible

      // Count models by status
      const [totalModels, readyModels, trainingModels, errorModels] =
        await Promise.all([
          AIModel.countDocuments({}),
          AIModel.countDocuments({ status: "ready" }),
          AIModel.countDocuments({ status: "training" }),
          AIModel.countDocuments({ status: { $in: ["error", "failed"] } }), // Assuming error statuses
        ]);

      // Get recent predictions for performance metrics (last 1000)
      const recentPredictions = await Prediction.find({})
        .sort({ createdAt: -1 })
        .limit(1000)
        .select("processingTime confidence");

      const totalPredictions = await Prediction.countDocuments({});
      const avgResponseTime =
        recentPredictions.length > 0
          ? recentPredictions.reduce(
              (sum, p) => sum + (p.processingTime || 0),
              0
            ) / recentPredictions.length
          : 0;

      const lowConfidenceCount = recentPredictions.filter(
        (p) => (p.output.confidence || 0) < 0.5
      ).length;
      const errorRate =
        totalPredictions > 0
          ? (lowConfidenceCount / totalPredictions) * 100
          : 0;

      const healthStatus: AIHealthStatus = {
        status:
          databaseHealthy && redisHealthy && tensorflowHealthy && queuesHealthy
            ? errorRate < 5
              ? "healthy"
              : "degraded"
            : "unhealthy",
        services: {
          database: databaseHealthy,
          redis: redisHealthy,
          tensorflow: tensorflowHealthy,
          queues: queuesHealthy,
        },
        models: {
          total: totalModels,
          ready: readyModels,
          training: trainingModels,
          error: errorModels,
        },
        performance: {
          avgResponseTime: Math.round(avgResponseTime),
          totalPredictions,
          errorRate: Math.round(errorRate * 100) / 100,
        },
      };

      logger.debug("AI service health status retrieved", {
        status: healthStatus.status,
        totalModels,
        totalPredictions,
      });

      return healthStatus;
    } catch (error) {
      logger.error("Failed to get AI service health status", { error });
      throw error;
    }
  }
}

// Export singleton instance
let aiServiceInstance: AIService | null = null;

export async function getAIService(): Promise<AIService> {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
    await aiServiceInstance.initialize();
  }
  return aiServiceInstance;
}

// For backward compatibility
export const aiService = {
  async createModel(
    data: CreateAIModelData,
    userId: string
  ): Promise<IAIModel> {
    const service = await getAIService();
    const response = await service.createModel({ ...data, createdBy: userId });
    return response.model;
  },

  async makePrediction(request: PredictionRequest): Promise<any> {
    const service = await getAIService();
    return service.makePrediction(request);
  },

  async listModels(
    memberId: string,
    options?: { page?: number; limit?: number; status?: string }
  ): Promise<any> {
    const service = await getAIService();
    return service.listModels(memberId, options);
  },

  async getModel(modelId: string, memberId?: string): Promise<IAIModel> {
    const service = await getAIService();
    return service.getModel(modelId, memberId);
  },

  async deleteModel(
    modelId: string,
    memberId: string,
    userId: string
  ): Promise<void> {
    const service = await getAIService();
    return service.deleteModel(modelId, memberId, userId);
  },

  async provideFeedback(
    predictionId: string,
    feedback: {
      actualValue: any;
      isCorrect: boolean;
      feedback?: string;
      providedBy: string;
    }
  ): Promise<void> {
    const service = await getAIService();
    return service.submitFeedback(predictionId, feedback, true);
  },
};
