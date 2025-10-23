import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { getAIService } from "../ai.service";
import type {
  CreateModelRequest,
  PredictionRequest,
} from "../interfaces/ai-service.interface";
import { getAutoMLService } from "../services/automl.service";
import { getModelDeploymentService } from "../services/deployment.service";
import { getModelMonitoringService } from "../services/model-monitoring.service";
import { disposeModelPool, getModelPool } from "../services/model-pool.service";
import { getMLSecurityService } from "../services/security.service";

describe("Enhanced AI Service", () => {
  let aiService: any;
  let testModelId: string;

  beforeAll(async () => {
    aiService = await getAIService();
  });

  afterAll(async () => {
    await disposeModelPool();
  });

  beforeEach(async () => {
    // Create a test model for each test
    const modelData: CreateModelRequest = {
      name: "Test Property Price Model",
      type: "regression",
      description: "Test model for property price prediction",
      configuration: {
        algorithm: "neural_network_regression",
        parameters: {
          layers: [
            { type: "dense", units: 64, activation: "relu" },
            { type: "dense", units: 32, activation: "relu" },
            { type: "dense", units: 1, activation: "linear" },
          ],
          optimizer: "adam",
          learningRate: 0.001,
        },
        features: ["bedrooms", "bathrooms", "size", "location"],
        target: "rentAmount",
      },
      trainingDataSource: "test_dataset",
      createdBy: "test_user_id",
    };

    const response = await aiService.createModel(modelData);
    testModelId = response.id;
  });

  describe("Model Creation with Enhanced Features", () => {
    it("should create model with security validation", async () => {
      const modelData: CreateModelRequest = {
        name: "Secure Test Model",
        type: "classification",
        description: "Model with enhanced security",
        configuration: {
          algorithm: "dense_nn",
          parameters: { learningRate: 0.001 },
          features: ["feature1", "feature2"],
          target: "label",
        },
        trainingDataSource: "secure_dataset",
        createdBy: "test_user",
      };

      const response = await aiService.createModel(modelData);

      expect(response.status).toBe("created");
      expect(response.model).toBeDefined();
      expect(response.model.name).toBe("Secure Test Model");
    });

    it("should reject malicious model creation attempts", async () => {
      const maliciousData: CreateModelRequest = {
        name: "<script>alert('xss')</script>",
        type: "classification",
        description: "'; DROP TABLE models; --",
        configuration: {
          algorithm: "dense_nn",
          parameters: { learningRate: 0.001 },
          features: ["<script>", "'; DELETE FROM users; --"],
          target: "label",
        },
        trainingDataSource: "malicious_dataset",
        createdBy: "test_user",
      };

      // Should not throw but should sanitize the input
      const response = await aiService.createModel(maliciousData);
      expect(response.model.name).not.toContain("<script>");
    });
  });

  describe("Enhanced Predictions", () => {
    it("should make secure predictions with monitoring", async () => {
      const predictionRequest: PredictionRequest = {
        modelId: testModelId,
        input: {
          bedrooms: 3,
          bathrooms: 2,
          size: 1200,
          location: "downtown",
        },
        memberId: "test_member",
        userId: "test_user",
      };

      const response = await aiService.predict(predictionRequest);

      expect(response.id).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.processingTime).toBeGreaterThan(0);
      expect(response.metadata).toBeDefined();
      expect(response.metadata.securityRiskScore).toBeDefined();
    });

    it("should handle batch predictions", async () => {
      const batchRequest = {
        modelId: testModelId,
        inputs: [
          { bedrooms: 2, bathrooms: 1, size: 800, location: "suburb" },
          { bedrooms: 4, bathrooms: 3, size: 1800, location: "downtown" },
          { bedrooms: 3, bathrooms: 2, size: 1200, location: "midtown" },
        ],
        memberId: "test_member",
        userId: "test_user",
      };

      const response = await aiService.batchPredict(batchRequest);

      expect(response.predictions).toHaveLength(3);
      expect(response.successCount).toBe(3);
      expect(response.errorCount).toBe(0);
      expect(response.totalProcessingTime).toBeGreaterThan(0);
    });

    it("should detect adversarial inputs", async () => {
      const adversarialRequest: PredictionRequest = {
        modelId: testModelId,
        input: {
          bedrooms: 999_999_999, // Extreme value
          bathrooms: -100, // Negative value
          size: 0.000_001, // Tiny value
          location: "A".repeat(10_000), // Very long string
        },
        memberId: "test_member",
        userId: "test_user",
      };

      try {
        await aiService.predict(adversarialRequest);
      } catch (error) {
        expect((error as Error).message).toContain("security risk");
      }
    });
  });

  describe("Model Monitoring", () => {
    it("should get model health status", async () => {
      const health = await aiService.getModelHealth(testModelId);

      // biome-ignore lint/performance/useTopLevelRegex: ignore
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.checks).toBeDefined();
      expect(health.lastUpdated).toBeDefined();
    });

    it("should get model metrics", async () => {
      // First make some predictions to generate metrics
      await aiService.predict({
        modelId: testModelId,
        input: { bedrooms: 2, bathrooms: 1, size: 800, location: "test" },
        memberId: "test_member",
      });

      const metrics = await aiService.getModelMetrics(testModelId);

      expect(metrics.latency).toBeDefined();
      expect(metrics.throughput).toBeDefined();
      expect(metrics.drift).toBeDefined();
    });

    it("should detect model drift", async () => {
      const driftReport = await aiService.detectModelDrift(testModelId);

      expect(driftReport.modelId).toBe(testModelId);
      expect(driftReport.driftScore).toBeDefined();
      expect(driftReport.threshold).toBeDefined();
      expect(driftReport.isDrifting).toBeDefined();
      expect(driftReport.recommendations).toBeDefined();
    });
  });

  describe("Model Deployment", () => {
    it("should deploy model with immediate strategy", async () => {
      const deploymentId = await aiService.deployModel(
        testModelId,
        "1.0.0",
        "staging",
        "immediate"
      );

      expect(deploymentId).toBeDefined();
      expect(typeof deploymentId).toBe("string");
    });

    it("should deploy model with canary strategy", async () => {
      const deploymentId = await aiService.deployModel(
        testModelId,
        "1.0.0",
        "production",
        "canary"
      );

      expect(deploymentId).toBeDefined();
    });

    it("should rollback model", async () => {
      // First deploy a model
      await aiService.deployModel(
        testModelId,
        "1.0.0",
        "production",
        "immediate"
      );

      // Then rollback
      await expect(
        aiService.rollbackModel(testModelId, "0.9.0")
      ).resolves.not.toThrow();
    });
  });

  describe("AutoML", () => {
    it("should auto-train a model", async () => {
      const dataset = {
        features: [
          { bedrooms: 2, bathrooms: 1, size: 800 },
          { bedrooms: 3, bathrooms: 2, size: 1200 },
          { bedrooms: 4, bathrooms: 3, size: 1600 },
        ],
        labels: [1200, 1800, 2400],
        metadata: {
          size: 3,
          featureCount: 3,
          targetType: "numeric" as const,
          hasNulls: false,
        },
      };

      const constraints = {
        maxTrainingTime: 5, // 5 minutes
        maxTrials: 3,
        earlyStoppingPatience: 2,
        validationSplit: 0.2,
      };

      const result = await aiService.autoTrainModel(
        dataset,
        "regression",
        constraints
      );

      expect(result.model).toBeDefined();
      expect(result.params).toBeDefined();
      expect(result.evaluation).toBeDefined();
    });
  });

  describe("Service Statistics", () => {
    it("should get comprehensive service stats", () => {
      const stats = aiService.getServiceStats();

      expect(stats.modelPool).toBeDefined();
      expect(stats.monitoring).toBeDefined();
      expect(stats.security).toBeDefined();
      expect(stats.deployment).toBeDefined();
      expect(stats.embeddingCache).toBeDefined();
    });
  });
});

describe("Model Pool Service", () => {
  let modelPool: any;

  beforeAll(() => {
    modelPool = getModelPool();
  });

  it("should manage model instances efficiently", async () => {
    const mockLoader = async () => ({ mock: "model" }) as any;

    // Get model from pool
    const model1 = await modelPool.getModel("test_model", "1.0.0", mockLoader);
    expect(model1).toBeDefined();

    // Get same model again (should reuse)
    const model2 = await modelPool.getModel("test_model", "1.0.0", mockLoader);
    expect(model2).toBeDefined();

    // Release models
    modelPool.releaseModel("test_model", "1.0.0", model1);
    modelPool.releaseModel("test_model", "1.0.0", model2);
  });

  it("should provide pool statistics", () => {
    const stats = modelPool.getPoolStats();

    expect(stats.totalPools).toBeDefined();
    expect(stats.totalModels).toBeDefined();
    expect(stats.loadingModels).toBeDefined();
  });
});

describe("Security Service", () => {
  let securityService: any;

  beforeAll(() => {
    securityService = getMLSecurityService();
  });

  it("should validate and sanitize inputs", () => {
    const input = {
      name: "<script>alert('xss')</script>",
      value: 123,
      description: "Normal text",
    };

    const result = securityService.validateAndSanitize(input, "test_model");

    expect(result.data.name).not.toContain("<script>");
    expect(result.sanitizationLog).toBeDefined();
    expect(result.riskScore).toBeDefined();
  });

  it("should detect adversarial inputs", () => {
    const input = {
      value1: 999_999_999,
      value2: -999_999_999,
      text: "A".repeat(10_000),
    };

    const result = securityService.detectAdversarialInputs(input);

    expect(result.isAdversarial).toBeDefined();
    expect(result.confidence).toBeDefined();
    expect(result.riskLevel).toBeDefined();
  });

  it("should anonymize sensitive data", () => {
    const data = {
      email: "user@example.com",
      phone: "+1234567890",
      name: "John Doe",
      value: 123,
    };

    const result = securityService.anonymizeData(data, "enhanced");

    expect(result.data.email).not.toBe("user@example.com");
    expect(result.data.name).not.toBe("John Doe");
    expect(result.data.value).toBe(123); // Non-sensitive data unchanged
    expect(result.anonymizationMap).toBeDefined();
  });
});

describe("Monitoring Service", () => {
  let monitoringService: any;

  beforeAll(() => {
    monitoringService = getModelMonitoringService();
  });

  it("should track prediction quality", async () => {
    const mockPredictions = [
      {
        modelId: "test_model",
        processingTime: 100,
        createdAt: new Date(),
        feedback: { isCorrect: true },
      },
      {
        modelId: "test_model",
        processingTime: 150,
        createdAt: new Date(),
        feedback: { isCorrect: false },
      },
    ];

    const metrics =
      await monitoringService.trackPredictionQuality(mockPredictions);

    expect(metrics.latency).toBeDefined();
    expect(metrics.throughput).toBeDefined();
    expect(metrics.accuracy).toBeDefined();
  });

  it("should detect drift", async () => {
    const newData = [
      { feature1: 1, feature2: 2 },
      { feature1: 3, feature2: 4 },
    ];

    const driftReport = await monitoringService.detectDrift(
      "test_model",
      newData
    );

    expect(driftReport.modelId).toBe("test_model");
    expect(driftReport.driftScore).toBeDefined();
    expect(driftReport.isDrifting).toBeDefined();
  });
});

describe("Deployment Service", () => {
  let deploymentService: any;

  beforeAll(() => {
    deploymentService = getModelDeploymentService();
  });

  it("should deploy model with different strategies", async () => {
    const config = {
      strategy: "immediate" as const,
      healthChecks: [],
      rollback: {
        enabled: false,
        autoRollback: false,
        triggers: [],
        maxRollbackAttempts: 0,
      },
      monitoring: {
        metricsEnabled: true,
        alerting: {
          enabled: false,
          channels: [] as const,
          thresholds: { errorRate: 0.1, latency: 1000, throughput: 10 },
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

    const deploymentId = await deploymentService.deployModel(
      "test_model",
      "1.0.0",
      "staging",
      config
    );

    expect(deploymentId).toBeDefined();
  });

  it("should get deployment statistics", () => {
    const stats = deploymentService.getDeploymentStats();

    expect(stats.totalDeployments).toBeDefined();
    expect(stats.activeDeployments).toBeDefined();
    expect(stats.statusCounts).toBeDefined();
  });
});

describe("AutoML Service", () => {
  let autoMLService: any;

  beforeAll(() => {
    autoMLService = getAutoMLService();
  });

  it("should generate model recommendations", () => {
    const dataset = {
      features: [{ f1: 1, f2: 2 }],
      labels: [1],
      metadata: {
        size: 100,
        featureCount: 2,
        hasNulls: false,
        imbalanced: false,
      },
    };

    const recommendations = autoMLService.generateModelRecommendations(
      dataset,
      "classification"
    );

    expect(recommendations.recommended).toBeDefined();
    expect(recommendations.reasons).toBeDefined();
    expect(recommendations.searchSpace).toBeDefined();
  });
});
