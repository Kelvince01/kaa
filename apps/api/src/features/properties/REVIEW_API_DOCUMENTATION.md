# Review API Documentation

Base URL: `/api/v1/reviews`

## Public Endpoints

### GET `/`
Get reviews with filtering

**Query Parameters:**
- `targetId` (optional): Filter by target (property/user ID)
- `reviewerId` (optional): Filter by reviewer ID
- `type` (optional): Review type (property, user_landlord, user_tenant, agent, platform)
- `status` (optional): Review status (pending, approved, rejected, flagged, hidden, spam)
- `county` (optional): Filter by Kenya county
- `city` (optional): Filter by city
- `language` (optional): Filter by language (en, sw)
- `sentiment` (optional): Filter by sentiment (positive, negative, neutral, mixed)
- `verified` (optional): Filter verified reviews (true/false)
- `minRating` (optional): Minimum rating (1-5)
- `maxRating` (optional): Maximum rating (1-5)
- `dateFrom` (optional): Filter from date
- `dateTo` (optional): Filter to date
- `tags` (optional): Comma-separated tags
- `search` (optional): Full-text search
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field
- `sortOrder` (optional): Sort order (asc/desc)

**Response:**
```json
{
  "status": "success",
  "data": {
    "reviews": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### GET `/:id`
Get single review by ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "review": {...}
  }
}
```

### GET `/stats/:targetId`
Get review statistics for a target

**Query Parameters:**
- `type` (optional): Review type

**Response:**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalReviews": 42,
      "averageRating": 4.5,
      "ratingDistribution": {...},
      "sentimentDistribution": {...},
      "languageDistribution": {...},
      "verificationRate": 0.85,
      "responseRate": 0.92
    }
  }
}
```

### GET `/featured/list`
Get featured reviews

**Query Parameters:**
- `type` (optional): Review type
- `limit` (optional): Number of reviews (default: 10)

### GET `/county/:county`
Get reviews by Kenya county

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

### GET `/swahili/list`
Get Swahili language reviews

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

### GET `/verified/list`
Get verified reviews only

**Query Parameters:**
- `targetId` (optional): Filter by target
- `page` (optional): Page number
- `limit` (optional): Items per page

## Authenticated Endpoints

### POST `/`
Create a new review

**Authentication:** Required

**Body:**
```json
{
  "type": "property",
  "targetId": "property-id",
  "applicationId": "booking-id",
  "title": "Great property!",
  "content": "Very clean and well-maintained...",
  "rating": {
    "overall": 5,
    "categories": {}
  },
  "photos": ["url1", "url2"],
  "videos": ["url1"],
  "tags": ["clean", "safe"],
  "language": "en",
  "reviewDate": "2024-01-01",
  "county": "Nairobi",
  "city": "Westlands",
  "isAnonymous": false
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Review created successfully",
  "data": {
    "review": {...}
  }
}
```

### PATCH `/:id`
Update a review

**Authentication:** Required (must be review owner)

**Body:**
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "rating": {
    "overall": 4
  },
  "photos": ["url1"],
  "tags": ["updated"]
}
```

### DELETE `/:id`
Delete a review

**Authentication:** Required (must be review owner)

### POST `/:id/helpful`
Mark review as helpful

**Authentication:** Required

### POST `/:id/not-helpful`
Mark review as not helpful

**Authentication:** Required

### POST `/:id/flag`
Flag a review for moderation

**Authentication:** Required

**Body:**
```json
{
  "reason": "inappropriate_language",
  "description": "Contains offensive language"
}
```

**Flag Reasons:**
- `inappropriate_language`
- `fake_review`
- `spam`
- `personal_attack`
- `off_topic`
- `misleading`
- `harassment`
- `privacy_violation`

### POST `/:id/response`
Create a response to a review

**Authentication:** Required (must be property owner/agent or reviewed user)

**Body:**
```json
{
  "content": "Thank you for your feedback!"
}
```

### PATCH `/response/:responseId`
Update a response

**Authentication:** Required (must be response owner)

**Body:**
```json
{
  "content": "Updated response"
}
```

### DELETE `/response/:responseId`
Delete a response

**Authentication:** Required (must be response owner)

### GET `/summary/user/:userId`
Get user review summary

**Authentication:** Required

**Response:**
```json
{
  "status": "success",
  "data": {
    "summary": {
      "userId": "user-id",
      "asReviewer": {
        "totalReviews": 10,
        "averageRatingGiven": 4.2,
        "reviewsByType": {...}
      },
      "asReviewed": {
        "totalReviews": 15,
        "averageRating": 4.5,
        "ratingDistribution": {...},
        "recentReviews": [...],
        "responseRate": 0.9
      },
      "credibilityScore": 85,
      "verificationStatus": {...}
    }
  }
}
```

### GET `/summary/property/:propertyId`
Get property review summary

**Authentication:** Required

**Response:**
```json
{
  "status": "success",
  "data": {
    "summary": {
      "propertyId": "property-id",
      "totalReviews": 42,
      "averageRating": 4.5,
      "ratingDistribution": {...},
      "recentReviews": [...],
      "monthlyTrend": [...],
      "responseRate": 0.95,
      "averageResponseTime": 12.5,
      "verifiedReviewsPercentage": 85,
      "sentimentSummary": {...}
    }
  }
}
```

### GET `/analytics/data`
Get review analytics

**Authentication:** Required

**Query Parameters:**
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `type` (optional): Review type
- `groupBy` (optional): Group by (day, week, month, year)

## Moderation Endpoints

**Authentication:** Required
**Permission:** `reviews:manage`

### GET `/moderation/pending`
Get pending reviews for moderation

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

### GET `/moderation/flagged`
Get flagged reviews

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

### POST `/:id/approve`
Approve a review

**Body:**
```json
{
  "notes": "Approved - looks good"
}
```

### POST `/:id/reject`
Reject a review

**Body:**
```json
{
  "reason": "Spam content"
}
```

### POST `/:id/hide`
Hide a review

**Body:**
```json
{
  "reason": "Inappropriate content"
}
```

### POST `/moderation/bulk`
Bulk moderate reviews

**Body:**
```json
{
  "reviewIds": ["id1", "id2", "id3"],
  "action": "approve",
  "reason": "Bulk approval"
}
```

**Actions:**
- `approve`
- `reject`
- `hide`

### POST `/flags/:flagId/resolve`
Resolve a flag

**Body:**
```json
{
  "action": "resolve"
}
```

**Actions:**
- `resolve`
- `dismiss`

### POST `/analytics/sentiment`
Analyze sentiment for multiple reviews

**Body:**
```json
{
  "reviewIds": ["id1", "id2", "id3"]
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Consider implementing rate limiting for:
- Review creation: 5 reviews per hour per user
- Flag creation: 10 flags per hour per user
- Helpful/Not helpful: 50 votes per hour per user

## Best Practices

1. **Always validate input** on the client side before sending
2. **Handle errors gracefully** and show user-friendly messages
3. **Use pagination** for list endpoints
4. **Cache statistics** when possible
5. **Implement optimistic updates** for better UX
6. **Show loading states** during API calls
7. **Retry failed requests** with exponential backoff

## Example Usage

### JavaScript/TypeScript

```typescript
// Create a review
const response = await fetch('/api/v1/reviews', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'property',
    targetId: propertyId,
    title: 'Great property!',
    content: 'Very clean and well-maintained...',
    rating: {
      overall: 5,
      categories: {}
    },
    tags: ['clean', 'safe']
  })
});

const data = await response.json();
```

### cURL

```bash
# Get reviews
curl -X GET "https://api.example.com/api/v1/reviews?targetId=property-123&page=1&limit=20"

# Create a review
curl -X POST "https://api.example.com/api/v1/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "property",
    "targetId": "property-123",
    "title": "Great property!",
    "content": "Very clean...",
    "rating": {"overall": 5}
  }'

# Approve a review (moderator)
curl -X POST "https://api.example.com/api/v1/reviews/review-123/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MODERATOR_TOKEN" \
  -d '{"notes": "Approved"}'
```

## Webhooks (Future Enhancement)

Consider implementing webhooks for:
- `review.created` - When a new review is created
- `review.approved` - When a review is approved
- `review.rejected` - When a review is rejected
- `review.flagged` - When a review is flagged
- `response.created` - When a response is created

## Testing

Use the following test data for development:

```json
{
  "testPropertyId": "507f1f77bcf86cd799439011",
  "testUserId": "507f1f77bcf86cd799439012",
  "testReviewId": "507f1f77bcf86cd799439013"
}
```

## Support

For issues or questions:
- Check the service implementation: `packages/services/REVIEW_SERVICE_IMPLEMENTATION.md`
- Check the quick start guide: `packages/services/REVIEW_SERVICE_QUICK_START.md`
- Review the type definitions: `packages/models/src/types/review.type.ts`
