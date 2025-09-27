import { createHash } from "node:crypto";
import { promisify } from "node:util";
import {
  brotliCompress,
  brotliCompressSync,
  deflateSync,
  gzip,
  gzipSync,
} from "node:zlib";
import { Elysia } from "elysia";

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

type CompressionOptions = {
  threshold?: number;
  level?: number;
  chunkSize?: number;
  memLevel?: number;
  strategy?: number;
  enableBrotli?: boolean;
  enableGzip?: boolean;
  filter?: (contentType: string) => boolean;
};

type CacheOptions = {
  ttl?: number;
  maxSize?: number;
  strategy?: "lru" | "fifo";
  keyGenerator?: (request: any) => string;
  shouldCache?: (response: any) => boolean;
};

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
  enableCursor?: boolean;
  enableOffset?: boolean;
};

type ChunkingOptions = {
  chunkSize?: number;
  enableStreaming?: boolean;
  bufferSize?: number;
};

class ResponseCache {
  private readonly cache: Map<
    string,
    { data: any; timestamp: number; ttl: number }
  > = new Map();
  private readonly options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 300_000, // 5 minutes
      maxSize: options.maxSize || 1000,
      strategy: options.strategy || "lru",
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      shouldCache: options.shouldCache || this.defaultShouldCache,
    };
  }

  private defaultKeyGenerator(request: any): string {
    const url = request.url || "";
    const method = request.method || "GET";
    const query = JSON.stringify(request.query || {});
    const userId = request.user?.id || "anonymous";

    return createHash("sha256")
      .update(`${method}:${url}:${query}:${userId}`)
      .digest("hex");
  }

  private defaultShouldCache(response: any): boolean {
    if (!response || response.status !== 200) return false;

    const contentType = response.headers?.["content-type"] || "";

    // Cache JSON responses, avoid caching sensitive data
    return (
      contentType.includes("application/json") &&
      !contentType.includes("private") &&
      !response.headers?.["set-cookie"]
    );
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end for LRU
    if (this.options.strategy === "lru") {
      this.cache.delete(key);
      this.cache.set(key, item);
    }

    return item.data;
  }

  set(key: string, data: any, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl;

    // Evict oldest if at max size
    if (this.cache.size >= this.options.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  invalidate(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: no static only class
class PaginationHelper {
  static validateParams(
    query: any,
    options: PaginationOptions = {}
  ): {
    limit: number;
    offset?: number;
    cursor?: string;
    sort?: string;
    filter?: any;
  } {
    const defaultLimit = options.defaultLimit || 20;
    const maxLimit = options.maxLimit || 100;

    let limit = Number.parseInt(query.limit, 10) || defaultLimit;
    limit = Math.min(limit, maxLimit);

    const result: any = { limit };

    if (options.enableOffset !== false && query.page) {
      const page = Math.max(1, Number.parseInt(query.page, 10));
      result.offset = (page - 1) * limit;
    }

    if (options.enableCursor !== false && query.cursor) {
      result.cursor = query.cursor;
    }

    if (query.sort) {
      result.sort = query.sort;
    }

    if (query.filter) {
      try {
        result.filter = JSON.parse(query.filter);
      } catch (e) {
        // Ignore invalid filter JSON
      }
    }

    return result;
  }

  static buildResponse(
    data: any[],
    totalCount: number,
    params: any
  ): {
    data: any[];
    pagination: {
      total: number;
      count: number;
      limit: number;
      page?: number;
      totalPages?: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextCursor?: string;
      prevCursor?: string;
    };
  } {
    const count = data.length;
    const hasNext = totalCount > (params.offset || 0) + count;
    const hasPrev = (params.offset || 0) > 0;

    const pagination: any = {
      total: totalCount,
      count,
      limit: params.limit,
      hasNext,
      hasPrev,
    };

    if (params.offset !== undefined) {
      const currentPage = Math.floor(params.offset / params.limit) + 1;
      pagination.page = currentPage;
      pagination.totalPages = Math.ceil(totalCount / params.limit);
    }

    if (params.cursor) {
      if (hasNext && data.length > 0) {
        pagination.nextCursor = PaginationHelper.generateCursor(data.at(-1));
      }
      if (hasPrev && data.length > 0) {
        pagination.prevCursor = PaginationHelper.generateCursor(data[0]);
      }
    }

    return { data, pagination };
  }

  private static generateCursor(item: any): string {
    const cursorData = {
      id: item._id || item.id,
      timestamp: item.createdAt || item.updatedAt || new Date(),
    };
    return Buffer.from(JSON.stringify(cursorData)).toString("base64");
  }

  static parseCursor(cursor: string): { id: string; timestamp: Date } | null {
    try {
      const decoded = Buffer.from(cursor, "base64").toString();
      const data = JSON.parse(decoded);
      return {
        id: data.id,
        timestamp: new Date(data.timestamp),
      };
    } catch (e) {
      return null;
    }
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: no static only class
class FileChunking {
  // biome-ignore lint/suspicious/useAwait: use await
  static async *chunkStream(
    data: Buffer | Uint8Array,
    options: ChunkingOptions = {}
  ): AsyncGenerator<Buffer, void, unknown> {
    const chunkSize = options.chunkSize || 64 * 1024; // 64KB
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    for (let i = 0; i < buffer.length; i += chunkSize) {
      yield buffer.slice(i, i + chunkSize);
    }
  }

  static createStreamingResponse(
    data: Buffer | Uint8Array,
    contentType = "application/octet-stream",
    options: ChunkingOptions = {}
  ): Response {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of FileChunking.chunkStream(data, options)) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Transfer-Encoding": "chunked",
      },
    });
  }

  static getOptimalChunkSize(fileSize: number): number {
    if (fileSize < 1024 * 1024) return 8 * 1024; // 8KB for small files
    if (fileSize < 10 * 1024 * 1024) return 64 * 1024; // 64KB for medium files
    if (fileSize < 100 * 1024 * 1024) return 256 * 1024; // 256KB for large files
    return 1024 * 1024; // 1MB for very large files
  }
}

export function compressionPlugin(options: CompressionOptions = {}) {
  const config = {
    threshold: options.threshold || 1024, // 1KB
    level: options.level || 6,
    chunkSize: options.chunkSize || 16 * 1024,
    memLevel: options.memLevel || 8,
    strategy: options.strategy || 0,
    enableBrotli: options.enableBrotli !== false,
    enableGzip: options.enableGzip !== false,
    filter:
      options.filter ||
      ((contentType: string) =>
        // biome-ignore lint/performance/useTopLevelRegex: use top level regex
        /text|javascript|json|css|xml|svg/.test(contentType)),
  };

  return new Elysia({ name: "compression" }).onAfterHandle(
    async ({ response, headers, set }) => {
      if (!response || typeof response !== "object") return;

      const body = JSON.stringify(response);
      const bodySize = Buffer.byteLength(body);

      if (bodySize < config.threshold) return;

      const acceptEncoding = headers["accept-encoding"] || "";
      const contentType = set.headers?.["content-type"] || "application/json";

      if (!config.filter(contentType)) return;

      let compressed: Buffer | null = null;
      let encoding = "";

      // Prefer Brotli for better compression
      if (config.enableBrotli && acceptEncoding.includes("br")) {
        try {
          compressed = await brotliAsync(Buffer.from(body));
          encoding = "br";
        } catch (error) {
          console.warn("Brotli compression failed:", error);
        }
      }

      // Fallback to Gzip
      if (!compressed && config.enableGzip && acceptEncoding.includes("gzip")) {
        try {
          compressed = await gzipAsync(Buffer.from(body));
          encoding = "gzip";
        } catch (error) {
          console.warn("Gzip compression failed:", error);
        }
      }

      if (compressed && encoding) {
        set.headers = {
          ...(set.headers as any),
          "content-encoding": encoding,
          "content-length": compressed.length.toString(),
          vary: "Accept-Encoding",
        };

        return new Response(compressed, {
          headers: set.headers as any,
          status: set.status as any,
        });
      }
    }
  );
}

export function responseCachePlugin(options: CacheOptions = {}) {
  const cache = new ResponseCache(options);

  return new Elysia({ name: "response-cache" })
    .decorate("cache", cache)
    .onBeforeHandle(({ request, set }) => {
      if (request.method !== "GET") return;

      const cacheKey = cache.get("options").keyGenerator(request);
      const cachedResponse = cache.get(cacheKey);

      if (cachedResponse) {
        set.headers = {
          ...(set.headers as any),
          "x-cache": "HIT",
          "x-cache-key": cacheKey,
        };
        return cachedResponse;
      }

      // Mark for caching
      (request as any)._cacheKey = cacheKey;
    })
    .onAfterHandle(({ response, request, set }) => {
      const cacheKey = (request as any)._cacheKey;
      if (!cacheKey || request.method !== "GET") return;

      if (
        cache.get("options").shouldCache({
          ...(response as any),
          status: set.status,
          headers: set.headers,
        })
      ) {
        cache.set(cacheKey, response);
        set.headers = {
          ...(set.headers as any),
          "x-cache": "MISS",
          "x-cache-key": cacheKey,
        };
      }
    });
}

export function paginationPlugin(options: PaginationOptions = {}) {
  return (
    new Elysia({ name: "pagination" })
      .decorate("pagination", PaginationHelper)
      // .macro(({ onBeforeHandle }) => ({
      //   paginate: (enabled = true) => {
      // if (!enabled) return;
      //   .macro(() => ({
      //     paginate: (enabled = true) => {
      //       if (!enabled) return;
      //     }
      //   }))
      .onBeforeHandle(({ query, set }) => {
        try {
          const paginationParams = PaginationHelper.validateParams(
            query,
            options
          );
          (query as any)._pagination = paginationParams;

          set.headers = {
            ...(set.headers as any),
            "x-pagination-limit": paginationParams.limit.toString(),
          };
        } catch (error) {
          set.status = 400;
          return { error: "Invalid pagination parameters" };
        }
      })
  );
  //   },
  // }));
}

export function chunkingPlugin(options: ChunkingOptions = {}) {
  return new Elysia({ name: "chunking" })
    .decorate("chunking", FileChunking)
    .onAfterHandle(({ response, set }) => {
      // Auto-chunk large responses
      if (response instanceof Buffer || response instanceof Uint8Array) {
        const size = response.byteLength;
        const optimalChunkSize = FileChunking.getOptimalChunkSize(size);

        if (size > optimalChunkSize && options.enableStreaming !== false) {
          return FileChunking.createStreamingResponse(
            response,
            set.headers?.["content-type"] || "application/octet-stream",
            { ...options, chunkSize: optimalChunkSize }
          );
        }
      }
    });
}

export function optimizationPlugin(
  compressionOpts?: CompressionOptions,
  cacheOpts?: CacheOptions,
  paginationOpts?: PaginationOptions,
  chunkingOpts?: ChunkingOptions
) {
  return new Elysia({ name: "optimization" })
    .use(compressionPlugin(compressionOpts))
    .use(responseCachePlugin(cacheOpts))
    .use(paginationPlugin(paginationOpts))
    .use(chunkingPlugin(chunkingOpts))
    .onStart(() => {
      console.log("🚀 Response optimization plugins loaded");
    });
}

export function compression() {
  return new Elysia({ name: "compressResponses" })
    .mapResponse(({ request, response, set }) => {
      const isJson = typeof response === "object";
      const acceptEncoding = request.headers.get("Accept-Encoding") ?? "";
      const text = isJson
        ? JSON.stringify(response)
        : (response?.toString() ?? "");

      if (text.length < 2048) {
        return response as Response;
      }

      let encoding: "br" | "gzip" | "deflate" | null = null;

      if (acceptEncoding.includes("br")) {
        encoding = "br";
      } else if (acceptEncoding.includes("gzip")) {
        encoding = "gzip";
      } else if (acceptEncoding.includes("deflate")) {
        encoding = "deflate";
      }

      if (!encoding) {
        return response as Response;
      }

      set.headers["Content-Encoding"] = encoding;

      const encoded = (() => {
        const encodedText = Buffer.from(text, "utf-8");
        switch (encoding) {
          case "br":
            return brotliCompressSync(encodedText);
          case "gzip":
            return gzipSync(encodedText);
          case "deflate":
            return deflateSync(encodedText);
          default:
            return encodedText;
        }
      })();

      return new Response(encoded, {
        headers: {
          "Content-Type": `${isJson ? "application/json" : "text/plain"}; charset=utf-8`,
        },
      });
    })
    .as("scoped");
}

// Kenya-specific optimizations
export const optimizations = {
  compression: {
    // Optimize for mobile networks with slower connections
    threshold: 512, // Lower threshold for mobile optimization
    level: 9, // Higher compression for bandwidth savings
    enableBrotli: true,
    enableGzip: true,
    filter: (contentType: string) =>
      // Include more content types for mobile optimization
      // biome-ignore lint/performance/useTopLevelRegex: use top level regex
      /text|javascript|json|css|xml|svg|html|plain/.test(contentType),
  } as CompressionOptions,

  cache: {
    ttl: 600_000, // 10 minutes - longer cache for slower networks
    maxSize: 2000,
    strategy: "lru" as const,
    shouldCache: (response: any) => {
      // Cache more aggressively for Kenya
      return (
        response?.status === 200 &&
        !response.headers?.["set-cookie"] &&
        !response.headers?.authorization
      );
    },
  } as CacheOptions,

  pagination: {
    defaultLimit: 10, // Smaller page sizes for mobile
    maxLimit: 50,
    enableCursor: true,
    enableOffset: true,
  } as PaginationOptions,

  chunking: {
    chunkSize: 32 * 1024, // Smaller chunks for mobile networks
    enableStreaming: true,
    bufferSize: 128 * 1024,
  } as ChunkingOptions,
};

export {
  ResponseCache,
  PaginationHelper,
  FileChunking,
  type CompressionOptions,
  type CacheOptions,
  type PaginationOptions,
  type ChunkingOptions,
};
