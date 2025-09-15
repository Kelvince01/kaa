import config from "@kaa/config/api";
import { createClient, type RedisClientType } from "redis";
import { logger } from "./logger.util";

// Parse Redis URI
const parseRedisUri = (uri: string) => {
  // biome-ignore lint/performance/useTopLevelRegex: false positive
  const regex = /redis:\/\/(?:([^:]+):([^@]+)@)?([^:]+)(?::(\d+))?(?:\/(\d+))?/;
  const match = uri.match(regex);

  if (!match) {
    throw new Error("Invalid Redis URI");
  }

  return {
    username: match[1],
    password: match[2],
    host: match[3] || "localhost",
    port: match[4] || "6379",
    database: match[5] || "0",
  };
};

export const redisConfig = parseRedisUri(config.redisUrl);

// Create Redis client
const redisClient: RedisClientType = createClient({
  url: config.redisUrl,
});

// Connect to Redis
(async () => {
  redisClient.on("error", (err: Error) => {
    logger.error(`Redis Error: ${err}`);
  });

  redisClient.on("connect", () => {
    logger.info("Redis connected");
  });

  await redisClient.connect();
})();

/*** Returns JSON parsed data */
export const redisGet = async <T>(key: string): Promise<T | null> => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

/*** Returns true/false depending on success or failure of retrieving data of that key
 ** lifespan: minutes
 */
export const redisSet = async (
  key: string,
  data: any,
  lifespan = 5
): Promise<boolean> => {
  return (
    (await redisClient.set(key, JSON.stringify(data), {
      EX: lifespan * 60,
    })) === "OK"
  );
};

/*** Returns a number after deleting data of the specified key
 */
export const redisDel = async (key: string): Promise<number> => {
  return await redisClient.del(key);
};

/*** Search for Keys by pattern
 */
export const redisKeys = async (pattern: string): Promise<string[]> => {
  return await redisClient.keys(pattern);
};

/*** Check if provided Key & Data exists in cache.
 * Returns a number
 */
export const redisExists = async (key: string): Promise<number> => {
  return await redisClient.exists(key);
};

/*** Returns all available data by key */
export const redisGetAll = async <T>(
  key: string
): Promise<Record<string, string> | null> => {
  return await redisClient.hGetAll(key);
};

// Auth

/*** Add JWT to the blacklist */
export async function blacklistToken(token: string, expiry: number) {
  await redisClient.set(`blacklist:${token}`, "true", { EX: expiry });
}

/*** Check if JWT is blacklisted */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const result = await redisClient.get(`blacklist:${token}`);
  return result === "true";
}

class RedisMessagingService {
  private readonly publisher: RedisClientType;
  private readonly subscriber: RedisClientType;

  constructor(redisUrl = config.redisUrl) {
    this.publisher = createClient({ url: redisUrl });
    this.subscriber = createClient({ url: redisUrl });
  }

  /**
   * Publish a message to a channel
   * @param channel - The name of the channel
   * @param message - The message payload (JSON, string, etc.)
   */
  publish(channel: string, message: any): void {
    const payload =
      typeof message === "string" ? message : JSON.stringify(message);
    this.publisher.publish(channel, payload);
  }

  /**
   * Subscribe to a channel and execute a callback on message reception
   * @param channel - The name of the channel
   * @param callback - The function to call when a message is received
   */
  subscribe(channel: string, callback: (message: string) => void): void {
    this.subscriber.subscribe(channel, (err: any, count: any) => {
      if (err) {
        console.error(`Failed to subscribe to channel ${channel}:`, err);
        return;
      }
      console.log(
        `Subscribed to ${channel}. Listening to ${count} channel(s).`
      );
    });

    this.subscriber.on(
      "message",
      (subscribedChannel: string, message: string) => {
        if (subscribedChannel === channel) {
          callback(message);
        }
      }
    );
  }

  /**
   * Close the Redis connections
   */
  close(): void {
    this.publisher.destroy();
    this.subscriber.destroy();
  }
}

export const redisMessagingService = new RedisMessagingService();
export const redisConnection = redisClient;

/*** Clear cache by pattern */
export const clearCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cache cleared for pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error(`Clear Cache Error: ${error}`);
  }
};

export { redisClient };
