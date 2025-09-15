import mongoose from "mongoose";

// Common database utilities
// biome-ignore lint/complexity/noStaticOnlyClass: false positive
export class DatabaseUtils {
  /**
   * Create compound indexes for efficient querying
   */
  static async createIndexes() {
    const db = mongoose.connection.db;

    try {
      // Users collection indexes
      await db
        ?.collection("users")
        .createIndex({ email: 1 }, { unique: true, background: true });
      await db
        ?.collection("users")
        .createIndex({ phone: 1 }, { unique: true, background: true });
      await db
        ?.collection("users")
        .createIndex(
          { nationalId: 1 },
          { unique: true, sparse: true, background: true }
        );
      await db
        ?.collection("users")
        .createIndex({ role: 1, status: 1 }, { background: true });

      // Properties collection indexes
      await db
        ?.collection("properties")
        .createIndex({ location: "2dsphere" }, { background: true });
      await db
        ?.collection("properties")
        .createIndex(
          { "location.county": 1, "location.estate": 1 },
          { background: true }
        );
      await db
        ?.collection("properties")
        .createIndex({ owner: 1, status: 1 }, { background: true });
      await db
        ?.collection("properties")
        .createIndex(
          { type: 1, status: 1, "pricing.rent": 1 },
          { background: true }
        );

      // Text search indexes
      await db?.collection("properties").createIndex(
        {
          title: "text",
          description: "text",
          "location.estate": "text",
          "location.county": "text",
        },
        {
          background: true,
          name: "property_text_search",
        }
      );

      // Listings collection indexes
      await db
        ?.collection("listings")
        .createIndex({ property: 1, status: 1 }, { background: true });
      await db
        ?.collection("listings")
        .createIndex({ status: 1, expiresAt: 1 }, { background: true });
      await db
        ?.collection("listings")
        .createIndex({ featured: 1, createdAt: -1 }, { background: true });

      // Messages collection indexes
      await db
        ?.collection("messages")
        .createIndex({ conversation: 1, createdAt: -1 }, { background: true });
      await db
        ?.collection("messages")
        .createIndex({ sender: 1, receiver: 1 }, { background: true });

      // Applications collection indexes
      await db
        ?.collection("applications")
        .createIndex(
          { property: 1, applicant: 1 },
          { unique: true, background: true }
        );
      await db
        ?.collection("applications")
        .createIndex({ status: 1, createdAt: -1 }, { background: true });

      // Payments collection indexes
      await db
        ?.collection("payments")
        .createIndex({ transactionId: 1 }, { unique: true, background: true });
      await db
        ?.collection("payments")
        .createIndex(
          { user: 1, status: 1, createdAt: -1 },
          { background: true }
        );

      // TTL indexes for temporary data
      await db?.collection("otpcodes").createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 300, background: true } // 5 minutes
      );
      await db
        ?.collection("sessions")
        .createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0, background: true }
        );

      // Analytics collection indexes
      await db
        ?.collection("analytics")
        .createIndex({ event: 1, createdAt: -1 }, { background: true });
      await db
        ?.collection("analytics")
        .createIndex(
          { userId: 1, event: 1, createdAt: -1 },
          { background: true }
        );

      console.log("✅ Database indexes created successfully");
    } catch (error) {
      console.error("❌ Error creating database indexes:", error);
      throw error;
    }
  }

  /**
   * Drop all indexes (for development/testing)
   */
  static async dropIndexes() {
    try {
      const collections = (await mongoose.connection.db?.collections()) || [];

      for (const collection of collections) {
        await collection.dropIndexes();
      }

      console.log("🗑️  All indexes dropped");
    } catch (error) {
      console.error("Error dropping indexes:", error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  static async getStats() {
    try {
      const stats = await mongoose.connection.db?.stats();
      const collections = (await mongoose.connection.db?.collections()) || [];

      const collectionStats = await Promise.all(
        collections.map(async (collection) => ({
          name: collection.collectionName,
          count: await collection.countDocuments(),
          indexes: await collection.indexes(),
        }))
      );

      return {
        database: stats,
        collections: collectionStats,
      };
    } catch (error) {
      console.error("Error getting database stats:", error);
      throw error;
    }
  }

  /**
   * Clean up test data (for testing environments)
   */
  static async cleanTestData() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cannot clean data in production environment");
    }

    try {
      const collections = await mongoose.connection.db?.collections();

      for (const collection of collections || []) {
        await collection.deleteMany({});
      }

      console.log("🧹 Test data cleaned successfully");
    } catch (error) {
      console.error("Error cleaning test data:", error);
      throw error;
    }
  }

  /**
   * Generate ObjectId
   */
  static generateObjectId(): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId();
  }

  /**
   * Validate ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Convert string to ObjectId
   */
  static toObjectId(id: string): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId(id);
  }

  /**
   * Aggregate data with common options
   */
  static async aggregateWithPagination<T>(
    model: mongoose.Model<any>,
    pipeline: any[],
    page = 1,
    limit = 10
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const skip = (page - 1) * limit;

    // Count total documents
    const countPipeline = [...pipeline, { $count: "total" }];

    const countResult = await model.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Get paginated data
    const dataPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];

    const data = await model.aggregate(dataPipeline);
    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }
}

export default DatabaseUtils;
