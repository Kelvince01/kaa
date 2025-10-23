import path from "node:path";
import { AIModel } from "@kaa/models";
import { logger } from "@kaa/utils";
import * as tf from "@tensorflow/tfjs-node";
import { metricsService } from "./metrics.service";

export type ModelStage = "development" | "staging" | "production" | "archived";

export type ModelVersion = {
  version: string;
  stage: ModelStage;
  performance: any;
  createdAt: Date;
  promotedAt?: Date;
  metadata?: Record<string, any>;
};

export type ModelComparison = {
  modelA: string;
  modelB: string;
  metrics: {
    modelA: any;
    modelB: any;
    winner?: string;
    improvement?: number;
  };
  testDataSize: number;
  timestamp: Date;
};

export type ABTestConfig = {
  modelA: string; // Model ID or version
  modelB: string; // Model ID or version
  trafficSplit: number; // Percentage of traffic to model B (0-100)
  duration?: number; // Test duration in milliseconds
  minSamples?: number; // Minimum samples before determining winner
};

export type ABTestResult = {
  config: ABTestConfig;
  modelAMetrics: any;
  modelBMetrics: any;
  winner?: string;
  confidence?: number;
  samplesA: number;
  samplesB: number;
};

export class ModelRegistryService {
  private readonly abTests: Map<
    string,
    {
      config: ABTestConfig;
      startTime: Date;
      samplesA: number;
      samplesB: number;
      performanceA: any[];
      performanceB: any[];
    }
  > = new Map();

  /**
   * Register a new model version
   */
  async registerVersion(
    modelId: string,
    version: string,
    performance?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const model = await AIModel.findById(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const versionEntry: ModelVersion = {
        version,
        stage: "development",
        performance: performance || {},
        createdAt: new Date(),
        metadata,
      };

      // Add to versions array
      if (!model.versions) {
        model.versions = [];
      }
      (model.versions as any).push(versionEntry);

      // Update lifecycle
      if (!model.lifecycle) {
        model.lifecycle = {} as any;
      }
      model.lifecycle.lastUpdated = new Date();

      await model.save();

      logger.info("Model version registered", { modelId, version });
    } catch (error) {
      logger.error("Failed to register model version", {
        modelId,
        version,
        error,
      });
      throw error;
    }
  }

  /**
   * Promote model to different stage
   */
  async promoteModel(
    modelId: string,
    version: string,
    toStage: ModelStage
  ): Promise<void> {
    try {
      const model = await AIModel.findById(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      // Find the version
      const versionIndex = (model.versions as any[])?.findIndex(
        (v) => v.version === version
      );

      if (versionIndex === -1) {
        throw new Error(`Version ${version} not found`);
      }

      // Update stage
      (model.versions as any)[versionIndex].stage = toStage;
      (model.versions as any)[versionIndex].promotedAt = new Date();

      // If promoting to production, update current version
      if (toStage === "production") {
        model.lifecycle.currentVersion = version;
        model.lifecycle.stage = "production";

        // Archive previous production versions
        for (let i = 0; i < (model.versions as any[]).length; i++) {
          if (
            i !== versionIndex &&
            (model.versions as any)[i].stage === "production"
          ) {
            (model.versions as any)[i].stage = "archived";
          }
        }
      }

      await model.save();

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
   * Compare two model versions
   */
  async compareModels(
    modelIdA: string,
    versionA: string,
    modelIdB: string,
    versionB: string,
    testData: { xs: tf.Tensor; ys: tf.Tensor },
    modelType: "classification" | "regression"
  ): Promise<ModelComparison> {
    try {
      // Load both models
      const modelPathA = this.getModelPath(modelIdA, versionA);
      const modelPathB = this.getModelPath(modelIdB, versionB);

      const modelA = await tf.loadLayersModel(`file://${modelPathA}`);
      const modelB = await tf.loadLayersModel(`file://${modelPathB}`);

      // Evaluate both models
      const metricsA = await metricsService.evaluateModel(
        modelA,
        testData.xs,
        testData.ys,
        modelType
      );

      const metricsB = await metricsService.evaluateModel(
        modelB,
        testData.xs,
        testData.ys,
        modelType
      );

      // Determine winner
      let winner: string | undefined;
      let improvement: number | undefined;

      if (modelType === "classification") {
        const accA = (metricsA as any).accuracy;
        const accB = (metricsB as any).accuracy;
        winner =
          accA > accB ? `${modelIdA}:${versionA}` : `${modelIdB}:${versionB}`;
        improvement = Math.abs(accA - accB) * 100;
      } else {
        const mseA = (metricsA as any).mse;
        const mseB = (metricsB as any).mse;
        winner =
          mseA < mseB ? `${modelIdA}:${versionA}` : `${modelIdB}:${versionB}`;
        improvement = Math.abs(mseA - mseB);
      }

      const comparison: ModelComparison = {
        modelA: `${modelIdA}:${versionA}`,
        modelB: `${modelIdB}:${versionB}`,
        metrics: {
          modelA: metricsA,
          modelB: metricsB,
          winner,
          improvement,
        },
        testDataSize: testData.xs.shape[0],
        timestamp: new Date(),
      };

      logger.info("Models compared", {
        modelA: comparison.modelA,
        modelB: comparison.modelB,
        winner,
      });

      return comparison;
    } catch (error) {
      logger.error("Failed to compare models", error);
      throw error;
    }
  }

  /**
   * Start A/B test between two models
   */
  startABTest(testId: string, config: ABTestConfig): void {
    if (this.abTests.has(testId)) {
      throw new Error(`A/B test ${testId} already exists`);
    }

    this.abTests.set(testId, {
      config,
      startTime: new Date(),
      samplesA: 0,
      samplesB: 0,
      performanceA: [],
      performanceB: [],
    });

    logger.info("A/B test started", { testId, config });
  }

  /**
   * Route request for A/B test
   */
  routeABTest(testId: string): "A" | "B" {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }

    // Use traffic split to determine routing
    const random = Math.random() * 100;
    return random < test.config.trafficSplit ? "B" : "A";
  }

  /**
   * Record A/B test result
   */
  recordABTestResult(testId: string, model: "A" | "B", performance: any): void {
    const test = this.abTests.get(testId);
    if (!test) return;

    if (model === "A") {
      test.samplesA++;
      test.performanceA.push(performance);
    } else {
      test.samplesB++;
      test.performanceB.push(performance);
    }
  }

  /**
   * Get A/B test results
   */
  getABTestResults(testId: string): ABTestResult | null {
    const test = this.abTests.get(testId);
    if (!test) return null;

    // Calculate average performance
    const avgPerformanceA = this.calculateAveragePerformance(test.performanceA);
    const avgPerformanceB = this.calculateAveragePerformance(test.performanceB);

    // Determine winner if enough samples
    let winner: string | undefined;
    let confidence: number | undefined;

    const minSamples = test.config.minSamples || 100;
    if (test.samplesA >= minSamples && test.samplesB >= minSamples) {
      // Simple comparison - in production, use statistical significance tests
      // biome-ignore lint/style/useCollapsedIf: ignore
      if (avgPerformanceA.accuracy && avgPerformanceB.accuracy) {
        winner =
          avgPerformanceA.accuracy > avgPerformanceB.accuracy
            ? test.config.modelA
            : test.config.modelB;
        confidence =
          Math.abs(avgPerformanceA.accuracy - avgPerformanceB.accuracy) * 100;
      }
    }

    return {
      config: test.config,
      modelAMetrics: avgPerformanceA,
      modelBMetrics: avgPerformanceB,
      winner,
      confidence,
      samplesA: test.samplesA,
      samplesB: test.samplesB,
    };
  }

  /**
   * Stop A/B test
   */
  stopABTest(testId: string): ABTestResult | null {
    const result = this.getABTestResults(testId);
    this.abTests.delete(testId);

    if (result) {
      logger.info("A/B test stopped", {
        testId,
        winner: result.winner,
        samplesA: result.samplesA,
        samplesB: result.samplesB,
      });
    }

    return result;
  }

  /**
   * List all model versions
   */
  async listVersions(
    modelId: string,
    stage?: ModelStage
  ): Promise<ModelVersion[]> {
    const model = await AIModel.findById(modelId);
    if (!model) return [];

    let versions = (model.versions as any[]) || [];

    if (stage) {
      versions = versions.filter((v) => v.stage === stage);
    }

    return versions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get best performing model version
   */
  async getBestVersion(
    modelId: string,
    metric = "accuracy"
  ): Promise<ModelVersion | null> {
    const versions = await this.listVersions(modelId);

    if (versions.length === 0) return null;

    return versions.reduce((best, current) => {
      const bestValue = best.performance?.[metric] || 0;
      const currentValue = current.performance?.[metric] || 0;
      return currentValue > bestValue ? current : best;
    });
  }

  /**
   * Archive old model versions
   */
  async archiveOldVersions(modelId: string, keepCount = 5): Promise<number> {
    const model = await AIModel.findById(modelId);
    if (!model) return 0;

    const versions = (model.versions as any[]) || [];

    // Sort by creation date
    versions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let archivedCount = 0;

    // Keep the most recent N versions, archive the rest
    for (let i = keepCount; i < versions.length; i++) {
      if (
        versions[i].stage !== "archived" &&
        versions[i].stage !== "production"
      ) {
        versions[i].stage = "archived";
        archivedCount++;
      }
    }

    if (archivedCount > 0) {
      await model.save();
      logger.info("Archived old model versions", { modelId, archivedCount });
    }

    return archivedCount;
  }

  /**
   * Helper methods
   */
  private getModelPath(modelId: string, version: string): string {
    const modelsRoot =
      process.env.MODEL_DIR || path.resolve(process.cwd(), "models");
    return path.join(modelsRoot, modelId, version, "model.json");
  }

  private calculateAveragePerformance(performances: any[]): any {
    if (performances.length === 0) return {};

    const avg: any = {};
    const keys = Object.keys(performances[0]);

    for (const key of keys) {
      const values = performances
        .map((p) => p[key])
        .filter((v) => typeof v === "number");
      if (values.length > 0) {
        avg[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }

    return avg;
  }
}

export const modelRegistryService = new ModelRegistryService();
