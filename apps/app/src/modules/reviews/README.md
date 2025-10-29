# Reviews Module

A comprehensive review system for managing property, user, agent, and platform reviews with support for moderation, analytics, and Kenya-specific features.

## Features

- ✅ **Multiple Review Types**: Property, Landlord, Tenant, Agent, and Platform reviews
- ✅ **Rich Review Content**: Ratings, photos, videos, tags, and detailed text
- ✅ **Moderation System**: Approve, reject, hide reviews with flag reporting
- ✅ **Engagement Features**: Helpful/Not Helpful voting, responses from owners
- ✅ **Analytics & Stats**: Rating distribution, sentiment analysis, verification rates
- ✅ **Kenya-Specific Features**: County-based filtering, Swahili language support
- ✅ **Filtering & Search**: Advanced filtering by rating, date, location, sentiment
- ✅ **Responsive UI**: Modern, accessible components built with Shadcn UI

## Usage

### Basic Review Dashboard

```tsx
import { ReviewDashboard } from "@/modules/reviews";

export function PropertyReviews({ propertyId }: { propertyId: string }) {
  return (
    <ReviewDashboard
      targetId={propertyId}
      type="property"
      currentUserId={currentUser.id}
      showCreateButton={true}
      showStats={true}
    />
  );
}
```

### Create Review Form

```tsx
import { CreateReviewForm } from "@/modules/reviews";

export function CreateReview() {
  return (
    <CreateReviewForm
      targetId="property-123"
      type="property"
      onSuccess={() => console.log("Review created!")}
      onCancel={() => console.log("Cancelled")}
    />
  );
}
```

### Review List with Custom Filters

```tsx
import { ReviewList, useReviews } from "@/modules/reviews";

export function CustomReviewList() {
  const { data, isLoading } = useReviews({
    targetId: "property-123",
    type: "property",
    status: "approved",
    minRating: 4,
    verified: true,
  });

  return (
    <ReviewList
      reviews={data?.reviews || []}
      isLoading={isLoading}
      pagination={data?.pagination}
      currentUserId={currentUser.id}
    />
  );
}
```

### Review Statistics

```tsx
import { ReviewStats, useReviewStats } from "@/modules/reviews";

export function PropertyStats({ propertyId }: { propertyId: string }) {
  const { data, isLoading } = useReviewStats(propertyId, "property");

  return <ReviewStats stats={data} isLoading={isLoading} />;
}
```

### Moderation Panel

```tsx
import { ModerationPanel } from "@/modules/reviews";

export function ReviewModeration() {
  return <ModerationPanel />;
}
```

## Components

### Core Components

- **`ReviewDashboard`** - Complete review interface with filters, stats, and list
- **`ReviewList`** - Paginated list of reviews
- **`ReviewCard`** - Individual review display with actions
- **`ReviewStats`** - Statistical overview with charts and metrics
- **`ReviewFilters`** - Advanced filtering controls

### Form Components

- **`CreateReviewForm`** - Form for creating new reviews
- **`ResponseForm`** - Form for responding to reviews
- **`FlagReviewDialog`** - Dialog for flagging inappropriate reviews

### Moderation Components

- **`ModerationPanel`** - Interface for moderating pending and flagged reviews

## Hooks

### Queries

- `useReviews(filters)` - Fetch reviews with filtering
- `useReview(id)` - Fetch single review
- `useReviewStats(targetId, type)` - Fetch review statistics
- `useFeaturedReviews(type, limit)` - Fetch featured reviews
- `useReviewsByCounty(county)` - Fetch reviews by Kenya county
- `useSwahiliReviews()` - Fetch Swahili language reviews
- `useVerifiedReviews(targetId)` - Fetch verified reviews only
- `usePendingReviews()` - Fetch pending moderation reviews
- `useFlaggedReviews()` - Fetch flagged reviews

### Mutations

- `useCreateReview()` - Create a new review
- `useUpdateReview()` - Update existing review
- `useDeleteReview()` - Delete a review
- `useMarkHelpful()` - Mark review as helpful
- `useMarkNotHelpful()` - Mark review as not helpful
- `useFlagReview()` - Flag a review
- `useCreateResponse()` - Respond to a review
- `useUpdateResponse()` - Update a response
- `useDeleteResponse()` - Delete a response

### Moderation Mutations

- `useApproveReview()` - Approve a review
- `useRejectReview()` - Reject a review
- `useHideReview()` - Hide a review
- `useBulkModerate()` - Bulk moderate multiple reviews
- `useResolveFlag()` - Resolve a flag

## State Management

The module uses Zustand for state management:

```tsx
import { useReviewStore } from "@/modules/reviews";

const {
  filters,
  setFilters,
  resetFilters,
  selectedReviews,
  isCreatingReview,
  setIsCreatingReview,
} = useReviewStore();
```

## API Integration

All API calls are handled through the `reviewService`:

```typescript
import { reviewService } from "@/modules/reviews";

// Get reviews
const reviews = await reviewService.getReviews({
  targetId: "property-123",
  minRating: 4,
});

// Create review
const review = await reviewService.createReview({
  type: "property",
  targetId: "property-123",
  title: "Great place!",
  content: "Loved staying here...",
  rating: { overall: 5 },
});
```

## Type Safety

The module is fully typed with TypeScript:

```typescript
import type {
  IReview,
  ReviewFilterOptions,
  ReviewFormData,
  ReviewWithUser,
} from "@/modules/reviews";
```

## Validation

Forms are validated using Zod schemas:

```typescript
import { reviewFormSchema, flagReviewSchema } from "@/modules/reviews";
```

## Features in Detail

### Rating System

- 5-star rating scale
- Overall rating plus optional category ratings
- Visual star display with hover effects

### Rich Media

- Up to 10 photos per review
- Up to 3 videos per review
- Image error handling

### Moderation Workflow

1. User submits review → Status: `pending`
2. Moderator reviews → Approve/Reject/Hide
3. Approved reviews are public
4. Rejected reviews notify the author
5. Hidden reviews are removed from view

### Flag System

Users can flag inappropriate reviews with reasons:
- Inappropriate language
- Fake review
- Spam
- Personal attack
- Off topic
- Misleading
- Harassment
- Privacy violation

### Response System

- Property owners/landlords can respond to reviews
- One response per review
- Responses show alongside the review
- Can be edited or deleted

### Analytics

Track key metrics:
- Total reviews
- Average rating
- Rating distribution (1-5 stars)
- Sentiment analysis (positive/negative/neutral/mixed)
- Language distribution (English/Swahili)
- Verification rate
- Response rate

### Kenya-Specific Features

- County-based filtering (14 major counties)
- City/town location tagging
- Swahili language support
- Auto-detection of Swahili content
- Localized review display

## Best Practices

1. **Always validate user input** using the provided schemas
2. **Handle loading and error states** in your components
3. **Implement pagination** for large review lists
4. **Show user feedback** using toast notifications
5. **Respect user permissions** - only allow editing own reviews
6. **Implement rate limiting** on the backend
7. **Cache statistics** for better performance
8. **Use optimistic updates** for better UX

## Error Handling

All mutations include error handling with user-friendly messages:

```tsx
const createReview = useCreateReview();

createReview.mutate(data, {
  onSuccess: () => {
    toast.success("Review created!");
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus management

## Performance

- React Query for data caching and invalidation
- Optimistic UI updates
- Lazy loading for images
- Pagination for large datasets
- Debounced search input

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Related Documentation

- [API Documentation](../../../../api/src/features/properties/REVIEW_API_DOCUMENTATION.md)
- [Review Model](../../../../packages/models/src/review.model.ts)
- [Review Types](../../../../packages/models/src/types/review.type.ts)
- [Review Service](../../../../packages/services/src/properties/review.service.ts)

