/**
 * Search module types and interfaces
 * Mirrors the backend search API types
 */

import type { Property } from "../property.type";

export type PropertyType =
  | "apartment"
  | "house"
  | "studio"
  | "townhouse"
  | "villa";

export type SortBy =
  | "relevance"
  | "price"
  | "bedrooms"
  | "size"
  | "createdAt"
  | "distance";

export type SortOrder = "asc" | "desc";

/**
 * Basic search parameters for properties
 */
export type PropertySearchParams = {
  // Basic search
  query?: string;
  location?: string;

  // Property type
  propertyType?: PropertyType | PropertyType[];

  // Price filters
  minPrice?: number;
  maxPrice?: number;

  // Room filters
  bedrooms?: number;
  bathrooms?: number;

  // Boolean filters
  furnished?: boolean;
  petsAllowed?: boolean;

  // Date filters
  availableFrom?: string;

  // Features/amenities
  features?: string[];

  // Geo-location search
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers

  // Sorting
  sortBy?: SortBy;
  sortOrder?: SortOrder;

  // Pagination
  page?: number;
  limit?: number;
};

/**
 * Advanced search parameters with additional filters
 */
export type AdvancedSearchParams = PropertySearchParams & {
  // Text search query
  q?: string;

  // Geo-location with specific format
  lat?: number;
  lon?: number;
  distance?: string; // e.g., "10km"

  // Additional filters
  minSize?: number;
  maxSize?: number;
  verified?: boolean;
  featured?: boolean;
};

/**
 * Saved search interface
 */
export type SavedSearch = {
  _id: string;
  user: string;
  name: string;
  searchParams: PropertySearchParams;
  alertsEnabled: boolean;
  frequency?: "daily" | "weekly" | "instant";
  lastNotified?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Search result metadata
 */
export type SearchMetadata = {
  query?: string;
  totalResults: number;
  page: number;
  limit: number;
  pages: number;
  filters: PropertySearchParams;
  searchTime?: number; // milliseconds
};

/**
 * Search response structure
 */
export type SearchResponse<T> = {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  metadata?: SearchMetadata;
  message?: string;
};

/**
 * Search response structure
 */
export type PropertySearchResponse = {
  success: boolean;
  properties: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  metadata?: SearchMetadata;
  message?: string;
};

/**
 * Search suggestions response
 */
export type SearchSuggestion = {
  text: string;
  type: "location" | "property_type" | "feature" | "recent" | "popular";
  count?: number;
  icon?: string;
};

/**
 * Search analytics event
 */
export type SearchAnalyticsEvent = {
  query: string;
  filters?: PropertySearchParams;
  resultCount: number;
  responseTime: number;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  noResults?: boolean;
  selectedResultId?: string;
  selectedResultPosition?: number;
};

/**
 * Search filter options (for UI)
 */
export type SearchFilterOptions = {
  propertyTypes: Array<{ value: PropertyType; label: string; count?: number }>;
  priceRanges: Array<{ min?: number; max?: number; label: string }>;
  bedroomOptions: Array<{ value: number; label: string }>;
  bathroomOptions: Array<{ value: number; label: string }>;
  features: Array<{ value: string; label: string; icon?: string }>;
  locations: Array<{
    value: string;
    label: string;
    coordinates?: [number, number];
  }>;
};

/**
 * Search state management
 */
export type SearchState = {
  query: string;
  filters: PropertySearchParams;
  isSearching: boolean;
  results: any[];
  totalResults: number;
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  savedSearches: SavedSearch[];
};

/**
 * Nearby search parameters
 */
export type NearbySearchParams = {
  latitude: number;
  longitude: number;
  radius?: number; // in kilometers
  limit?: number;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
};

/**
 * Create saved search payload
 */
export type CreateSavedSearchPayload = {
  name: string;
  searchParams: PropertySearchParams;
  alertsEnabled?: boolean;
  frequency?: "daily" | "weekly" | "instant";
};

/**
 * Update saved search payload
 */
export type UpdateSavedSearchPayload = Partial<CreateSavedSearchPayload>;

/**
 * Search alert notification
 */
export type SearchAlert = {
  _id: string;
  savedSearch: SavedSearch;
  newProperties: string[]; // Property IDs
  sentAt: string;
  viewed: boolean;
};
