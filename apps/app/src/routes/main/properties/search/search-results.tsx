"use client";

import { useQuery } from "@tanstack/react-query";
import { Filter, Grid, List, MapIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
// import NoResults from "@/modules/properties/components/no-results";
import type { Property } from "@/modules/properties/property.type";

// import PropertyCard from "../properties/property-card";
// import PropertyFilterPanel from "../properties/property-filter-panel";
// import PropertyListItem from "../properties/property-list-item";
// import PropertyMap from "../properties/property-map";

// Define the interface for search params
type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type ViewMode = "grid" | "list" | "map";

const SearchResultsClient = ({ params }: { params: Promise<SearchParams> }) => {
  const searchParams = use(params);

  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // We'll parse the search parameters here to create a readable summary
  const locationQuery = (searchParams.location as string) || "Any location";
  const minPrice = (searchParams.minPrice as string) || "0";
  const maxPrice = (searchParams.maxPrice as string) || "No max";
  const bedrooms = (searchParams.bedrooms as string) || "Any";
  const _propertyType = (searchParams.propertyType as string) || "Any";

  // Create a readable search summary
  const searchSummary = `${locationQuery}, ${bedrooms === "Any" ? "Any beds" : `${bedrooms} beds`}, ${minPrice === "0" && maxPrice === "No max" ? "Any price" : `£${minPrice} - ${maxPrice === "No max" ? "∞" : `£${maxPrice}`}`}`;

  // Reset to page 1 when search params change
  useEffect(() => {
    setCurrentPage(1);

    // Parse active filters from search params

    const filters: Record<string, any> = {};
    if (searchParams.minPrice) filters.minPrice = Number(searchParams.minPrice);
    if (searchParams.maxPrice && searchParams.maxPrice !== "No max")
      filters.maxPrice = Number(searchParams.maxPrice);
    if (searchParams.bedrooms && searchParams.bedrooms !== "Any")
      filters.bedrooms = Number(searchParams.bedrooms);
    if (searchParams.propertyType && searchParams.propertyType !== "Any")
      filters.propertyType = searchParams.propertyType;
    if (searchParams.furnished)
      filters.furnished = searchParams.furnished === "true";
    if (searchParams.petsAllowed)
      filters.petsAllowed = searchParams.petsAllowed === "true";

    setActiveFilters(filters);
  }, [searchParams]);

  // Query to fetch search results
  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["searchResults", searchParams, currentPage, sortBy],
    queryFn: async () => {
      // In a real app, this would be an API call with all search parameters
      // For now, we're using mock data
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

      // Mock search results
      const results: Property[] | any[] = Array.from(
        { length: 24 },
        (_, i) => ({
          _id: `prop${i + 1}`,
          title: `${i % 3 === 0 ? "Modern" : i % 3 === 1 ? "Spacious" : "Luxury"} ${(i % 5) + 1} Bedroom ${i % 2 === 0 ? "Apartment" : "House"}`,
          type: i % 2 === 0 ? ("apartment" as any) : ("house" as any),
          slug: `property-${i + 1}`,
          aiInsights: {
            marketValue: 800 + i * 100,
            rentPrediction: 800 + i * 100,
            occupancyScore: i % 100,
            investmentScore: i % 100,
            maintenanceRisk: "low",
            lastUpdated: new Date().toISOString(),
          },
          utilities: {
            electricity: {
              provider: "KES",
              meterNumber: "1234567890",
              averageMonthlyBill: 100,
            },
          },
          compliance: {
            titleDeed: true,
            occupancyCertificate: true,
            fireCompliance: true,
            environmentalCompliance: true,
            countyApprovals: [],
          },
          listingType: "rent",
          energyRating: "A",
          rejectionReason: "",
          governingLaw: "Kenya",
          jurisdiction: "Kenya",
          tags: [],
          featured: i % 2 === 0,
          verified: true,
          verifiedAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          views: 0,
          stats: {
            views: 0,
            inquiries: 0,
            applications: 0,
            bookmarks: 0,
            averageRating: 0,
            totalReviews: 0,
          },
          moderationStatus: "approved",
          lastUpdatedAt: new Date().toISOString(),
          isPromoted: false,
          description:
            "This is a mock property description for demonstration purposes. It would typically include details about the property's features, amenities, and location.",
          pricing: {
            currency: "KES",
            rent: 800 + i * 100,
            deposit: 1000,
            paymentFrequency: "monthly",
            utilitiesIncluded: [],
            negotiable: false,
          },
          memberId: `user${i + 1}`,
          // type: i % 2 === 0 ? "apartment" : "house",
          specifications: {
            bedrooms: (i % 5) + 1,
            bathrooms: Math.ceil(((i % 5) + 1) / 2),
            furnished: i % 3 === 0,
            // latitude: 51.5 + (Math.random() * 0.1 - 0.05),
            // longitude: -0.12 + (Math.random() * 0.1 - 0.05),
          },
          rules: {
            petsAllowed: i % 4 === 0,
            smokingAllowed: i % 3 === 0,
            partiesAllowed: i % 2 === 0,
            childrenAllowed: i % 1 === 0,
          },
          availability: {
            availableFrom: new Date(
              Date.now() + i * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          media: {
            images: [
              {
                url: `https://source.unsplash.com/random/800x600?property&sig=${i}`,
                caption: "",
                isPrimary: i === 0,
              },
            ],
          },
          amenities: [],
          location: {
            country: "USA",
            county: "Anytown",
            constituency: "Anytown",
            address: {
              line1: "123 Main St",
              line2: "Apt 4B",
              town: "Anytown",
              postalCode: "12345",
            },
          },
          geolocation: {
            type: "Point",
            coordinates: [
              -0.12 + (Math.random() * 0.1 - 0.05),
              51.5 + (Math.random() * 0.1 - 0.05),
            ],
          },
          landlord: {
            _id: `user${i + 1}`,
            profile: {
              firstName: "John",
              lastName: "Doe",
            },
            contact: {
              email: "john.doe@example.com",
              phone: "1234567890",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            emailVerified: true,
            phoneVerified: true,
            status: "active",
          },
          status: "active" as any,
          available: true,
          features: ["Feature 1", "Feature 2", "Feature 3"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contactName: "John Doe",
          contactPhone: "1234567890",
          furnished: i % 3 === 0,
          petsAllowed: i % 4 === 0,
          availableFrom: new Date(
            Date.now() + i * 24 * 60 * 60 * 1000
          ).toISOString(),
          latitude: 51.5 + (Math.random() * 0.1 - 0.05),
          longitude: -0.12 + (Math.random() * 0.1 - 0.05),
        })
      );

      // Apply filters
      const filteredResults = results.filter((property) => {
        if (
          activeFilters.minPrice &&
          property.pricing.rent < activeFilters.minPrice
        )
          return false;
        if (
          activeFilters.maxPrice &&
          property.pricing.rent > activeFilters.maxPrice
        )
          return false;
        if (
          activeFilters.bedrooms &&
          property.specifications.bedrooms < activeFilters.bedrooms
        )
          return false;
        if (
          activeFilters.propertyType &&
          property.type !== activeFilters.propertyType
        )
          return false;
        if (
          activeFilters.furnished !== undefined &&
          property.specifications.furnished !== activeFilters.furnished
        )
          return false;
        if (
          activeFilters.petsAllowed !== undefined &&
          property.rules.petsAllowed !== activeFilters.petsAllowed
        )
          return false;
        return true;
      });

      // Apply sorting
      const sortedResults = [...filteredResults].sort((a, b) => {
        if (sortBy === "price_low") return a.pricing.rent - b.pricing.rent;
        if (sortBy === "price_high") return b.pricing.rent - a.pricing.rent;
        if (sortBy === "newest")
          return (
            new Date(b.availability.availableFrom || "").getTime() -
            new Date(a.availability.availableFrom || "").getTime()
          );
        // For relevance sorting, we're just using the default order in this mock example
        return 0;
      });

      // Calculate total pages and paginate
      const ITEMS_PER_PAGE = 12;
      const totalResults = sortedResults.length;
      const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginatedResults = sortedResults.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
      );

      return {
        properties: paginatedResults as Property[],
        totalResults,
        totalPages,
      };
    },
    staleTime: 60_000, // 1 minute
  });

  // Handle search filter changes

  const handleFilterChange = (newFilters: Record<string, any>) => {
    // Combine with existing search params and navigate
    const updatedParams = new URLSearchParams();

    // Add existing params that are not being changed
    for (const [key, value] of Object.entries(searchParams)) {
      if (!(key in newFilters) && value !== undefined) {
        updatedParams.append(key, value.toString());
      }
    }

    // Add new/updated filters
    for (const [key, value] of Object.entries(newFilters)) {
      if (value !== undefined && value !== null && value !== "") {
        updatedParams.append(key, value.toString());
      }
    }

    router.push(`/search?${updatedParams.toString()}`);
    setShowFilters(false);
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-bold text-2xl text-gray-900">Search Results</h1>
          <div className="flex items-center space-x-2">
            <div className="flex">
              <button
                className="rounded-l-md border border-gray-300 bg-white px-3 py-2"
                type="button"
              >
                <Grid className="h-5 w-5 text-gray-400" />
              </button>
              <button
                className="border-gray-300 border-t border-b bg-white px-3 py-2"
                type="button"
              >
                <List className="h-5 w-5 text-gray-400" />
              </button>
              <button
                className="rounded-r-md border border-gray-300 bg-white px-3 py-2"
                type="button"
              >
                <MapIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              className="overflow-hidden rounded-lg bg-white shadow"
              key={index.toString()}
            >
              <div className="h-48 bg-gray-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-4 w-5/6 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="font-medium text-red-800 text-sm">
            Error loading search results
          </h3>
          <p className="mt-2 text-red-700 text-sm">
            There was an error loading the search results. Please try refreshing
            the page or modifying your search criteria.
          </p>
        </div>
      </div>
    );
  }

  // No results
  if (searchResults?.properties.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-bold text-2xl text-gray-900">Search Results</h1>
          <button
            className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
            onClick={() => setShowFilters(!showFilters)}
            type="button"
          >
            <Filter className="mr-2 h-5 w-5 text-gray-500" />
            <span>Filters</span>
          </button>
        </div>

        {/* <NoResults
					title="No properties match your search"
					description="Try adjusting your search criteria or filters to see more results."
					actionText="Modify Search"
					onAction={() => setShowFilters(true)}
				/> */}

        {showFilters && (
          <div className="fixed inset-0 z-40 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowFilters(false)}
              />
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                {/* <PropertyFilterPanel
									initialFilters={activeFilters}
									onFilterChange={handleFilterChange}
									collapsed={false}
									className="p-4"
								/> */}
                <div className="flex justify-end border-gray-200 border-t p-4">
                  <button
                    className="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-200"
                    onClick={() => setShowFilters(false)}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="font-bold text-2xl text-gray-900">
            Properties in {locationQuery}
          </h1>
          <p className="mt-1 text-gray-600 text-sm">
            {searchResults?.totalResults} properties found • {searchSummary}
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <div className="hidden overflow-hidden rounded-md border border-gray-300 bg-white sm:flex">
            <button
              aria-label="Grid view"
              className={`px-3 py-2 ${viewMode === "grid" ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500"}`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              aria-label="List view"
              className={`px-3 py-2 ${viewMode === "list" ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500"}`}
              onClick={() => setViewMode("list")}
              type="button"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              aria-label="Map view"
              className={`px-3 py-2 ${viewMode === "map" ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500"}`}
              onClick={() => setViewMode("map")}
              type="button"
            >
              <MapIcon className="h-5 w-5" />
            </button>
          </div>

          <button
            className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
            onClick={() => setShowFilters(!showFilters)}
            type="button"
          >
            <Filter className="mr-2 h-5 w-5 text-gray-500" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filters</span>
          </button>
        </div>
      </div>

      {/* Mobile View Mode Selector */}
      <div className="mb-4 flex w-full overflow-hidden rounded-md border border-gray-300 bg-white sm:hidden">
        <button
          aria-label="Grid view"
          className={`flex-1 px-3 py-2 ${viewMode === "grid" ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500"}`}
          onClick={() => setViewMode("grid")}
          type="button"
        >
          <Grid className="mx-auto h-5 w-5" />
        </button>
        <button
          aria-label="List view"
          className={`flex-1 px-3 py-2 ${viewMode === "list" ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500"}`}
          onClick={() => setViewMode("list")}
          type="button"
        >
          <List className="mx-auto h-5 w-5" />
        </button>
        <button
          aria-label="Map view"
          className={`flex-1 px-3 py-2 ${viewMode === "map" ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500"}`}
          onClick={() => setViewMode("map")}
          type="button"
        >
          <MapIcon className="mx-auto h-5 w-5" />
        </button>
      </div>

      {/* Active Filters */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-gray-500 text-sm">Active filters:</span>
          {Object.entries(activeFilters).map(([key, value]) => {
            // Skip rendering if value is undefined or null
            if (value === undefined || value === null) return null;

            let displayText = "";

            switch (key) {
              case "minPrice":
                displayText = `Min £${value}`;
                break;
              case "maxPrice":
                displayText = `Max £${value}`;
                break;
              case "bedrooms":
                displayText = `${value}+ beds`;
                break;
              case "propertyType":
                displayText = value.charAt(0).toUpperCase() + value.slice(1);
                break;
              case "furnished":
                displayText = value ? "Furnished" : "Unfurnished";
                break;
              case "petsAllowed":
                displayText = value ? "Pets allowed" : "No pets";
                break;
              default:
                displayText = `${key}: ${value}`;
            }

            return (
              <span
                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-800 text-sm"
                key={key}
              >
                {displayText}
                <button
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    const { [key]: _, ...restFilters } = activeFilters;
                    handleFilterChange(restFilters);
                  }}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            );
          })}
          <button
            className="text-primary-600 text-sm hover:text-primary-800"
            onClick={() => handleFilterChange({})}
            type="button"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Sort controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <label className="mr-2 text-gray-700 text-sm" htmlFor="sort-by">
            Sort by:
          </label>
          <select
            className="rounded-md border-gray-300 py-1 pr-10 pl-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            id="sort-by"
            onChange={handleSortChange}
            value={sortBy}
          >
            <option value="relevance">Relevance</option>
            <option value="price_low">Price (Low to High)</option>
            <option value="price_high">Price (High to Low)</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <div className="hidden text-gray-700 text-sm sm:block">
          Showing {(currentPage - 1) * 12 + 1}-
          {Math.min(currentPage * 12, searchResults?.totalResults || 0)} of{" "}
          {searchResults?.totalResults} results
        </div>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div className="mb-6 overflow-hidden rounded-lg bg-white shadow">
          <div className="relative h-[600px]">
            {/* <PropertyMap
							properties={searchResults?.properties || []}
							initialCenter={{ lat: 51.5, lng: -0.12 }} // London center
						/> */}
            <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-white p-4">
              <h3 className="mb-2 font-medium text-gray-900 text-lg">
                Map View
              </h3>
              <p className="text-gray-600 text-sm">
                Showing {searchResults?.properties.length} properties in the
                visible area. Click on a marker to see property details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {searchResults?.properties.map((property) => (
            <div key={property._id}>{property.title}</div>
            // <PropertyCard key={property._id} property={property} onFavoriteToggle={() => {}} />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {searchResults?.properties.map((property) => (
            <div key={property._id}>{property.title}</div>
            // <PropertyListItem key={property._id} property={property} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {searchResults && searchResults.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center">
          <nav
            aria-label="Pagination"
            className="-space-x-px relative z-0 inline-flex rounded-md shadow-sm"
          >
            <button
              className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 font-medium text-sm ${
                currentPage === 1
                  ? "cursor-not-allowed text-gray-300"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              type="button"
            >
              <span className="sr-only">Previous</span>
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  fillRule="evenodd"
                />
              </svg>
            </button>

            {Array.from(
              { length: searchResults.totalPages },
              (_, i) => i + 1
            ).map((page) => {
              // Show first page, last page, current page, and pages around current page
              if (
                page === 1 ||
                page === searchResults.totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    className={`relative inline-flex items-center border px-4 py-2 ${
                      currentPage === page
                        ? "z-10 border-primary-500 bg-primary-50 text-primary-600"
                        : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                    } font-medium text-sm`}
                    key={page}
                    onClick={() => handlePageChange(page)}
                    type="button"
                  >
                    {page}
                  </button>
                );
              }

              // Show ellipsis for skipped pages
              if (page === 2 && currentPage > 3) {
                return (
                  <span
                    className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm"
                    key="start-ellipsis"
                  >
                    ...
                  </span>
                );
              }

              if (
                page === searchResults.totalPages - 1 &&
                currentPage < searchResults.totalPages - 2
              ) {
                return (
                  <span
                    className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm"
                    key="end-ellipsis"
                  >
                    ...
                  </span>
                );
              }

              return null;
            })}

            <button
              className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 font-medium text-sm ${
                currentPage === searchResults.totalPages
                  ? "cursor-not-allowed text-gray-300"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              disabled={currentPage === searchResults.totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              type="button"
            >
              <span className="sr-only">Next</span>
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  fillRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      )}

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowFilters(false)}
            />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              {/* <PropertyFilterPanel
								initialFilters={activeFilters}
								onFilterChange={handleFilterChange}
								collapsed={false}
								className="p-4"
							/> */}
              <div className="flex justify-end border-gray-200 border-t p-4">
                <button
                  className="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-200"
                  onClick={() => setShowFilters(false)}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultsClient;
