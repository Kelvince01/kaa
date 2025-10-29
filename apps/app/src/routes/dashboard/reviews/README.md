# Reviews Dashboard Routes

This directory contains the review management routes for the dashboard.

## Structure

```
reviews/
├── index.tsx                 # Main reviews dashboard (all reviews + moderation)
├── property-reviews.tsx      # Property-specific reviews
├── user-reviews.tsx          # User-specific reviews (landlords/tenants)
└── README.md                 # This file
```

## Routes

### Main Reviews Dashboard
**File**: `index.tsx`  
**URL**: `/dashboard/reviews`

Displays all reviews across the platform with two tabs:
- **All Reviews**: Shows all reviews with filtering and stats
- **Moderation** (admin/moderator only): Pending and flagged reviews for moderation

**Features**:
- View all reviews
- Filter by type, status, rating, etc.
- Create new reviews
- Moderate reviews (with permissions)
- View statistics

### Property Reviews
**File**: `property-reviews.tsx`  
**URL**: `/dashboard/properties/[id]/reviews`

Shows all reviews for a specific property.

**Features**:
- Property-specific reviews only
- Create review for this property
- View rating statistics
- Filter and search
- Response management

**Usage**:
```tsx
<PropertyReviews propertyId="property-123" />
```

### User Reviews
**File**: `user-reviews.tsx`  
**URL**: `/dashboard/users/[id]/reviews` (to be created)

Shows reviews about a specific user (landlord or tenant).

**Features**:
- User-specific reviews
- Filter by review type (landlord/tenant)
- View rating statistics
- No create button (reviews created from bookings)

**Usage**:
```tsx
<UserReviews userId="user-123" reviewType="user_landlord" />
```

## Integration

### Property Page Integration

Add reviews tab to property details page:

```tsx
// app/dashboard/properties/[id]/page.tsx
import PropertyReviews from "@/routes/dashboard/reviews/property-reviews";

export default function PropertyPage({ params }) {
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
      
      <TabsContent value="reviews">
        <PropertyReviews propertyId={params.id} />
      </TabsContent>
    </Tabs>
  );
}
```

### User Profile Integration

Add reviews section to user profiles:

```tsx
// app/dashboard/users/[id]/page.tsx
import UserReviews from "@/routes/dashboard/reviews/user-reviews";

export default function UserProfilePage({ params }) {
  return (
    <div>
      <h1>User Profile</h1>
      <UserReviews userId={params.id} reviewType="user_landlord" />
    </div>
  );
}
```

## Permissions

### Viewing Reviews
- **Public**: Can view approved reviews
- **Authenticated**: Can view all their own reviews
- **Admin/Moderator**: Can view all reviews

### Creating Reviews
- **Authenticated**: Can create reviews for properties/users they've interacted with
- Review creation is validated on the backend

### Moderation
- **Admin**: Full moderation access
- **Moderator**: Limited moderation access
- Requires `reviews:manage` permission

## Components Used

All routes use the `ReviewDashboardContainer` component from `@/modules/reviews/containers/ReviewDashboardContainer.tsx`.

### Props

```typescript
type ReviewDashboardContainerProps = {
  targetId: string;           // Property/User ID
  type?: string;              // Review type: 'property', 'user_landlord', 'user_tenant'
  currentUserId?: string;     // Current logged-in user ID
  showCreateButton?: boolean; // Show "Write Review" button
  showStats?: boolean;        // Show statistics tab
};
```

## Features

### Filtering
- By review type
- By status (pending, approved, rejected, etc.)
- By rating (1-5 stars)
- By language (English/Swahili)
- By county (Kenya counties)
- By date range
- Full-text search

### Statistics
- Total reviews count
- Average rating
- Rating distribution
- Sentiment analysis
- Language distribution
- Verification rate
- Response rate

### Actions
- Create review
- Edit own review (within time window)
- Delete own review
- Flag inappropriate reviews
- Respond to reviews (property owners)
- Mark helpful/not helpful

### Moderation (Admin/Moderator)
- View pending reviews
- View flagged reviews
- Approve reviews
- Reject reviews
- Hide reviews
- Bulk moderation
- Resolve flags

## State Management

Reviews use Zustand for state management:

```typescript
const {
  filters,              // Current filter state
  setFilters,          // Update filters
  resetFilters,        // Reset to defaults
  selectedReviews,     // Selected for bulk actions
  isCreatingReview,    // Create form visibility
  flaggingReviewId,    // Flag dialog state
  respondingToReviewId,// Response form state
} = useReviewStore();
```

## API Integration

All API calls are handled through React Query:

```typescript
// Queries
useReviews(filters)           // Get reviews list
useReview(id)                 // Get single review
useReviewStats(targetId)      // Get statistics
usePendingReviews()           // Get pending reviews
useFlaggedReviews()           // Get flagged reviews

// Mutations
useCreateReview()             // Create new review
useUpdateReview()             // Update review
useDeleteReview()             // Delete review
useFlagReview()               // Flag review
useCreateResponse()           // Respond to review
useApproveReview()            // Approve (moderation)
useRejectReview()             // Reject (moderation)
```

## Related Files

- **Module**: `@/modules/reviews/`
- **Components**: `@/modules/reviews/components/`
- **Container**: `@/modules/reviews/containers/ReviewDashboardContainer.tsx`
- **Types**: `@/modules/reviews/review.type.ts`
- **Service**: `@/modules/reviews/review.service.ts`
- **Store**: `@/modules/reviews/review.store.ts`

## Next Steps

1. ✅ Create main reviews dashboard page
2. ✅ Create property reviews page
3. ✅ Create moderation page
4. ⏳ Create user reviews page (when user profile exists)
5. ⏳ Add reviews tab to property details page
6. ⏳ Add reviews section to user profiles
7. ⏳ Implement email notifications
8. ⏳ Add review reminders
9. ⏳ Implement advanced analytics

## Testing

To test the routes:

1. **Main Dashboard**: Navigate to `/dashboard/reviews`
2. **Property Reviews**: Navigate to `/dashboard/properties/[propertyId]/reviews`
3. **Moderation**: Navigate to `/dashboard/reviews/moderation` (admin only)

Make sure you have:
- Valid authentication token
- Appropriate permissions
- Sample data in the database

