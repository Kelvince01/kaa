/**
 * Property Favourites Types
 *
 * This module provides type definitions for property favourites management
 * including adding, removing, and listing favourite properties.
 */

import type { User } from "../../users/user.type";
import type { Property } from "../property.type";

/**
 * Main favourite interface
 */
export type Favourite = {
  _id: string;
  user: string | User;
  property: string | Property;
  createdAt: string;
  updatedAt: string;

  // Additional fields for frontend
  propertyTitle?: string;
  propertyAddress?: string;
  propertyPrice?: number;
  propertyImage?: string;
  propertyStatus?: string;
  propertyType?: string;
  addedDate?: string;
};

/**
 * Favourite creation input
 */
export type AddFavouriteInput = {
  propertyId: string;
};

/**
 * Favourite removal input
 */
export type RemoveFavouriteInput = {
  propertyId: string;
};

/**
 * Favourite query parameters
 */
export type FavouriteQueryParams = {
  userId?: string;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  sortBy?: "createdAt" | "propertyTitle" | "propertyPrice" | "addedDate";
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
  search?: string;
};

/**
 * Favourite filters
 */
export type FavouriteFilters = {
  propertyTypes?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  locations?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  availability?: "available" | "rented" | "sold" | "all";
};

/**
 * Favourite statistics
 */
export type FavouriteStats = {
  total: number;
  byPropertyType: Record<string, number>;
  byLocation: Record<string, number>;
  averagePrice: number;
  recentlyAdded: number;
  availableProperties: number;
  rentedProperties: number;
  soldProperties: number;
};

/**
 * Favourite list item for display
 */
export type FavouriteListItem = {
  _id: string;
  propertyId: string;
  title: string;
  address: string;
  price: number;
  currency: string;
  propertyType: string;
  status: string;
  image: string;
  addedAt: string;
  isAvailable: boolean;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  landlordName?: string;
  landlordContact?: string;
};

/**
 * Bulk favourite operations
 */
export type BulkFavouriteOperation = {
  propertyIds: string[];
  operation: "add" | "remove" | "export";
};

/**
 * Favourite comparison data
 */
export type FavouriteComparison = {
  properties: Array<{
    property: Property;
    favourite: Favourite;
  }>;
  comparisonFields: string[];
  generatedAt: string;
};

/**
 * Pagination interface
 */
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/**
 * Base API response interface
 */
export type ApiResponse<T> = {
  status: "success" | "error";
  message?: string;
  data?: T;
};

/**
 * Favourite API responses
 */
export interface FavouriteResponse extends ApiResponse<Favourite> {
  favourite?: Favourite;
}

export interface FavouriteListResponse
  extends ApiResponse<FavouriteListItem[]> {
  favourites?: FavouriteListItem[];
  items?: FavouriteListItem[];
  pagination: Pagination;
}

export interface FavouriteStatsResponse extends ApiResponse<FavouriteStats> {
  stats?: FavouriteStats;
}

export interface FavouriteComparisonResponse
  extends ApiResponse<FavouriteComparison> {
  comparison?: FavouriteComparison;
}

/**
 * Favourite status check response
 */
export type FavouriteStatusResponse = {
  isFavourite: boolean;
  favouriteId?: string;
  addedAt?: string;
  status: string;
};

/**
 * Favourite notification preferences
 */
export type FavouriteNotificationSettings = {
  priceChanges: boolean;
  statusChanges: boolean;
  similarProperties: boolean;
  marketUpdates: boolean;
  channels: ("email" | "sms" | "push")[];
};

/**
 * Property watch list item
 */
export type WatchListItem = {
  _id: string;
  user: string;
  searchCriteria: {
    location?: string;
    propertyType?: string;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    bathrooms?: number;
    keywords?: string[];
  };
  alertFrequency: "instant" | "daily" | "weekly";
  isActive: boolean;
  lastNotified?: string;
  matchesCount: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Watch list creation input
 */
export type CreateWatchListInput = {
  searchCriteria: WatchListItem["searchCriteria"];
  alertFrequency: WatchListItem["alertFrequency"];
  name?: string;
};

/**
 * Recently viewed properties
 */
export type RecentlyViewed = {
  _id: string;
  user: string;
  property: string | Property;
  viewedAt: string;
  viewCount: number;
  lastViewDuration?: number; // in seconds
};

/**
 * Property recommendation
 */
export type PropertyRecommendation = {
  property: Property;
  score: number;
  reasons: string[];
  basedOn: "favourites" | "viewed" | "searches" | "similar_users";
  confidence: "high" | "medium" | "low";
};

/**
 * Export options for favourites
 */
export type FavouriteExportOptions = {
  format: "csv" | "xlsx" | "pdf";
  includeImages: boolean;
  includeDetails: boolean;
  fields: string[];
  filters?: FavouriteFilters;
};

/**
 * Favourite sharing options
 */
export type FavouriteShareOptions = {
  propertyIds: string[];
  shareWith: string[]; // email addresses
  message?: string;
  includeComparison?: boolean;
  expiresAt?: string;
};

/**
 * Saved search interface
 */
export type SavedSearch = {
  _id: string;
  user: string;
  name: string;
  searchParams: FavouriteQueryParams;
  alertsEnabled: boolean;
  lastRun?: string;
  resultsCount?: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Property alert interface
 */
export type PropertyAlert = {
  _id: string;
  user: string;
  property: string;
  alertType: "price_change" | "status_change" | "new_photos" | "back_on_market";
  oldValue?: string;
  newValue?: string;
  notified: boolean;
  notifiedAt?: string;
  createdAt: string;
};
