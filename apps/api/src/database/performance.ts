import { redisClient } from "@kaa/utils/redis";
import mongoose from "mongoose";
import type { RedisClientType } from "redis";

// Database performance configuration
type DBPerformanceConfig = {
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
  maxConnecting: number;
  connectTimeoutMS: number;
  socketTimeoutMS: number;
  serverSelectionTimeoutMS: number;
  heartbeatFrequencyMS: number;
  retryWrites: boolean;
  readPreference: string;
  readConcern: string;
  writeConcern: {
    w: string | number;
    j: boolean;
    wtimeout: number;
  };
};

const dbConfig: DBPerformanceConfig = {
  maxPoolSize: Number.parseInt(process.env.DB_MAX_POOL_SIZE || "20", 10),
  minPoolSize: Number.parseInt(process.env.DB_MIN_POOL_SIZE || "5", 10),
  maxIdleTimeMS: Number.parseInt(
    process.env.DB_MAX_IDLE_TIME_MS || "30000",
    10
  ),
  maxConnecting: Number.parseInt(process.env.DB_MAX_CONNECTING || "2", 10),
  connectTimeoutMS: Number.parseInt(
    process.env.DB_CONNECT_TIMEOUT_MS || "10000",
    10
  ),
  socketTimeoutMS: Number.parseInt(
    process.env.DB_SOCKET_TIMEOUT_MS || "45000",
    10
  ),
  serverSelectionTimeoutMS: Number.parseInt(
    process.env.DB_SERVER_SELECTION_TIMEOUT_MS || "30000",
    10
  ),
  heartbeatFrequencyMS: Number.parseInt(
    process.env.DB_HEARTBEAT_FREQUENCY_MS || "10000",
    10
  ),
  retryWrites: process.env.DB_RETRY_WRITES === "true",
  readPreference: process.env.DB_READ_PREFERENCE || "primaryPreferred",
  readConcern: process.env.DB_READ_CONCERN || "local",
  writeConcern: {
    w: process.env.DB_WRITE_CONCERN_W || "majority",
    j: process.env.DB_WRITE_CONCERN_J === "true",
    wtimeout: Number.parseInt(
      process.env.DB_WRITE_CONCERN_WTIMEOUT || "10000",
      10
    ),
  },
};

// Performance monitoring
type QueryMetrics = {
  operation: string;
  collection: string;
  duration: number;
  timestamp: Date;
  query: any;
  executionStats?: any;
};

class DatabasePerformanceMonitor {
  private readonly redis: RedisClientType;
  readonly queryMetrics: QueryMetrics[] = [];
  private readonly slowQueryThreshold: number;

  constructor() {
    this.redis = redisClient;

    this.slowQueryThreshold = Number.parseInt(
      process.env.SLOW_QUERY_THRESHOLD || "1000",
      10
    ); // 1 second
    this.setupMonitoring();
  }

  private setupMonitoring(): void {
    // Monitor MongoDB operations
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
      this.logConnectionStats();
    });

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    // Setup query profiling
    if (mongoose.connection.readyState === 1) {
      this.enableProfiling();
    } else {
      mongoose.connection.once("connected", () => {
        this.enableProfiling();
      });
    }
  }

  private async enableProfiling(): Promise<void> {
    try {
      // Enable profiling for slow operations
      await mongoose.connection.db?.admin().command({
        profile: 2,
        slowms: this.slowQueryThreshold,
        sampleRate: 1.0,
      });

      console.log("Database profiling enabled");
    } catch (error) {
      console.error("Failed to enable database profiling:", error);
    }
  }

  async logConnectionStats(): Promise<void> {
    try {
      const stats = await mongoose.connection.db?.admin().serverStatus();
      const connectionStats = {
        connections: stats?.connections,
        network: stats?.network,
        opcounters: stats?.opcounters,
        opcountersRepl: stats?.opcountersRepl,
        timestamp: new Date(),
      };

      await this.redis.lPush(
        "db_connection_stats",
        JSON.stringify(connectionStats)
      );
      await this.redis.lTrim("db_connection_stats", 0, 999); // Keep last 1000 entries
    } catch (error) {
      console.error("Failed to log connection stats:", error);
    }
  }

  async getConnectionStats(): Promise<any> {
    try {
      const stats = await this.redis.lRange("db_connection_stats", 0, 99);
      return stats.map((stat) => JSON.parse(stat));
    } catch (error) {
      console.error("Failed to get connection stats:", error);
      return [];
    }
  }

  async getSlowQueries(): Promise<any[]> {
    try {
      const profilerCollection =
        mongoose.connection.db?.collection("system.profile");
      const slowQueries = await profilerCollection
        ?.find({ ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }) // Last 24 hours
        .sort({ ts: -1 })
        .limit(100)
        .toArray();

      return slowQueries || [];
    } catch (error) {
      console.error("Failed to get slow queries:", error);
      return [];
    }
  }

  async analyzeIndexUsage(): Promise<any> {
    try {
      const collections = await mongoose.connection.db
        ?.listCollections()
        .toArray();
      const indexAnalysis = {};

      for (const collection of collections || []) {
        const collectionName = collection.name;
        if (collectionName.startsWith("system.")) continue;

        const coll = mongoose.connection.db?.collection(collectionName);

        // Get index stats
        const indexStats = await coll
          ?.aggregate([{ $indexStats: {} }])
          .toArray();

        // Get collection stats
        const collStats = (await (coll as any)?.stats()) as any;

        (indexAnalysis as any)[collectionName] = {
          documentCount: collStats.count,
          indexCount: collStats.nindexes,
          totalIndexSize: collStats.totalIndexSize,
          averageObjectSize: collStats.avgObjSize,
          indexes: indexStats?.map((stat) => ({
            name: stat.name,
            key: stat.key,
            accesses: stat.accesses,
            usage: stat.accesses.ops || 0,
            since: stat.accesses.since,
          })),
        };
      }

      return indexAnalysis;
    } catch (error) {
      console.error("Failed to analyze index usage:", error);
      return {};
    }
  }

  async optimizeIndexes(): Promise<void> {
    try {
      const analysis = await this.analyzeIndexUsage();

      for (const [collectionName, data] of Object.entries(analysis as any)) {
        const unusedIndexes = (data as any).indexes.filter(
          (index: any) => index.usage === 0 && index.name !== "_id_"
        );

        if (unusedIndexes.length > 0) {
          console.log(
            `Found ${unusedIndexes.length} unused indexes in ${collectionName}:`,
            unusedIndexes.map((idx: any) => idx.name)
          );
        }
      }
    } catch (error) {
      console.error("Failed to optimize indexes:", error);
    }
  }
}

// Database index definitions
export const indexDefinitions = [
  // Users collection indexes
  {
    collection: "users",
    indexes: [
      { key: { email: 1 }, options: { unique: true } },
      { key: { phone: 1 }, options: { unique: true, sparse: true } },
      { key: { role: 1, status: 1 } },
      { key: { "profile.county": 1 } },
      {
        key: {
          "verification.isEmailVerified": 1,
          "verification.isPhoneVerified": 1,
        },
      },
      { key: { createdAt: -1 } },
      { key: { lastLoginAt: -1 } },
      {
        key: {
          "profile.firstName": "text",
          "profile.lastName": "text",
          email: "text",
        },
      },
    ],
  },

  // Properties collection indexes
  {
    collection: "properties",
    indexes: [
      { key: { ownerId: 1, status: 1 } },
      { key: { status: 1, isActive: 1 } },
      { key: { "location.county": 1, "location.city": 1 } },
      { key: { "location.coordinates": "2dsphere" } },
      { key: { type: 1, "pricing.rent": 1 } },
      {
        key: {
          "pricing.rent": 1,
          "features.bedrooms": 1,
          "features.bathrooms": 1,
        },
      },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
      { key: { featured: -1, createdAt: -1 } },
      { key: { "seo.slug": 1 }, options: { unique: true, sparse: true } },
      {
        key: { title: "text", description: "text", "location.address": "text" },
      },
    ],
  },

  // Listings collection indexes
  {
    collection: "listings",
    indexes: [
      { key: { propertyId: 1 }, options: { unique: true } },
      { key: { agentId: 1, status: 1 } },
      { key: { status: 1, expiresAt: 1 } },
      { key: { "pricing.monthlyRent": 1 } },
      { key: { "availability.availableFrom": 1 } },
      { key: { featured: -1, createdAt: -1 } },
      { key: { createdAt: -1 } },
      { key: { "views.total": -1 } },
    ],
  },

  // Applications collection indexes
  {
    collection: "applications",
    indexes: [
      { key: { applicantId: 1, status: 1 } },
      { key: { propertyId: 1, status: 1 } },
      { key: { landlordId: 1, status: 1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { "scoring.totalScore": -1 } },
      { key: { expiresAt: 1 } },
      { key: { createdAt: -1 } },
    ],
  },

  // Payments collection indexes
  {
    collection: "payments",
    indexes: [
      { key: { userId: 1, status: 1 } },
      { key: { propertyId: 1, type: 1 } },
      { key: { transactionId: 1 }, options: { unique: true } },
      { key: { "mpesa.checkoutRequestId": 1 }, options: { sparse: true } },
      { key: { status: 1, createdAt: -1 } },
      { key: { type: 1, createdAt: -1 } },
      { key: { amount: -1, createdAt: -1 } },
      { key: { createdAt: -1 } },
      { key: { dueDate: 1 }, options: { sparse: true } },
    ],
  },

  // Bookings collection indexes
  {
    collection: "bookings",
    indexes: [
      { key: { tenantId: 1, status: 1 } },
      { key: { propertyId: 1, status: 1 } },
      { key: { applicationId: 1 }, options: { unique: true, sparse: true } },
      { key: { status: 1, startDate: 1 } },
      { key: { endDate: 1 } },
      { key: { createdAt: -1 } },
    ],
  },

  // Notifications collection indexes
  {
    collection: "notifications",
    indexes: [
      { key: { userId: 1, read: 1 } },
      { key: { type: 1, priority: 1 } },
      { key: { createdAt: -1 } },
      { key: { scheduledFor: 1 }, options: { sparse: true } },
      {
        key: { expiresAt: 1 },
        options: { expireAfterSeconds: 0, sparse: true },
      },
    ],
  },

  // Messages collection indexes
  {
    collection: "messages",
    indexes: [
      { key: { conversationId: 1, createdAt: -1 } },
      { key: { senderId: 1, createdAt: -1 } },
      { key: { recipientId: 1, read: 1 } },
      { key: { type: 1, status: 1 } },
      { key: { createdAt: -1 } },
    ],
  },

  // Reviews collection indexes
  {
    collection: "reviews",
    indexes: [
      { key: { propertyId: 1, status: 1 } },
      { key: { reviewerId: 1, type: 1 } },
      { key: { targetId: 1, type: 1, status: 1 } },
      { key: { rating: -1, createdAt: -1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { createdAt: -1 } },
    ],
  },

  // Analytics events indexes
  {
    collection: "analytics_events",
    indexes: [
      { key: { userId: 1, eventType: 1, timestamp: -1 } },
      { key: { eventType: 1, timestamp: -1 } },
      {
        key: { "metadata.propertyId": 1, timestamp: -1 },
        options: { sparse: true },
      },
      { key: { timestamp: -1 } },
      { key: { timestamp: 1 }, options: { expireAfterSeconds: 7_776_000 } }, // 90 days
    ],
  },

  // Files collection indexes
  {
    collection: "files",
    indexes: [
      { key: { uploadedBy: 1, category: 1 } },
      { key: { category: 1, status: 1 } },
      { key: { "metadata.propertyId": 1 }, options: { sparse: true } },
      { key: { "metadata.userId": 1 }, options: { sparse: true } },
      { key: { mimeType: 1, size: 1 } },
      { key: { createdAt: -1 } },
      {
        key: { expiresAt: 1 },
        options: { expireAfterSeconds: 0, sparse: true },
      },
    ],
  },
];

// Connection optimization
export async function optimizeDatabaseConnection(): Promise<void> {
  try {
    // Set up connection with optimized settings
    mongoose.set("maxTimeMS", 20_000);
    // mongoose.set("bufferMaxEntries", 0);

    // Enable query result caching
    // mongoose.set("cache", true);

    // Configure connection options
    const connectionOptions = {
      ...dbConfig,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    // Apply connection options
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(
        process.env.MONGODB_URI || "",
        connectionOptions as any
      );
    }

    console.log("Database connection optimized");
  } catch (error) {
    console.error("Failed to optimize database connection:", error);
    throw error;
  }
}

// Index creation utility
export async function createOptimizedIndexes(): Promise<void> {
  try {
    console.log("Creating optimized indexes...");

    for (const { collection, indexes } of indexDefinitions) {
      const coll = mongoose.connection.db?.collection(collection);

      for (const { key, options = {} } of indexes as any) {
        try {
          await coll?.createIndex(key, options);
          console.log(`Created index on ${collection}:`, key);
        } catch (error: any) {
          if (error.code !== 85) {
            // Index already exists
            console.error(`Failed to create index on ${collection}:`, error);
          }
        }
      }
    }

    console.log("Optimized indexes created successfully");
  } catch (error) {
    console.error("Failed to create optimized indexes:", error);
    throw error;
  }
}

// Query optimization utilities
// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class QueryOptimizer {
  static addPagination(query: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  }

  static addSorting(query: any, sort = "-createdAt") {
    return query.sort(sort);
  }

  static addProjection(query: any, fields: string[]) {
    const projection = fields.reduce((acc, field) => {
      acc[field] = 1;
      return acc;
    }, {} as any);
    return query.select(projection);
  }

  static addPopulation(query: any, populate: string | string[]) {
    if (Array.isArray(populate)) {
      for (const field of populate) {
        query.populate(field);
      }
    } else {
      query.populate(populate);
    }
    return query;
  }

  static optimizeAggregation(pipeline: any[]) {
    // Move $match stages to the beginning
    const matchStages = pipeline.filter((stage) => stage.$match);
    const otherStages = pipeline.filter((stage) => !stage.$match);

    return [...matchStages, ...otherStages];
  }
}

// Database health monitoring
export class DatabaseHealthMonitor {
  private readonly monitor: DatabasePerformanceMonitor;

  constructor() {
    this.monitor = new DatabasePerformanceMonitor();
  }

  async getHealthStatus(): Promise<any> {
    try {
      const connectionState = mongoose.connection.readyState;
      const connectionStats = await this.monitor.getConnectionStats();
      const slowQueries = await this.monitor.getSlowQueries();
      const indexAnalysis = await this.monitor.analyzeIndexUsage();

      return {
        status: connectionState === 1 ? "healthy" : "unhealthy",
        connectionState: this.getConnectionStateName(connectionState),
        stats: connectionStats[0] || null,
        slowQueriesCount: slowQueries.length,
        indexAnalysis: Object.keys(indexAnalysis).length,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  private getConnectionStateName(state: number): string {
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    return states[state as keyof typeof states] || "unknown";
  }

  async performHealthCheck(): Promise<boolean> {
    try {
      // Test database connectivity
      await mongoose.connection.db?.admin().ping();

      // Test query performance
      const start = Date.now();
      await mongoose.connection.db?.collection("users").findOne({});
      const duration = Date.now() - start;

      // Consider healthy if ping succeeds and query takes less than 5 seconds
      return duration < 5000;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

// Read replica configuration
export function configureReadReplicas(): void {
  try {
    if (process.env.MONGODB_READ_REPLICA_URI) {
      const readConnection = mongoose.createConnection(
        process.env.MONGODB_READ_REPLICA_URI || "",
        {
          ...dbConfig,
          readPreference: "secondary",
        } as any
      );

      // Export read connection for use in read-heavy operations
      (global as any).readConnection = readConnection;

      console.log("Read replica configured successfully");
    }
  } catch (error) {
    console.error("Failed to configure read replicas:", error);
  }
}

export const performanceMonitor = new DatabasePerformanceMonitor();
export const healthMonitor = new DatabaseHealthMonitor();

// Initialize database optimizations
export async function initializeDatabaseOptimizations(): Promise<void> {
  await optimizeDatabaseConnection();
  await createOptimizedIndexes();
  await configureReadReplicas();

  // Schedule periodic maintenance
  setInterval(async () => {
    await performanceMonitor.logConnectionStats();
    await performanceMonitor.optimizeIndexes();
  }, 300_000); // Every 5 minutes
}
