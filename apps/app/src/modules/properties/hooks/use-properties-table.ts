import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useUpdatePropertyStatus } from "../property.mutations";
import { useProperties } from "../property.queries";
import { usePropertyStore } from "../property.store";
import type { Property, PropertySearchParams } from "../property.type";
import { propertyStatusOptions } from "../table";

export function usePropertiesTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get state from store
  const {
    selectedProperties,
    viewMode,
    sortBy,
    sortOrder,
    currentFilters,
    setSelectedProperties,
    togglePropertySelection,
    clearSelectedProperties,
    setViewMode,
    setSortBy,
    setSortOrder,
    setCurrentFilters,
    clearFilters,
    updateFilter,
  } = usePropertyStore();

  // Parse search params
  const page = searchParams.get("page")
    ? Number.parseInt(searchParams.get("page") as string, 10)
    : 1;
  const perPage = searchParams.get("perPage")
    ? Number.parseInt(searchParams.get("perPage") as string, 10)
    : 10;
  const status =
    (searchParams.get("status") as Property["status"]) || undefined;
  const search = searchParams.get("search") || "";

  // Build query params
  const queryParams: PropertySearchParams = useMemo(
    () => ({
      page,
      limit: perPage,
      status,
      search,
      sort: sortBy,
      order: sortOrder,
      ...currentFilters,
    }),
    [page, perPage, status, search, sortBy, sortOrder, currentFilters]
  );

  // Fetch properties data
  const { data, isLoading, isFetching, error, refetch } =
    useProperties(queryParams);

  // Status update mutation
  const { mutateAsync: updateStatus } = useUpdatePropertyStatus();

  // Handle status change
  const handleStatusChange = useCallback(
    async (id: string, newStatus: string) => {
      try {
        await updateStatus({ id, status: newStatus });
        refetch();
      } catch (error) {
        console.error("Failed to update property status:", error);
      }
    },
    [updateStatus, refetch]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Handle per page change
  const handlePerPageChange = useCallback(
    (newPerPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("perPage", newPerPage.toString());
      params.set("page", "1"); // Reset to first page
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (newStatus: string) => {
      const params = new URLSearchParams(searchParams);
      if (newStatus) {
        params.set("status", newStatus);
      } else {
        params.delete("status");
      }
      params.set("page", "1"); // Reset to first page
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set("search", query);
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset to first page
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Handle sort
  const handleSort = useCallback(
    (id: string, desc: boolean) => {
      setSortBy(id as any);
      setSortOrder(desc ? "desc" : "asc");
    },
    [setSortBy, setSortOrder]
  );

  // Get status filter options with counts
  const statusFilterOptions = useMemo(() => {
    if (!data?.meta?.statusCounts) return propertyStatusOptions;

    return propertyStatusOptions.map((option) => ({
      ...option,
      count:
        data.meta.statusCounts?.[
          option.value as keyof typeof data.meta.statusCounts
        ] || 0,
    }));
  }, [data?.meta?.statusCounts]);

  return {
    // State
    properties: data?.properties || [],
    pagination: data?.pagination || {
      page: 1,
      pages: 1,
      total: 0,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
    selectedProperties,
    viewMode,
    sortBy,
    sortOrder,
    currentFilters,
    statusFilter: status,
    statusFilterOptions,
    isLoading,
    isFetching,
    error,

    // Actions
    setSelectedProperties,
    togglePropertySelection,
    clearSelectedProperties,
    setViewMode,
    handlePageChange,
    handlePerPageChange,
    handleStatusFilterChange,
    handleSearch,
    handleSort,
    handleStatusChange,
    setCurrentFilters,
    clearFilters,
    updateFilter,
    refetch,
  };
}
