import { config } from "@kaa/config";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AIRecommendation,
  MarketInsights,
  NearbyAmenity,
  Property,
  PropertyAnalytics,
  PropertyComparison,
  PropertySearchParams,
  SavedSearch,
} from "./property.type";

type PropertyStore = {
  // UI State
  selectedProperties: string[];
  selectedProperty: Property | null;
  isPropertyModalOpen: boolean;
  isPropertyFormOpen: boolean;
  isPropertyFiltersOpen: boolean;
  viewMode: "grid" | "list" | "map";
  sortBy: "price" | "bedrooms" | "bathrooms" | "size" | "createdAt";
  sortOrder: "asc" | "desc";

  // Filter State
  currentFilters: PropertySearchParams;
  appliedFilters: PropertySearchParams;

  // AI Features State
  aiRecommendations: AIRecommendation[];
  isLoadingAI: boolean;
  aiGeneratedDescription: string | null;

  // Location Features State
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number;
  nearbyAmenities: NearbyAmenity[];
  selectedLocation: { lat: number; lng: number } | null;

  // Analytics State
  propertyAnalytics: PropertyAnalytics | null;
  marketInsights: MarketInsights | null;
  selectedPropertyForAnalytics: string | null;

  // Search State
  savedSearches: SavedSearch[];
  searchSuggestions: string[];
  recentSearches: string[];

  // Comparison State
  comparisonProperties: Property[];
  comparisonData: PropertyComparison | null;

  // Virtual Tour State
  virtualTourUrl: string | null;
  isVirtualTourOpen: boolean;

  // Actions for UI state management
  setSelectedProperties: (propertyIds: string[]) => void;
  setSelectedProperty: (property: Property) => void;
  togglePropertySelection: (propertyId: string) => void;
  clearSelectedProperties: () => void;
  setPropertyModalOpen: (isOpen: boolean) => void;
  setPropertyFormOpen: (isOpen: boolean) => void;
  setPropertyFiltersOpen: (isOpen: boolean) => void;
  setViewMode: (mode: "grid" | "list" | "map") => void;
  setSortBy: (
    sortBy: "price" | "bedrooms" | "bathrooms" | "size" | "createdAt"
  ) => void;
  setSortOrder: (order: "asc" | "desc") => void;

  // Filter actions
  setCurrentFilters: (filters: PropertySearchParams) => void;
  setAppliedFilters: (filters: PropertySearchParams) => void;
  clearFilters: () => void;
  updateFilter: (key: keyof PropertySearchParams, value: any) => void;

  // AI Features actions
  setAIRecommendations: (recommendations: AIRecommendation[]) => void;
  setIsLoadingAI: (loading: boolean) => void;
  setAIGeneratedDescription: (description: string | null) => void;

  // Location Features actions
  setMapCenter: (center: { lat: number; lng: number } | null) => void;
  setMapZoom: (zoom: number) => void;
  setNearbyAmenities: (amenities: NearbyAmenity[]) => void;
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void;

  // Analytics actions
  setPropertyAnalytics: (analytics: PropertyAnalytics | null) => void;
  setMarketInsights: (insights: MarketInsights | null) => void;
  setSelectedPropertyForAnalytics: (propertyId: string | null) => void;

  // Search actions
  setSavedSearches: (searches: SavedSearch[]) => void;
  setSearchSuggestions: (suggestions: string[]) => void;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;

  // Comparison actions
  setComparisonProperties: (properties: Property[]) => void;
  addToComparison: (property: Property) => void;
  removeFromComparison: (propertyId: string) => void;
  clearComparison: () => void;
  setComparisonData: (data: PropertyComparison | null) => void;

  // Virtual Tour actions
  setVirtualTourUrl: (url: string | null) => void;
  setVirtualTourOpen: (isOpen: boolean) => void;

  // Computed getters
  hasSelectedProperties: () => boolean;
  selectedCount: () => number;
  hasActiveFilters: () => boolean;
  hasComparisonProperties: () => boolean;
  comparisonCount: () => number;
};

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  // Initial state
  selectedProperties: [],
  selectedProperty: null,
  isPropertyModalOpen: false,
  isPropertyFormOpen: false,
  isPropertyFiltersOpen: false,
  viewMode: "grid",
  sortBy: "createdAt",
  sortOrder: "desc",
  currentFilters: {},
  appliedFilters: {},

  // AI Features State
  aiRecommendations: [],
  isLoadingAI: false,
  aiGeneratedDescription: null,

  // Location Features State
  mapCenter: null,
  mapZoom: 12,
  nearbyAmenities: [],
  selectedLocation: null,

  // Analytics State
  propertyAnalytics: null,
  marketInsights: null,
  selectedPropertyForAnalytics: null,

  // Search State
  savedSearches: [],
  searchSuggestions: [],
  recentSearches: [],

  // Comparison State
  comparisonProperties: [],
  comparisonData: null,

  // Virtual Tour State
  virtualTourUrl: null,
  isVirtualTourOpen: false,

  // Actions
  setSelectedProperties: (propertyIds: string[]) => {
    set({ selectedProperties: propertyIds });
  },

  setSelectedProperty: (property: Property) => {
    set({ selectedProperty: property });
  },

  togglePropertySelection: (propertyId: string) => {
    set((state) => {
      const isSelected = state.selectedProperties.includes(propertyId);
      const newSelected = isSelected
        ? state.selectedProperties.filter((id) => id !== propertyId)
        : [...state.selectedProperties, propertyId];
      return { selectedProperties: newSelected };
    });
  },

  clearSelectedProperties: () => {
    set({ selectedProperties: [] });
  },

  setPropertyModalOpen: (isOpen: boolean) => {
    set({ isPropertyModalOpen: isOpen });
  },

  setPropertyFormOpen: (isOpen: boolean) => {
    set({ isPropertyFormOpen: isOpen });
  },

  setPropertyFiltersOpen: (isOpen: boolean) => {
    set({ isPropertyFiltersOpen: isOpen });
  },

  setViewMode: (mode: "grid" | "list" | "map") => {
    set({ viewMode: mode });
  },

  setSortBy: (
    sortBy: "price" | "bedrooms" | "bathrooms" | "size" | "createdAt"
  ) => {
    set({ sortBy });
  },

  setSortOrder: (order: "asc" | "desc") => {
    set({ sortOrder: order });
  },

  setCurrentFilters: (filters: PropertySearchParams) => {
    set({ currentFilters: filters });
  },

  setAppliedFilters: (filters: PropertySearchParams) => {
    set({ appliedFilters: filters });
  },

  clearFilters: () => {
    set({ currentFilters: {}, appliedFilters: {} });
  },

  updateFilter: (key: keyof PropertySearchParams, value: any) => {
    set((state) => ({
      currentFilters: {
        ...state.currentFilters,
        [key]: value,
      },
    }));
  },

  // AI Features actions
  setAIRecommendations: (recommendations: AIRecommendation[]) => {
    set({ aiRecommendations: recommendations });
  },

  setIsLoadingAI: (loading: boolean) => {
    set({ isLoadingAI: loading });
  },

  setAIGeneratedDescription: (description: string | null) => {
    set({ aiGeneratedDescription: description });
  },

  // Location Features actions
  setMapCenter: (center: { lat: number; lng: number } | null) => {
    set({ mapCenter: center });
  },

  setMapZoom: (zoom: number) => {
    set({ mapZoom: zoom });
  },

  setNearbyAmenities: (amenities: NearbyAmenity[]) => {
    set({ nearbyAmenities: amenities });
  },

  setSelectedLocation: (location: { lat: number; lng: number } | null) => {
    set({ selectedLocation: location });
  },

  // Analytics actions
  setPropertyAnalytics: (analytics: PropertyAnalytics | null) => {
    set({ propertyAnalytics: analytics });
  },

  setMarketInsights: (insights: MarketInsights | null) => {
    set({ marketInsights: insights });
  },

  setSelectedPropertyForAnalytics: (propertyId: string | null) => {
    set({ selectedPropertyForAnalytics: propertyId });
  },

  // Search actions
  setSavedSearches: (searches: SavedSearch[]) => {
    set({ savedSearches: searches });
  },

  setSearchSuggestions: (suggestions: string[]) => {
    set({ searchSuggestions: suggestions });
  },

  addRecentSearch: (search: string) => {
    set((state) => {
      const recentSearches = [
        search,
        ...state.recentSearches.filter((s) => s !== search),
      ].slice(0, 10);
      return { recentSearches };
    });
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
  },

  // Comparison actions
  setComparisonProperties: (properties: Property[]) => {
    set({ comparisonProperties: properties });
  },

  addToComparison: (property: Property) => {
    set((state) => {
      const isAlreadyAdded = state.comparisonProperties.some(
        (p) => p._id === property._id
      );
      if (isAlreadyAdded) return state;

      const newComparisonProperties = [
        ...state.comparisonProperties,
        property,
      ].slice(0, 4); // Max 4 properties
      return { comparisonProperties: newComparisonProperties };
    });
  },

  removeFromComparison: (propertyId: string) => {
    set((state) => ({
      comparisonProperties: state.comparisonProperties.filter(
        (p) => p._id !== propertyId
      ),
    }));
  },

  clearComparison: () => {
    set({ comparisonProperties: [], comparisonData: null });
  },

  setComparisonData: (data: PropertyComparison | null) => {
    set({ comparisonData: data });
  },

  // Virtual Tour actions
  setVirtualTourUrl: (url: string | null) => {
    set({ virtualTourUrl: url });
  },

  setVirtualTourOpen: (isOpen: boolean) => {
    set({ isVirtualTourOpen: isOpen });
  },

  // Computed getters
  hasSelectedProperties: () => get().selectedProperties.length > 0,

  selectedCount: () => get().selectedProperties.length,

  hasActiveFilters: () => {
    const filters = get().appliedFilters;
    return Object.keys(filters).length > 0;
  },

  hasComparisonProperties: () => get().comparisonProperties.length > 0,

  comparisonCount: () => get().comparisonProperties.length,
}));

type NewPropertyStoreState = {
  isNewPropertyOpen: boolean;
  setNewPropertyOpen: (isOpen: boolean) => void;

  finishedCreating: boolean; // Tracks if the user has completed onboarding
  setFinishedCreating: () => void; // Marks onboarding as complete
  clearNewPropertyStore: () => void;
};

export const useNewPropertyStore = create<NewPropertyStoreState>()(
  persist(
    (set) => ({
      isNewPropertyOpen: false,
      finishedCreating: false,

      setNewPropertyOpen: (isOpen: boolean) => {
        set({ isNewPropertyOpen: isOpen });
      },

      setFinishedCreating: () => {
        set({ finishedCreating: true });
      },

      clearNewPropertyStore: () => {
        set({ isNewPropertyOpen: false, finishedCreating: false });
      },
    }),
    {
      name: `${config.slug}-new-property`,
      partialize: (state) => ({
        isNewPropertyOpen: state.isNewPropertyOpen,
        finishedCreating: state.finishedCreating,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
