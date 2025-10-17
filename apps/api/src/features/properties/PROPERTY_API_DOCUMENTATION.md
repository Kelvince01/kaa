# Property API Documentation

Complete API documentation for property management endpoints.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Public Endpoints](#public-endpoints)
  - [Authenticated Endpoints](#authenticated-endpoints)
  - [Admin/Moderator Endpoints](#adminmoderator-endpoints)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

The Property API provides comprehensive endpoints for managing property listings, including:

- CRUD operations for properties
- Advanced search and filtering
- Location-based queries
- Property analytics and statistics
- Moderation and verification workflows
- Bulk operations
- Personalized recommendations
- Pricing insights

**Base URL:** `/api/v1/properties`

## Authentication

Most endpoints require authentication using the `authPlugin`. Protected endpoints expect:

- Valid session token in cookies or headers
- User ID available in `user` context
- Appropriate permissions for admin/moderator endpoints

## Endpoints

### Public Endpoints

These endpoints are accessible without authentication.

#### 1. Get All Properties

```http
GET /api/v1/properties
```

Get a paginated list of properties with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `sortBy` | string | Sort field (default: createdAt) |
| `sortOrder` | string | Sort order: asc/desc (default: desc) |
| `status` | string | Filter by status (comma-separated) |
| `type` | string | Filter by type (comma-separated) |
| `listingType` | string | Filter by listing type (comma-separated) |
| `landlordId` | string | Filter by landlord ID |
| `agentId` | string | Filter by agent ID |
| `memberId` | string | Filter by member ID |
| `organizationId` | string | Filter by organization ID |
| `county` | string | Filter by county (comma-separated) |
| `estate` | string | Filter by estate (comma-separated) |
| `minRent` | number | Minimum rent price |
| `maxRent` | number | Maximum rent price |
| `minBedrooms` | number | Minimum bedrooms |
| `maxBedrooms` | number | Maximum bedrooms |
| `minBathrooms` | number | Minimum bathrooms |
| `maxBathrooms` | number | Maximum bathrooms |
| `amenities` | string | Required amenities (comma-separated) |
| `featured` | boolean | Filter featured properties |
| `verified` | boolean | Filter verified properties |
| `isAvailable` | boolean | Filter available properties |
| `moderationStatus` | string | Filter by moderation status |
| `search` | string | Text search across title, description, location |
| `tags` | string | Filter by tags (comma-separated) |
| `latitude` | number | Latitude for location-based search |
| `longitude` | number | Longitude for location-based search |
| `maxDistance` | number | Max distance in meters (default: 5000) |
| `publishedAfter` | date | Filter by published date (after) |
| `publishedBefore` | date | Filter by published date (before) |

**Response:**

```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### 2. Get Property by ID

```http
GET /api/v1/properties/:id
```

Get a single property by its ID. Automatically increments view count.

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "title": "Modern 3BR Apartment",
    "description": "...",
    "type": "apartment",
    "location": {...},
    "pricing": {...},
    "specifications": {...},
    "amenities": {...},
    "media": {...}
  }
}
```

#### 3. Get Featured Properties

```http
GET /api/v1/properties/featured/list?limit=10
```

Get featured properties.

**Query Parameters:**

- `limit` (number): Number of properties to return (default: 10)

#### 4. Get Verified Properties

```http
GET /api/v1/properties/verified/list?limit=10
```

Get verified properties.

#### 5. Get Recent Properties

```http
GET /api/v1/properties/recent/list?limit=10
```

Get recently added properties.

#### 6. Get Similar Properties

```http
GET /api/v1/properties/:id/similar?limit=5
```

Get properties similar to the specified property based on type, location, and price.

**Query Parameters:**

- `limit` (number): Number of similar properties (default: 5)

#### 7. Get Properties Near Location

```http
GET /api/v1/properties/nearby/search
```

Get properties near specified coordinates.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latitude` | number | Yes | Latitude coordinate |
| `longitude` | number | Yes | Longitude coordinate |
| `radius` | number | No | Search radius in meters (default: 5000) |
| `limit` | number | No | Number of properties (default: 10) |

### Authenticated Endpoints

These endpoints require authentication.

#### 8. Create Property

```http
POST /api/v1/properties
```

Create a new property listing.

**Request Body:**

```json
{
  "title": "Modern 3BR Apartment in Kilimani",
  "description": "A beautiful modern apartment...",
  "type": "apartment",
  "listingType": "rent",
  "landlord": "landlord_id",
  "memberId": "member_id",
  "location": {
    "country": "Kenya",
    "county": "Nairobi",
    "constituency": "Dagoretti North",
    "ward": "Kilimani",
    "estate": "Kilimani",
    "address": {
      "line1": "Wood Avenue",
      "town": "Nairobi",
      "postalCode": "00100"
    },
    "coordinates": {
      "latitude": -1.2921,
      "longitude": 36.7872
    }
  },
  "pricing": {
    "rent": 85000,
    "currency": "KES",
    "deposit": 85000,
    "paymentFrequency": "monthly"
  },
  "specifications": {
    "bedrooms": 3,
    "bathrooms": 2,
    "totalArea": 120,
    "furnished": "semi_furnished"
  },
  "amenities": {
    "water": true,
    "electricity": true,
    "parking": true,
    "security": true,
    "internet": true
  }
}
```

**Response:** HTTP 201 Created with property object

#### 9. Update Property

```http
PATCH /api/v1/properties/:id
```

Update an existing property. Only the owner, agent, or admin can update.

**Request Body:** Partial property object (same structure as create)

#### 10. Delete Property

```http
DELETE /api/v1/properties/:id
```

Soft delete a property (marks as inactive). Only the owner or admin can delete.

#### 11. Check Publishing Requirements

```http
GET /api/v1/properties/:id/can-publish
```

Check if a property meets all requirements for publishing.

**Response:**

```json
{
  "status": "success",
  "data": {
    "canPublish": true,
    "missingRequirements": [],
    "warnings": [
      "Consider adding more images for better visibility"
    ]
  }
}
```

#### 12. Get Property Statistics

```http
GET /api/v1/properties/:id/stats
```

Get engagement and performance statistics for a property.

**Response:**

```json
{
  "status": "success",
  "data": {
    "views": 523,
    "inquiries": 45,
    "applications": 12,
    "bookmarks": 67,
    "totalEngagement": 580,
    "viewsLastWeek": 89,
    "inquiriesLastWeek": 8
  }
}
```

#### 13. Get Pricing Insights

```http
GET /api/v1/properties/:id/pricing-insights
```

Get market pricing insights for the property's area.

**Response:**

```json
{
  "status": "success",
  "data": {
    "averageRent": 78500,
    "medianRent": 75000,
    "priceRange": {
      "min": 50000,
      "max": 120000
    },
    "comparableCount": 45,
    "pricePercentile": 68,
    "suggestion": "Your rent is competitively priced for the market."
  }
}
```

#### 14. Get Personalized Recommendations

```http
GET /api/v1/properties/recommendations/for-me?limit=10
```

Get property recommendations based on user preferences.

#### 15. Update Property Pricing

```http
PATCH /api/v1/properties/:id/pricing
```

Update property pricing with history tracking.

**Request Body:**

```json
{
  "rent": 90000,
  "deposit": 90000,
  "reason": "Market adjustment"
}
```

#### 16. Add Property Image

```http
POST /api/v1/properties/:id/images
```

Add an image to property media.

**Request Body:**

```json
{
  "id": "img_123",
  "url": "https://cdn.example.com/image.jpg",
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "caption": "Living room",
  "isPrimary": false,
  "order": 1
}
```

#### 17. Remove Property Image

```http
DELETE /api/v1/properties/:id/images/:imageId
```

Remove an image from property media.

#### 18. Update Property Availability

```http
PATCH /api/v1/properties/:id/availability
```

Update property availability status.

**Request Body:**

```json
{
  "isAvailable": true,
  "availableFrom": "2025-11-01"
}
```

#### 19. Record Property Inquiry

```http
POST /api/v1/properties/:id/inquire
```

Increment property inquiry count when a user inquires about it.

#### 20. Bookmark Property

```http
POST /api/v1/properties/:id/bookmark
```

Add property to user's bookmarks (increments bookmark count).

### Admin/Moderator Endpoints

These endpoints require admin or moderator permissions.

#### 21. Get Properties Pending Moderation

```http
GET /api/v1/properties/moderation/pending
```

Get all properties awaiting moderation.

**Required Permission:** `properties:moderate`

#### 22. Approve Property

```http
POST /api/v1/properties/:id/approve
```

Approve a pending property for publication.

**Required Permission:** `properties:moderate`

#### 23. Reject Property

```http
POST /api/v1/properties/:id/reject
```

Reject a property with a reason.

**Request Body:**

```json
{
  "reason": "Property description does not meet quality standards"
}
```

**Required Permission:** `properties:moderate`

#### 24. Flag Property

```http
POST /api/v1/properties/:id/flag
```

Flag a property for review.

**Request Body:**

```json
{
  "reason": "Suspicious pricing or misleading information"
}
```

**Required Permission:** `properties:moderate`

#### 25. Verify Property

```http
POST /api/v1/properties/:id/verify
```

Mark property as verified.

**Required Permission:** `properties:moderate`

#### 26. Unverify Property

```http
POST /api/v1/properties/:id/unverify
```

Remove verified status from property.

**Required Permission:** `properties:moderate`

#### 27. Feature Property

```http
POST /api/v1/properties/:id/feature?duration=30
```

Mark property as featured with optional duration in days.

**Query Parameters:**

- `duration` (number): Duration in days (optional)

**Required Permission:** `properties:moderate`

#### 28. Unfeature Property

```http
POST /api/v1/properties/:id/unfeature
```

Remove featured status from property.

**Required Permission:** `properties:moderate`

#### 29. Get Property Analytics

```http
GET /api/v1/properties/analytics/overview
```

Get comprehensive property analytics and statistics.

**Query Parameters:**

- `landlordId` (string): Filter by landlord
- `organizationId` (string): Filter by organization
- `status` (string): Filter by status

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalProperties": 1250,
    "activeProperties": 856,
    "draftProperties": 124,
    "inactiveProperties": 198,
    "letProperties": 72,
    "verifiedProperties": 543,
    "featuredProperties": 89,
    "averageRent": 65800,
    "medianRent": 58000,
    "totalValue": 82250000,
    "byType": {...},
    "byStatus": {...},
    "byListingType": {...},
    "byCounty": [...],
    "byEstate": [...],
    "byBedrooms": [...],
    "occupancyStats": {...},
    "priceRanges": [...],
    "trends": {...}
  }
}
```

**Required Permission:** `properties:moderate`

#### 30. Bulk Update Property Status

```http
PATCH /api/v1/properties/bulk/status
```

Update status for multiple properties at once.

**Request Body:**

```json
{
  "propertyIds": ["id1", "id2", "id3"],
  "status": "active"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "updated": 3,
    "errors": []
  }
}
```

**Required Permission:** `properties:moderate`

#### 31. Get Expiring Properties

```http
GET /api/v1/properties/expiring/list?days=30
```

Get properties expiring within specified days.

**Query Parameters:**

- `days` (number): Number of days ahead (default: 30)

**Required Permission:** `properties:moderate`

## Request/Response Examples

### Creating a Complete Property Listing

```bash
curl -X POST https://api.example.com/api/v1/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Luxury 4BR Villa in Karen",
    "description": "Stunning 4-bedroom villa with modern amenities, swimming pool, and beautiful garden in the prestigious Karen estate.",
    "type": "villa",
    "listingType": "rent",
    "landlord": "landlord_id_here",
    "memberId": "member_id_here",
    "location": {
      "country": "Kenya",
      "county": "Nairobi",
      "constituency": "Lang'\''ata",
      "ward": "Karen",
      "estate": "Karen",
      "address": {
        "line1": "Karen Road",
        "town": "Nairobi",
        "postalCode": "00502"
      },
      "coordinates": {
        "latitude": -1.3203,
        "longitude": 36.7076
      }
    },
    "pricing": {
      "rent": 350000,
      "currency": "KES",
      "deposit": 700000,
      "paymentFrequency": "monthly",
      "advanceMonths": 3,
      "depositMonths": 2
    },
    "specifications": {
      "bedrooms": 4,
      "bathrooms": 4,
      "halfBaths": 1,
      "totalArea": 400,
      "plotSize": 1200,
      "yearBuilt": 2020,
      "condition": "excellent",
      "furnished": "fully_furnished"
    },
    "amenities": {
      "water": true,
      "electricity": true,
      "parking": true,
      "security": true,
      "swimmingPool": true,
      "garden": true,
      "generator": true,
      "borehole": true,
      "cctv": true
    },
    "rules": {
      "petsAllowed": true,
      "smokingAllowed": false,
      "childrenAllowed": true,
      "minimumLease": 12
    }
  }'
```

### Searching for Properties

```bash
# Search for apartments in Kilimani with 2-3 bedrooms, max rent 80K
curl -X GET "https://api.example.com/api/v1/properties?\
type=apartment&\
estate=Kilimani&\
minBedrooms=2&\
maxBedrooms=3&\
maxRent=80000&\
isAvailable=true&\
page=1&\
limit=20"
```

### Location-Based Search

```bash
# Find properties within 2km of specific coordinates
curl -X GET "https://api.example.com/api/v1/properties/nearby/search?\
latitude=-1.2921&\
longitude=36.7872&\
radius=2000&\
limit=10"
```

## Error Handling

The API uses standard HTTP status codes and returns errors in a consistent format:

```json
{
  "status": "error",
  "message": "Error description here"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid input or missing required fields
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Property not found
- **500 Internal Server Error**: Server error

### Error Examples

```json
// Invalid property ID
{
  "status": "error",
  "message": "Invalid property ID"
}

// Permission denied
{
  "status": "error",
  "message": "You don't have permission to edit this property"
}

// Property not found
{
  "status": "error",
  "message": "Property not found"
}
```

## Best Practices

### 1. Pagination

Always use pagination for list endpoints to avoid performance issues:

```http
GET /api/v1/properties?page=1&limit=20
```

### 2. Filtering

Combine multiple filters for precise results:

```http
GET /api/v1/properties?county=Nairobi&type=apartment&minBedrooms=2&maxRent=80000
```

### 3. Location Search

Use location-based search when users need properties near a specific point:

```http
GET /api/v1/properties?latitude=-1.2921&longitude=36.7872&maxDistance=5000
```

### 4. Property Creation

When creating properties:

1. Validate all required fields before submission
2. Use the `can-publish` endpoint to check requirements
3. Add at least 3 high-quality images
4. Provide detailed descriptions (minimum 50 characters)
5. Include accurate coordinates for map display

### 5. Caching

The API implements caching for performance. When updating properties, the cache is automatically cleared.

### 6. Rate Limiting

Be mindful of rate limits. The API may throttle requests if too many are made in a short period.

### 7. Async Operations

Some operations (like AI insights generation) are asynchronous and won't block the response.

### 8. Image Management

When managing property images:

1. Set one image as `isPrimary`
2. Use the `order` field to control display sequence
3. Provide both full-size and thumbnail URLs
4. Add descriptive captions for accessibility

### 9. Status Workflow

Property status workflow:

```text
DRAFT → (submit for review) → ACTIVE → LET or INACTIVE
```

- `DRAFT`: Property being created
- `ACTIVE`: Published and available
- `LET`: Property has been rented/sold
- `INACTIVE`: Removed from listings
- `MAINTENANCE`: Temporarily unavailable

### 10. Moderation Workflow

Moderation status workflow:

```text
pending → approved → active
       ↘ rejected → inactive
       ↘ flagged → (review) → approved/rejected
```

## Webhooks

The API can trigger webhooks for certain events:

- Property approved
- Property rejected
- Property verified
- Property featured
- Property status changed

Configure webhooks in your organization settings.

## Metrics and Monitoring

The API exposes Prometheus metrics:

- `kaa_active_properties`: Current number of active properties
- `kaa_verified_properties`: Current number of verified properties
- `kaa_property_operations`: Count of operations by type

## Support

For API support or questions:

- Email: <api-support@example.com>
- Documentation: <https://docs.example.com>
- Status Page: <https://status.example.com>
