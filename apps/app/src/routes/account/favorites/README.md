# Favourites Component Implementation

## Overview

This implementation provides a complete favourites management system for the account section, allowing users to view, manage, and organize their saved properties.

## Files Created

### Route Components
- **`index.tsx`** - Main favourites page with search, filters, and view controls
- **`grid-view.tsx`** - Grid layout for displaying favourite properties
- **`list-view.tsx`** - List layout for displaying favourite properties
- **`stats-card.tsx`** - Statistics cards showing favourite metrics

### App Route
- **`app/account/favourites/page.tsx`** - Next.js page wrapper

### Navigation
- **`routes/account/layout/sidebar.tsx`** - Updated to include Favourites navigation item

## Features Implemented

### 1. View Modes
- **Grid View**: Card-based layout showing properties in a responsive grid
- **List View**: Detailed list layout with more property information
- Toggle between views with a single click

### 2. Search and Filters
- **Search**: Real-time search across favourite properties
- **Sort Options**: 
  - Recently Added
  - Property Name
  - Price
- **Sort Order**: Ascending/Descending toggle
- Filter management with clear filters option

### 3. Selection and Bulk Actions
- Checkbox-based selection for multiple properties
- Bulk delete functionality
- Selection count display
- Clear selection option

### 4. Statistics Dashboard
- Total favourites count
- Available properties count
- Average price calculation
- Number of unique locations

### 5. Property Management
- **Remove Individual**: Heart icon button to remove single properties
- **Clear All**: Remove all favourites at once (with confirmation)
- **View Property**: Navigate to property details page
- Property status indicators (Available/Rented/Sold)

### 6. State Management
- Integrated with existing favourites store (`useFavouriteStore`)
- React Query for data fetching and caching
- Optimistic updates for better UX

### 7. Responsive Design
- Mobile-first approach
- Adaptive grid columns (1/2/3 columns based on screen size)
- Touch-friendly controls
- Skeleton loading states

## Integration Points

### Modules Used
- **`@/modules/properties/favourites`**
  - `useFavourites` - Fetch favourites with filters
  - `useFavouriteStats` - Fetch statistics
  - `useRemoveFavourite` - Remove single favourite
  - `useClearAllFavourites` - Remove all favourites
  - `useFavouriteStore` - State management

### UI Components (from @kaa/ui)
- Button
- Input
- Select
- Badge
- Card
- Checkbox
- Skeleton

### Routing
- **Navigation Path**: `/account/favourites`
- **Sidebar Integration**: Added to account sidebar with Heart icon
- **Property Links**: Navigate to `/properties/{propertyId}`

## Data Flow

1. **Initial Load**:
   - Fetch favourites with query params from store
   - Fetch statistics separately
   - Display loading skeletons

2. **User Actions**:
   - Search updates store filters
   - Sort/filter changes trigger new queries
   - View mode toggle updates store preferences

3. **Mutations**:
   - Remove favourite → invalidate queries → refetch
   - Clear all → invalidate all → empty state
   - Success/error toasts for user feedback

## Empty State

When no favourites exist:
- Heart icon placeholder
- Clear message
- Call-to-action button to browse properties
- Navigates to `/properties` page

## Accessibility

- Semantic HTML elements
- Button type attributes
- Keyboard navigation support
- ARIA labels where needed
- Screen reader friendly

## Performance Optimizations

- React Query caching (5-10 minute stale times)
- Skeleton loading for perceived performance
- Optimistic updates where applicable
- Lazy component loading
- Image optimization with Next.js Image

## Future Enhancements

Potential additions that can be integrated:
- Export favourites (CSV/PDF)
- Share favourites with others
- Create custom lists/collections
- Price alerts for favourites
- Similar property recommendations
- Comparison tool for selected properties
- Save search filters
- Email notifications for updates

## Testing Recommendations

1. **Unit Tests**:
   - Store actions and selectors
   - Utility functions (formatPrice, etc.)

2. **Integration Tests**:
   - Data fetching and mutations
   - Filter and search functionality
   - View mode toggling

3. **E2E Tests**:
   - Complete user journey
   - Add/remove favourites flow
   - Navigation and routing

## Error Handling

- Try-catch blocks for async operations
- Toast notifications for user feedback
- Graceful degradation for missing data
- Loading and error states

## Known Limitations

1. **TypeScript Module Resolution**: Some UI component imports show TypeScript errors but work correctly at runtime due to monorepo setup
2. **Confirmation Dialogs**: Uses native `window.confirm` (consider implementing custom dialog component)
3. **Array Keys**: Uses index-based keys for skeleton loading (acceptable for static loading states)

## Code Quality

- Biome formatter applied
- Consistent code style
- Type safety with TypeScript
- ESLint/Biome rules followed
- Clean component structure

## Usage Example

```typescript
// Navigate to favourites page
router.push('/account/favourites');

// Access favourites store
const { filters, viewPreferences, selectedFavourites } = useFavouriteStore();

// Fetch favourites
const { data, isLoading } = useFavourites(filters);

// Remove favourite
const removeFavourite = useRemoveFavourite();
await removeFavourite.mutateAsync({ propertyId: 'xxx' });
```

## Maintenance

- **Store**: `apps/app/src/modules/properties/favourites/favourite.store.ts`
- **Services**: `apps/app/src/modules/properties/favourites/favourite.service.ts`
- **Types**: `apps/app/src/modules/properties/favourites/favourite.type.ts`
- **Queries**: `apps/app/src/modules/properties/favourites/favourite.queries.ts`

## Related Documentation

- [Property Module](../../modules/properties/README.md)
- [Account Routes](../README.md)
- [UI Components](../../../../packages/ui/README.md)

