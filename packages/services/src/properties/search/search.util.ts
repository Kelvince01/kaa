import type { GeoPoint } from "@kaa/utils";
import {
  SEARCH_CONFIG,
  SEARCH_FIELDS,
  type SearchEntityType,
  type SortOrder,
} from "./search.config";

/**
 * Search utilities and helper functions
 */

export type SearchFilters = {
  // Property filters
  propertyType?: string[];
  priceRange?: { min?: number; max?: number };
  bedrooms?: number[];
  bathrooms?: number[];
  furnished?: boolean;
  petsAllowed?: boolean;
  features?: string[];

  // Contractor filters
  specialties?: string[];
  serviceAreas?: string[];
  minRating?: number;
  emergencyAvailable?: boolean;

  // Common filters
  location?: GeoPoint & { distance?: string };
};

export type SearchOptions = {
  query?: string;
  filters?: SearchFilters;
  sort?: Array<{ field: string; order: SortOrder }>;
  pagination?: { page: number; limit: number };
  includeAggregations?: boolean;
  includeHighlights?: boolean;
};

export type ParsedSearchQuery = {
  textQuery?: any;
  filters: any[];
  sort: any[];
  from: number;
  size: number;
  highlight?: any;
  aggs?: any;
};

/**
 * Parse and validate search options
 */
export function parseSearchOptions(
  options: SearchOptions,
  entityType: SearchEntityType
): ParsedSearchQuery {
  const {
    query,
    filters,
    sort,
    pagination,
    includeAggregations,
    includeHighlights,
  } = options;
  const { page = 1, limit = SEARCH_CONFIG.elasticsearch.defaultPageSize } =
    pagination || {};

  // Validate pagination
  const validatedPage = Math.max(
    1,
    Math.min(page, SEARCH_CONFIG.validation.maxPage)
  );
  const validatedLimit = Math.max(
    1,
    Math.min(limit, SEARCH_CONFIG.validation.maxLimit)
  );

  const result: ParsedSearchQuery = {
    filters: [],
    sort: [],
    from: (validatedPage - 1) * validatedLimit,
    size: validatedLimit,
  };

  // Build text query
  if (query?.trim()) {
    const searchFields = SEARCH_FIELDS[entityType].text;
    result.textQuery = {
      multi_match: {
        query: query.trim(),
        fields: searchFields,
        type: "best_fields",
        fuzziness: SEARCH_CONFIG.elasticsearch.fuzziness,
      },
    };
  }

  // Build filters
  if (filters) {
    result.filters = buildFilters(filters, entityType);
  }

  // Build sort
  if (sort?.length) {
    result.sort = buildSort(sort, entityType);
  } else if (filters?.location) {
    result.sort = buildGeoDistanceSort(filters.location, entityType);
  } else if (query) {
    result.sort = [{ _score: { order: "desc" } }];
  } else {
    result.sort = [{ createdAt: { order: "desc" } }];
  }

  // Build highlights
  if (includeHighlights && SEARCH_CONFIG.features.enableHighlighting) {
    result.highlight = buildHighlight(entityType);
  }

  // Build aggregations
  if (includeAggregations && SEARCH_CONFIG.features.enableAggregations) {
    result.aggs = buildAggregations(entityType);
  }

  return result;
}

/**
 * Build Elasticsearch filters from search filters
 */
function buildFilters(
  filters: SearchFilters,
  entityType: SearchEntityType
): any[] {
  const esFilters: any[] = [];

  // Geo-distance filter
  if (filters.location) {
    const {
      lat,
      lon,
      distance = SEARCH_CONFIG.elasticsearch.defaultGeoDistance,
    } = filters.location;
    const geoField =
      entityType === "properties" ? "geolocation" : "address.coordinates";

    esFilters.push({
      geo_distance: {
        distance,
        [geoField]: { lat, lon },
      },
    });
  }

  if (entityType === "properties") {
    // Property-specific filters
    if (filters.propertyType?.length) {
      esFilters.push({ terms: { type: filters.propertyType } });
    }

    if (filters.priceRange) {
      const priceFilter: any = {};
      if (filters.priceRange.min !== undefined)
        priceFilter.gte = filters.priceRange.min;
      if (filters.priceRange.max !== undefined)
        priceFilter.lte = filters.priceRange.max;

      if (Object.keys(priceFilter).length > 0) {
        esFilters.push({ range: { "pricing.rentAmount": priceFilter } });
      }
    }

    if (filters.bedrooms?.length) {
      esFilters.push({ terms: { "details.bedrooms": filters.bedrooms } });
    }

    if (filters.bathrooms?.length) {
      esFilters.push({ terms: { "details.bathrooms": filters.bathrooms } });
    }

    if (filters.furnished !== undefined) {
      esFilters.push({ term: { "details.furnished": filters.furnished } });
    }

    if (filters.petsAllowed !== undefined) {
      esFilters.push({ term: { "details.petFriendly": filters.petsAllowed } });
    }

    if (filters.features?.length) {
      esFilters.push({ terms: { features: filters.features } });
    }

    // Always filter for available properties
    esFilters.push({ term: { available: true } });
  } else if (entityType === "contractors") {
    // Contractor-specific filters
    if (filters.specialties?.length) {
      esFilters.push({ terms: { specialties: filters.specialties } });
    }

    if (filters.serviceAreas?.length) {
      esFilters.push({ terms: { serviceAreas: filters.serviceAreas } });
    }

    if (filters.minRating !== undefined) {
      esFilters.push({ range: { averageRating: { gte: filters.minRating } } });
    }

    if (filters.emergencyAvailable !== undefined) {
      esFilters.push({
        term: { emergencyAvailable: filters.emergencyAvailable },
      });
    }

    if (filters.priceRange) {
      const rateFilter: any = {};
      if (filters.priceRange.min !== undefined)
        rateFilter.gte = filters.priceRange.min;
      if (filters.priceRange.max !== undefined)
        rateFilter.lte = filters.priceRange.max;

      if (Object.keys(rateFilter).length > 0) {
        esFilters.push({ range: { hourlyRate: rateFilter } });
      }
    }

    // Always filter for active contractors
    esFilters.push({ term: { status: "active" } });
  }

  return esFilters;
}

/**
 * Build Elasticsearch sort configuration
 */
function buildSort(
  sort: Array<{ field: string; order: SortOrder }>,
  entityType: SearchEntityType
): any[] {
  const esSort: any[] = [];
  const sortFields = SEARCH_FIELDS[entityType].sort;

  for (const { field, order } of sort) {
    if (field in sortFields) {
      const esField = sortFields[field as keyof typeof sortFields];
      esSort.push({ [esField]: { order } });
    }
  }

  return esSort;
}

/**
 * Build geo-distance sort for location-based searches
 */
function buildGeoDistanceSort(
  location: GeoPoint,
  entityType: SearchEntityType
): any[] {
  const geoField =
    entityType === "properties" ? "geolocation" : "address.coordinates";

  return [
    {
      _geo_distance: {
        [geoField]: {
          lat: location.lat,
          lon: location.lon,
        },
        order: "asc",
        unit: "km",
      },
    },
  ];
}

/**
 * Build highlight configuration
 */
function buildHighlight(entityType: SearchEntityType): any {
  const highlightFields = SEARCH_FIELDS[entityType].highlight;
  const fields: any = {};

  for (const field of highlightFields) {
    fields[field] = {
      fragment_size: SEARCH_CONFIG.elasticsearch.highlightFragmentSize,
      number_of_fragments:
        SEARCH_CONFIG.elasticsearch.highlightNumberOfFragments,
    };
  }

  return { fields };
}

/**
 * Build aggregations configuration
 */
function buildAggregations(entityType: SearchEntityType): any {
  // Import aggregations from config
  const { AGGREGATIONS } = require("./search.config");
  return AGGREGATIONS[entityType];
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return "";
  }

  // Remove potentially harmful characters and limit length
  const sanitized = query
    .trim()
    .slice(0, SEARCH_CONFIG.validation.maxQueryLength)
    .replace(/[<>"']/g, "") // Remove HTML/script injection chars
    .replace(/\s+/g, " "); // Normalize whitespace

  return sanitized;
}

/**
 * Validate search filters
 */
export function validateSearchFilters(filters: SearchFilters): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate price range
  if (filters.priceRange) {
    const { min, max } = filters.priceRange;

    if (
      min !== undefined &&
      (min < SEARCH_CONFIG.validation.minPriceValue ||
        min > SEARCH_CONFIG.validation.maxPriceValue)
    ) {
      errors.push(
        `Minimum price must be between ${SEARCH_CONFIG.validation.minPriceValue} and ${SEARCH_CONFIG.validation.maxPriceValue}`
      );
    }

    if (
      max !== undefined &&
      (max < SEARCH_CONFIG.validation.minPriceValue ||
        max > SEARCH_CONFIG.validation.maxPriceValue)
    ) {
      errors.push(
        `Maximum price must be between ${SEARCH_CONFIG.validation.minPriceValue} and ${SEARCH_CONFIG.validation.maxPriceValue}`
      );
    }

    if (min !== undefined && max !== undefined && min > max) {
      errors.push("Minimum price cannot be greater than maximum price");
    }
  }

  // Validate location
  if (filters.location) {
    const { lat, lon } = filters.location;

    if (
      lat < SEARCH_CONFIG.validation.minLatitude ||
      lat > SEARCH_CONFIG.validation.maxLatitude
    ) {
      errors.push("Invalid latitude value");
    }

    if (
      lon < SEARCH_CONFIG.validation.minLongitude ||
      lon > SEARCH_CONFIG.validation.maxLongitude
    ) {
      errors.push("Invalid longitude value");
    }
  }

  // Validate arrays length
  const arrayFields = [
    "propertyType",
    "bedrooms",
    "bathrooms",
    "features",
    "specialties",
    "serviceAreas",
  ];
  for (const field of arrayFields) {
    const value = filters[field as keyof SearchFilters] as any[];
    if (
      value &&
      Array.isArray(value) &&
      value.length > SEARCH_CONFIG.validation.maxFiltersPerRequest
    ) {
      errors.push(
        `Too many ${field} filters (max: ${SEARCH_CONFIG.validation.maxFiltersPerRequest})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Build search response with metadata
 */
export function buildSearchResponse<T>(
  hits: any[],
  total: number,
  aggregations: any,
  pagination: { page: number; limit: number },
  responseTime?: number
): {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  aggregations?: any;
  meta: {
    responseTime?: number;
    timestamp: string;
  };
} {
  return {
    items: hits.map((hit) => ({
      ...hit._source,
      _id: hit._id,
      _score: hit._score,
      highlight: hit.highlight,
    })),
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(total / pagination.limit),
    },
    aggregations,
    meta: {
      responseTime,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Extract search terms from query for analytics
 */
export function extractSearchTerms(query: string): string[] {
  if (!query || typeof query !== "string") {
    return [];
  }

  return (
    query
      .toLowerCase()
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      .split(/\s+/)
      .filter((term) => term.length >= 2)
      .slice(0, 10)
  ); // Limit to 10 terms
}

/**
 * Calculate search relevance score
 */
export function calculateRelevanceScore(hit: any, query?: string): number {
  let score = hit._score || 0;

  // Boost score based on various factors
  if (hit._source) {
    // Boost for exact matches in title
    if (
      query &&
      hit._source.title?.toLowerCase().includes(query.toLowerCase())
    ) {
      score *= 1.5;
    }

    // Boost for recent items
    if (hit._source.createdAt) {
      const daysSinceCreated =
        (Date.now() - new Date(hit._source.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 30) {
        score *= 1.2;
      }
    }

    // Boost for verified items
    if (hit._source.verified) {
      score *= 1.1;
    }
  }

  return Math.round(score * 100) / 100;
}
