import { AIModel } from "@kaa/models";
import { logger } from "@kaa/utils/logger";
import { getModelMonitoringService } from "./model-monitoring.service";
import { getModelPool } from "./persistent-model-pool.service";

export type DeploymentStage =
  | "development"
  | "staging"
  | "production"
  | "archived";
export type DeploymentStrategy =
  | "blue_green"
  | "canary"
  | "rolling"
  | "immediate";

export type DeploymentConfig = {
  strategy: DeploymentStrategy;
  healthChecks: HealthCheckConfig[];
  rollback: RollbackConfig;
  monitoring: MonitoringConfig;
  resources: ResourceConfig;
};

export type HealthCheckConfig = {
  type: "http" | "tcp" | "custom";
  endpoint?: string;
  timeout: number;
  interval: number;
  retries: number;
  successThreshold: number;
  failureThreshold: number;
};

export type RollbackConfig = {
  enabled: boolean;
  autoRollback: boolean;
  triggers: RollbackTrigger[];
  maxRollbackAttempts: number;
};

export type RollbackTrigger = {
  metric: string;
  threshold: number;
  duration: number; // seconds
  operator: "gt" | "lt" | "eq";
};

export type MonitoringConfig = {
  metricsEnabled: boolean;
  alerting: AlertingConfig;
  logging: LoggingConfig;
};

export type AlertingConfig = {
  enabled: boolean;
  channels: ("email" | "slack" | "webhook")[];
  thresholds: {
    errorRate: number;
    latency: number;
    throughput: number;
  };
};

export type LoggingConfig = {
  level: "debug" | "info" | "warn" | "error";
  structured: boolean;
  retention: number; // days
};

export type ResourceConfig = {
  cpu: {
    request: string;
    limit: string;
  };
  memory: {
    request: string;
    limit: string;
  };
  replicas: {
    min: number;
    max: number;
    target: number;
  };
};

export type DeploymentStatus = {
  id: string;
  modelId: string;
  version: string;
  stage: DeploymentStage;
  strategy: DeploymentStrategy;
  status:
    | "pending"
    | "deploying"
    | "deployed"
    | "failed"
    | "rolling_back"
    | "rolled_back";
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  healthChecks: HealthCheckResult[];
  metrics: DeploymentMetrics;
};

export type HealthCheckResult = {
  type: string;
  status: "pass" | "fail" | "unknown";
  message: string;
  timestamp: Date;
  duration: number;
};

export type DeploymentMetrics = {
  requestCount: number;
  errorCount: number;
  avgLatency: number;
  p95Latency: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
};

export type CanaryDeploymentConfig = {
  trafficPercent: number;
  duration: number; // minutes
  successCriteria: {
    errorRate: number;
    latency: number;
    minRequests: number;
  };
  autoPromote: boolean;
};

export type BlueGreenDeploymentConfig = {
  warmupDuration: number; // minutes
  switchTrafficAt: number; // percentage of health checks passed
  keepOldVersion: boolean;
  keepOldVersionDuration: number; // minutes
};

export class ModelDeploymentService {
  private readonly deployments: Map<string, DeploymentStatus> = new Map();
  private readonly activeDeployments: Map<string, string> = new Map(); // modelId -> deploymentId
  private readonly modelPool = getModelPool();
  private readonly monitoringService = getModelMonitoringService();

  /**
   * Deploy model using specified strategy
   */
  async deployModel(
    modelId: string,
    version: string,
    stage: DeploymentStage,
    config: DeploymentConfig
  ): Promise<string> {
    const deploymentId = this.generateDeploymentId();

    const deployment: DeploymentStatus = {
      id: deploymentId,
      modelId,
      version,
      stage,
      strategy: config.strategy,
      status: "pending",
      progress: 0,
      startedAt: new Date(),
      healthChecks: [],
      metrics: {
        requestCount: 0,
        errorCount: 0,
        avgLatency: 0,
        p95Latency: 0,
        throughput: 0,
        cpuUsage: 0,
        memoryUsage: 0,
      },
    };

    this.deployments.set(deploymentId, deployment);

    logger.info("Starting model deployment", {
      deploymentId,
      modelId,
      version,
      stage,
      strategy: config.strategy,
    });

    // Start deployment process asynchronously
    this.executeDeployment(deploymentId, config).catch((error) => {
      logger.error("Deployment failed", { deploymentId, error });
      this.updateDeploymentStatus(deploymentId, "failed", 0, error.message);
    });

    return await Promise.resolve(deploymentId);
  }

  /**
   * Canary deployment with gradual traffic shifting
   */
  async canaryDeploy(
    modelId: string,
    version: string,
    trafficPercent: number,
    config?: CanaryDeploymentConfig
  ): Promise<string> {
    const canaryConfig: CanaryDeploymentConfig = {
      trafficPercent,
      duration: config?.duration || 30,
      successCriteria: {
        errorRate: config?.successCriteria?.errorRate || 0.05,
        latency: config?.successCriteria?.latency || 1000,
        minRequests: config?.successCriteria?.minRequests || 100,
      },
      autoPromote: config?.autoPromote ?? true,
    };

    const deploymentConfig: DeploymentConfig = {
      strategy: "canary",
      healthChecks: [
        {
          type: "custom",
          timeout: 5000,
          interval: 30_000,
          retries: 3,
          successThreshold: 2,
          failureThreshold: 3,
        },
      ],
      rollback: {
        enabled: true,
        autoRollback: true,
        triggers: [
          {
            metric: "error_rate",
            threshold: canaryConfig.successCriteria.errorRate,
            duration: 300,
            operator: "gt",
          },
          {
            metric: "latency_p95",
            threshold: canaryConfig.successCriteria.latency,
            duration: 300,
            operator: "gt",
          },
        ],
        maxRollbackAttempts: 3,
      },
      monitoring: {
        metricsEnabled: true,
        alerting: {
          enabled: true,
          channels: ["email"],
          thresholds: {
            errorRate: canaryConfig.successCriteria.errorRate,
            latency: canaryConfig.successCriteria.latency,
            throughput: 10,
          },
        },
        logging: {
          level: "info",
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

    const deploymentId = await this.deployModel(
      modelId,
      version,
      "production",
      deploymentConfig
    );

    // Start canary monitoring
    this.monitorCanaryDeployment(deploymentId, canaryConfig);

    return deploymentId;
  }

  /**
   * Blue-green deployment with zero downtime
   */
  async blueGreenDeploy(
    modelId: string,
    version: string,
    config?: BlueGreenDeploymentConfig
  ): Promise<string> {
    const blueGreenConfig: BlueGreenDeploymentConfig = {
      warmupDuration: config?.warmupDuration || 10,
      switchTrafficAt: config?.switchTrafficAt || 80,
      keepOldVersion: config?.keepOldVersion ?? true,
      keepOldVersionDuration: config?.keepOldVersionDuration || 60,
    };

    const deploymentConfig: DeploymentConfig = {
      strategy: "blue_green",
      healthChecks: [
        {
          type: "custom",
          timeout: 5000,
          interval: 10_000,
          retries: 3,
          successThreshold: 3,
          failureThreshold: 2,
        },
      ],
      rollback: {
        enabled: true,
        autoRollback: true,
        triggers: [
          {
            metric: "health_check_success_rate",
            threshold: 0.8,
            duration: 180,
            operator: "lt",
          },
        ],
        maxRollbackAttempts: 1,
      },
      monitoring: {
        metricsEnabled: true,
        alerting: {
          enabled: true,
          channels: ["email", "slack"],
          thresholds: {
            errorRate: 0.01,
            latency: 500,
            throughput: 50,
          },
        },
        logging: {
          level: "info",
          structured: true,
          retention: 30,
        },
      },
      resources: {
        cpu: { request: "200m", limit: "1000m" },
        memory: { request: "512Mi", limit: "2Gi" },
        replicas: { min: 2, max: 5, target: 2 },
      },
    };

    const deploymentId = await this.deployModel(
      modelId,
      version,
      "production",
      deploymentConfig
    );

    // Start blue-green monitoring
    this.monitorBlueGreenDeployment(deploymentId, blueGreenConfig);

    return deploymentId;
  }

  /**
   * Rollback to previous version
   */
  async rollback(modelId: string, targetVersion?: string): Promise<string> {
    const currentDeploymentId = this.activeDeployments.get(modelId);

    if (!currentDeploymentId) {
      throw new Error(`No active deployment found for model ${modelId}`);
    }

    const currentDeployment = this.deployments.get(currentDeploymentId);
    if (!currentDeployment) {
      throw new Error(`Deployment ${currentDeploymentId} not found`);
    }

    // Find target version
    let rollbackVersion = targetVersion;
    if (!rollbackVersion) {
      const model = await AIModel.findById(modelId);
      if (!model?.versions || model.versions.length < 2) {
        throw new Error("No previous version available for rollback");
      }

      // Get the previous version
      const sortedVersions = model.versions
        .filter((v) => v.version !== currentDeployment.version)
        .sort(
          (a, b) =>
            new Date(b.savedAt || 0).getTime() -
            new Date(a.savedAt || 0).getTime()
        );

      if (sortedVersions.length === 0) {
        throw new Error("No previous version available for rollback");
      }

      rollbackVersion = sortedVersions[0].version;
    }

    logger.info("Starting rollback", {
      modelId,
      currentVersion: currentDeployment.version,
      targetVersion: rollbackVersion,
      deploymentId: currentDeploymentId,
    });

    // Update current deployment status
    this.updateDeploymentStatus(
      currentDeploymentId,
      "rolling_back",
      currentDeployment.progress
    );

    // Create rollback deployment
    const rollbackConfig: DeploymentConfig = {
      strategy: "immediate",
      healthChecks: [
        {
          type: "custom",
          timeout: 3000,
          interval: 5000,
          retries: 2,
          successThreshold: 1,
          failureThreshold: 2,
        },
      ],
      rollback: {
        enabled: false,
        autoRollback: false,
        triggers: [],
        maxRollbackAttempts: 0,
      },
      monitoring: {
        metricsEnabled: true,
        alerting: {
          enabled: true,
          channels: ["email"],
          thresholds: {
            errorRate: 0.1,
            latency: 2000,
            throughput: 5,
          },
        },
        logging: {
          level: "info",
          structured: true,
          retention: 30,
        },
      },
      resources: {
        cpu: { request: "100m", limit: "500m" },
        memory: { request: "256Mi", limit: "1Gi" },
        replicas: { min: 1, max: 2, target: 1 },
      },
    };

    const rollbackDeploymentId = await this.deployModel(
      modelId,
      rollbackVersion,
      currentDeployment.stage,
      rollbackConfig
    );

    // Mark original deployment as rolled back
    setTimeout(() => {
      this.updateDeploymentStatus(currentDeploymentId, "rolled_back", 100);
    }, 5000);

    return rollbackDeploymentId;
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(deploymentId: string): DeploymentStatus | null {
    return this.deployments.get(deploymentId) || null;
  }

  /**
   * List deployments for a model
   */
  getModelDeployments(modelId: string): DeploymentStatus[] {
    return Array.from(this.deployments.values())
      .filter((d) => d.modelId === modelId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Get active deployment for a model
   */
  getActiveDeployment(modelId: string): DeploymentStatus | null {
    const deploymentId = this.activeDeployments.get(modelId);
    return deploymentId ? this.deployments.get(deploymentId) || null : null;
  }

  /**
   * Cancel deployment
   */
  cancelDeployment(deploymentId: string): void {
    const deployment = this.deployments.get(deploymentId);

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    if (deployment.status === "deployed") {
      throw new Error("Cannot cancel completed deployment");
    }

    logger.info("Cancelling deployment", { deploymentId });

    this.updateDeploymentStatus(
      deploymentId,
      "failed",
      deployment.progress,
      "Deployment cancelled by user"
    );
  }

  /**
   * Get deployment statistics
   */
  getDeploymentStats(): any {
    const deployments = Array.from(this.deployments.values());

    const statusCounts = deployments.reduce(
      (counts, d) => {
        counts[d.status] = (counts[d.status] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );

    const strategyCounts = deployments.reduce(
      (counts, d) => {
        counts[d.strategy] = (counts[d.strategy] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );

    const avgDeploymentTime =
      deployments
        .filter((d) => d.completedAt)
        .reduce((sum, d) => {
          // biome-ignore lint/style/noNonNullAssertion: ignore
          const duration = d.completedAt!.getTime() - d.startedAt.getTime();
          return sum + duration;
        }, 0) / deployments.filter((d) => d.completedAt).length || 0;

    return {
      totalDeployments: deployments.length,
      activeDeployments: this.activeDeployments.size,
      statusCounts,
      strategyCounts,
      avgDeploymentTimeMs: avgDeploymentTime,
      successRate: statusCounts.deployed / deployments.length || 0,
    };
  }

  private async executeDeployment(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const deployment = this.deployments.get(deploymentId)!;

    try {
      this.updateDeploymentStatus(deploymentId, "deploying", 10);

      // Load and validate model
      await this.loadAndValidateModel(deployment.modelId, deployment.version);
      this.updateDeploymentStatus(deploymentId, "deploying", 30);

      // Execute strategy-specific deployment
      switch (config.strategy) {
        case "immediate":
          await this.executeImmediateDeployment(deploymentId, config);
          break;
        case "rolling":
          await this.executeRollingDeployment(deploymentId, config);
          break;
        case "canary":
          await this.executeCanaryDeployment(deploymentId, config);
          break;
        case "blue_green":
          await this.executeBlueGreenDeployment(deploymentId, config);
          break;
        default:
          throw new Error(`Invalid deployment strategy: ${config.strategy}`);
      }

      // Run health checks
      this.updateDeploymentStatus(deploymentId, "deploying", 80);
      await this.runHealthChecks(deploymentId, config.healthChecks);

      // Complete deployment
      this.updateDeploymentStatus(deploymentId, "deployed", 100);
      this.activeDeployments.set(deployment.modelId, deploymentId);

      // Start monitoring
      if (config.monitoring.metricsEnabled) {
        this.startDeploymentMonitoring(deploymentId, config);
      }

      logger.info("Deployment completed successfully", { deploymentId });
    } catch (error) {
      logger.error("Deployment failed", { deploymentId, error });
      this.updateDeploymentStatus(
        deploymentId,
        "failed",
        deployment.progress,
        (error as Error).message
      );

      // Trigger rollback if configured
      if (config.rollback.enabled && config.rollback.autoRollback) {
        await this.triggerAutoRollback(deployment.modelId, config.rollback);
      }
    }
  }

  private async loadAndValidateModel(
    modelId: string,
    version: string
  ): Promise<void> {
    const model = await AIModel.findById(modelId);

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.status !== "ready") {
      throw new Error(
        `Model ${modelId} is not ready for deployment (status: ${model.status})`
      );
    }

    // Validate version exists
    const versionExists = model.versions?.some((v) => v.version === version);
    if (!versionExists && model.version !== version) {
      throw new Error(`Version ${version} not found for model ${modelId}`);
    }

    // Pre-load model in pool for faster startup
    await this.modelPool.getModel(modelId, version, async () => {
      // This would load the actual TensorFlow model
      // For now, return a mock model
      return await Promise.resolve({} as any);
    });
  }

  private async executeImmediateDeployment(
    deploymentId: string,
    _config: DeploymentConfig
  ): Promise<void> {
    // Immediate deployment - just update progress
    this.updateDeploymentStatus(deploymentId, "deploying", 70);

    // Simulate deployment time
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async executeRollingDeployment(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    const replicas = config.resources.replicas.target;
    const batchSize = Math.max(1, Math.floor(replicas / 3));

    for (let i = 0; i < replicas; i += batchSize) {
      const progress = 40 + (i / replicas) * 30;
      this.updateDeploymentStatus(deploymentId, "deploying", progress);

      // Simulate rolling update
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Run health check for this batch
      const healthCheck = await this.runSingleHealthCheck(
        deploymentId,
        config.healthChecks[0]
      );
      if (healthCheck.status === "fail") {
        throw new Error(
          `Rolling deployment failed at replica ${i}: ${healthCheck.message}`
        );
      }
    }
  }

  private async executeCanaryDeployment(
    deploymentId: string,
    _config: DeploymentConfig
  ): Promise<void> {
    // Deploy canary instance
    this.updateDeploymentStatus(deploymentId, "deploying", 50);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Start with small traffic percentage
    this.updateDeploymentStatus(deploymentId, "deploying", 60);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Canary monitoring will handle the rest
  }

  private async executeBlueGreenDeployment(
    deploymentId: string,
    _config: DeploymentConfig
  ): Promise<void> {
    // Deploy green environment
    this.updateDeploymentStatus(deploymentId, "deploying", 50);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Warm up green environment
    this.updateDeploymentStatus(deploymentId, "deploying", 65);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Blue-green monitoring will handle traffic switch
  }

  private async runHealthChecks(
    deploymentId: string,
    healthChecks: HealthCheckConfig[]
  ): Promise<void> {
    const results: HealthCheckResult[] = [];

    for (const healthCheck of healthChecks) {
      const result = await this.runSingleHealthCheck(deploymentId, healthCheck);
      results.push(result);

      if (result.status === "fail") {
        throw new Error(`Health check failed: ${result.message}`);
      }
    }

    // Update deployment with health check results
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const deployment = this.deployments.get(deploymentId)!;
    deployment.healthChecks = results;
  }

  private async runSingleHealthCheck(
    _deploymentId: string,
    config: HealthCheckConfig
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Simulate health check
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

      // Random success/failure for demo
      const success = Math.random() > 0.1; // 90% success rate

      return {
        type: config.type,
        status: success ? "pass" : "fail",
        message: success ? "Health check passed" : "Health check failed",
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        type: config.type,
        status: "fail",
        message: `Health check error: ${(error as Error).message}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  private monitorCanaryDeployment(
    deploymentId: string,
    config: CanaryDeploymentConfig
  ): void {
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const deployment = this.deployments.get(deploymentId)!;
    const startTime = Date.now();
    const durationMs = config.duration * 60 * 1000;

    logger.info("Starting canary monitoring", { deploymentId, config });

    const monitoringInterval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, 70 + (elapsed / durationMs) * 20);

      this.updateDeploymentStatus(deploymentId, "deploying", progress);

      // Get metrics from monitoring service
      // const metrics = await this.monitoringService.getModelMetrics(deployment.modelId);
      const metrics = await this.monitoringService.generateModelReport(
        deployment.modelId
      );

      // Check success criteria
      const errorRate = metrics.accuracy ? 1 - metrics.accuracy : 0;
      const latency = metrics.latency?.p95 || 0;

      if (errorRate > config.successCriteria.errorRate) {
        clearInterval(monitoringInterval);
        logger.warn("Canary deployment failed - high error rate", {
          deploymentId,
          errorRate,
        });
        await this.rollback(deployment.modelId);
        return;
      }

      if (latency > config.successCriteria.latency) {
        clearInterval(monitoringInterval);
        logger.warn("Canary deployment failed - high latency", {
          deploymentId,
          latency,
        });
        await this.rollback(deployment.modelId);
        return;
      }

      // Check if canary period is complete
      if (elapsed >= durationMs) {
        clearInterval(monitoringInterval);

        if (config.autoPromote) {
          logger.info(
            "Canary deployment successful - promoting to full traffic",
            { deploymentId }
          );
          this.updateDeploymentStatus(deploymentId, "deployed", 100);
        } else {
          logger.info(
            "Canary deployment monitoring complete - manual promotion required",
            {
              deploymentId,
            }
          );
        }
      }
    }, 30_000); // Check every 30 seconds
  }

  private async monitorBlueGreenDeployment(
    deploymentId: string,
    config: BlueGreenDeploymentConfig
  ): Promise<void> {
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const deployment = this.deployments.get(deploymentId)!;

    logger.info("Starting blue-green monitoring", { deploymentId, config });

    // Wait for warmup period
    await new Promise((resolve) =>
      setTimeout(resolve, config.warmupDuration * 60 * 1000)
    );

    // Check health and switch traffic
    const healthChecks = deployment.healthChecks;
    const successRate =
      healthChecks.filter((h) => h.status === "pass").length /
      healthChecks.length;

    if (successRate >= config.switchTrafficAt / 100) {
      logger.info("Blue-green deployment successful - switching traffic", {
        deploymentId,
        successRate,
      });
      this.updateDeploymentStatus(deploymentId, "deployed", 100);

      // Schedule old version cleanup
      if (!config.keepOldVersion) {
        setTimeout(
          () => {
            logger.info("Cleaning up old version", { deploymentId });
            // Clean up old version
          },
          config.keepOldVersionDuration * 60 * 1000
        );
      }
    } else {
      logger.warn(
        "Blue-green deployment failed - insufficient health check success rate",
        {
          deploymentId,
          successRate,
        }
      );
      await this.rollback(deployment.modelId);
    }
  }

  private startDeploymentMonitoring(
    deploymentId: string,
    config: DeploymentConfig
  ): void {
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const deployment = this.deployments.get(deploymentId)!;

    // Start metrics collection
    const metricsInterval = setInterval(async () => {
      try {
        // const metrics = await this.monitoringService.getModelMetrics(deployment.modelId);
        const metrics = await this.monitoringService.generateModelReport(
          deployment.modelId
        );

        // Update deployment metrics
        deployment.metrics = {
          requestCount: deployment.metrics.requestCount + 1,
          errorCount:
            deployment.metrics.errorCount +
            (metrics.accuracy && metrics.accuracy < 0.9 ? 1 : 0),
          avgLatency: metrics.latency?.mean || 0,
          p95Latency: metrics.latency?.p95 || 0,
          throughput: metrics.throughput?.requestsPerSecond || 0,
          cpuUsage: Math.random() * 100, // Mock CPU usage
          memoryUsage: Math.random() * 100, // Mock memory usage
        };

        // Check rollback triggers
        if (config.rollback.enabled) {
          await this.checkRollbackTriggers(deploymentId, config.rollback);
        }
      } catch (error) {
        logger.error("Deployment monitoring error", { deploymentId, error });
      }
    }, 60_000); // Check every minute

    // Store interval for cleanup
    setTimeout(
      () => {
        clearInterval(metricsInterval);
      },
      24 * 60 * 60 * 1000
    ); // Stop after 24 hours
  }

  private async checkRollbackTriggers(
    deploymentId: string,
    rollbackConfig: RollbackConfig
  ): Promise<void> {
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const deployment = this.deployments.get(deploymentId)!;

    for (const trigger of rollbackConfig.triggers) {
      let currentValue: number;

      switch (trigger.metric) {
        case "error_rate":
          currentValue =
            deployment.metrics.errorCount /
            Math.max(1, deployment.metrics.requestCount);
          break;
        case "latency_p95":
          currentValue = deployment.metrics.p95Latency;
          break;
        case "throughput":
          currentValue = deployment.metrics.throughput;
          break;
        default:
          continue;
      }

      const shouldTrigger = this.evaluateTrigger(currentValue, trigger);

      if (shouldTrigger) {
        logger.warn("Rollback trigger activated", {
          deploymentId,
          metric: trigger.metric,
          currentValue,
          threshold: trigger.threshold,
        });

        await this.triggerAutoRollback(deployment.modelId, rollbackConfig);
        break;
      }
    }
  }

  private evaluateTrigger(value: number, trigger: RollbackTrigger): boolean {
    switch (trigger.operator) {
      case "gt":
        return value > trigger.threshold;
      case "lt":
        return value < trigger.threshold;
      case "eq":
        return Math.abs(value - trigger.threshold) < 0.001;
      default:
        return false;
    }
  }

  private async triggerAutoRollback(
    modelId: string,
    _rollbackConfig: RollbackConfig
  ): Promise<void> {
    try {
      logger.info("Triggering auto rollback", { modelId });
      await this.rollback(modelId);
    } catch (error) {
      logger.error("Auto rollback failed", { modelId, error });
    }
  }

  private updateDeploymentStatus(
    deploymentId: string,
    status: DeploymentStatus["status"],
    progress: number,
    error?: string
  ): void {
    const deployment = this.deployments.get(deploymentId);

    if (deployment) {
      deployment.status = status;
      deployment.progress = progress;
      deployment.error = error;

      if (
        status === "deployed" ||
        status === "failed" ||
        status === "rolled_back"
      ) {
        deployment.completedAt = new Date();
      }

      logger.debug("Deployment status updated", {
        deploymentId,
        status,
        progress,
        error,
      });
    }
  }

  private generateDeploymentId(): string {
    return `deploy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
let deploymentServiceInstance: ModelDeploymentService | null = null;

export function getModelDeploymentService(): ModelDeploymentService {
  if (!deploymentServiceInstance) {
    deploymentServiceInstance = new ModelDeploymentService();
  }
  return deploymentServiceInstance;
}
