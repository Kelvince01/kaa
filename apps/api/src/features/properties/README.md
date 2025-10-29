# Property Features API

## Overview

This directory contains all property-related API endpoints and controllers.

## Controllers

### Core Controllers

1. **`property.controller.ts`**
   - Main property CRUD operations
   - Property listings and search
   - Property details and management

2. **`favorite.controller.ts`** ⭐ 
   - Complete favorites management
   - 10 endpoints for add/remove/toggle/stats
   - All routes consolidated (no separate extended file)

3. **`property-condition.controller.ts`**
   - Property condition tracking
   - Maintenance records

4. **`property-inspection.controller.ts`**
   - Property inspections
   - Inspection reports

5. **`valuation.controller.ts`**
   - Property valuations
   - Market analysis

### Integration Controllers

6. **`property.integration.ts`**
   - AI features
   - Monitoring services

7. **`search/search.controller.ts`**
   - Advanced search
   - Filters and facets

## Favorites API Routes

All favorite routes are in `favorite.controller.ts`:

### Query Routes (GET)
- `GET /favorites` - List all with pagination
- `GET /favorites/:id` - Get specific favorite
- `GET /favorites/status/:propertyId` - Check if favorited
- `GET /favorites/stats` - Get user statistics

### Mutation Routes (POST)
- `POST /favorites` - Add to favorites
- `POST /favorites/toggle` - Toggle favorite
- `POST /favorites/bulk` - Bulk operations

### Delete Routes (DELETE)
- `DELETE /favorites/:propertyId` - Remove (path)
- `DELETE /favorites` - Remove (body)
- `DELETE /favorites/clear` - Clear all

## File Structure

```
properties/
├── favorite.controller.ts          # ✅ Consolidated favorites (10 routes)
├── property.controller.ts          # Main property operations
├── property.routes.ts              # Route registration
├── property-condition.controller.ts
├── property-inspection.controller.ts
├── property.integration.ts
├── valuation.controller.ts
├── search/
│   └── search.controller.ts
├── MISSING_ROUTES.md              # Routes still to implement
├── IMPLEMENTATION_SUMMARY.md      # Current implementation status
├── CONTROLLER_MERGE_SUMMARY.md    # Details of controller merge
└── README.md                      # This file
```

## Recent Changes

### Controller Merge (Latest)
- ✅ Merged `favorite.controller.extended.ts` into `favorite.controller.ts`
- ✅ Removed duplicate endpoints
- ✅ Organized routes logically
- ✅ Reduced total lines from 793 to ~750

### Removed Duplicates
- Kept `GET /favorites/status/:propertyId` (more RESTful)
- Removed `GET /favorites/:propertyId/check` (duplicate)
- Both DELETE methods kept (different use cases)

## Documentation

- **[MISSING_ROUTES.md](./MISSING_ROUTES.md)** - 52 routes to implement
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - API testing guide
- **[CONTROLLER_MERGE_SUMMARY.md](./CONTROLLER_MERGE_SUMMARY.md)** - Merge details

## Testing

See `IMPLEMENTATION_SUMMARY.md` for curl examples and testing instructions.

## Next Features to Implement

Priority order from `MISSING_ROUTES.md`:

### Phase 1 (High Priority)
1. Recently viewed properties
2. Property recommendations
3. Export favorites

### Phase 2 (Medium Priority)
4. Watch lists with alerts
5. Saved searches
6. Property comparison

### Phase 3 (Low Priority)
7. Market insights
8. Price alerts
9. Trends analysis

## Models Used

- **Property** - From `@kaa/models`
- **Favorite** - From `@kaa/models`
- **Landlord** - From `@kaa/models`

## Authentication

All routes use `authPlugin` for JWT-based authentication.

## Error Handling

Consistent error responses:
```json
{
  "status": "error",
  "message": "Error description"
}
```

Success responses:
```json
{
  "status": "success",
  "data": { ... }
}
```

## Contributing

When adding new routes:
1. Add to appropriate controller
2. Update `property.routes.ts`
3. Document in `IMPLEMENTATION_SUMMARY.md`
4. Remove from `MISSING_ROUTES.md`
5. Add tests
6. Update this README

## Maintenance

- Keep controllers focused and single-purpose
- Avoid duplication between controllers
- Use consistent error handling patterns
- Document all endpoints with OpenAPI tags
- Update property counts when needed

