import { ArrowRight, Clock, Home, MapPin, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";

type Location = {
  id: string;
  name: string;
  type: "area" | "city" | "postal" | "region" | "street" | "station";
  county?: string;
  popularity?: number;
};

type SearchResult = {
  term: string;
  timestamp: number;
  type: "location" | "property" | "filter" | string;
  data: Location | Record<string, unknown>;
};

type SmartSearchProps = {
  onSearch: (searchTerm: string, locationType?: string) => void;
  className?: string;
  placeholder?: string;
};

const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  className = "",
  placeholder = "Search by location or property type...",
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [locationSuggestions, setLocationSuggestions] = useState<Location[]>(
    []
  );
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [popularLocations, setPopularLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with sample popular locations
  useEffect(() => {
    setPopularLocations([
      { id: "loc-1", name: "Camden", type: "area" },
      { id: "loc-2", name: "Shoreditch", type: "area" },
      { id: "loc-3", name: "Greenwich", type: "area" },
      { id: "loc-4", name: "Hackney", type: "area" },
      { id: "loc-5", name: "Islington", type: "area" },
      { id: "loc-6", name: "Brixton", type: "area" },
      { id: "loc-7", name: "Clapham", type: "area" },
      { id: "loc-8", name: "Notting Hill", type: "area" },
    ]);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSearches = localStorage.getItem("recentSearches");
      if (savedSearches) {
        try {
          setRecentSearches(JSON.parse(savedSearches).slice(0, 5));
        } catch (e) {
          console.error("Error parsing recent searches:", e);
        }
      }
    }
  }, []);

  // Handle click outside to close suggestions

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search for locations as user types
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length < 2) {
        setLocationSuggestions([]);
        return;
      }

      searchLocations(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Simulate fetching location suggestions
  const searchLocations = async (query: string) => {
    setIsLoading(true);
    try {
      // In a real app, you would call your API
      // const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/locations/search?query=${query}`);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generate mock suggestions based on input
      const mockSuggestions: Location[] = [
        {
          id: `${query}-1`,
          name: `${query.charAt(0).toUpperCase() + query.slice(1)}`,
          type: "area",
        },
        {
          id: `${query}-2`,
          name: `${query.charAt(0).toUpperCase() + query.slice(1)} Park`,
          type: "area",
        },
        {
          id: `${query}-3`,
          name: `North ${query.charAt(0).toUpperCase() + query.slice(1)}`,
          type: "area",
        },
        {
          id: `${query}-4`,
          name: `${query.charAt(0).toUpperCase() + query.slice(1)} Road`,
          type: "street",
        },
        {
          id: `${query}-5`,
          name: `${query.charAt(0).toUpperCase() + query.slice(1)} Station`,
          type: "station",
        },
      ];

      setLocationSuggestions(mockSuggestions);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e?.preventDefault();

    if (!searchTerm.trim()) return;

    // Save to recent searches
    saveRecentSearch(searchTerm);

    // Close suggestions
    setShowSuggestions(false);

    // Perform search
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      // Default behavior - navigate to search page
      router.push(`/properties?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Save search to recent searches
  const saveRecentSearch = (term: string, type = "text") => {
    const newSearch: SearchResult = {
      term,
      type,
      timestamp: Date.now(),
      data:
        type === "location"
          ? ({
              id: `search-${Date.now()}`,
              name: term,
              type: "area",
            } as Location)
          : ({} as Record<string, unknown>),
    };

    // Deduplicate searches
    const updatedSearches = [
      newSearch,
      ...recentSearches.filter(
        (search) => search.term.toLowerCase() !== term.toLowerCase()
      ),
    ].slice(0, 5);

    setRecentSearches(updatedSearches);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    }
  };

  // Handle clicking on a location suggestion
  const handleSuggestionClick = (suggestion: Location) => {
    // Save to recent searches
    saveRecentSearch(suggestion.name, "location");

    // Close suggestions
    setShowSuggestions(false);

    // Perform search
    if (onSearch) {
      onSearch(suggestion.name, suggestion.type);
    } else {
      // Default behavior - navigate to search page
      router.push(`/properties?search=${encodeURIComponent(suggestion.name)}`);
    }
  };

  // Handle clicking on a recent search
  const handleRecentSearchClick = (search: SearchResult) => {
    // Set search term in input
    setSearchTerm(search.term);
    saveRecentSearch(search.term, search.type);

    // Move this search to the top of recents
    // const updatedSearches = [
    // 	search,
    // 	...recentSearches.filter((item) => item.term !== search.term),
    // ];
    // setRecentSearches(updatedSearches);

    // if (typeof window !== "undefined") {
    // 	localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    // }

    // Close suggestions
    setShowSuggestions(false);

    // Perform search
    if (onSearch) {
      // If it's a location search, pass the location type
      if (search.type === "location" && search.data) {
        const locationData = search.data as Location;
        onSearch(search.term, locationData.type);
      } else {
        onSearch(search.term);
      }
    } else {
      // Default behavior - navigate to search page
      router.push(`/properties?search=${encodeURIComponent(search.term)}`);
    }
  };

  // Clear recent searches
  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);

    if (typeof window !== "undefined") {
      localStorage.removeItem("recentSearches");
    }
  };

  // Clear search input
  const clearSearch = () => {
    setSearchTerm("");
    inputRef.current?.focus();
  };

  // Format suggestion with highlighting for matched text
  const formatSuggestion = (text: string, query: string) => {
    if (!query) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="font-semibold">
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <div className={`smart-search relative ${className}`} ref={searchRef}>
      <form className="relative" onSubmit={handleSearch}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>

          <input
            autoComplete="off"
            className="block w-full rounded-lg border border-gray-300 py-3 pr-10 pl-10 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            ref={inputRef}
            type="text"
            value={searchTerm}
          />

          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              onClick={clearSearch}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <button aria-label="Search" className="hidden" type="submit">
          Search
        </button>
      </form>
      {/* Search suggestions */}
      {showSuggestions && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium text-gray-500 text-xs uppercase">
                  Recent Searches
                </h3>
                <button
                  className="text-gray-500 text-xs hover:text-gray-700"
                  onClick={clearRecentSearches}
                  type="button"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <div
                    className="flex cursor-pointer items-center rounded-md p-2 hover:bg-gray-100"
                    key={`recent-${index.toString()}`}
                    onClick={() => handleRecentSearchClick(search)}
                  >
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="text-gray-800">{search.term}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions divider */}
          {recentSearches.length > 0 &&
            (searchTerm.length > 1 || popularLocations.length > 0) && (
              <div className="border-gray-100 border-t" />
            )}

          {/* Location suggestions */}
          {searchTerm.length > 1 && (
            <div className="p-3">
              <h3 className="mb-2 font-medium text-gray-500 text-xs uppercase">
                Suggestions
              </h3>

              {isLoading ? (
                <div className="flex justify-center p-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-primary-500 border-b-2" />
                </div>
              ) : locationSuggestions.length > 0 ? (
                <div className="space-y-1">
                  {locationSuggestions.map((suggestion) => (
                    <div
                      className="flex cursor-pointer items-center rounded-md p-2 hover:bg-gray-100"
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.type === "area" && (
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                      )}
                      {suggestion.type === "street" && (
                        <Home className="mr-2 h-4 w-4 text-gray-400" />
                      )}
                      {suggestion.type === "station" && (
                        <ArrowRight className="mr-2 h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-gray-800">
                        {formatSuggestion(suggestion.name, searchTerm)}
                      </span>
                      {suggestion.type && (
                        <span className="ml-auto text-gray-500 text-xs">
                          {suggestion.type.charAt(0).toUpperCase() +
                            suggestion.type.slice(1)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-gray-500 text-sm">
                  No suggestions found for "{searchTerm}"
                </div>
              )}
            </div>
          )}

          {/* Popular locations */}
          {(!searchTerm || searchTerm.length <= 1) &&
            popularLocations.length > 0 && (
              <div className="p-3">
                <h3 className="mb-2 font-medium text-gray-500 text-xs uppercase">
                  Popular Locations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularLocations.map((location) => (
                    <button
                      className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
                      key={location.id}
                      onClick={() => handleSuggestionClick(location)}
                      type="button"
                    >
                      <MapPin className="mr-1 h-3 w-3 text-gray-500" />
                      {location.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Search button */}
          {searchTerm.length > 0 && (
            <div className="border-gray-100 border-t p-3">
              <button
                className="flex w-full items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-primary-700"
                onClick={handleSearch}
                type="button"
              >
                <Search className="mr-2 h-4 w-4" />
                Search for "{searchTerm}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
