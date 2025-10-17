/**
 * Service Orchestrator for Advanced Virtual Tours
 * Coordinates all advanced services and manages their lifecycle
 */

import { EventEmitter } from "node:events";
import { AIService } from "./services/ai.service";
import { CollaborationService } from "./services/collaboration.service";
import { EdgeComputingService } from "./services/edge-computing.service";
import { IotIntegrationService } from "./services/iot-integration.service";
import { MLAnalyticsService } from "./services/ml-analytics.service";

type ServiceHealth = {
  name: string;
  status: "healthy" | "degraded" | "unhealthy" | "offline";
  version: string;
  uptime: number;
  dependencies: string[];
  lastHealthCheck: Date;
  metrics?: Record<string, any>;
};

type SystemHealth = {
  overall: "healthy" | "degraded" | "unhealthy";
  services: ServiceHealth[];
  criticalServices: string[];
  degradedServices: string[];
  timestamp: Date;
};

// type Orchestrator = AIService | CollaborationService | MLAnalyticsService | EdgeComputingService | IotIntegrationService;

export class VirtualTourServicesOrchestrator extends EventEmitter {
  private readonly services: Map<string, any> = new Map();
  private readonly healthStatus: Map<string, ServiceHealth> = new Map();
  private isInitialized = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.registerServices();
  }

  /**
   * Register all services
   */
  private registerServices(): void {
    this.services.set("ai", new AIService());
    this.services.set("collaboration", new CollaborationService());
    this.services.set("ml-analytics", new MLAnalyticsService());
    this.services.set("edge-computing", new EdgeComputingService());
    this.services.set("iot-integration", new IotIntegrationService());
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log("🚀 Initializing Advanced Virtual Tours Services...");

    try {
      // Initialize services in dependency order
      const initializationPlan = [
        { services: ["security"], description: "Core services" },
        {
          services: ["edge-computing"],
          description: "Infrastructure services",
        },
        { services: ["ai", "ml-analytics"], description: "AI/ML services" },
        {
          services: ["iot-integration"],
          description: "Advanced feature services",
        },
        { services: ["collaboration"], description: "Real-time services" },
      ];

      for (const phase of initializationPlan) {
        console.log(`📋 Initializing ${phase.description}...`);

        const promises = phase.services.map(async (serviceName) => {
          const service = this.services.get(serviceName);
          if (service?.initialize) {
            try {
              await service.initialize();
              console.log(`✅ ${serviceName} initialized`);
              this.updateServiceHealth(serviceName, "healthy");
            } catch (error) {
              console.error(`❌ ${serviceName} initialization failed:`, error);
              this.updateServiceHealth(serviceName, "unhealthy");
            }
          } else {
            console.log(`ℹ️ ${serviceName} - no initialization required`);
            this.updateServiceHealth(serviceName, "healthy");
          }
        });

        await Promise.allSettled(promises);
      }

      // Setup cross-service event handling
      this.setupCrossServiceEvents();

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      this.emit("services-initialized");

      console.log(
        "🎉 All Advanced Virtual Tours Services initialized successfully!"
      );
      console.log("📊 System Status:", this.getSystemHealth().overall);
    } catch (error) {
      console.error("💥 Failed to initialize services:", error);
      throw error;
    }
  }

  /**
   * Setup cross-service event handling
   */
  private setupCrossServiceEvents(): void {
    // AI Service events
    const aiService = this.services.get("ai");
    if (aiService) {
      aiService.on(
        "content-generated",
        (data: { tourId: string; content: string }) => {
          this.emit("ai-content-generated", data);

          // Trigger analytics update
          const mlService = this.services.get(
            "ml-analytics"
          ) as MLAnalyticsService;
          mlService?.updateRealTimeData?.(data.tourId, {
            type: "ai-content",
            timestamp: Date.now(),
            metadata: data,
          });
        }
      );
    }

    // Collaboration events
    const collaborationService = this.services.get("collaboration");
    if (collaborationService) {
      collaborationService.on("session-created", (data: any) => {
        this.emit("collaboration-session-created", data);
      });

      collaborationService.on("tour-changed", (data: any) => {
        this.emit("collaborative-change", data);

        // Update analytics
        const mlService = this.services.get(
          "ml-analytics"
        ) as MLAnalyticsService;
        mlService?.updateRealTimeData?.(data.tourId, {
          type: "collaboration",
          timestamp: Date.now(),
          metadata: data,
        });
      });
    }

    // IoT events
    const iotService = this.services.get("iot-integration");
    if (iotService) {
      iotService.on("iot-data-updated", (data: any) => {
        this.emit("iot-metrics-updated", data);
      });
    }

    // Security events
    const securityService = this.services.get("security");
    if (securityService) {
      securityService.on("security-threat", (data: any) => {
        this.emit("security-alert", data);
        console.warn("🔒 Security threat detected:", data);
      });
    }

    // Edge computing events
    const edgeService = this.services.get("edge-computing");
    if (edgeService) {
      edgeService.on("performance-alert", (data: any) => {
        this.emit("performance-alert", data);
        console.warn("⚡ Performance alert:", data);
      });
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().then((_) => null);
    }, 60_000); // Every minute

    // Initial health check
    this.performHealthCheck().then((_) => null);
  }

  /**
   * Perform health check on all services
   */
  private async performHealthCheck(): Promise<void> {
    const healthChecks = Array.from(this.services.entries()).map(
      async ([name, service]) => {
        try {
          const health: ServiceHealth = {
            name,
            status: "healthy",
            version: service.version || "1.0.0",
            uptime: process.uptime(),
            dependencies: [],
            lastHealthCheck: new Date(),
          };

          // Check if service has health method
          if (service.getHealth) {
            const serviceHealth = await service.getHealth();
            health.status = serviceHealth.status || "healthy";
            health.metrics = serviceHealth;
          } else if (service.getServiceHealth) {
            const serviceHealth = await service.getServiceHealth();
            health.status = serviceHealth.status || "healthy";
            health.metrics = serviceHealth;
          } else {
            // Service doesn't have health check - assume healthy if it exists
            health.status = "healthy";
          }

          this.healthStatus.set(name, health);
        } catch (error) {
          console.error(`Health check failed for ${name}:`, error);
          this.updateServiceHealth(name, "unhealthy");
        }
      }
    );

    await Promise.allSettled(healthChecks);
    this.emit("health-check-completed", this.getSystemHealth());
  }

  /**
   * Update service health status
   */
  private updateServiceHealth(
    serviceName: string,
    status: ServiceHealth["status"]
  ): void {
    let health = this.healthStatus.get(serviceName);
    if (health) {
      health.status = status;
      health.lastHealthCheck = new Date();
    } else {
      health = {
        name: serviceName,
        status,
        version: "1.0.0",
        uptime: process.uptime(),
        dependencies: [],
        lastHealthCheck: new Date(),
      };
    }

    this.healthStatus.set(serviceName, health);
  }

  /**
   * Get system health overview
   */
  getSystemHealth(): SystemHealth {
    const services = Array.from(this.healthStatus.values());
    const healthyServices = services.filter((s) => s.status === "healthy");
    const degradedServices = services.filter((s) => s.status === "degraded");
    const unhealthyServices = services.filter((s) => s.status === "unhealthy");

    let overall: SystemHealth["overall"] = "healthy";

    if (unhealthyServices.length > 0) {
      overall = "unhealthy";
    } else if (degradedServices.length > 0) {
      overall = "degraded";
    }

    return {
      overall,
      services,
      criticalServices: ["edge-computing"],
      degradedServices: degradedServices.map((s) => s.name),
      timestamp: new Date(),
    };
  }

  /**
   * Get service by name
   */
  getService(name: string): any {
    return this.services.get(name);
  }

  /**
   * Get all services
   */
  getAllServices(): Map<string, any> {
    return new Map(this.services);
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down services...");

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Shutdown services in reverse order
    const shutdownOrder = [
      "collaboration",
      "iot-integration",
      "ai",
      "ml-analytics",
      "edge-computing",
    ];

    for (const serviceName of shutdownOrder) {
      const service = this.services.get(serviceName);
      if (service?.shutdown) {
        try {
          await service.shutdown();
          console.log(`✅ ${serviceName} shutdown completed`);
        } catch (error) {
          console.error(`❌ ${serviceName} shutdown failed:`, error);
        }
      }
    }

    this.isInitialized = false;
    this.emit("services-shutdown");
    console.log("🏁 All services shutdown completed");
  }

  /**
   * Restart a specific service
   */
  async restartService(serviceName: string): Promise<boolean> {
    try {
      const service = this.services.get(serviceName);
      if (!service) {
        console.error(`Service ${serviceName} not found`);
        return false;
      }

      console.log(`🔄 Restarting ${serviceName}...`);

      // Shutdown if method exists
      if (service.shutdown) {
        await service.shutdown();
      }

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Initialize again
      if (service.initialize) {
        await service.initialize();
      }

      this.updateServiceHealth(serviceName, "healthy");
      this.emit("service-restarted", { serviceName });

      console.log(`✅ ${serviceName} restarted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to restart ${serviceName}:`, error);
      this.updateServiceHealth(serviceName, "unhealthy");
      return false;
    }
  }

  /**
   * Get service metrics
   */
  getServiceMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};

    for (const [name, service] of this.services.entries()) {
      try {
        if (service.getMetrics) {
          metrics[name] = service.getMetrics();
        } else if (service.getStats) {
          metrics[name] = service.getStats();
        }
      } catch (error) {
        console.warn(`Failed to get metrics for ${name}:`, error);
      }
    }

    return metrics;
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(serviceName: string): boolean {
    const health = this.healthStatus.get(serviceName);
    return health?.status === "healthy" || health?.status === "degraded";
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): {
    isInitialized: boolean;
    initializedServices: string[];
    failedServices: string[];
    totalServices: number;
  } {
    const allServices = Array.from(this.services.keys());
    const healthyServices = Array.from(this.healthStatus.entries())
      .filter(([, health]) => health.status === "healthy")
      .map(([name]) => name);
    const failedServices = Array.from(this.healthStatus.entries())
      .filter(([, health]) => health.status === "unhealthy")
      .map(([name]) => name);

    return {
      isInitialized: this.isInitialized,
      initializedServices: healthyServices,
      failedServices,
      totalServices: allServices.length,
    };
  }
}

// export default new VirtualTourServicesOrchestrator();
