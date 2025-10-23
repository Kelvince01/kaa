/**
 * Centralized AI Configuration
 * All AI-related configuration values with environment variable support and sensible defaults
 */

export const aiConfig = {
  // Training Configuration
  training: {
    defaultEpochs: Number(process.env.AI_TRAIN_EPOCHS) || 10_000,
    defaultBatchSize: Number(process.env.AI_BATCH_SIZE) || 32,
    defaultLearningRate: Number(process.env.AI_LEARNING_RATE) || 0.001,
    maxTrainingRecords: Number(process.env.AI_TRAIN_LIMIT) || 50_000,
    trainingSeed: Number(process.env.AI_TRAIN_SEED) || 42,
    validationSplit: Number(process.env.AI_VALIDATION_SPLIT) || 0.2,
    testSplit: Number(process.env.AI_TEST_SPLIT) || 0.1,
    earlyStoppingPatience: Number(process.env.AI_EARLY_STOPPING_PATIENCE) || 5,
  },

  // Model Configuration
  model: {
    defaultHiddenUnits: Number(process.env.AI_HIDDEN_UNITS) || 128,
    dropoutRate: Number(process.env.AI_DROPOUT_RATE) || 0.2,
    l2Regularization: Number(process.env.AI_L2_REGULARIZATION) || 0.001,
    activationFunction: process.env.AI_ACTIVATION || "relu",
    optimizer: process.env.AI_OPTIMIZER || "adam",
  },

  // Storage Configuration
  storage: {
    basePath: process.env.AI_MODEL_STORAGE_PATH || ".cache/models",
    provider: process.env.AI_STORAGE_PROVIDER || "local", // local, s3, gcs, azure
    s3: {
      bucket: process.env.AI_S3_BUCKET || "ai-models",
      region: process.env.AI_S3_REGION || "us-east-1",
      accessKeyId: process.env.AI_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AI_S3_SECRET_ACCESS_KEY,
    },
    gcs: {
      bucket: process.env.AI_GCS_BUCKET || "ai-models",
      projectId: process.env.AI_GCS_PROJECT_ID,
      keyFilePath: process.env.AI_GCS_KEY_FILE,
    },
    azure: {
      container: process.env.AI_AZURE_CONTAINER || "ai-models",
      accountName: process.env.AI_AZURE_ACCOUNT_NAME,
      accountKey: process.env.AI_AZURE_ACCOUNT_KEY,
    },
  },

  // Embedding Configuration
  embedding: {
    cacheEnabled: process.env.AI_EMBEDDING_CACHE_ENABLED !== "false",
    cacheMaxSize: Number(process.env.AI_EMBEDDING_CACHE_SIZE) || 1000,
    cacheTTL: Number(process.env.AI_EMBEDDING_CACHE_TTL) || 86_400, // 24 hours
    persistToDisk: process.env.AI_EMBEDDING_PERSIST === "true",
    persistPath: process.env.AI_EMBEDDING_PERSIST_PATH || ".cache/embeddings",
    dimension: Number(process.env.AI_EMBEDDING_DIMENSION) || 512, // USE default
  },

  // Incremental Learning Configuration
  incrementalLearning: {
    enabled: process.env.AI_INCREMENTAL_LEARNING !== "false",
    minBatchSize: Number(process.env.AI_INCREMENTAL_MIN_BATCH) || 10,
    maxBatchSize: Number(process.env.AI_INCREMENTAL_MAX_BATCH) || 100,
    updateFrequency: Number(process.env.AI_INCREMENTAL_UPDATE_FREQ) || 50,
    learningRateDecay: Number(process.env.AI_INCREMENTAL_LR_DECAY) || 0.95,
    maxUpdatesPerDay: Number(process.env.AI_INCREMENTAL_MAX_DAILY) || 10,
  },

  // Model Registry Configuration
  registry: {
    maxVersionsPerModel: Number(process.env.AI_REGISTRY_MAX_VERSIONS) || 10,
    autoArchiveAfterDays: Number(process.env.AI_REGISTRY_ARCHIVE_DAYS) || 30,
    defaultStage: process.env.AI_REGISTRY_DEFAULT_STAGE || "development",
    requireApprovalForProduction:
      process.env.AI_REGISTRY_REQUIRE_APPROVAL === "true",
  },

  // A/B Testing Configuration
  abTesting: {
    defaultTrafficSplit: Number(process.env.AI_AB_DEFAULT_SPLIT) || 50,
    minSampleSize: Number(process.env.AI_AB_MIN_SAMPLES) || 100,
    significanceLevel: Number(process.env.AI_AB_SIGNIFICANCE) || 0.05,
    maxConcurrentTests: Number(process.env.AI_AB_MAX_CONCURRENT) || 5,
  },

  // Feature Transformers Configuration
  transformers: {
    maxCustomTransformers: Number(process.env.AI_TRANSFORMERS_MAX_CUSTOM) || 50,
    enableBuiltIn: process.env.AI_TRANSFORMERS_BUILTIN !== "false",
    cacheTransformedFeatures: process.env.AI_TRANSFORMERS_CACHE === "true",
  },

  // Performance & Limits
  performance: {
    maxPredictionBatchSize: Number(process.env.AI_MAX_PREDICTION_BATCH) || 100,
    predictionTimeoutMs: Number(process.env.AI_PREDICTION_TIMEOUT) || 5000,
    maxConcurrentTraining: Number(process.env.AI_MAX_CONCURRENT_TRAINING) || 2,
    gpuEnabled:
      process.env.USE_GPU === "true" || process.env.TF_BACKEND === "gpu",
  },

  // Rate Limiting
  rateLimiting: {
    predictionsPerMinute: Number(process.env.AI_RATE_LIMIT_PREDICTIONS) || 10,
    trainingsPerHour: Number(process.env.AI_RATE_LIMIT_TRAININGS) || 5,
    modelsPerMember: Number(process.env.AI_RATE_LIMIT_MODELS) || 20,
  },

  // Queue Configuration
  queue: {
    concurrency: Number(process.env.AI_QUEUE_CONCURRENCY) || 2,
    maxRetries: Number(process.env.AI_QUEUE_MAX_RETRIES) || 3,
    retryDelayMs: Number(process.env.AI_QUEUE_RETRY_DELAY) || 5000,
    jobTimeoutMs: Number(process.env.AI_QUEUE_JOB_TIMEOUT) || 600_000, // 10 minutes
  },

  // Monitoring & Logging
  monitoring: {
    logLevel: process.env.AI_LOG_LEVEL || "info",
    metricsEnabled: process.env.AI_METRICS_ENABLED !== "false",
    tracingEnabled: process.env.AI_TRACING_ENABLED === "true",
    alertOnError: process.env.AI_ALERT_ON_ERROR === "true",
    driftDetectionEnabled: process.env.AI_DRIFT_DETECTION_ENABLED !== "false",
    driftThreshold: Number(process.env.AI_DRIFT_THRESHOLD) || 0.1,
    healthCheckInterval: Number(process.env.AI_HEALTH_CHECK_INTERVAL) || 60_000, // 1 minute
    metricsRetentionDays: Number(process.env.AI_METRICS_RETENTION_DAYS) || 30,
  },

  // Data Preparation
  dataPrep: {
    maxCategoricalCardinality: Number(process.env.AI_MAX_CATEGORICAL) || 100,
    minTextLength: Number(process.env.AI_MIN_TEXT_LENGTH) || 3,
    handleMissingValues: process.env.AI_HANDLE_MISSING || "zero", // zero, mean, median, drop
    outlierDetection: process.env.AI_OUTLIER_DETECTION === "true",
    outlierThreshold: Number(process.env.AI_OUTLIER_THRESHOLD) || 3, // standard deviations
  },

  prediction: {
    allowMockPredictions: process.env.AI_ALLOW_MOCK_PREDICTIONS === "true",
  },

  // Enhanced Features Configuration
  modelPool: {
    maxPoolSize: Number(process.env.AI_MODEL_POOL_MAX_SIZE) || 5,
    minPoolSize: Number(process.env.AI_MODEL_POOL_MIN_SIZE) || 1,
    maxIdleTime: Number(process.env.AI_MODEL_POOL_MAX_IDLE_TIME) || 300_000, // 5 minutes
  },

  // Security Configuration
  security: {
    encryptModels: process.env.AI_ENCRYPT_MODELS === "true",
    sanitizeInputs: process.env.AI_SANITIZE_INPUTS !== "false",
    maxInputSize: Number(process.env.AI_MAX_INPUT_SIZE) || 1_048_576, // 1MB
    allowedFileTypes: (
      process.env.AI_ALLOWED_FILE_TYPES || "csv,json,parquet"
    ).split(","),
    adversarialDetection: {
      enabled: process.env.AI_ADVERSARIAL_DETECTION !== "false",
      threshold: Number(process.env.AI_ADVERSARIAL_THRESHOLD) || 0.7,
    },
    dataPrivacy: {
      enableAnonymization: process.env.AI_ENABLE_ANONYMIZATION === "true",
      retentionPeriod: Number(process.env.AI_DATA_RETENTION_DAYS) || 90,
    },
  },

  // Deployment Configuration
  deployment: {
    defaultStrategy: process.env.AI_DEFAULT_DEPLOYMENT_STRATEGY || "immediate",
    healthCheckTimeout: Number(process.env.AI_HEALTH_CHECK_TIMEOUT) || 5000,
    rollbackEnabled: process.env.AI_ROLLBACK_ENABLED !== "false",
    canaryTrafficPercent: Number(process.env.AI_CANARY_TRAFFIC_PERCENT) || 10,
  },

  // AutoML Configuration
  automl: {
    enabled: process.env.AI_AUTOML_ENABLED === "true",
    maxTrials: Number(process.env.AI_AUTOML_MAX_TRIALS) || 50,
    maxTrainingTime: Number(process.env.AI_AUTOML_MAX_TRAINING_TIME) || 120, // minutes
    defaultObjective: process.env.AI_AUTOML_DEFAULT_OBJECTIVE || "accuracy",
  },
} as const;

// Type for the configuration
export type AIConfig = typeof aiConfig;

// Validation function to ensure critical config is present
export function validateAIConfig(): void {
  const errors: string[] = [];

  // Check critical storage config if using cloud providers
  if (
    aiConfig.storage.provider === "s3" &&
    !(aiConfig.storage.s3.accessKeyId && aiConfig.storage.s3.secretAccessKey)
  ) {
    errors.push("S3 credentials not configured");
  }

  if (
    aiConfig.storage.provider === "gcs" &&
    !(aiConfig.storage.gcs.projectId && aiConfig.storage.gcs.keyFilePath)
  ) {
    errors.push("GCS credentials not configured");
  }

  if (
    aiConfig.storage.provider === "azure" &&
    !(aiConfig.storage.azure.accountName && aiConfig.storage.azure.accountKey)
  ) {
    errors.push("Azure Storage credentials not configured");
  }

  if (errors.length > 0) {
    throw new Error(
      `AI Configuration validation failed:\n${errors.join("\n")}`
    );
  }
}

// Helper to get typed config sections
export const getTrainingConfig = () => aiConfig.training;
export const getModelConfig = () => aiConfig.model;
export const getStorageConfig = () => aiConfig.storage;
export const getEmbeddingConfig = () => aiConfig.embedding;
export const getIncrementalConfig = () => aiConfig.incrementalLearning;
export const getRegistryConfig = () => aiConfig.registry;
export const getABTestingConfig = () => aiConfig.abTesting;
export const getPerformanceConfig = () => aiConfig.performance;
export const getRateLimitConfig = () => aiConfig.rateLimiting;
export const getQueueConfig = () => aiConfig.queue;
export const getDataPrepConfig = () => aiConfig.dataPrep;

export default aiConfig;
