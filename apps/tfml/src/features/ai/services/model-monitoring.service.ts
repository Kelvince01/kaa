import { AIModel, Prediction } from "@kaa/models";
import type { IAIModel, IPrediction } from "@kaa/models/types";
import { logger } from "@kaa/utils/logger";
import type {
  DriftMetrics,
  DriftReport,
  HealthCheck,
  HealthStatus,
  LatencyMetrics,
  ModelMetrics,
  ThroughputMetrics,
} from "../interfaces/ai-service.interface";

export type ModelPerformanceData = {
  predictions: IPrediction[];
  timeWindow: {
    start: Date;
    end: Date;
  };
  metrics: ModelMetrics;
};

export type DriftDetectionConfig = {
  threshold: number;
  windowSize: number;
  features: string[];
  method: "psi" | "ks" | "chi2" | "wasserstein";
};

export type AlertConfig = {
  enabled: boolean;
  thresholds: {
    accuracy: number;
    latency: number;
    errorRate: number;
    driftScore: number;
  };
  channels: ("email" | "slack" | "webhook")[];
  recipients: string[];
};

export class ModelMonitoringService {
  private readonly performanceCache: Map<string, ModelPerformanceData> =
    new Map();
  private readonly driftDetectors: Map<string, DriftDetectionConfig> =
    new Map();
  private readonly alertConfigs: Map<string, AlertConfig> = new Map();
  private readonly healthChecks: Map<string, HealthCheck[]> = new Map();

  /**
   * Detect model drift using statistical methods
   */
  async detectDrift(modelId: string, newData: any[]): Promise<DriftReport> {
    try {
      const model = await AIModel.findById(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const config = this.driftDetectors.get(modelId) || {
        threshold: 0.1,
        windowSize: 1000,
        features: model.configuration.features,
        method: "psi" as const,
      };

      // Get reference data (training data or recent predictions)
      const referenceData = await this.getReferenceData(
        modelId,
        config.windowSize
      );

      if (referenceData.length === 0) {
        logger.warn("No reference data available for drift detection", {
          modelId,
        });
        return {
          modelId,
          driftScore: 0,
          threshold: config.threshold,
          isDrifting: false,
          affectedFeatures: [],
          recommendations: ["Collect more reference data for drift detection"],
          detectedAt: new Date(),
        };
      }

      // Calculate drift score for each feature
      const featureDriftScores: Record<string, number> = {};
      const affectedFeatures: string[] = [];

      for (const feature of config.features) {
        const referenceValues = referenceData
          .map((d) => d[feature])
          .filter((v) => v !== undefined);
        const newValues = newData
          .map((d) => d[feature])
          .filter((v) => v !== undefined);

        if (referenceValues.length === 0 || newValues.length === 0) {
          continue;
        }

        const driftScore = this.calculateFeatureDrift(
          referenceValues,
          newValues,
          config.method
        );

        featureDriftScores[feature] = driftScore;

        if (driftScore > config.threshold) {
          affectedFeatures.push(feature);
        }
      }

      // Overall drift score (max of feature drift scores)
      const overallDriftScore = Math.max(...Object.values(featureDriftScores));
      const isDrifting = overallDriftScore > config.threshold;

      // Generate recommendations
      const recommendations = this.generateDriftRecommendations(
        isDrifting,
        affectedFeatures,
        featureDriftScores
      );

      const driftReport: DriftReport = {
        modelId,
        driftScore: overallDriftScore,
        threshold: config.threshold,
        isDrifting,
        affectedFeatures,
        recommendations,
        detectedAt: new Date(),
      };

      // Log drift detection
      logger.info("Drift detection completed", {
        modelId,
        driftScore: overallDriftScore,
        isDrifting,
        affectedFeatures: affectedFeatures.length,
        method: config.method,
      });

      // Trigger alerts if drifting
      if (isDrifting) {
        await this.triggerDriftAlert(modelId, driftReport);
      }

      return driftReport;
    } catch (error) {
      logger.error("Failed to detect model drift", { modelId, error });
      throw error;
    }
  }

  /**
   * Track prediction quality over time
   */
  async trackPredictionQuality(
    predictions: IPrediction[]
  ): Promise<ModelMetrics> {
    if (predictions.length === 0) {
      throw new Error("No predictions provided for quality tracking");
    }

    const modelId = predictions[0].modelId.toString();

    // Calculate latency metrics
    const latencies = predictions.map((p) => p.processingTime);
    const latencyMetrics: LatencyMetrics = {
      p50: this.percentile(latencies, 0.5),
      p95: this.percentile(latencies, 0.95),
      p99: this.percentile(latencies, 0.99),
      mean: latencies.reduce((sum, val) => sum + val, 0) / latencies.length,
      max: Math.max(...latencies),
    };

    // Calculate throughput metrics
    const timeWindow = 60_000; // 1 minute
    const now = Date.now();
    const recentPredictions = predictions.filter(
      (p) => now - p.createdAt.getTime() < timeWindow
    );

    const throughputMetrics: ThroughputMetrics = {
      requestsPerSecond: recentPredictions.length / (timeWindow / 1000),
      predictionsPerSecond: recentPredictions.length / (timeWindow / 1000),
      concurrentRequests: this.estimateConcurrentRequests(recentPredictions),
    };

    // Calculate accuracy metrics (if feedback available)
    const predictionsWithFeedback = predictions.filter((p) => p.feedback);
    const accuracyMetrics: Partial<ModelMetrics> = {};

    if (predictionsWithFeedback.length > 0) {
      const correctPredictions = predictionsWithFeedback.filter(
        (p) => p.feedback?.isCorrect
      );
      accuracyMetrics.accuracy =
        correctPredictions.length / predictionsWithFeedback.length;
    }

    // Calculate drift metrics
    const driftMetrics: DriftMetrics = {
      score: 0, // Will be updated by drift detection
      threshold: 0.1,
      isDrifting: false,
      lastChecked: new Date(),
    };

    const metrics: ModelMetrics = {
      ...accuracyMetrics,
      latency: latencyMetrics,
      throughput: throughputMetrics,
      drift: driftMetrics,
    };

    // Cache performance data
    this.performanceCache.set(modelId, {
      predictions,
      timeWindow: {
        start: new Date(
          Math.min(...predictions.map((p) => p.createdAt.getTime()))
        ),
        end: new Date(
          Math.max(...predictions.map((p) => p.createdAt.getTime()))
        ),
      },
      metrics,
    });

    logger.info("Prediction quality tracked", {
      modelId,
      predictionCount: predictions.length,
      accuracy: metrics.accuracy,
      meanLatency: latencyMetrics.mean,
      throughput: throughputMetrics.requestsPerSecond,
    });

    return await Promise.resolve(metrics);
  }

  /**
   * Generate comprehensive model report
   */
  async generateModelReport(modelId: string): Promise<any> {
    try {
      const model = await AIModel.findById(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      // Get recent predictions
      const recentPredictions = await Prediction.find({ modelId })
        .sort({ createdAt: -1 })
        .limit(1000);

      // Get performance metrics
      const metrics = await this.trackPredictionQuality(recentPredictions);

      // Get health status
      const health = await this.getModelHealth(modelId);

      // Get drift report
      const driftReport = await this.detectDrift(modelId, []);

      // Calculate usage statistics
      const usageStats = this.calculateUsageStatistics(recentPredictions);

      // Generate insights and recommendations
      const insights = this.generateModelInsights(
        model,
        metrics,
        health,
        driftReport
      );

      const report = {
        modelId,
        modelName: model.name,
        modelType: model.type,
        version: model.version,
        status: model.status,
        generatedAt: new Date(),
        timeWindow: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          end: new Date(),
        },
        performance: metrics,
        health,
        drift: driftReport,
        usage: usageStats,
        insights,
        recommendations: insights.recommendations,
      };

      logger.info("Model report generated", {
        modelId,
        reportSize: JSON.stringify(report).length,
      });

      return report;
    } catch (error) {
      logger.error("Failed to generate model report", { modelId, error });
      throw error;
    }
  }

  /**
   * Get model health status
   */
  async getModelHealth(modelId: string): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];
    const startTime = Date.now();

    try {
      // Check model availability
      const modelCheck = await this.checkModelAvailability(modelId);
      checks.push(modelCheck);

      // Check prediction latency
      const latencyCheck = await this.checkPredictionLatency(modelId);
      checks.push(latencyCheck);

      // Check error rate
      const errorRateCheck = await this.checkErrorRate(modelId);
      checks.push(errorRateCheck);

      // Check resource usage
      const resourceCheck = await this.checkResourceUsage(modelId);
      checks.push(resourceCheck);

      // Check data quality
      const dataQualityCheck = await this.checkDataQuality(modelId);
      checks.push(dataQualityCheck);

      // Determine overall status
      const failedChecks = checks.filter((c) => c.status === "fail");
      const warnChecks = checks.filter((c) => c.status === "warn");

      let overallStatus: "healthy" | "degraded" | "unhealthy";
      if (failedChecks.length > 0) {
        overallStatus = "unhealthy";
      } else if (warnChecks.length > 0) {
        overallStatus = "degraded";
      } else {
        overallStatus = "healthy";
      }

      const healthStatus: HealthStatus = {
        status: overallStatus,
        checks,
        lastUpdated: new Date(),
      };

      // Cache health checks
      this.healthChecks.set(modelId, checks);

      logger.info("Model health check completed", {
        modelId,
        status: overallStatus,
        checkCount: checks.length,
        duration: Date.now() - startTime,
      });

      return healthStatus;
    } catch (error) {
      logger.error("Failed to check model health", { modelId, error });

      return {
        status: "unhealthy",
        checks: [
          {
            name: "health_check_error",
            status: "fail",
            message: `Health check failed: ${(error as Error).message}`,
            duration: Date.now() - startTime,
          },
        ],
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Configure drift detection for a model
   */
  configureDriftDetection(modelId: string, config: DriftDetectionConfig): void {
    this.driftDetectors.set(modelId, config);
    logger.info("Drift detection configured", { modelId, config });
  }

  /**
   * Configure alerts for a model
   */
  configureAlerts(modelId: string, config: AlertConfig): void {
    this.alertConfigs.set(modelId, config);
    logger.info("Alerts configured", { modelId, config });
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): any {
    return {
      monitoredModels: this.performanceCache.size,
      driftDetectors: this.driftDetectors.size,
      alertConfigs: this.alertConfigs.size,
      healthChecks: this.healthChecks.size,
      cacheSize: Array.from(this.performanceCache.values()).reduce(
        (total, data) => total + data.predictions.length,
        0
      ),
    };
  }

  private async getReferenceData(
    modelId: string,
    windowSize: number
  ): Promise<any[]> {
    // Get recent predictions as reference data
    const predictions = await Prediction.find({ modelId })
      .sort({ createdAt: -1 })
      .limit(windowSize);

    return predictions.map((p) => p.input);
  }

  private calculateFeatureDrift(
    referenceValues: any[],
    newValues: any[],
    method: "psi" | "ks" | "chi2" | "wasserstein"
  ): number {
    switch (method) {
      case "psi":
        return this.calculatePSI(referenceValues, newValues);
      case "ks":
        return this.calculateKSStatistic(referenceValues, newValues);
      case "chi2":
        return this.calculateChi2Statistic(referenceValues, newValues);
      case "wasserstein":
        return this.calculateWassersteinDistance(referenceValues, newValues);
      default:
        return 0;
    }
  }

  private calculatePSI(referenceValues: any[], newValues: any[]): number {
    // Population Stability Index calculation
    const bins = 10;
    const refHist = this.createHistogram(referenceValues, bins);
    const newHist = this.createHistogram(newValues, bins);

    let psi = 0;
    for (let i = 0; i < bins; i++) {
      const refPct = refHist[i] / referenceValues.length;
      const newPct = newHist[i] / newValues.length;

      if (refPct > 0 && newPct > 0) {
        psi += (newPct - refPct) * Math.log(newPct / refPct);
      }
    }

    return Math.abs(psi);
  }

  private calculateKSStatistic(
    referenceValues: number[],
    newValues: number[]
  ): number {
    // Kolmogorov-Smirnov test statistic
    const refSorted = [...referenceValues].sort((a, b) => a - b);
    const newSorted = [...newValues].sort((a, b) => a - b);

    const allValues = [...new Set([...refSorted, ...newSorted])].sort(
      (a, b) => a - b
    );

    let maxDiff = 0;
    for (const value of allValues) {
      const refCDF =
        refSorted.filter((v) => v <= value).length / refSorted.length;
      const newCDF =
        newSorted.filter((v) => v <= value).length / newSorted.length;
      maxDiff = Math.max(maxDiff, Math.abs(refCDF - newCDF));
    }

    return maxDiff;
  }

  private calculateChi2Statistic(
    referenceValues: any[],
    newValues: any[]
  ): number {
    // Chi-square test for categorical data
    const refCounts = this.countValues(referenceValues);
    const newCounts = this.countValues(newValues);

    const allValues = new Set([
      ...Object.keys(refCounts),
      ...Object.keys(newCounts),
    ]);

    let chi2 = 0;
    for (const value of allValues) {
      const observed = newCounts[value] || 0;
      const expected = refCounts[value] || 0;

      if (expected > 0) {
        chi2 += (observed - expected) ** 2 / expected;
      }
    }

    return chi2;
  }

  private calculateWassersteinDistance(
    referenceValues: number[],
    newValues: number[]
  ): number {
    // Simplified Wasserstein distance (1D)
    const refSorted = [...referenceValues].sort((a, b) => a - b);
    const newSorted = [...newValues].sort((a, b) => a - b);

    const minLength = Math.min(refSorted.length, newSorted.length);
    let distance = 0;

    for (let i = 0; i < minLength; i++) {
      distance += Math.abs(refSorted[i] - newSorted[i]);
    }

    return distance / minLength;
  }

  private createHistogram(values: number[], bins: number): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;

    const histogram = new Array(bins).fill(0);

    for (const value of values) {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    }

    return histogram;
  }

  private countValues(values: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const value of values) {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  private generateDriftRecommendations(
    isDrifting: boolean,
    affectedFeatures: string[],
    featureDriftScores: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    if (!isDrifting) {
      recommendations.push(
        "Model is performing well with no significant drift detected"
      );
      return recommendations;
    }

    recommendations.push(
      "Model drift detected - consider the following actions:"
    );

    if (affectedFeatures.length > 0) {
      recommendations.push(
        `Features showing drift: ${affectedFeatures.join(", ")}`
      );
      recommendations.push(
        "Investigate data quality issues in the affected features"
      );
      recommendations.push("Consider retraining the model with recent data");
    }

    const highDriftFeatures = Object.entries(featureDriftScores)
      .filter(([_, score]) => score > 0.2)
      .map(([feature, _]) => feature);

    if (highDriftFeatures.length > 0) {
      recommendations.push(
        `High drift detected in: ${highDriftFeatures.join(", ")}`
      );
      recommendations.push("Urgent retraining recommended");
    }

    recommendations.push("Monitor prediction accuracy closely");
    recommendations.push("Consider implementing incremental learning");

    return recommendations;
  }

  private triggerDriftAlert(modelId: string, driftReport: DriftReport): void {
    const alertConfig = this.alertConfigs.get(modelId);

    if (!alertConfig?.enabled) {
      return;
    }

    if (driftReport.driftScore < alertConfig.thresholds.driftScore) {
      return;
    }

    logger.warn("Drift alert triggered", {
      modelId,
      driftScore: driftReport.driftScore,
    });

    // Here you would implement actual alerting (email, Slack, webhook, etc.)
    // For now, just log the alert
    const alertMessage = `Model ${modelId} drift detected: score ${driftReport.driftScore.toFixed(3)} exceeds threshold ${alertConfig.thresholds.driftScore}`;

    for (const channel of alertConfig.channels) {
      switch (channel) {
        case "email":
          // Send email alert
          logger.info("Email alert sent", {
            modelId,
            recipients: alertConfig.recipients,
          });
          break;
        case "slack":
          // Send Slack alert
          logger.info("Slack alert sent", { modelId });
          break;
        case "webhook":
          // Send webhook alert
          logger.info("Webhook alert sent", { modelId });
          break;
        default:
          break;
      }
    }
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  private estimateConcurrentRequests(predictions: IPrediction[]): number {
    // Simple estimation based on overlapping processing times
    if (predictions.length === 0) return 0;

    const events: Array<{ time: number; type: "start" | "end" }> = [];

    for (const prediction of predictions) {
      const startTime = prediction.createdAt.getTime();
      const endTime = startTime + prediction.processingTime;

      events.push({ time: startTime, type: "start" });
      events.push({ time: endTime, type: "end" });
    }

    events.sort((a, b) => a.time - b.time);

    let maxConcurrent = 0;
    let currentConcurrent = 0;

    for (const event of events) {
      if (event.type === "start") {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
      } else {
        currentConcurrent--;
      }
    }

    return maxConcurrent;
  }

  private calculateUsageStatistics(predictions: IPrediction[]): any {
    if (predictions.length === 0) {
      return {
        totalPredictions: 0,
        avgPredictionsPerDay: 0,
        peakHour: null,
        errorRate: 0,
      };
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const hourMs = 60 * 60 * 1000;

    // Calculate daily average
    const oldestPrediction = Math.min(
      ...predictions.map((p) => p.createdAt.getTime())
    );
    const daysSinceOldest = Math.max(1, (now - oldestPrediction) / dayMs);
    const avgPredictionsPerDay = predictions.length / daysSinceOldest;

    // Find peak hour
    const hourCounts: Record<number, number> = {};
    for (const prediction of predictions) {
      const hour = new Date(prediction.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    const peakHour = Object.entries(hourCounts).reduce(
      (max, [hour, count]) =>
        count > max.count ? { hour: Number.parseInt(hour, 10), count } : max,
      { hour: 0, count: 0 }
    );

    // Calculate error rate (simplified)
    const errorsCount = predictions.filter(
      (p) => p.feedback && !p.feedback.isCorrect
    ).length;
    const errorRate =
      predictions.length > 0 ? errorsCount / predictions.length : 0;

    return {
      totalPredictions: predictions.length,
      avgPredictionsPerDay: Math.round(avgPredictionsPerDay),
      peakHour: peakHour.hour,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  private generateModelInsights(
    _model: IAIModel,
    metrics: ModelMetrics,
    health: HealthStatus,
    driftReport: DriftReport
  ): any {
    const insights: any = {
      performance: [],
      health: [],
      drift: [],
      recommendations: [],
    };

    // Performance insights
    if (metrics.accuracy && metrics.accuracy < 0.8) {
      insights.performance.push(
        "Model accuracy is below 80% - consider retraining"
      );
      insights.recommendations.push("Retrain model with more recent data");
    }

    if (metrics.latency.p95 > 1000) {
      insights.performance.push("95th percentile latency exceeds 1 second");
      insights.recommendations.push("Optimize model for faster inference");
    }

    if (metrics.throughput.requestsPerSecond < 10) {
      insights.performance.push("Low throughput detected");
      insights.recommendations.push("Consider model optimization or scaling");
    }

    // Health insights
    if (health.status === "unhealthy") {
      insights.health.push("Model health is critical");
      insights.recommendations.push(
        "Investigate and resolve health check failures"
      );
    } else if (health.status === "degraded") {
      insights.health.push("Model health is degraded");
      insights.recommendations.push("Monitor closely and address warnings");
    }

    // Drift insights
    if (driftReport.isDrifting) {
      insights.drift.push(
        `Data drift detected (score: ${driftReport.driftScore.toFixed(3)})`
      );
      insights.recommendations.push(
        "Address data drift through retraining or data quality improvements"
      );
    }

    return insights;
  }

  private async checkModelAvailability(modelId: string): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const model = await AIModel.findById(modelId);
      const duration = Date.now() - startTime;

      if (!model) {
        return {
          name: "model_availability",
          status: "fail",
          message: "Model not found in database",
          duration,
        };
      }

      if (model.status !== "ready") {
        return {
          name: "model_availability",
          status: "warn",
          message: `Model status is ${model.status}, not ready`,
          duration,
        };
      }

      return {
        name: "model_availability",
        status: "pass",
        message: "Model is available and ready",
        duration,
      };
    } catch (error) {
      return {
        name: "model_availability",
        status: "fail",
        message: `Failed to check model availability: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private async checkPredictionLatency(modelId: string): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Get recent predictions
      const recentPredictions = await Prediction.find({ modelId })
        .sort({ createdAt: -1 })
        .limit(100);

      const duration = Date.now() - startTime;

      if (recentPredictions.length === 0) {
        return {
          name: "prediction_latency",
          status: "warn",
          message: "No recent predictions to analyze",
          duration,
        };
      }

      const avgLatency =
        recentPredictions.reduce((sum, p) => sum + p.processingTime, 0) /
        recentPredictions.length;
      const p95Latency = this.percentile(
        recentPredictions.map((p) => p.processingTime),
        0.95
      );

      if (p95Latency > 5000) {
        // 5 seconds
        return {
          name: "prediction_latency",
          status: "fail",
          message: `P95 latency ${p95Latency}ms exceeds 5000ms threshold`,
          duration,
        };
      }

      if (avgLatency > 1000) {
        // 1 second
        return {
          name: "prediction_latency",
          status: "warn",
          message: `Average latency ${avgLatency.toFixed(0)}ms exceeds 1000ms threshold`,
          duration,
        };
      }

      return {
        name: "prediction_latency",
        status: "pass",
        message: `Latency is healthy (avg: ${avgLatency.toFixed(0)}ms, p95: ${p95Latency.toFixed(0)}ms)`,
        duration,
      };
    } catch (error) {
      return {
        name: "prediction_latency",
        status: "fail",
        message: `Failed to check prediction latency: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private async checkErrorRate(modelId: string): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Get recent predictions with feedback
      const recentPredictions = await Prediction.find({
        modelId,
        feedback: { $exists: true },
      })
        .sort({ createdAt: -1 })
        .limit(100);

      const duration = Date.now() - startTime;

      if (recentPredictions.length === 0) {
        return {
          name: "error_rate",
          status: "warn",
          message: "No recent predictions with feedback to analyze",
          duration,
        };
      }

      const incorrectPredictions = recentPredictions.filter(
        (p) => !p.feedback?.isCorrect
      );
      const errorRate = incorrectPredictions.length / recentPredictions.length;

      if (errorRate > 0.3) {
        // 30%
        return {
          name: "error_rate",
          status: "fail",
          message: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds 30% threshold`,
          duration,
        };
      }

      if (errorRate > 0.1) {
        // 10%
        return {
          name: "error_rate",
          status: "warn",
          message: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds 10% threshold`,
          duration,
        };
      }

      return {
        name: "error_rate",
        status: "pass",
        message: `Error rate is healthy (${(errorRate * 100).toFixed(1)}%)`,
        duration,
      };
    } catch (error) {
      return {
        name: "error_rate",
        status: "fail",
        message: `Failed to check error rate: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private checkResourceUsage(_modelId: string): HealthCheck {
    const startTime = Date.now();

    try {
      // Check memory usage (simplified)
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;

      const duration = Date.now() - startTime;

      if (memUsageMB > 1000) {
        // 1GB
        return {
          name: "resource_usage",
          status: "warn",
          message: `High memory usage: ${memUsageMB.toFixed(0)}MB`,
          duration,
        };
      }

      return {
        name: "resource_usage",
        status: "pass",
        message: `Resource usage is normal (${memUsageMB.toFixed(0)}MB)`,
        duration,
      };
    } catch (error) {
      return {
        name: "resource_usage",
        status: "fail",
        message: `Failed to check resource usage: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private async checkDataQuality(modelId: string): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Get recent prediction inputs
      const recentPredictions = await Prediction.find({ modelId })
        .sort({ createdAt: -1 })
        .limit(100);

      const duration = Date.now() - startTime;

      if (recentPredictions.length === 0) {
        return {
          name: "data_quality",
          status: "warn",
          message: "No recent predictions to analyze data quality",
          duration,
        };
      }

      // Check for missing values
      let totalFields = 0;
      let missingFields = 0;

      for (const prediction of recentPredictions) {
        const input = prediction.input;
        for (const [key, value] of Object.entries(input)) {
          totalFields++;
          if (value === null || value === undefined || value === "") {
            missingFields++;
          }
        }
      }

      const missingRate = totalFields > 0 ? missingFields / totalFields : 0;

      if (missingRate > 0.2) {
        // 20%
        return {
          name: "data_quality",
          status: "fail",
          message: `High missing data rate: ${(missingRate * 100).toFixed(1)}%`,
          duration,
        };
      }

      if (missingRate > 0.05) {
        // 5%
        return {
          name: "data_quality",
          status: "warn",
          message: `Elevated missing data rate: ${(missingRate * 100).toFixed(1)}%`,
          duration,
        };
      }

      return {
        name: "data_quality",
        status: "pass",
        message: `Data quality is good (${(missingRate * 100).toFixed(1)}% missing)`,
        duration,
      };
    } catch (error) {
      return {
        name: "data_quality",
        status: "fail",
        message: `Failed to check data quality: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }
}

// Singleton instance
let monitoringServiceInstance: ModelMonitoringService | null = null;

export function getModelMonitoringService(): ModelMonitoringService {
  if (!monitoringServiceInstance) {
    monitoringServiceInstance = new ModelMonitoringService();
  }
  return monitoringServiceInstance;
}
