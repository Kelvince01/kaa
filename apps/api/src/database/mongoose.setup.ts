import config from "@kaa/config/api";
import { logger } from "@kaa/utils";
import mongoose from "mongoose";

// Database connection
class MongooseSetup {
  private count = 0;
  private readonly mongooseOptions: mongoose.ConnectOptions = {};
  // Create read-only connection for read operations
  readOnlyConnection: mongoose.Connection | null = null;

  constructor() {
    this.mongooseOptions = {
      maxPoolSize:
        config.env === "production"
          ? 10
          : Number.parseInt(process.env.MONGODB_POOL_SIZE || "5", 5),
      minPoolSize: 2,
      socketTimeoutMS: 45_000,
      connectTimeoutMS: 30_000,
      serverSelectionTimeoutMS: 5000,
      family: 4,
      retryWrites: true,
      w: "majority",
    };

    // Connect to MongoDB only if not already connected
    if (
      config.env !== ("test" as const) &&
      mongoose.connection.readyState === 0
    ) {
      this.connectWithRetry();
    }

    // if (config.env === "development") {
    // 	mongoose.set("debug", true);
    // }
  }

  getMongoose() {
    return mongoose;
  }

  connectWithRetry = () => {
    if (!config.mongoUri) {
      logger.error("MongoDB URI is not defined");
      return;
    }

    try {
      // log("Attempting MongoDB connection (will retry if needed)");
      mongoose
        .connect(config.mongoUri, this.mongooseOptions)
        .then((conn) => {
          logger.info(`MongoDB Connected: ${conn.connection.host}`);
        })
        .catch((err) => {
          const retrySeconds = 5;
          logger.error(
            `MongoDB connection unsuccessful (will retry #${++this
              .count} after ${retrySeconds} seconds):`,
            err
          );
          logger.error(`MongoDB connection error: ${err.message}`);
          setTimeout(this.connectWithRetry, retrySeconds * 1000);
          process.exit(1);
        });

      // Handle connection events
      mongoose.connection.on("error", (err) => {
        logger.error("❌ MongoDB connection error:", { extra: err });
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("⚠️ MongoDB disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("🔄 MongoDB reconnected");
      });

      // Handle process termination
      process.on("SIGINT", async () => {
        try {
          await mongoose.connection.close();
          logger.info("📴 MongoDB connection closed through app termination");
          process.exit(0);
        } catch (error) {
          console.error("Error closing MongoDB connection:", error);
          process.exit(1);
        }
      });
    } catch (error) {
      logger.error("❌ Error connecting to MongoDB:", { extra: error });
    }
  };

  getReadOnlyConnection = async (): Promise<mongoose.Connection> => {
    if (this.readOnlyConnection && this.readOnlyConnection.readyState === 1) {
      return this.readOnlyConnection;
    }

    try {
      const mongoReadURI =
        process.env.MONGODB_READ_URI || process.env.MONGODB_URI;

      if (!mongoReadURI) {
        throw new Error(
          "MongoDB read URI is not defined in environment variables"
        );
      }

      // Create a separate connection for read operations
      this.readOnlyConnection = await mongoose
        .createConnection(mongoReadURI, this.mongooseOptions)
        .asPromise();
      logger.info("Connected to MongoDB read replica");

      // Handle connection errors
      this.readOnlyConnection.on("error", (error) => {
        logger.error("MongoDB read replica connection error:", error);
      });

      // Handle disconnection
      this.readOnlyConnection.on("disconnected", () => {
        logger.warn("MongoDB read replica disconnected");
        this.readOnlyConnection = null;
      });

      return this.readOnlyConnection;
    } catch (error) {
      logger.error("MongoDB read replica connection error:", error);
      // Fallback to primary connection if read replica is unavailable
      return mongoose.connection;
    }
  };

  // Create a read model that uses the read replica
  createReadModel = <T, U>(
    model: mongoose.Model<T, U>
  ): mongoose.Model<T, U> => {
    const modelName = model.modelName;
    const schema = model.schema;

    return {
      ...model,
      find: async (...args: any[]) => {
        const conn = await this.getReadOnlyConnection();
        // @ts-expect-error
        return conn.model(modelName, schema).find(...args);
      },
      findOne: async (...args: any[]) => {
        const conn = await this.getReadOnlyConnection();
        return conn.model(modelName, schema).findOne(...args);
      },
      findById: async (...args: any[]) => {
        const conn = await this.getReadOnlyConnection();
        // @ts-expect-error
        return conn.model(modelName, schema).findById(...args);
      },
      countDocuments: async (...args: any[]) => {
        const conn = await this.getReadOnlyConnection();
        return conn.model(modelName, schema).countDocuments(...args);
      },
      aggregate: async (...args: any[]) => {
        const conn = await this.getReadOnlyConnection();
        return conn.model(modelName, schema).aggregate(...args);
      },
    } as mongoose.Model<T, U>;
  };

  disconnectDB = async (): Promise<void> => {
    try {
      await mongoose.connection.close();
      logger.info("📴 MongoDB disconnected");
    } catch (error) {
      logger.error("❌ Error disconnecting from MongoDB:", { extra: error });
    }
  };

  checkDBHealth = (): boolean => {
    try {
      const state = mongoose.connection.readyState;
      return state === 1; // 1 = connected
    } catch (error) {
      logger.error("❌ Database health check failed:", { extra: error });
      return false;
    }
  };

  // Health check function
  isDatabaseConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  // Get connection info
  getConnectionInfo() {
    return {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }
}

export { MongooseSetup };
