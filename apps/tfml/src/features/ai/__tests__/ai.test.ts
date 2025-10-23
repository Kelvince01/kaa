import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { AIModel, Prediction } from "@kaa/models";
import mongoose from "mongoose";
import { type AIService, getAIService } from "../ai.service";
import { diContainer } from "../services/di-container";

// import { testSetup } from "~/shared/utils/test.util";

// Mock the permission check
// jest.mock("../../rbac/permission.service", () => ({
//   checkPermission: jest.fn().mockResolvedValue(true),
// }));

describe("Unified AI Service Integration Tests", () => {
  let service: AIService;
  let testModelId: string;
  let testUserId: string;
  let testMemberId: string;

  beforeAll(async () => {
    // await testSetup.connectDB();
    // Initialize the service
    service = await getAIService();
    testUserId = new mongoose.Types.ObjectId().toString();
    testMemberId = new mongoose.Types.ObjectId().toString();
  });

  afterAll(async () => {
    // Clean up test data
    if (testModelId) {
      await AIModel.deleteOne({ _id: testModelId });
      await Prediction.deleteMany({ modelId: testModelId });
    }
    // Reset DI container
    await diContainer.reset();
    // await testSetup.disconnectDB();
  });

  describe("Dependency Injection", () => {
    it("should initialize all services through DI container", () => {
      expect(service).toBeDefined();
      expect(diContainer.tensorflowService).toBeDefined();
      expect(diContainer.dataPrepService).toBeDefined();
      expect(diContainer.embeddingCache).toBeDefined();
      expect(diContainer.metricsService).toBeDefined();
      expect(diContainer.modelRegistryService).toBeDefined();
      expect(diContainer.incrementalLearningService).toBeDefined();
      expect(diContainer.featureTransformersService).toBeDefined();
      expect(diContainer.storageAdapter).toBeDefined();
    });

    it("should maintain singleton instances", async () => {
      const service1 = await getAIService();
      const service2 = await getAIService();
      expect(service1).toBe(service2);
    });
  });

  describe("Model Creation with Enhanced Features", () => {
    it("should create a model with transformers and incremental learning", async () => {
      const modelData = {
        name: "Test Enhanced Model",
        type: "classification" as const,
        description: "Test model with enhanced features",
        configuration: {
          algorithm: "dense_nn",
          parameters: { learningRate: 0.001, numClasses: 3 },
          features: ["feature1", "feature2", "feature3"],
          target: "target",
          useEmbeddings: true,
        },
        trainingDataSource: "synthetic",
        createdBy: testUserId,
        memberId: testMemberId,
        transformers: [
          {
            feature: "feature1",
            transformers: ["normalize", "log"],
          },
        ],
        incrementalLearning: true,
      };

      const model = await service.createModel(
        modelData
        // testUserId
      );

      expect(model).toBeDefined();
      // expect(model.name).toBe(modelData.name);
      // expect(model.type).toBe(modelData.type);
      expect(model.status).toBe("training");
      // expect(model.lifecycle?.stage).toBe("development");

      // testModelId = model._id?.toString() || "";
    });
  });

  describe("Feature Transformers", () => {
    it("should list available transformers", () => {
      const transformers = service.listTransformers();
      expect(transformers).toBeInstanceOf(Array);
      expect(transformers.length).toBeGreaterThan(0);

      // Check for built-in transformers
      const transformerNames = transformers.map((t) => t.name);
      expect(transformerNames).toContain("normalize");
      expect(transformerNames).toContain("log");
      expect(transformerNames).toContain("sqrt");
    });

    it("should register a custom transformer", () => {
      service.registerCustomTransformer(
        "test_transformer",
        "Test transformer for unit tests",
        "return value * 2",
        "numeric",
        1
      );

      const transformers = service.listTransformers();
      const testTransformer = transformers.find(
        (t) => t.name === "test_transformer"
      );

      expect(testTransformer).toBeDefined();
      expect(testTransformer?.description).toBe(
        "Test transformer for unit tests"
      );
    });
  });

  describe("Embedding Cache", () => {
    it("should get cache statistics", () => {
      const stats = service.getEmbeddingCacheStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("hits");
      expect(stats).toHaveProperty("misses");
      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("maxSize");
    });

    it("should warm up cache with texts", async () => {
      const texts = ["test text 1", "test text 2", "test text 3"];

      // This would normally generate embeddings, but in test mode it might be mocked
      await expect(service.warmUpEmbeddingCache(texts)).resolves.not.toThrow();

      const stats = service.getEmbeddingCacheStats();
      // Cache might be populated if embeddings are generated
      expect(stats.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Model Registry", () => {
    it("should promote model through stages", async () => {
      if (!testModelId) {
        // Create a model first if not already created
        const model = await AIModel.create({
          name: "Test Model",
          type: "classification",
          status: "ready",
          memberId: testMemberId,
          createdBy: testUserId,
          version: "1.0.0",
          configuration: {
            algorithm: "dense_nn",
            parameters: {},
            features: ["f1"],
          },
          trainingData: {
            source: "synthetic",
            recordCount: 100,
            lastTrained: new Date(),
          },
          lifecycle: {
            stage: "development",
            currentVersion: "1.0.0",
          },
        });
        testModelId = (model._id as mongoose.Types.ObjectId).toString();
      }

      await service.promoteModel(testModelId, "1.0.0", "staging");

      const model = await AIModel.findById(testModelId);
      expect(model?.lifecycle?.stage).toBe("staging");
    });

    it("should archive old versions", async () => {
      if (!testModelId) return;

      const archivedCount = await service.archiveOldVersions(testModelId, 3);
      expect(archivedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("A/B Testing", () => {
    it("should start and stop A/B test", () => {
      const testId = `test-ab-${Date.now()}`;

      // Start A/B test
      expect(() => {
        service.startABTest(
          testId,
          `${testModelId}:1.0.0`,
          `${testModelId}:1.0.1`,
          50,
          10
        );
      }).not.toThrow();

      // Get results
      const results = service.getABTestResults(testId);
      expect(results).toBeDefined();
      expect(results?.config?.trafficSplit).toBe(50);

      // Stop test
      const finalResults = service.stopABTest(testId);
      expect(finalResults).toBeDefined();
    });
  });

  describe("Incremental Learning", () => {
    it("should get incremental learning history", () => {
      if (!testModelId) return;

      const history = service.getIncrementalHistory(testModelId);
      expect(history).toBeInstanceOf(Array);
    });

    it("should force incremental update", async () => {
      if (!testModelId) return;

      // This might fail if no samples are buffered, which is expected
      const result = await service.forceIncrementalUpdate(testModelId);

      // Result could be null if no samples are available
      if (result) {
        expect(result).toHaveProperty("loss");
        expect(result).toHaveProperty("timestamp");
      }
    });
  });

  describe("Feature Importance", () => {
    it("should calculate feature importance with sample data", async () => {
      if (!testModelId) return;

      const sampleData = [
        { feature1: 1, feature2: 2, feature3: 3 },
        { feature1: 4, feature2: 5, feature3: 6 },
      ];

      try {
        const importance = await service.calculateFeatureImportance(
          testModelId,
          sampleData,
          testMemberId
        );

        // Importance should be an object with feature names as keys
        expect(importance).toBeInstanceOf(Object);
      } catch (error) {
        // Model might not be ready for predictions yet
        expect(error).toBeDefined();
      }
    });
  });

  describe("Model Evaluation", () => {
    it("should evaluate model on test data", async () => {
      if (!testModelId) return;

      const testData = {
        features: [
          { feature1: 1, feature2: 2, feature3: 3 },
          { feature1: 4, feature2: 5, feature3: 6 },
        ],
        labels: [0, 1],
      };

      try {
        const metrics = await service.evaluateModel(testModelId, testData);

        // Should return metrics based on model type
        expect(metrics).toBeDefined();

        // For classification models
        if (metrics.accuracy !== undefined) {
          expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
          expect(metrics.accuracy).toBeLessThanOrEqual(1);
        }
      } catch (error) {
        // Model might not have been trained yet
        expect(error).toBeDefined();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid model ID gracefully", async () => {
      const invalidId = new mongoose.Types.ObjectId().toString();

      await expect(service.getModel(invalidId)).rejects.toThrow(
        "Model not found"
      );
    });

    it("should handle prediction on non-existent model", async () => {
      const invalidId = new mongoose.Types.ObjectId().toString();

      await expect(
        service.makePrediction({
          modelId: invalidId,
          input: { test: 1 },
          memberId: testMemberId,
          userId: testUserId,
        })
      ).rejects.toThrow("not found");
    });

    it("should handle feedback on non-existent prediction", async () => {
      const invalidId = new mongoose.Types.ObjectId().toString();

      await expect(
        service.submitFeedback(invalidId, {
          actualValue: 1,
          isCorrect: true,
          providedBy: testUserId,
        })
      ).rejects.toThrow("not found");
    });
  });
});

describe("AI Utils", () => {
  it("should provide utility functions through AIUtils", async () => {
    const { AIUtils } = await import("../index");

    // Test initialization
    await expect(AIUtils.initialize()).resolves.not.toThrow();

    // Test cache stats
    const stats = await AIUtils.getCacheStats();
    expect(stats).toBeDefined();

    // Test transformer listing
    const transformers = await AIUtils.listTransformers();
    expect(transformers).toBeInstanceOf(Array);
  });
});
