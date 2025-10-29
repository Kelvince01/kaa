## Property Search Module

Comprehensive property search functionality with advanced filtering, saved searches, and analytics.

### Features

#### 🔍 Advanced Search
- Full-text search with query suggestions
- Location-based search with radius filtering
- Property type filters (apartment, house, studio, etc.)
- Price range filtering
- Bedroom and bathroom filters
- Amenity and feature filters
- Furnished and pet-friendly options
- Sort by relevance, price, bedrooms, size, or date

#### 💾 Saved Searches
- Save search criteria for quick access
- Enable alerts for new matching properties
- Configure alert frequency (instant, daily, weekly)
- Execute saved searches with one click
- View new properties since last check

#### 📊 Search Analytics
- Track search queries and filters
- Monitor search performance (response time)
- Detect no-result searches
- Track result clicks and positions
- User behavior insights

#### 🎯 Smart Suggestions
- Autocomplete with location suggestions
- Property type suggestions
- Feature-based suggestions
- Recent search history
- Popular searches

### Usage

#### Basic Search

```tsx
import { PropertySearchBar } from "@/modules/properties/search";

function MyComponent() {
  const handleSearch = (params) => {
    console.log("Search params:", params);
  };

  return (
    <PropertySearchBar
      onSearch={handleSearch}
      placeholder="Search properties..."
      size="lg"
    />
  );
}
```

#### Advanced Search with Filters

```tsx
import { SearchFilters } from "@/modules/properties/search";

function MyComponent() {
  const [filters, setFilters] = useState({});

  return (
    <SearchFilters
      filters={filters}
      onFiltersChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
      onClearFilters={() => setFilters({})}
      hasActiveFilters={Object.keys(filters).length > 0}
      variant="full"
    />
  );
}
```

#### Enhanced Search Hook

```tsx
import { useEnhancedSearch } from "@/modules/properties/search";

function PropertyList() {
  const {
    searchParams,
    results,
    pagination,
    isLoading,
    updateParams,
    clearParams,
    trackResultClick,
  } = useEnhancedSearch({
    initialParams: { type: "apartment" },
    enableAnalytics: true,
    autoSearch: true,
  });

  return (
    <div>
      {results.map((property, index) => (
        <div
          key={property._id}
          onClick={() => trackResultClick(property._id, index)}
        >
          {property.title}
        </div>
      ))}
    </div>
  );
}
```

#### Saved Searches

```tsx
import { SavedSearchesList } from "@/modules/properties/search";

function MySavedSearches() {
  const handleExecuteSearch = (filters) => {
    // Navigate to search results with filters
    router.push(`/properties?${new URLSearchParams(filters)}`);
  };

  return (
    <SavedSearchesList onExecuteSearch={handleExecuteSearch} />
  );
}
```

#### Search Analytics

```tsx
import { useSearchAnalytics } from "@/modules/properties/search";

function MySearchComponent() {
  const analytics = useSearchAnalytics({ enabled: true });

  const performSearch = async (query) => {
    analytics.startSearch();
    
    const results = await searchAPI(query);
    
    analytics.trackSearchComplete({
      query,
      resultCount: results.length,
    });

    if (results.length === 0) {
      analytics.trackNoResults({ query });
    }
  };

  return <SearchInput onSearch={performSearch} />;
}
```

### API Integration

The search module integrates with the following backend endpoints:

#### Search Endpoints
- `GET /properties/search` - Basic property search
- `GET /advanced-search/properties` - Advanced search with Elasticsearch
- `GET /properties/search/nearby` - Nearby properties search
- `GET /properties/search/suggestions` - Search autocomplete
- `GET /properties/search/popular` - Popular searches
- `GET /properties/search/filters` - Available filter options

#### Saved Searches
- `GET /properties/search/saved` - Get user's saved searches
- `POST /properties/search/saved` - Create a saved search
- `PATCH /properties/search/saved/:id` - Update a saved search
- `DELETE /properties/search/saved/:id` - Delete a saved search
- `GET /properties/search/saved/:id/execute` - Execute a saved search
- `GET /properties/search/saved/:id/new` - Get new properties for saved search

#### Search Alerts
- `GET /properties/search/alerts` - Get search alerts
- `PATCH /properties/search/alerts/:id/view` - Mark alert as viewed

#### Analytics
- `POST /properties/search/analytics/track` - Track search event
- `GET /properties/search/history` - Get user search history
- `DELETE /properties/search/history` - Clear search history

### Types

See `search.types.ts` for comprehensive type definitions including:
- `PropertySearchParams` - Search parameters
- `AdvancedSearchParams` - Advanced search parameters
- `SavedSearch` - Saved search structure
- `SearchResponse` - Search result structure
- `SearchSuggestion` - Autocomplete suggestion
- `SearchAnalyticsEvent` - Analytics event structure

### Components

#### PropertySearchBar
Advanced search input with autocomplete suggestions.

**Props:**
- `onSearch: (params: PropertySearchParams) => void` - Search handler
- `defaultValue?: string` - Default search query
- `placeholder?: string` - Input placeholder
- `className?: string` - Additional CSS classes
- `showSuggestions?: boolean` - Show autocomplete (default: true)
- `size?: "sm" | "md" | "lg"` - Input size (default: "md")

#### SearchFilters
Comprehensive property filter component.

**Props:**
- `filters: PropertySearchParams` - Current filters
- `onFiltersChange: (filters: Partial<PropertySearchParams>) => void` - Filter change handler
- `onClearFilters: () => void` - Clear filters handler
- `hasActiveFilters: boolean` - Whether filters are applied
- `className?: string` - Additional CSS classes
- `variant?: "full" | "compact"` - Display variant (default: "full")

#### SavedSearchesList
Display and manage user's saved searches.

**Props:**
- `onExecuteSearch?: (filters: PropertySearchParams) => void` - Execute search handler
- `className?: string` - Additional CSS classes

#### SearchSuggestions
Display search autocomplete suggestions.

**Props:**
- `suggestions: SearchSuggestion[]` - Suggestions to display
- `recentSearches?: string[]` - Recent search queries
- `popularSearches?: Array<{ query: string; count: number }>` - Popular searches
- `isLoading?: boolean` - Loading state
- `onSuggestionClick: (suggestion) => void` - Suggestion click handler
- `onClearRecent?: () => void` - Clear recent searches handler
- `className?: string` - Additional CSS classes

### Hooks

#### useEnhancedSearch
Main search hook with analytics integration.

**Returns:**
- `searchParams` - Current search parameters
- `results` - Search results
- `pagination` - Pagination info
- `metadata` - Search metadata
- `isLoading` - Loading state
- `error` - Error state
- `updateParams` - Update search parameters
- `clearParams` - Clear all parameters
- `search` - Perform search
- `refetch` - Refetch results
- `trackResultClick` - Track result click
- `hasResults` - Whether results exist
- `hasFilters` - Whether filters are applied
- `totalResults` - Total result count

#### useSearchAnalytics
Track search events and analytics.

**Returns:**
- `startSearch` - Start tracking a search
- `trackSearchComplete` - Track search completion
- `trackResultClick` - Track result click
- `trackNoResults` - Track no results

#### useSearchPerformance
Track search performance metrics.

**Returns:**
- `recordSearch` - Record search metrics
- `getMetrics` - Get performance metrics
- `resetMetrics` - Reset metrics

### Best Practices

1. **Always track searches** for analytics when `enableAnalytics` is true
2. **Debounce search inputs** to avoid excessive API calls
3. **Clear filters** button should always be visible when filters are active
4. **Validate search parameters** before submitting
5. **Show loading states** during search operations
6. **Handle no results** gracefully with suggestions
7. **Cache suggestions** to improve performance
8. **Track user interactions** for better recommendations

### Performance Considerations

- Search queries are debounced by 300ms
- Suggestions are cached for 5 minutes
- Popular searches are cached for 30 minutes
- Filter options are cached for 30 minutes
- Search history is limited to recent 10 searches
- Analytics tracking is non-blocking

### Examples

See the complete implementation in:
- `/routes/main/properties/search/index.tsx` - Advanced search page
- `/routes/main/properties/index.tsx` - Properties list with search
- `/routes/main/properties/hooks/use-properties-search.ts` - Search state management

