# Review Service - Quick Start Guide

## Installation

The review service is already integrated into the services package. Import it:

```typescript
import { reviewsService } from '@kaa/services';
// or
import { ReviewsService } from '@kaa/services';
```

## Basic Usage

### 1. Create a Review

```typescript
const review = await reviewsService.createReview({
  type: ReviewType.PROPERTY,
  targetId: propertyId,
  title: 'Excellent property',
  content: 'The property is well-maintained and in a great location...',
  rating: {
    overall: 5,
    categories: {}
  },
  tags: ['clean', 'safe', 'quiet'],
  language: 'en'
}, userId);
```

### 2. Get Reviews

```typescript
// Get all reviews for a property
const { reviews, pagination } = await reviewsService.getReviews({
  targetId: propertyId,
  status: ReviewStatus.APPROVED,
  page: 1,
  limit: 20
});

// Get verified reviews only
const verifiedReviews = await reviewsService.getVerifiedReviews(propertyId);

// Get reviews by county
const nairobiReviews = await reviewsService.getReviewsByCounty('Nairobi');
```

### 3. Update a Review

```typescript
const updated = await reviewsService.updateReview(
  reviewId,
  {
    title: 'Updated title',
    content: 'Updated content...',
    rating: { overall: 4, categories: {} }
  },
  userId
);
```

### 4. Moderate Reviews

```typescript
// Approve
await reviewsService.approveReview(reviewId, moderatorId, 'Approved');

// Reject
await reviewsService.rejectReview(reviewId, moderatorId, 'Spam content');

// Get pending reviews
const { reviews } = await reviewsService.getPendingReviews(1, 20);
```

### 5. Flag a Review

```typescript
await reviewsService.flagReview(
  reviewId,
  userId,
  ReviewFlagReason.INAPPROPRIATE_LANGUAGE,
  'Contains offensive language'
);
```

### 6. Respond to a Review

```typescript
// Property owner responding
const response = await reviewsService.createResponse(
  reviewId,
  propertyOwnerId,
  'Thank you for your feedback!'
);
```

### 7. Mark as Helpful

```typescript
await reviewsService.markHelpful(reviewId, userId);
await reviewsService.markNotHelpful(reviewId, userId);
```

### 8. Get Statistics

```typescript
// Property stats
const stats = await reviewsService.getReviewStats(propertyId, ReviewType.PROPERTY);
console.log(stats.averageRating); // 4.5
console.log(stats.totalReviews); // 42

// User summary
const userSummary = await reviewsService.getUserReviewSummary(userId);
console.log(userSummary.credibilityScore); // 85

// Property summary
const propertySummary = await reviewsService.getPropertyReviewSummary(propertyId);
console.log(propertySummary.responseRate); // 0.95
```

## Review Types

```typescript
enum ReviewType {
  PROPERTY = "property",
  USER_LANDLORD = "user_landlord",
  USER_TENANT = "user_tenant",
  AGENT = "agent",
  PLATFORM = "platform"
}
```

## Review Status

```typescript
enum ReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  FLAGGED = "flagged",
  HIDDEN = "hidden",
  SPAM = "spam"
}
```

## Flag Reasons

```typescript
enum ReviewFlagReason {
  INAPPROPRIATE_LANGUAGE = "inappropriate_language",
  FAKE_REVIEW = "fake_review",
  SPAM = "spam",
  PERSONAL_ATTACK = "personal_attack",
  OFF_TOPIC = "off_topic",
  MISLEADING = "misleading",
  HARASSMENT = "harassment",
  PRIVACY_VIOLATION = "privacy_violation"
}
```

## Advanced Filtering

```typescript
const { reviews, pagination, summary } = await reviewsService.getReviews({
  // Target filters
  targetId: propertyId,
  reviewerId: userId,
  type: ReviewType.PROPERTY,
  
  // Status filters
  status: ReviewStatus.APPROVED,
  verified: true,
  
  // Rating filters
  minRating: 4,
  maxRating: 5,
  
  // Location filters
  county: 'Nairobi',
  city: 'Westlands',
  
  // Language filters
  language: 'sw',
  sentiment: ReviewSentiment.POSITIVE,
  
  // Date filters
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-12-31'),
  
  // Content filters
  search: 'clean and safe',
  tags: ['clean', 'safe'],
  
  // Pagination
  page: 1,
  limit: 20,
  sortBy: 'rating.overall',
  sortOrder: 'desc'
});
```

## Error Handling

```typescript
try {
  const review = await reviewsService.createReview(data, userId);
} catch (error) {
  if (error instanceof NotFoundError) {
    // Handle not found
  } else if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof ForbiddenError) {
    // Handle permission error
  }
}
```

## Best Practices

1. **Always check permissions** before allowing review operations
2. **Use pagination** for list operations to avoid performance issues
3. **Enable auto-approval** only for trusted users
4. **Monitor flagged reviews** regularly
5. **Respond to reviews** to improve engagement
6. **Track analytics** to understand review trends
7. **Verify reviews** when possible to build trust

## Configuration

Edit `KENYA_REVIEW_CONSTANTS` in `packages/models/src/types/review.type.ts`:

```typescript
export const KENYA_REVIEW_CONSTANTS = {
  MIN_REVIEW_LENGTH: 10,
  MAX_REVIEW_LENGTH: 2000,
  MIN_RATING: 1,
  MAX_RATING: 5,
  EDIT_WINDOW_HOURS: 3,
  BUSINESS_HOURS: {
    START: 9,
    END: 17,
    ENFORCE_BUSINESS_HOURS: true, // Set to false to disable
  },
  AUTO_MODERATION: {
    SPAM_SCORE_THRESHOLD: 0.8,
    SENTIMENT_EXTREME_THRESHOLD: 0.9,
    FLAG_AUTO_HIDE_THRESHOLD: 5,
    RESPONSE_TIME_TARGET_HOURS: 48,
  },
};
```

## Common Patterns

### Review Workflow
```typescript
// 1. User creates review
const review = await reviewsService.createReview(data, userId);

// 2. Review goes to moderation (if not auto-approved)
const pending = await reviewsService.getPendingReviews();

// 3. Moderator approves/rejects
await reviewsService.approveReview(review._id, moderatorId);

// 4. Property owner responds
await reviewsService.createResponse(review._id, ownerId, 'Thank you!');

// 5. Users mark as helpful
await reviewsService.markHelpful(review._id, otherUserId);
```

### Analytics Dashboard
```typescript
// Get overall stats
const stats = await reviewsService.getReviewStats();

// Get property-specific stats
const propertyStats = await reviewsService.getPropertyReviewSummary(propertyId);

// Get time-based analytics
const analytics = await reviewsService.getAnalytics({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  type: ReviewType.PROPERTY,
  groupBy: 'month'
});
```

## Support

For issues or questions:
- Check the full implementation guide: `REVIEW_SERVICE_IMPLEMENTATION.md`
- Review the type definitions: `packages/models/src/types/review.type.ts`
- Check the model schemas: `packages/models/src/review.model.ts`
