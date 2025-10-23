import { useCallback, useEffect, useState } from "react";
import { httpClient } from "@/lib/axios";
import type { PropertySearchParams } from "@/modules/properties/property.type";

/**
 * SavedSearch interface defining the structure of a saved search
 */
export type SavedSearch = {
  /** Unique identifier for the saved search */
  id: string;
  /** User ID who owns this saved search */
  userId: string;
  /** Name given to this saved search */
  name: string;
  /** Search criteria parameters */
  searchParams: PropertySearchParams;
  /** Whether to receive notifications for new matching properties */
  notificationsEnabled: boolean;
  /** Search creation date */
  createdAt: string;
  /** Last updated date */
  updatedAt: string;
};

/**
 * Input for creating a new saved search
 */
export type SavedSearchInput = Omit<
  SavedSearch,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

/**
 * Response from the saved search hook
 */
type UseSavedSearchResponse = {
  /** List of user's saved searches */
  savedSearches: SavedSearch[];
  /** Whether searches are currently loading */
  loading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Create a new saved search */
  createSavedSearch: (search: SavedSearchInput) => Promise<SavedSearch>;
  /** Update an existing saved search */
  updateSavedSearch: (
    id: string,
    search: Partial<SavedSearchInput>
  ) => Promise<SavedSearch>;
  /** Delete a saved search */
  deleteSavedSearch: (id: string) => Promise<boolean>;
  /** Toggle notifications for a saved search */
  toggleNotifications: (id: string, enabled: boolean) => Promise<SavedSearch>;
  /** Refresh the list of saved searches */
  refreshSavedSearches: () => Promise<void>;
};

/**
 * Custom hook for managing saved property searches
 * @returns Functions and data for managing saved searches
 */
export function useSavedSearch(): UseSavedSearchResponse {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all saved searches for the current user
   */
  const fetchSavedSearches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response =
        await httpClient.api.get<SavedSearch[]>("/saved-searches");
      setSavedSearches(response.data);
      return response.data;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch saved searches"
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new saved search
   * @param search - The search to save
   */
  const createSavedSearch = useCallback(
    async (search: SavedSearchInput): Promise<SavedSearch> => {
      try {
        setError(null);
        const response = await httpClient.api.post<SavedSearch>(
          "/saved-searches",
          search
        );
        setSavedSearches((prev) => [...prev, response.data]);
        return response.data;
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to create saved search"
        );
        throw err;
      }
    },
    []
  );

  /**
   * Update an existing saved search
   * @param id - ID of the saved search to update
   * @param search - Updated search data
   */
  const updateSavedSearch = useCallback(
    async (
      id: string,
      search: Partial<SavedSearchInput>
    ): Promise<SavedSearch> => {
      try {
        setError(null);
        const response = await httpClient.api.put<SavedSearch>(
          `/saved-searches/${id}`,
          search
        );
        setSavedSearches((prev) =>
          prev.map((item) => (item.id === id ? response.data : item))
        );
        return response.data;
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to update saved search"
        );
        throw err;
      }
    },
    []
  );

  /**
   * Delete a saved search
   * @param id - ID of the saved search to delete
   */
  const deleteSavedSearch = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        await httpClient.api.delete(`/saved-searches/${id}`);
        setSavedSearches((prev) => prev.filter((item) => item.id !== id));
        return true;
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to delete saved search"
        );
        return false;
      }
    },
    []
  );

  /**
   * Toggle notifications for a saved search
   * @param id - ID of the saved search
   * @param enabled - Whether notifications should be enabled
   */
  const toggleNotifications = useCallback(
    async (id: string, enabled: boolean): Promise<SavedSearch> =>
      updateSavedSearch(id, { notificationsEnabled: enabled }),
    [updateSavedSearch]
  );

  // Load saved searches on mount
  useEffect(() => {
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  return {
    savedSearches,
    loading,
    error,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    toggleNotifications,
    refreshSavedSearches: async () => {
      await fetchSavedSearches();
    },
  };
}

export default useSavedSearch;
