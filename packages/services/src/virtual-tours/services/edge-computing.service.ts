/**
 * Edge Computing Service for Virtual Tours
 * Handles content delivery optimization, adaptive quality, and global distribution
 */

import { EventEmitter } from "node:events";
import type {
  EdgeComputingConfig,
  EdgeNode,
  NetworkThreshold,
  QualityLevel,
} from "@kaa/models/types";
import axios from "axios";
import NodeCache from "node-cache";

type CDNConfig = {
  primaryProvider: "cloudflare" | "aws" | "azure" | "gcp";
  backupProviders: string[];
  regions: CDNRegion[];
  cacheRules: CacheRule[];
};

type CDNRegion = {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  capacity: number;
  endpoints: string[];
  priority: number;
};

type CacheRule = {
  pattern: string;
  ttl: number;
  headers: Record<string, string>;
  compression: boolean;
};

type PerformanceMetrics = {
  latency: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
  bandwidth: number;
  activeConnections: number;
};

type AdaptiveQualityConfig = {
  profiles: QualityProfile[];
  switchingRules: SwitchingRule[];
  bufferThresholds: BufferThreshold[];
};

type QualityProfile = {
  id: string;
  name: string;
  resolution: { width: number; height: number };
  bitrate: number;
  fps: number;
  codec: "h264" | "h265" | "vp9" | "av1";
  audioCodec: "aac" | "opus" | "mp3";
};

type SwitchingRule = {
  condition: "bandwidth" | "latency" | "buffer" | "device";
  threshold: number;
  targetProfile: string;
  hysteresis: number;
};

type BufferThreshold = {
  level: "low" | "medium" | "high";
  seconds: number;
  action: "upgrade" | "downgrade" | "maintain";
};

type ConnectionInfo = {
  ip: string;
  country: string;
  region: string;
  isp: string;
  connectionType: "fiber" | "cable" | "dsl" | "mobile" | "satellite";
  estimatedBandwidth: number;
  latency: number;
};

type LoadBalancer = {
  algorithm: "round-robin" | "least-connections" | "weighted" | "ip-hash";
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
  failover: {
    enabled: boolean;
    threshold: number;
    cooldown: number;
  };
};

export class EdgeComputingService extends EventEmitter {
  private readonly config: EdgeComputingConfig;
  private readonly cdnConfig: CDNConfig;
  private readonly edgeNodes: Map<string, EdgeNode> = new Map();
  private readonly cache: NodeCache;
  private readonly performanceMetrics: Map<string, PerformanceMetrics> =
    new Map();
  private readonly adaptiveQuality: AdaptiveQualityConfig;
  readonly loadBalancer: LoadBalancer;
  private activeConnections: Map<string, ConnectionInfo> = new Map();

  constructor() {
    super();

    this.config = {
      enabled: process.env.EDGE_COMPUTING_ENABLED === "true",
      nodes: [],
      adaptiveQuality: {
        enabled: true,
        networkThresholds: this.getDefaultNetworkThresholds(),
        qualityLevels: this.getDefaultQualityLevels(),
        autoAdjustment: true,
      },
      preloading: {
        predictiveLoading: true,
        maxCacheSize: 500 * 1024 * 1024, // 500MB
        priorityScenes: [],
        preloadRadius: 2,
      },
      compression: {
        algorithm: "brotli",
        level: 6,
        adaptive: true,
      },
    };

    this.cdnConfig = {
      primaryProvider: "cloudflare",
      backupProviders: ["aws", "azure"],
      regions: this.initializeKenyaRegions(),
      cacheRules: this.getDefaultCacheRules(),
    };

    this.adaptiveQuality = {
      profiles: this.getQualityProfiles(),
      switchingRules: this.getSwitchingRules(),
      bufferThresholds: this.getBufferThresholds(),
    };

    this.loadBalancer = {
      algorithm: "weighted",
      healthCheck: {
        enabled: true,
        interval: 30_000, // 30 seconds
        timeout: 5000,
        retries: 3,
      },
      failover: {
        enabled: true,
        threshold: 0.95, // 95% error rate
        cooldown: 300_000, // 5 minutes
      },
    };

    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour default
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false,
    });

    this.initializeEdgeNodes();
    this.startPerformanceMonitoring();
  }

  /**
   * Initialize edge nodes in Kenya and neighboring regions
   */
  private initializeKenyaRegions(): CDNRegion[] {
    return [
      {
        id: "nairobi-1",
        name: "Nairobi Primary",
        location: { lat: -1.2921, lng: 36.8219 },
        capacity: 1000,
        endpoints: ["https://nairobi1.kaa-tours.co.ke"],
        priority: 1,
      },
      {
        id: "nairobi-2",
        name: "Nairobi Secondary",
        location: { lat: -1.2921, lng: 36.8219 },
        capacity: 800,
        endpoints: ["https://nairobi2.kaa-tours.co.ke"],
        priority: 2,
      },
      {
        id: "mombasa-1",
        name: "Mombasa",
        location: { lat: -4.0435, lng: 39.6682 },
        capacity: 500,
        endpoints: ["https://mombasa1.kaa-tours.co.ke"],
        priority: 3,
      },
      {
        id: "kisumu-1",
        name: "Kisumu",
        location: { lat: -0.1022, lng: 34.7617 },
        capacity: 300,
        endpoints: ["https://kisumu1.kaa-tours.co.ke"],
        priority: 4,
      },
      {
        id: "kampala-1",
        name: "Kampala (Uganda)",
        location: { lat: 0.3476, lng: 32.5825 },
        capacity: 400,
        endpoints: ["https://kampala1.kaa-tours.co.ke"],
        priority: 5,
      },
      {
        id: "dar-es-salaam-1",
        name: "Dar es Salaam (Tanzania)",
        location: { lat: -6.7924, lng: 39.2083 },
        capacity: 400,
        endpoints: ["https://dar1.kaa-tours.co.ke"],
        priority: 5,
      },
    ];
  }

  /**
   * Initialize edge nodes from configuration
   */
  private async initializeEdgeNodes(): Promise<void> {
    for (const region of this.cdnConfig.regions) {
      const node: EdgeNode = {
        id: region.id,
        location: `${region.name}, Kenya`,
        capacity: region.capacity,
        latency: 0,
        isActive: true,
      };

      this.edgeNodes.set(node.id, node);
    }

    // Test connectivity to all nodes
    await this.testEdgeNodeConnectivity();

    console.log(`Initialized ${this.edgeNodes.size} edge nodes`);
    this.emit("edge-nodes-initialized", Array.from(this.edgeNodes.values()));
  }

  /**
   * Test connectivity to edge nodes
   */
  private async testEdgeNodeConnectivity(): Promise<void> {
    const testPromises = Array.from(this.edgeNodes.entries()).map(
      async ([nodeId, node]) => {
        try {
          const region = this.cdnConfig.regions.find((r) => r.id === nodeId);
          if (!region || region.endpoints.length === 0) return;

          const start = Date.now();
          await axios.get(`${region.endpoints[0]}/health`, { timeout: 5000 });
          const latency = Date.now() - start;

          node.latency = latency;
          node.isActive = latency < 2000; // Consider active if latency < 2s

          this.updatePerformanceMetrics(nodeId, {
            latency,
            throughput: 0,
            errorRate: 0,
            cacheHitRate: 0,
            bandwidth: 0,
            activeConnections: 0,
          });
        } catch (error) {
          console.warn(
            `Edge node ${nodeId} connectivity test failed:`,
            (error as Error).message
          );
          node.isActive = false;
          node.latency = 9999;
        }
      }
    );

    await Promise.allSettled(testPromises);
  }

  /**
   * Get optimal edge node for a client
   */
  async getOptimalEdgeNode(
    clientIP: string,
    _userAgent?: string
  ): Promise<EdgeNode | null> {
    try {
      const connectionInfo = await this.analyzeClientConnection(clientIP);
      const availableNodes = Array.from(this.edgeNodes.values()).filter(
        (node) => node.isActive
      );

      if (availableNodes.length === 0) {
        console.warn("No active edge nodes available");
        return null;
      }

      // Score nodes based on multiple factors
      const scoredNodes = availableNodes.map((node) => {
        const region = this.cdnConfig.regions.find((r) => r.id === node.id);
        if (!region) return { node, score: 0 };

        let score = 100;

        // Geographic proximity (rough estimation)
        const distance = this.calculateDistance(
          connectionInfo.region,
          region.location
        );
        score -= distance * 0.01; // Reduce score based on distance

        // Latency factor
        score -= node.latency * 0.1;

        // Capacity factor
        const metrics = this.performanceMetrics.get(node.id);
        if (metrics) {
          const utilization = metrics.activeConnections / node.capacity;
          score -= utilization * 50; // Heavily penalize overloaded nodes
          score += metrics.cacheHitRate * 20; // Bonus for good cache hit rate
        }

        // Priority factor
        score += (10 - region.priority) * 5;

        return { node, score };
      });

      // Sort by score and return the best node
      scoredNodes.sort((a, b) => b.score - a.score);
      const bestNode = scoredNodes[0]?.node;

      if (bestNode) {
        this.incrementActiveConnections(bestNode.id);
        this.emit("optimal-node-selected", {
          node: bestNode,
          clientIP,
          connectionInfo,
        });
      }

      return bestNode || null;
    } catch (error) {
      console.error(
        "Error selecting optimal edge node:",
        (error as Error).message
      );
      // Fallback to first available node
      return (
        Array.from(this.edgeNodes.values()).find((node) => node.isActive) ||
        null
      );
    }
  }

  /**
   * Analyze client connection details
   */
  private async analyzeClientConnection(
    clientIP: string
  ): Promise<ConnectionInfo> {
    try {
      // Use IP geolocation service (you would implement this with a real service)
      const geoResponse = await axios.get(
        `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEO_API_KEY}&ip=${clientIP}`,
        {
          timeout: 2000,
        }
      );

      const data = geoResponse.data;

      const connectionInfo: ConnectionInfo = {
        ip: clientIP,
        country: data.country_name || "Unknown",
        region: data.state_prov || data.city || "Unknown",
        isp: data.isp || "Unknown",
        connectionType: this.estimateConnectionType(data.isp),
        estimatedBandwidth: this.estimateBandwidth(
          data.isp,
          data.connection_type
        ),
        latency: 0, // Will be measured during connection
      };

      this.activeConnections.set(clientIP, connectionInfo);
      return connectionInfo;
    } catch (error) {
      console.warn(
        "Failed to analyze client connection:",
        (error as Error).message
      );
      // Return default connection info
      return {
        ip: clientIP,
        country: "Kenya",
        region: "Nairobi",
        isp: "Unknown",
        connectionType: "cable",
        estimatedBandwidth: 10, // 10 Mbps default
        latency: 100,
      };
    }
  }

  /**
   * Get adaptive quality level based on connection
   */
  getAdaptiveQuality(clientIP: string, currentBuffer = 0): QualityLevel {
    const connectionInfo = this.activeConnections.get(clientIP);

    if (!connectionInfo) {
      return (
        this.config.adaptiveQuality.qualityLevels[1] ||
        (this.config.adaptiveQuality.qualityLevels[0] as QualityLevel)
      ); // Default to medium quality
    }

    const { estimatedBandwidth, connectionType } = connectionInfo;

    // Apply switching rules
    for (const rule of this.adaptiveQuality.switchingRules) {
      if (
        this.evaluateSwitchingRule(
          rule,
          estimatedBandwidth,
          connectionInfo.latency,
          currentBuffer,
          connectionType
        )
      ) {
        const targetProfile = this.adaptiveQuality.profiles.find(
          (p) => p.id === rule.targetProfile
        );
        if (targetProfile) {
          const qualityLevel = this.config.adaptiveQuality.qualityLevels.find(
            (q) => q.resolution.width === targetProfile.resolution.width
          );
          if (qualityLevel) return qualityLevel;
        }
      }
    }

    // Fallback based on bandwidth
    if (estimatedBandwidth >= 25)
      return this.config.adaptiveQuality.qualityLevels[3] as QualityLevel; // 4K
    if (estimatedBandwidth >= 10)
      return this.config.adaptiveQuality.qualityLevels[2] as QualityLevel; // High
    if (estimatedBandwidth >= 5)
      return this.config.adaptiveQuality.qualityLevels[1] as QualityLevel; // Medium
    return this.config.adaptiveQuality.qualityLevels[0] as QualityLevel; // Low
  }

  /**
   * Predictive preloading of tour content
   */
  async predictivePreload(
    tourId: string,
    currentSceneId: string,
    userBehavior: any,
    clientIP: string
  ): Promise<string[]> {
    if (!this.config.preloading.predictiveLoading) {
      return [];
    }

    try {
      const connectionInfo = this.activeConnections.get(clientIP);
      const quality = this.getAdaptiveQuality(clientIP);

      // Get tour structure
      const tourStructure = await this.getTourStructure(tourId);
      const currentScene = tourStructure.scenes.find(
        (s: any) => s.id === currentSceneId
      );

      if (!currentScene) return [];

      const scenesToPreload: string[] = [];
      let totalSize = 0;
      const maxSize = this.config.preloading.maxCacheSize;

      // Priority 1: Connected scenes
      for (const connection of currentScene.connections || []) {
        if (
          totalSize < maxSize &&
          scenesToPreload.length < this.config.preloading.preloadRadius
        ) {
          scenesToPreload.push(connection.targetSceneId);
          totalSize += this.estimateSceneSize(
            connection.targetSceneId,
            quality
          );
        }
      }

      // Priority 2: Frequently visited scenes based on user behavior
      if (userBehavior.commonPaths) {
        for (const sceneId of userBehavior.commonPaths.slice(0, 3)) {
          if (!scenesToPreload.includes(sceneId) && totalSize < maxSize) {
            scenesToPreload.push(sceneId);
            totalSize += this.estimateSceneSize(sceneId, quality);
          }
        }
      }

      // Priority 3: High-engagement scenes
      if (tourStructure.analytics?.topScenes) {
        for (const sceneId of tourStructure.analytics.topScenes.slice(0, 2)) {
          if (!scenesToPreload.includes(sceneId) && totalSize < maxSize) {
            scenesToPreload.push(sceneId);
            totalSize += this.estimateSceneSize(sceneId, quality);
          }
        }
      }

      // Start preloading
      await this.startPreloading(tourId, scenesToPreload, quality, clientIP);

      this.emit("predictive-preload-started", {
        tourId,
        currentSceneId,
        scenesToPreload,
        estimatedSize: totalSize,
        clientIP,
      });

      return scenesToPreload;
    } catch (error) {
      console.error("Predictive preloading error:", (error as Error).message);
      return [];
    }
  }

  /**
   * Optimize content delivery
   */
  async optimizeContentDelivery(
    contentUrl: string,
    clientIP: string,
    contentType: "image" | "video" | "3d" | "audio"
  ): Promise<string> {
    try {
      const edgeNode = await this.getOptimalEdgeNode(clientIP);
      const connectionInfo = this.activeConnections.get(clientIP);

      if (!(edgeNode && connectionInfo)) {
        return contentUrl; // Return original URL as fallback
      }

      const region = this.cdnConfig.regions.find((r) => r.id === edgeNode.id);
      if (!region || region.endpoints.length === 0) {
        return contentUrl;
      }

      const baseEndpoint = region.endpoints[0];

      // Build optimized URL with parameters
      const optimizedUrl = new URL(contentUrl);

      // Add compression parameters
      if (this.config.compression.adaptive) {
        optimizedUrl.searchParams.set(
          "compress",
          this.config.compression.algorithm
        );
        optimizedUrl.searchParams.set(
          "level",
          this.config.compression.level.toString()
        );
      }

      // Add quality parameters
      const quality = this.getAdaptiveQuality(clientIP);
      optimizedUrl.searchParams.set("w", quality.resolution.width.toString());
      optimizedUrl.searchParams.set("h", quality.resolution.height.toString());
      optimizedUrl.searchParams.set(
        "q",
        Math.round(quality.compressionRatio * 100).toString()
      );

      // Add format optimization
      if (contentType === "image") {
        // Serve WebP to supported browsers, fallback to original
        optimizedUrl.searchParams.set("format", "webp");
        optimizedUrl.searchParams.set("fallback", "auto");
      }

      // Replace domain with edge endpoint
      optimizedUrl.hostname = new URL(baseEndpoint || "").hostname;
      optimizedUrl.protocol = new URL(baseEndpoint || "").protocol;

      const finalUrl = optimizedUrl.toString();

      // Track optimization
      this.emit("content-optimized", {
        originalUrl: contentUrl,
        optimizedUrl: finalUrl,
        edgeNode: edgeNode.id,
        quality: quality.name,
        clientIP,
      });

      return finalUrl;
    } catch (error) {
      console.error(
        "Content delivery optimization error:",
        (error as Error).message
      );
      return contentUrl;
    }
  }

  /**
   * Handle dynamic scaling based on load
   */
  async handleDynamicScaling(): Promise<void> {
    const activeNodeCount = Array.from(this.edgeNodes.values()).filter(
      (node) => node.isActive
    ).length;
    const totalConnections = Array.from(
      this.performanceMetrics.values()
    ).reduce((sum, metrics) => sum + metrics.activeConnections, 0);

    const avgConnectionsPerNode = totalConnections / activeNodeCount;

    // Scale up if average connections per node > 80% capacity
    if (avgConnectionsPerNode > 800) {
      await this.scaleUpEdgeNodes();
    }
    // Scale down if average connections per node < 20% capacity
    else if (avgConnectionsPerNode < 200 && activeNodeCount > 2) {
      await this.scaleDownEdgeNodes();
    }

    // Update CDN configuration if needed
    await this.updateCDNConfiguration();
  }

  /**
   * Monitor performance metrics
   */
  private startPerformanceMonitoring(): void {
    setInterval(async () => {
      await this.collectPerformanceMetrics();
      await this.handleDynamicScaling();
      this.optimizeCacheStrategy();
    }, 60_000); // Every minute

    setInterval(async () => {
      await this.testEdgeNodeConnectivity();
    }, 300_000); // Every 5 minutes
  }

  /**
   * Collect performance metrics from all edge nodes
   */
  private async collectPerformanceMetrics(): Promise<void> {
    const metricsPromises = Array.from(this.edgeNodes.entries()).map(
      async ([nodeId, node]) => {
        try {
          const region = this.cdnConfig.regions.find((r) => r.id === nodeId);
          if (!(region && node.isActive)) return;

          const response = await axios.get(`${region.endpoints[0]}/metrics`, {
            timeout: 5000,
          });

          const metrics: PerformanceMetrics = response.data;
          this.updatePerformanceMetrics(nodeId, metrics);
        } catch (error) {
          console.warn(
            `Failed to collect metrics from node ${nodeId}:`,
            (error as Error).message
          );
        }
      }
    );

    await Promise.allSettled(metricsPromises);
    this.emit("metrics-collected", this.performanceMetrics);
  }

  /**
   * Update performance metrics for a node
   */
  private updatePerformanceMetrics(
    nodeId: string,
    metrics: PerformanceMetrics
  ): void {
    this.performanceMetrics.set(nodeId, metrics);

    // Check for performance issues
    if (metrics.errorRate > 0.05) {
      // 5% error rate
      this.emit("performance-alert", {
        nodeId,
        type: "high-error-rate",
        value: metrics.errorRate,
        threshold: 0.05,
      });
    }

    if (metrics.latency > 2000) {
      // 2 second latency
      this.emit("performance-alert", {
        nodeId,
        type: "high-latency",
        value: metrics.latency,
        threshold: 2000,
      });
    }
  }

  /**
   * Optimize cache strategy based on performance data
   */
  private optimizeCacheStrategy(): void {
    const totalHitRate =
      Array.from(this.performanceMetrics.values()).reduce(
        (sum, metrics) => sum + metrics.cacheHitRate,
        0
      ) / this.performanceMetrics.size;

    // Adjust cache rules if hit rate is low
    if (totalHitRate < 0.7) {
      // Increase TTL for static assets
      const staticRule = this.cdnConfig.cacheRules.find((rule) =>
        rule.pattern.includes("static")
      );
      if (staticRule && staticRule.ttl < 86_400) {
        staticRule.ttl = Math.min(staticRule.ttl * 1.5, 86_400); // Max 24 hours
      }
    }

    this.emit("cache-strategy-optimized", { hitRate: totalHitRate });
  }

  /**
   * Utility methods
   */
  private getDefaultNetworkThresholds(): NetworkThreshold[] {
    return [
      { speed: 1, quality: "low", priority: 4 },
      { speed: 5, quality: "medium", priority: 3 },
      { speed: 10, quality: "high", priority: 2 },
      { speed: 25, quality: "4k", priority: 1 },
    ];
  }

  private getDefaultQualityLevels(): QualityLevel[] {
    return [
      {
        name: "low",
        resolution: { width: 1280, height: 720 },
        bitrate: 2000,
        fps: 30,
        compressionRatio: 0.6,
      },
      {
        name: "medium",
        resolution: { width: 1920, height: 1080 },
        bitrate: 5000,
        fps: 30,
        compressionRatio: 0.75,
      },
      {
        name: "high",
        resolution: { width: 2560, height: 1440 },
        bitrate: 10_000,
        fps: 60,
        compressionRatio: 0.85,
      },
      {
        name: "4k",
        resolution: { width: 3840, height: 2160 },
        bitrate: 20_000,
        fps: 60,
        compressionRatio: 0.9,
      },
    ];
  }

  private getDefaultCacheRules(): CacheRule[] {
    return [
      {
        pattern: "/static/*",
        ttl: 86_400, // 24 hours
        headers: { "Cache-Control": "public, max-age=86400" },
        compression: true,
      },
      {
        pattern: "/tours/*/scenes/*",
        ttl: 3600, // 1 hour
        headers: { "Cache-Control": "public, max-age=3600" },
        compression: true,
      },
      {
        pattern: "/api/*",
        ttl: 300, // 5 minutes
        headers: { "Cache-Control": "public, max-age=300" },
        compression: false,
      },
    ];
  }

  private getQualityProfiles(): QualityProfile[] {
    return [
      {
        id: "mobile-low",
        name: "Mobile Low",
        resolution: { width: 854, height: 480 },
        bitrate: 1000,
        fps: 24,
        codec: "h264",
        audioCodec: "aac",
      },
      {
        id: "mobile-high",
        name: "Mobile High",
        resolution: { width: 1280, height: 720 },
        bitrate: 2500,
        fps: 30,
        codec: "h264",
        audioCodec: "aac",
      },
      {
        id: "desktop-hd",
        name: "Desktop HD",
        resolution: { width: 1920, height: 1080 },
        bitrate: 5000,
        fps: 30,
        codec: "h264",
        audioCodec: "aac",
      },
      {
        id: "desktop-4k",
        name: "Desktop 4K",
        resolution: { width: 3840, height: 2160 },
        bitrate: 15_000,
        fps: 60,
        codec: "h265",
        audioCodec: "aac",
      },
    ];
  }

  private getSwitchingRules(): SwitchingRule[] {
    return [
      {
        condition: "bandwidth",
        threshold: 25,
        targetProfile: "desktop-4k",
        hysteresis: 5,
      },
      {
        condition: "bandwidth",
        threshold: 10,
        targetProfile: "desktop-hd",
        hysteresis: 2,
      },
      {
        condition: "bandwidth",
        threshold: 5,
        targetProfile: "mobile-high",
        hysteresis: 1,
      },
      {
        condition: "bandwidth",
        threshold: 0,
        targetProfile: "mobile-low",
        hysteresis: 0,
      },
    ];
  }

  private getBufferThresholds(): BufferThreshold[] {
    return [
      { level: "low", seconds: 5, action: "downgrade" },
      { level: "medium", seconds: 15, action: "maintain" },
      { level: "high", seconds: 30, action: "upgrade" },
    ];
  }

  // Additional utility methods
  private calculateDistance(
    region: string,
    location: { lat: number; lng: number }
  ): number {
    // Simplified distance calculation - in production, use proper geolocation
    const regionCoords = this.getRegionCoordinates(region);
    const lat1 = regionCoords.lat;
    const lng1 = regionCoords.lng;
    const lat2 = location.lat;
    const lng2 = location.lng;

    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private getRegionCoordinates(region: string): { lat: number; lng: number } {
    // Default to Nairobi coordinates
    const coordinates: Record<string, { lat: number; lng: number }> = {
      Nairobi: { lat: -1.2921, lng: 36.8219 },
      Mombasa: { lat: -4.0435, lng: 39.6682 },
      Kisumu: { lat: -0.1022, lng: 34.7617 },
      Nakuru: { lat: -0.3031, lng: 36.08 },
    };
    return coordinates[region] || { lat: 0, lng: 0 };
  }

  private estimateConnectionType(
    isp: string
  ): ConnectionInfo["connectionType"] {
    const mobileISPs = ["safaricom", "airtel", "telkom"];
    const fiberISPs = ["liquid telecom", "wananchi", "zuku"];

    const ispLower = isp.toLowerCase();

    if (mobileISPs.some((mobile) => ispLower.includes(mobile))) {
      return "mobile";
    }
    if (fiberISPs.some((fiber) => ispLower.includes(fiber))) {
      return "fiber";
    }
    return "cable"; // Default assumption
  }

  private estimateBandwidth(isp: string, connectionType?: string): number {
    // Rough bandwidth estimation based on Kenyan ISP performance
    const ispLower = isp.toLowerCase();

    if (ispLower.includes("safaricom")) {
      return connectionType?.includes("fiber") ? 50 : 15;
    }
    if (ispLower.includes("liquid telecom")) {
      return 100;
    }
    if (ispLower.includes("wananchi") || ispLower.includes("zuku")) {
      return 30;
    }
    if (ispLower.includes("airtel")) {
      return 10;
    }

    return 10; // Default 10 Mbps
  }

  private evaluateSwitchingRule(
    rule: SwitchingRule,
    bandwidth: number,
    latency: number,
    buffer: number,
    connectionType: string
  ): boolean {
    switch (rule.condition) {
      case "bandwidth":
        return bandwidth >= rule.threshold;
      case "latency":
        return latency <= rule.threshold;
      case "buffer":
        return buffer >= rule.threshold;
      case "device":
        return connectionType !== "mobile" || rule.threshold <= 1;
      default:
        return false;
    }
  }

  private incrementActiveConnections(nodeId: string): void {
    const metrics = this.performanceMetrics.get(nodeId);
    if (metrics) {
      metrics.activeConnections++;
    }
  }

  private async getTourStructure(_tourId: string): Promise<any> {
    // This would fetch from your tour service
    // For now, return mock structure
    return await Promise.resolve({
      scenes: [
        { id: "scene1", connections: [{ targetSceneId: "scene2" }] },
        { id: "scene2", connections: [{ targetSceneId: "scene3" }] },
        { id: "scene3", connections: [] },
      ],
      analytics: {
        topScenes: ["scene1", "scene2"],
      },
    });
  }

  private estimateSceneSize(_sceneId: string, quality: QualityLevel): number {
    // Rough estimation based on quality level
    const baseSize = 5 * 1024 * 1024; // 5MB base
    const qualityMultiplier = quality.resolution.width / 1920; // Relative to 1080p
    return Math.round(baseSize * qualityMultiplier);
  }

  private async startPreloading(
    tourId: string,
    sceneIds: string[],
    _quality: QualityLevel,
    _clientIP: string
  ): Promise<void> {
    // Implementation would start background downloads
    await Promise.resolve();
    console.log(
      `Starting preload for tour ${tourId}, scenes: ${sceneIds.join(", ")}`
    );
  }

  private async scaleUpEdgeNodes(): Promise<void> {
    await Promise.resolve();
    console.log("Scaling up edge nodes due to high load");
    // Implementation would provision additional nodes
  }

  private async scaleDownEdgeNodes(): Promise<void> {
    await Promise.resolve();
    console.log("Scaling down edge nodes due to low utilization");
    // Implementation would deallocate underutilized nodes
  }

  private async updateCDNConfiguration(): Promise<void> {
    // Implementation would update CDN settings
  }

  /**
   * Public API methods
   */
  getPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return this.performanceMetrics;
  }

  getActiveEdgeNodes(): EdgeNode[] {
    return Array.from(this.edgeNodes.values()).filter((node) => node.isActive);
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const keys = this.cache.keys().filter((key) => key.includes(pattern));
      this.cache.del(keys);
    } else {
      this.cache.flushAll();
    }

    this.emit("cache-cleared", { pattern });
  }

  /**
   * Initialize edge computing service
   */
  async initialize(): Promise<void> {
    // Edge computing initialization is handled in constructor
    await this.initializeEdgeNodes();
    console.log("Edge Computing Service ready for performance optimization");
  }

  /**
   * Get service health
   */
  getHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    activeNodes: number;
    totalNodes: number;
    avgLatency: number;
  } {
    const activeNodes = this.getActiveEdgeNodes().length;
    const totalNodes = this.edgeNodes.size;
    const avgLatency =
      Array.from(this.edgeNodes.values())
        .filter((node) => node.isActive)
        .reduce((sum, node) => sum + node.latency, 0) / activeNodes || 0;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (activeNodes === 0) {
      status = "unhealthy";
    } else if (activeNodes < totalNodes * 0.5) {
      status = "degraded";
    }

    return {
      status,
      activeNodes,
      totalNodes,
      avgLatency,
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): any {
    return {
      edgeNodes: Array.from(this.edgeNodes.values()).map((node) => ({
        id: node.id,
        location: node.location,
        isActive: node.isActive,
        latency: node.latency,
        capacity: node.capacity,
      })),
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      activeConnections: this.activeConnections.size,
      uptime: process.uptime(),
    };
  }
}

export default new EdgeComputingService();
