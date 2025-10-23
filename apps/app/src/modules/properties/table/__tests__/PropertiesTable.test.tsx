// import * as React from "react";
// import { render, screen, waitFor, fireEvent } from "@testing-library/react";
// import { describe, it, expect, vi, beforeEach } from "vitest";
// import { useRouter, useSearchParams } from "next/navigation";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { usePropertiesTable } from "../../hooks/use-properties-table";
// import { PropertiesTable } from "../index";
// import type { Property } from "../../property.type";
// import { UserRole, UserStatus } from "@/modules/users/user.type";

// // Mock the useRouter hook
// vi.mock("next/navigation", () => ({
// 	useRouter: vi.fn(),
// 	useSearchParams: vi.fn(),
// }));

// // Mock the usePropertiesTable hook
// vi.mock("../../hooks/use-properties-table");

// // Mock the PropertyFormSheet and PropertyViewSheet components
// vi.mock("../../components/property-form-sheet", () => ({
// 	PropertyFormSheet: ({ open, property, onSuccess }: any) =>
// 		open ? (
// 			<div data-testid="property-form-sheet">
// 				{property ? `Edit Property: ${property.title}` : "Add New Property"}
// 			</div>
// 		) : null,
// }));

// vi.mock("../../components/property-view-sheet", () => ({
// 	PropertyViewSheet: ({ propertyId, open }: any) =>
// 		open ? <div data-testid="property-view-sheet">View Property: {propertyId}</div> : null,
// }));

// describe("PropertiesTable", () => {
// 	const queryClient = new QueryClient();

// 	const mockProperties: Property[] = [
// 		{
// 			_id: "1",
// 			title: "Luxury Apartment",
// 			description: "Beautiful apartment in the city center",
// 			memberId: "user123",
// 			pricing: {
// 				rentAmount: 2500,
// 				currency: "USD",
// 				paymentFrequency: "monthly",
// 				securityDeposit: 2500,
// 				utilitiesIncluded: ["water", "internet"],
// 				negotiable: false,
// 			},
// 			location: {
// 				country: "USA",
// 				county: "New York",
// 				constituency: "Manhattan",
// 				address: {
// 					line1: "123 Main St",
// 					town: "New York",
// 					postalCode: "10001",
// 				},
// 			},
// 			type: "apartment",
// 			details: {
// 				bedrooms: 2,
// 				bathrooms: 2,
// 				furnished: true,
// 				petsAllowed: true,
// 				size: 1200,
// 			},
// 			status: "available",
// 			createdAt: new Date().toISOString(),
// 			updatedAt: new Date().toISOString(),
// 			media: {
// 				photos: [],
// 				virtualTour: undefined,
// 				floorPlan: undefined,
// 				epcImage: undefined,
// 				videos: undefined,
// 			},
// 			available: false,
// 			availableFrom: "",
// 			features: [],
// 			amenities: [],
// 			geolocation: {
// 				type: "Point",
// 				coordinates: [0, 0],
// 			},
// 			landlord: {
// 				id: "user123",
// 				firstName: "John",
// 				lastName: "Doe",
// 				email: "john.doe@example.com",
// 				role: UserRole.LANDLORD,
// 				createdAt: new Date().toISOString(),
// 				updatedAt: new Date().toISOString(),
// 				memberId: "",
// 				username: "",
// 				status: UserStatus.ACTIVE,
// 				isActive: false,
// 				isVerified: false,
// 			},
// 		},
// 	];

// 	const mockUsePropertiesTable = (overrides = {}) => {
// 		const defaultValues = {
// 			properties: mockProperties,
// 			pagination: {
// 				page: 1,
// 				pages: 1,
// 				total: 1,
// 				limit: 10,
// 				hasNextPage: false,
// 				hasPrevPage: false,
// 			},
// 			selectedProperties: [],
// 			viewMode: "list" as const,
// 			sortBy: "createdAt",
// 			sortOrder: "desc" as const,
// 			statusFilter: "",
// 			statusFilterOptions: [
// 				{ label: "Available", value: "available", count: 1 },
// 				{ label: "Rented", value: "rented", count: 0 },
// 				{ label: "Sold", value: "sold", count: 0 },
// 				{ label: "Pending", value: "pending", count: 0 },
// 				{ label: "Inactive", value: "inactive", count: 0 },
// 			],
// 			isLoading: false,
// 			isFetching: false,
// 			handlePageChange: vi.fn(),
// 			handlePerPageChange: vi.fn(),
// 			handleStatusFilterChange: vi.fn(),
// 			handleSearch: vi.fn(),
// 			handleSort: vi.fn(),
// 			handleStatusChange: vi.fn(),
// 			setCurrentFilters: vi.fn(),
// 			clearFilters: vi.fn(),
// 			updateFilter: vi.fn(),
// 			refetch: vi.fn(),
// 		};

// 		vi.mocked(usePropertiesTable).mockReturnValue({
// 			...defaultValues,
// 			...overrides,
// 			currentFilters: {
// 				page: undefined,
// 				limit: undefined,
// 				query: undefined,
// 				location: undefined,
// 				minPrice: undefined,
// 				maxPrice: undefined,
// 				minBedrooms: undefined,
// 				maxBedrooms: undefined,
// 				propertyType: undefined,
// 				furnished: undefined,
// 				petsAllowed: undefined,
// 				billsIncluded: undefined,
// 				availableFrom: undefined,
// 				lat: undefined,
// 				lng: undefined,
// 				radius: undefined,
// 				features: undefined,
// 			},
// 			error: null,
// 			setSelectedProperties: (_propertyIds: string[]): void => {
// 				throw new Error("Function not implemented.");
// 			},
// 			togglePropertySelection: (_propertyId: string): void => {
// 				throw new Error("Function not implemented.");
// 			},
// 			clearSelectedProperties: (): void => {
// 				throw new Error("Function not implemented.");
// 			},
// 			setViewMode: (_mode: "grid" | "list" | "map"): void => {
// 				throw new Error("Function not implemented.");
// 			},
// 		});
// 	};

// 	beforeEach(() => {
// 		// Reset all mocks before each test
// 		vi.clearAllMocks();

// 		// Setup default mock implementations
// 		vi.mocked(useRouter).mockReturnValue({
// 			push: vi.fn(),
// 			refresh: vi.fn(),
// 		} as any);

// 		vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any);

// 		// Setup default mock for usePropertiesTable
// 		mockUsePropertiesTable();
// 	});

// 	const renderComponent = () => {
// 		return render(
// 			<QueryClientProvider client={queryClient}>
// 				<PropertiesTable params={{}} />
// 			</QueryClientProvider>
// 		);
// 	};

// 	it("renders the properties table with data", async () => {
// 		renderComponent();

// 		// Check if the table renders with the property data
// 		expect(screen.getByText("Luxury Apartment")).toBeInTheDocument();
// 		expect(screen.getByText("2 Beds")).toBeInTheDocument();
// 		expect(screen.getByText("2 Baths")).toBeInTheDocument();
// 		expect(screen.getByText("$2,500.00/monthly")).toBeInTheDocument();
// 		expect(screen.getByText("Available")).toBeInTheDocument();
// 	});

// 	it("shows loading state when data is being fetched", () => {
// 		mockUsePropertiesTable({ isLoading: true });
// 		renderComponent();

// 		// Check if loading state is shown
// 		expect(screen.getByRole("progressbar")).toBeInTheDocument();
// 	});

// 	it("opens the property form when add button is clicked", async () => {
// 		renderComponent();

// 		// Click the add button
// 		const addButton = screen.getByRole("button", { name: /add property/i });
// 		fireEvent.click(addButton);

// 		// Check if the form is opened
// 		expect(screen.getByTestId("property-form-sheet")).toHaveTextContent("Add New Property");
// 	});

// 	it("opens the property view when a row is clicked", async () => {
// 		renderComponent();

// 		// Click the view action button (simulated since we're not testing the actual table implementation)
// 		const viewButtons = screen.getAllByRole("button", { name: /open menu/i });
// 		fireEvent.click(viewButtons[0]);

// 		// Click the view details menu item
// 		const viewDetails = screen.getByText(/view details/i);
// 		fireEvent.click(viewDetails);

// 		// Check if the view sheet is opened
// 		expect(screen.getByTestId("property-view-sheet")).toHaveTextContent("View Property: 1");
// 	});

// 	it("handles status change when status is updated", async () => {
// 		const handleStatusChange = vi.fn();
// 		mockUsePropertiesTable({ handleStatusChange });

// 		renderComponent();

// 		// Click the action button
// 		const actionButtons = screen.getAllByRole("button", { name: /open menu/i });
// 		fireEvent.click(actionButtons[0]);

// 		// Click the "Mark as Rented" menu item
// 		const markAsRented = screen.getByText(/mark as rented/i);
// 		fireEvent.click(markAsRented);

// 		// Check if the status change handler was called
// 		expect(handleStatusChange).toHaveBeenCalledTimes(1);
// 		expect(handleStatusChange).toHaveBeenCalledWith("1", "rented");
// 	});

// 	it("handles search when search input is used", async () => {
// 		const handleSearch = vi.fn();
// 		mockUsePropertiesTable({ handleSearch });

// 		renderComponent();

// 		// Type in the search input
// 		const searchInput = screen.getByPlaceholderText(/search properties/i);
// 		fireEvent.change(searchInput, { target: { value: "luxury" } });

// 		// Wait for debounce
// 		await waitFor(
// 			() => {
// 				expect(handleSearch).toHaveBeenCalledWith("luxury");
// 			},
// 			{ timeout: 500 }
// 		);
// 	});
// });
