import { searchAnalyticsService } from "@kaa/services";
import { logger } from "@kaa/utils";
import { Elysia } from "elysia";

/**
 * Search middleware for analytics tracking and performance monitoring
 */
export const searchMiddleware = new Elysia({ name: "search-middleware" })
  .derive(({ headers }) => {
    const startTime = Date.now();
    const sessionId = headers["x-session-id"] || "anonymous";
    const userId = headers["x-user-id"];
    const userAgent = headers["user-agent"] || "";

    // Determine source from user agent
    const source = userAgent.includes("Mobile") ? "mobile" : "web";

    return {
      searchContext: {
        startTime,
        sessionId,
        userId,
        source: source as "web" | "mobile" | "api",
        userAgent,
      },
    };
  })
  .onAfterHandle(({ searchContext, query, response, path }) => {
    try {
      const endTime = Date.now();
      const responseTime = endTime - searchContext.startTime;

      // Only track search endpoints
      if (!(path.includes("/search") || path.includes("/nearby"))) {
        return;
      }

      // Extract search parameters
      const searchQuery = (query as any)?.q;
      const lat = (query as any)?.lat;
      const lon = (query as any)?.lon;
      const searchType = path.includes("/contractors")
        ? "contractors"
        : "properties";

      // Extract result count from response
      let resultCount = 0;
      if (response && typeof response === "object" && "data" in response) {
        const data = (response as any).data;
        if (data?.properties?.length) {
          resultCount = data.properties.length;
        } else if (data?.contractors?.length) {
          resultCount = data.contractors.length;
        } else if (data?.items?.length) {
          resultCount = data.items.length;
        } else if (data?.total) {
          resultCount = data.total;
        }
      }

      // Build filters object
      const filters: Record<string, any> = {};
      const queryObj = query as Record<string, any>;

      // Common filters
      if (queryObj.propertyType) filters.propertyType = queryObj.propertyType;
      if (queryObj.minPrice) filters.minPrice = queryObj.minPrice;
      if (queryObj.maxPrice) filters.maxPrice = queryObj.maxPrice;
      if (queryObj.bedrooms) filters.bedrooms = queryObj.bedrooms;
      if (queryObj.bathrooms) filters.bathrooms = queryObj.bathrooms;
      if (queryObj.furnished !== undefined)
        filters.furnished = queryObj.furnished;
      if (queryObj.petsAllowed !== undefined)
        filters.petsAllowed = queryObj.petsAllowed;
      if (queryObj.features) filters.features = queryObj.features;
      if (queryObj.specialties) filters.specialties = queryObj.specialties;
      if (queryObj.serviceAreas) filters.serviceAreas = queryObj.serviceAreas;
      if (queryObj.minRating) filters.minRating = queryObj.minRating;
      if (queryObj.emergencyAvailable !== undefined)
        filters.emergencyAvailable = queryObj.emergencyAvailable;

      // Track the search event
      searchAnalyticsService.trackSearch({
        query: searchQuery,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        location:
          lat && lon ? { lat: Number(lat), lon: Number(lon) } : undefined,
        resultCount,
        responseTime,
        userId: searchContext.userId,
        sessionId: searchContext.sessionId,
        searchType,
        source: searchContext.source,
      });

      // Log slow searches
      if (responseTime > 2000) {
        logger.warn("Slow search detected", {
          path,
          query: searchQuery,
          responseTime,
          resultCount,
          userId: searchContext.userId,
        });
      }
    } catch (error) {
      logger.error("Error in search middleware:", error);
    }
  });

/**
 * Search rate limiting middleware
 */
export const searchRateLimitMiddleware = new Elysia({
  name: "search-rate-limit",
})
  .derive(({ headers }) => {
    const clientId =
      headers["x-client-id"] || headers["x-forwarded-for"] || "unknown";
    return { clientId };
  })
  .onBeforeHandle(({ clientId, set }) => {
    // Simple in-memory rate limiting (in production, use Redis)
    const rateLimitStore = new Map<
      string,
      { count: number; resetTime: number }
    >();
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // 100 requests per minute

    const key = `search:${clientId}`;
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (current.count >= maxRequests) {
      set.status = 429;
      return {
        status: "error",
        message: "Too many search requests. Please try again later.",
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      };
    }

    current.count++;
  });

/**
 * Search validation middleware
 */
export const searchValidationMiddleware = new Elysia({
  name: "search-validation",
}).onBeforeHandle(({ query, set }) => {
  const queryObj = query as Record<string, any>;

  // Validate geo coordinates
  if (queryObj.lat !== undefined || queryObj.lon !== undefined) {
    const lat = Number(queryObj.lat);
    const lon = Number(queryObj.lon);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      set.status = 400;
      return {
        status: "error",
        message: "Invalid latitude or longitude coordinates",
      };
    }
  }

  // Validate distance
  if (queryObj.distance) {
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const distanceRegex = /^\d+(\.\d+)?(km|m|mi|yd)$/i;
    if (!distanceRegex.test(queryObj.distance)) {
      set.status = 400;
      return {
        status: "error",
        message:
          'Invalid distance format. Use format like "10km", "5mi", "1000m"',
      };
    }
  }

  // Validate pagination
  if (queryObj.page !== undefined) {
    const page = Number(queryObj.page);
    if (Number.isNaN(page) || page < 1 || page > 1000) {
      set.status = 400;
      return {
        status: "error",
        message: "Invalid page number. Must be between 1 and 1000",
      };
    }
  }

  if (queryObj.limit !== undefined) {
    const limit = Number(queryObj.limit);
    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      set.status = 400;
      return {
        status: "error",
        message: "Invalid limit. Must be between 1 and 100",
      };
    }
  }

  // Validate price range
  if (queryObj.minPrice !== undefined || queryObj.maxPrice !== undefined) {
    const minPrice = queryObj.minPrice ? Number(queryObj.minPrice) : 0;
    const maxPrice = queryObj.maxPrice
      ? Number(queryObj.maxPrice)
      : Number.MAX_SAFE_INTEGER;

    if (
      Number.isNaN(minPrice) ||
      Number.isNaN(maxPrice) ||
      minPrice < 0 ||
      maxPrice < 0 ||
      minPrice > maxPrice
    ) {
      set.status = 400;
      return {
        status: "error",
        message: "Invalid price range",
      };
    }
  }
});
