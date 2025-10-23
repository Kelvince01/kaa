/**
 * Properties page specific types and interfaces
 */

export type PropertySearchFilters = {
  // Basic search
  query?: string;
  location?: string;

  // Price filters
  minPrice?: number;
  maxPrice?: number;

  // Property details
  type?: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;

  // Features and amenities
  features?: string[];
  amenities?: string[];
  furnished?: boolean;
  petsAllowed?: boolean;

  // Location filters
  coordinates?: [number, number];
  radius?: number; // in kilometers

  // Sorting
  sortBy?: "price" | "bedrooms" | "size" | "createdAt" | "distance";
  sortOrder?: "asc" | "desc";

  // Pagination
  page?: number;
  limit?: number;
};

export type PropertyListViewConfig = {
  viewMode: "list" | "grid" | "map";
  showMap: boolean;
  mapHeight: number;
  gridColumns: 1 | 2 | 3 | 4;
  showFilters: boolean;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type PropertyMapMarker = {
  id: string;
  coordinates: [number, number];
  price: number;
  type: string;
  title: string;
  image?: string;
  isSelected?: boolean;
  isFeatured?: boolean;
};

export type SavedSearch = {
  id: string;
  name: string;
  filters: PropertySearchFilters;
  alertsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PropertyViewState = {
  selectedPropertyId?: string;
  hoveredPropertyId?: string;
  mapCenter: [number, number];
  mapZoom: number;
  mapBounds?: MapBounds;
};
