// import { renderHook, act } from "@testing-library/react";
// import { describe, it, expect, vi, beforeEach } from "vitest";
// import { usePropertiesTable } from "../use-properties-table";
// import { useRouter, useSearchParams } from "next/navigation";
// import { usePropertyStore } from "../../property.store";
// import * as propertyQueries from "../../property.queries";

// // Mock the next/navigation hooks
// vi.mock("next/navigation", () => ({
//   useRouter: vi.fn(),
//   useSearchParams: vi.fn(),
// }));

// // Mock the property store
// vi.mock("../../property.store");

// // Mock the property queries
// vi.mock("../../property.queries");

// describe("usePropertiesTable", () => {
//   const mockPush = vi.fn();
//   const mockRefetch = vi.fn();

//   const mockProperties = [
//     {
//       _id: "1",
//       title: "Test Property",
//       status: "available",
//       // Add other required properties
//     },
//   ];

//   const mockPagination = {
//     page: 1,
//     pages: 1,
//     total: 1,
//     limit: 10,
//     hasNextPage: false,
//     hasPrevPage: false,
//   };

//   const mockStatusCounts = {
//     available: 1,
//     rented: 0,
//     sold: 0,
//     pending: 0,
//     inactive: 0,
//   };

//   beforeEach(() => {
//     vi.clearAllMocks();

//     // Setup default mock implementations
//     vi.mocked(useRouter).mockReturnValue({
//       push: mockPush,
//     } as any);

//     vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any);

//     // Mock the store
//     vi.mocked(usePropertyStore).mockImplementation((selector) => {
//       const state = {
//         selectedProperties: [],
//         viewMode: "list",
//         sortBy: "createdAt",
//         sortOrder: "desc",
//         currentFilters: {},
//         setSelectedProperties: vi.fn(),
//         togglePropertySelection: vi.fn(),
//         clearSelectedProperties: vi.fn(),
//         setViewMode: vi.fn(),
//         setSortBy: vi.fn(),
//         setSortOrder: vi.fn(),
//         setCurrentFilters: vi.fn(),
//         clearFilters: vi.fn(),
//         updateFilter: vi.fn(),
//       };

//       return selector(state);
//     });

//     // Mock the queries
//     vi.mocked(propertyQueries.useProperties).mockReturnValue({
//       data: {
//         items: mockProperties,
//         pagination: mockPagination,
//         meta: {
//           statusCounts: mockStatusCounts,
//         },
//       },
//       isLoading: false,
//       isFetching: false,
//       refetch: mockRefetch,
//     });

//     vi.mocked(propertyQueries.useUpdatePropertyStatus).mockReturnValue({
//       mutateAsync: vi.fn().mockResolvedValue({}),
//     });
//   });

//   it("should return initial state", () => {
//     const { result } = renderHook(() => usePropertiesTable());

//     expect(result.current.properties).toEqual(mockProperties);
//     expect(result.current.pagination).toEqual(mockPagination);
//     expect(result.current.isLoading).toBe(false);
//     expect(result.current.isFetching).toBe(false);
//   });

//   it("should handle page change", () => {
//     const { result } = renderHook(() => usePropertiesTable());

//     act(() => {
//       result.current.handlePageChange(2);
//     });

//     expect(mockPush).toHaveBeenCalledWith("?page=2");
//   });

//   it("should handle per page change", () => {
//     const { result } = renderHook(() => usePropertiesTable());

//     act(() => {
//       result.current.handlePerPageChange(25);
//     });

//     expect(mockPush).toHaveBeenCalledWith("?page=1&perPage=25");
//   });

//   it("should handle status filter change", () => {
//     const { result } = renderHook(() => usePropertiesTable());

//     act(() => {
//       result.current.handleStatusFilterChange("rented");
//     });

//     expect(mockPush).toHaveBeenCalledWith("?page=1&status=rented");
//   });

//   it("should handle search", () => {
//     const { result } = renderHook(() => usePropertiesTable());

//     act(() => {
//       result.current.handleSearch("test");
//     });

//     expect(mockPush).toHaveBeenCalledWith("?page=1&search=test");
//   });

//   it("should handle status change", async () => {
//     const mockUpdateStatus = vi.fn().mockResolvedValue({});
//     vi.mocked(propertyQueries.useUpdatePropertyStatus).mockReturnValue({
//       mutateAsync: mockUpdateStatus,
//     });

//     const { result } = renderHook(() => usePropertiesTable());

//     await act(async () => {
//       await result.current.handleStatusChange("1", "rented");
//     });

//     expect(mockUpdateStatus).toHaveBeenCalledWith({
//       id: "1",
//       status: "rented",
//     });
//     expect(mockRefetch).toHaveBeenCalled();
//   });

//   it("should handle filters update", () => {
//     const { result } = renderHook(() => usePropertiesTable());

//     act(() => {
//       result.current.updateFilter("minPrice", 1000);
//     });

//     expect(usePropertyStore().updateFilter).toHaveBeenCalledWith("minPrice", 1000);
//   });

//   it("should handle clear filters", () => {
//     const { result } = renderHook(() => usePropertiesTable());

//     act(() => {
//       result.current.clearFilters();
//     });

//     expect(usePropertyStore().clearFilters).toHaveBeenCalled();
//     expect(mockPush).toHaveBeenCalledWith("?");
//   });
// });
