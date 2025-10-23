import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Favourite, FavouriteQueryParams } from "./favourite.type";

/**
 * Favourite modal states
 */
type FavouriteModals = {
  isAddModalOpen: boolean;
  isRemoveModalOpen: boolean;
  isCompareModalOpen: boolean;
  isShareModalOpen: boolean;
  isExportModalOpen: boolean;
  isWatchListModalOpen: boolean;
  isSavedSearchModalOpen: boolean;
  isNotificationSettingsModalOpen: boolean;
  isPriceAlertModalOpen: boolean;
  isPropertyListModalOpen: boolean;
};

/**
 * Favourite form states
 */
type FavouriteFormState = {
  currentFavourite: Partial<Favourite> | null;
  isSubmitting: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
};

/**
 * Favourite filters and search state
 */
type FavouriteFiltersState = {
  searchTerm: string;
  propertyTypeFilter: string[];
  locationFilter: string[];
  priceRange: {
    min?: number;
    max?: number;
  } | null;
  dateRange: {
    startDate?: Date;
    endDate?: Date;
  } | null;
  availabilityFilter: "available" | "rented" | "sold" | "all";
  sortBy: "createdAt" | "propertyTitle" | "propertyPrice" | "addedDate";
  sortOrder: "asc" | "desc";
};

/**
 * Favourite view preferences
 */
type FavouriteViewPreferences = {
  viewMode: "grid" | "list" | "map";
  itemsPerPage: number;
  showPropertyDetails: boolean;
  showPriceHistory: boolean;
  compactView: boolean;
  gridColumns: number;
};

/**
 * Main favourite store interface
 */
type FavouriteStore = {
  // Selection state
  selectedFavourites: string[];
  selectedProperties: string[];
  lastSelectedFavourite: string | null;

  // Modal states
  modals: FavouriteModals;

  // Form state
  form: FavouriteFormState;

  // Filters and search
  filters: FavouriteFiltersState;

  // View preferences
  viewPreferences: FavouriteViewPreferences;

  // UI state
  isLoading: boolean;
  bulkActionLoading: boolean;
  lastRefresh: Date | null;
  compareMode: boolean;
  compareList: string[];

  // Recently viewed
  recentlyViewedLimit: number;
  autoTrackViews: boolean;

  // Notifications
  unreadAlertsCount: number;
  showNotificationBadge: boolean;

  // Selection actions
  setSelectedFavourites: (ids: string[]) => void;
  toggleFavouriteSelection: (id: string) => void;
  selectAllFavourites: (favouriteIds: string[]) => void;
  clearSelectedFavourites: () => void;
  isFavouriteSelected: (id: string) => boolean;
  hasSelectedFavourites: () => boolean;
  selectedCount: () => number;
  setLastSelectedFavourite: (id: string | null) => void;

  // Property selection for comparison
  setSelectedProperties: (ids: string[]) => void;
  togglePropertySelection: (id: string) => void;
  clearSelectedProperties: () => void;
  hasSelectedProperties: () => boolean;
  selectedPropertiesCount: () => number;

  // Modal actions
  openModal: (modal: keyof FavouriteModals, favouriteId?: string) => void;
  closeModal: (modal: keyof FavouriteModals) => void;
  closeAllModals: () => void;

  // Form actions
  setCurrentFavourite: (favourite: Partial<Favourite> | null) => void;
  setFormSubmitting: (isSubmitting: boolean) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  setFormDirty: (isDirty: boolean) => void;
  resetForm: () => void;
  updateFormField: (field: string, value: any) => void;

  // Filter actions
  setSearchTerm: (term: string) => void;
  setPropertyTypeFilter: (types: string[]) => void;
  setLocationFilter: (locations: string[]) => void;
  setPriceRange: (range: FavouriteFiltersState["priceRange"]) => void;
  setDateRange: (range: FavouriteFiltersState["dateRange"]) => void;
  setAvailabilityFilter: (
    availability: FavouriteFiltersState["availabilityFilter"]
  ) => void;
  setSortBy: (sortBy: FavouriteFiltersState["sortBy"]) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  clearFilters: () => void;
  getActiveFiltersCount: () => number;
  getQueryParams: () => FavouriteQueryParams;

  // View preference actions
  setViewMode: (mode: FavouriteViewPreferences["viewMode"]) => void;
  setItemsPerPage: (count: number) => void;
  setShowPropertyDetails: (show: boolean) => void;
  setShowPriceHistory: (show: boolean) => void;
  setCompactView: (compact: boolean) => void;
  setGridColumns: (columns: number) => void;

  // Compare mode actions
  toggleCompareMode: () => void;
  addToCompare: (propertyId: string) => void;
  removeFromCompare: (propertyId: string) => void;
  clearCompareList: () => void;
  isInCompareList: (propertyId: string) => boolean;
  canAddToCompare: () => boolean;

  // Recently viewed actions
  setRecentlyViewedLimit: (limit: number) => void;
  setAutoTrackViews: (auto: boolean) => void;

  // Notification actions
  setUnreadAlertsCount: (count: number) => void;
  setShowNotificationBadge: (show: boolean) => void;
  incrementUnreadAlerts: () => void;
  decrementUnreadAlerts: () => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setBulkActionLoading: (loading: boolean) => void;
  setLastRefresh: (date: Date) => void;

  // Utility actions
  resetStore: () => void;
  bulkUpdateFavourites: (
    favouriteIds: string[],
    updates: Partial<Favourite>
  ) => void;
  addFavouriteToSelection: (favouriteId: string) => void;
  removeFavouriteFromSelection: (favouriteId: string) => void;
};

// Default states
const defaultModals: FavouriteModals = {
  isAddModalOpen: false,
  isRemoveModalOpen: false,
  isCompareModalOpen: false,
  isShareModalOpen: false,
  isExportModalOpen: false,
  isWatchListModalOpen: false,
  isSavedSearchModalOpen: false,
  isNotificationSettingsModalOpen: false,
  isPriceAlertModalOpen: false,
  isPropertyListModalOpen: false,
};

const defaultForm: FavouriteFormState = {
  currentFavourite: null,
  isSubmitting: false,
  errors: {},
  isDirty: false,
};

const defaultFilters: FavouriteFiltersState = {
  searchTerm: "",
  propertyTypeFilter: [],
  locationFilter: [],
  priceRange: null,
  dateRange: null,
  availabilityFilter: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const defaultViewPreferences: FavouriteViewPreferences = {
  viewMode: "grid",
  itemsPerPage: 12,
  showPropertyDetails: true,
  showPriceHistory: false,
  compactView: false,
  gridColumns: 3,
};

/**
 * Create the favourite store with persistence for preferences
 */
export const useFavouriteStore = create<FavouriteStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedFavourites: [],
        selectedProperties: [],
        lastSelectedFavourite: null,
        modals: defaultModals,
        form: defaultForm,
        filters: defaultFilters,
        viewPreferences: defaultViewPreferences,
        isLoading: false,
        bulkActionLoading: false,
        lastRefresh: null,
        compareMode: false,
        compareList: [],
        recentlyViewedLimit: 20,
        autoTrackViews: true,
        unreadAlertsCount: 0,
        showNotificationBadge: true,

        // Selection actions
        setSelectedFavourites: (ids: string[]) => {
          set({ selectedFavourites: ids });
        },

        toggleFavouriteSelection: (id: string) => {
          set((state) => {
            const isSelected = state.selectedFavourites.includes(id);
            const newSelected = isSelected
              ? state.selectedFavourites.filter(
                  (favouriteId) => favouriteId !== id
                )
              : [...state.selectedFavourites, id];

            return {
              selectedFavourites: newSelected,
              lastSelectedFavourite: id,
            };
          });
        },

        selectAllFavourites: (favouriteIds: string[]) => {
          set({ selectedFavourites: favouriteIds });
        },

        clearSelectedFavourites: () => {
          set({ selectedFavourites: [], lastSelectedFavourite: null });
        },

        isFavouriteSelected: (id: string) =>
          get().selectedFavourites.includes(id),

        hasSelectedFavourites: () => get().selectedFavourites.length > 0,

        selectedCount: () => get().selectedFavourites.length,

        setLastSelectedFavourite: (id: string | null) => {
          set({ lastSelectedFavourite: id });
        },

        // Property selection actions
        setSelectedProperties: (ids: string[]) => {
          set({ selectedProperties: ids });
        },

        togglePropertySelection: (id: string) => {
          set((state) => {
            const isSelected = state.selectedProperties.includes(id);
            const newSelected = isSelected
              ? state.selectedProperties.filter(
                  (propertyId) => propertyId !== id
                )
              : [...state.selectedProperties, id];

            return { selectedProperties: newSelected };
          });
        },

        clearSelectedProperties: () => {
          set({ selectedProperties: [] });
        },

        hasSelectedProperties: () => get().selectedProperties.length > 0,

        selectedPropertiesCount: () => get().selectedProperties.length,

        // Modal actions
        openModal: (modal: keyof FavouriteModals, favouriteId?: string) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: true,
            },
            ...(favouriteId && {
              lastSelectedFavourite: favouriteId,
            }),
          }));
        },

        closeModal: (modal: keyof FavouriteModals) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: false,
            },
          }));
        },

        closeAllModals: () => {
          set({ modals: defaultModals });
        },

        // Form actions
        setCurrentFavourite: (favourite: Partial<Favourite> | null) => {
          set((state) => ({
            form: {
              ...state.form,
              currentFavourite: favourite,
              errors: {},
              isDirty: false,
            },
          }));
        },

        setFormSubmitting: (isSubmitting: boolean) => {
          set((state) => ({
            form: {
              ...state.form,
              isSubmitting,
            },
          }));
        },

        setFormErrors: (errors: Record<string, string>) => {
          set((state) => ({
            form: {
              ...state.form,
              errors,
            },
          }));
        },

        setFormDirty: (isDirty: boolean) => {
          set((state) => ({
            form: {
              ...state.form,
              isDirty,
            },
          }));
        },

        resetForm: () => {
          set(() => ({
            form: defaultForm,
          }));
        },

        updateFormField: (field: string, value: any) => {
          set((state) => ({
            form: {
              ...state.form,
              currentFavourite: {
                ...state.form.currentFavourite,
                [field]: value,
              },
              isDirty: true,
            },
          }));
        },

        // Filter actions
        setSearchTerm: (term: string) => {
          set((state) => ({
            filters: {
              ...state.filters,
              searchTerm: term,
            },
          }));
        },

        setPropertyTypeFilter: (types: string[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              propertyTypeFilter: types,
            },
          }));
        },

        setLocationFilter: (locations: string[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              locationFilter: locations,
            },
          }));
        },

        setPriceRange: (range: FavouriteFiltersState["priceRange"]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              priceRange: range,
            },
          }));
        },

        setDateRange: (range: FavouriteFiltersState["dateRange"]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              dateRange: range,
            },
          }));
        },

        setAvailabilityFilter: (
          availability: FavouriteFiltersState["availabilityFilter"]
        ) => {
          set((state) => ({
            filters: {
              ...state.filters,
              availabilityFilter: availability,
            },
          }));
        },

        setSortBy: (sortBy: FavouriteFiltersState["sortBy"]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              sortBy,
            },
          }));
        },

        setSortOrder: (order: "asc" | "desc") => {
          set((state) => ({
            filters: {
              ...state.filters,
              sortOrder: order,
            },
          }));
        },

        clearFilters: () => {
          set(() => ({
            filters: defaultFilters,
          }));
        },

        getActiveFiltersCount: () => {
          const filters = get().filters;
          let count = 0;

          if (filters.searchTerm.trim()) count++;
          if (filters.propertyTypeFilter.length > 0) count++;
          if (filters.locationFilter.length > 0) count++;
          if (filters.priceRange?.min || filters.priceRange?.max) count++;
          if (filters.dateRange?.startDate || filters.dateRange?.endDate)
            count++;
          if (filters.availabilityFilter !== "all") count++;

          return count;
        },

        getQueryParams: (): FavouriteQueryParams => {
          const filters = get().filters;

          return {
            ...(filters.searchTerm && { search: filters.searchTerm }),
            ...(filters.propertyTypeFilter.length > 0 && {
              propertyType: filters.propertyTypeFilter[0],
            }),
            ...(filters.locationFilter.length > 0 && {
              location: filters.locationFilter[0],
            }),
            ...(filters.priceRange?.min && {
              priceMin: filters.priceRange.min,
            }),
            ...(filters.priceRange?.max && {
              priceMax: filters.priceRange.max,
            }),
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            limit: get().viewPreferences.itemsPerPage,
          };
        },

        // View preference actions
        setViewMode: (mode: FavouriteViewPreferences["viewMode"]) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              viewMode: mode,
            },
          }));
        },

        setItemsPerPage: (count: number) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              itemsPerPage: count,
            },
          }));
        },

        setShowPropertyDetails: (show: boolean) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              showPropertyDetails: show,
            },
          }));
        },

        setShowPriceHistory: (show: boolean) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              showPriceHistory: show,
            },
          }));
        },

        setCompactView: (compact: boolean) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              compactView: compact,
            },
          }));
        },

        setGridColumns: (columns: number) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              gridColumns: columns,
            },
          }));
        },

        // Compare mode actions
        toggleCompareMode: () => {
          set((state) => ({
            compareMode: !state.compareMode,
            ...(state.compareMode && { compareList: [] }), // Clear when exiting
          }));
        },

        addToCompare: (propertyId: string) => {
          set((state) => {
            if (state.compareList.length >= 4) return state; // Max 4 properties
            if (state.compareList.includes(propertyId)) return state;

            return {
              compareList: [...state.compareList, propertyId],
            };
          });
        },

        removeFromCompare: (propertyId: string) => {
          set((state) => ({
            compareList: state.compareList.filter((id) => id !== propertyId),
          }));
        },

        clearCompareList: () => {
          set({ compareList: [] });
        },

        isInCompareList: (propertyId: string) =>
          get().compareList.includes(propertyId),

        canAddToCompare: () => get().compareList.length < 4,

        // Recently viewed actions
        setRecentlyViewedLimit: (limit: number) => {
          set({ recentlyViewedLimit: limit });
        },

        setAutoTrackViews: (auto: boolean) => {
          set({ autoTrackViews: auto });
        },

        // Notification actions
        setUnreadAlertsCount: (count: number) => {
          set({ unreadAlertsCount: count });
        },

        setShowNotificationBadge: (show: boolean) => {
          set({ showNotificationBadge: show });
        },

        incrementUnreadAlerts: () => {
          set((state) => ({
            unreadAlertsCount: state.unreadAlertsCount + 1,
          }));
        },

        decrementUnreadAlerts: () => {
          set((state) => ({
            unreadAlertsCount: Math.max(0, state.unreadAlertsCount - 1),
          }));
        },

        // UI state actions
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setBulkActionLoading: (loading: boolean) => {
          set({ bulkActionLoading: loading });
        },

        setLastRefresh: (date: Date) => {
          set({ lastRefresh: date });
        },

        // Utility actions
        resetStore: () => {
          set({
            selectedFavourites: [],
            selectedProperties: [],
            lastSelectedFavourite: null,
            modals: defaultModals,
            form: defaultForm,
            filters: defaultFilters,
            isLoading: false,
            bulkActionLoading: false,
            lastRefresh: null,
            compareMode: false,
            compareList: [],
            unreadAlertsCount: 0,
            // Don't reset view preferences and notification settings
          });
        },

        bulkUpdateFavourites: (
          _favouriteIds: string[],
          _updates: Partial<Favourite>
        ) => {
          set({
            selectedFavourites: [],
            bulkActionLoading: false,
          });
        },

        addFavouriteToSelection: (favouriteId: string) => {
          set((state) => ({
            selectedFavourites: state.selectedFavourites.includes(favouriteId)
              ? state.selectedFavourites
              : [...state.selectedFavourites, favouriteId],
          }));
        },

        removeFavouriteFromSelection: (favouriteId: string) => {
          set((state) => ({
            selectedFavourites: state.selectedFavourites.filter(
              (id) => id !== favouriteId
            ),
          }));
        },
      }),
      {
        name: "favourite-store",
        // Only persist certain parts of the store
        partialize: (state) => ({
          viewPreferences: state.viewPreferences,
          filters: {
            sortBy: state.filters.sortBy,
            sortOrder: state.filters.sortOrder,
            availabilityFilter: state.filters.availabilityFilter,
          },
          recentlyViewedLimit: state.recentlyViewedLimit,
          autoTrackViews: state.autoTrackViews,
          showNotificationBadge: state.showNotificationBadge,
        }),
      }
    ),
    {
      name: "favourite-store",
    }
  )
);

/**
 * Selector hooks for better performance
 */

// Modal selectors
export const useFavouriteModals = () =>
  useFavouriteStore((state) => state.modals);
export const useFavouriteModal = (modal: keyof FavouriteModals) =>
  useFavouriteStore((state) => state.modals[modal]);

// Selection selectors
export const useSelectedFavourites = () =>
  useFavouriteStore((state) => state.selectedFavourites);
export const useSelectedProperties = () =>
  useFavouriteStore((state) => state.selectedProperties);
export const useHasSelectedFavourites = () =>
  useFavouriteStore((state) => state.hasSelectedFavourites());
export const useSelectedFavouritesCount = () =>
  useFavouriteStore((state) => state.selectedCount());

// Form selectors
export const useFavouriteForm = () => useFavouriteStore((state) => state.form);
export const useCurrentFavourite = () =>
  useFavouriteStore((state) => state.form.currentFavourite);

// Filter selectors
export const useFavouriteFilters = () =>
  useFavouriteStore((state) => state.filters);
export const useFavouriteQueryParams = () =>
  useFavouriteStore((state) => state.getQueryParams());
export const useActiveFiltersCount = () =>
  useFavouriteStore((state) => state.getActiveFiltersCount());

// View preference selectors
export const useFavouriteViewPreferences = () =>
  useFavouriteStore((state) => state.viewPreferences);
export const useFavouriteViewMode = () =>
  useFavouriteStore((state) => state.viewPreferences.viewMode);

// Compare selectors
export const useCompareMode = () =>
  useFavouriteStore((state) => state.compareMode);
export const useCompareList = () =>
  useFavouriteStore((state) => state.compareList);

// Notification selectors
export const useUnreadAlertsCount = () =>
  useFavouriteStore((state) => state.unreadAlertsCount);
export const useShowNotificationBadge = () =>
  useFavouriteStore((state) => state.showNotificationBadge);

// UI state selectors
export const useFavouriteLoading = () =>
  useFavouriteStore((state) => state.isLoading);
export const useBulkActionLoading = () =>
  useFavouriteStore((state) => state.bulkActionLoading);
