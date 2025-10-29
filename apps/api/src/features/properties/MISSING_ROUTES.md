# Missing API Routes for Favourites Feature

## Currently Implemented Routes (4 total)
✅ `GET /properties/favorites` - Get all favorites
✅ `GET /properties/favorites/:propertyId/check` - Check favorite status  
✅ `POST /properties/favorites` - Add to favorites
✅ `DELETE /properties/favorites/:propertyId` - Remove from favorites

## Missing Routes (Frontend is calling these)

### Basic Favorites Operations
❌ `POST /properties/favorites/toggle` - Toggle favorite status
❌ `GET /properties/favorites/:id` - Get favorite by ID
❌ `GET /properties/favorites/status/:propertyId` - Check favorite status (alternative endpoint)
❌ `GET /properties/favorites/stats` - Get favorite statistics
❌ `POST /properties/favorites/bulk` - Bulk operations on favorites
❌ `POST /properties/favorites/export` - Export favorites
❌ `POST /properties/favorites/share` - Share favorites
❌ `POST /properties/favorites/compare` - Compare favourite properties
❌ `DELETE /properties/favorites/clear` - Clear all favorites
❌ `DELETE /properties/favorites` - Remove favorite (body with propertyId)

### Recommendations
❌ `GET /properties/recommendations` - Get property recommendations

### Recently Viewed
❌ `POST /properties/recently-viewed` - Add to recently viewed
❌ `GET /properties/recently-viewed` - Get recently viewed
❌ `DELETE /properties/recently-viewed` - Clear recently viewed
❌ `DELETE /properties/recently-viewed/:propertyId` - Remove from recently viewed

### Watch Lists
❌ `GET /properties/watch-lists` - Get user's watch lists
❌ `POST /properties/watch-lists` - Create watch list
❌ `PATCH /properties/watch-lists/:id` - Update watch list
❌ `DELETE /properties/watch-lists/:id` - Delete watch list
❌ `POST /properties/watch-lists/:id/toggle` - Toggle watch list status
❌ `GET /properties/watch-lists/:id/matches` - Get watch list matches

### Saved Searches
❌ `GET /properties/saved-searches` - Get saved searches
❌ `POST /properties/saved-searches` - Create saved search
❌ `PATCH /properties/saved-searches/:id` - Update saved search
❌ `DELETE /properties/saved-searches/:id` - Delete saved search
❌ `POST /properties/saved-searches/:id/run` - Run saved search

### Property Alerts
❌ `GET /properties/alerts` - Get property alerts
❌ `POST /properties/alerts/:alertId/read` - Mark alert as read
❌ `POST /properties/alerts/read-all` - Mark all alerts as read
❌ `DELETE /properties/alerts/:alertId` - Delete alert

### Notification Settings
❌ `GET /properties/favorites/notification-settings` - Get notification settings
❌ `PUT /properties/favorites/notification-settings` - Update notification settings

### Similar Properties
❌ `GET /properties/favorites/:favouriteId/similar` - Get similar properties to favorite
❌ `GET /properties/by-taste` - Get properties by user taste

### Property Lists
❌ `GET /properties/lists` - Get user's property lists
❌ `POST /properties/lists` - Create property list
❌ `POST /properties/lists/:listId/properties` - Add property to list
❌ `DELETE /properties/lists/:listId/properties/:propertyId` - Remove property from list
❌ `POST /properties/lists/:listId/share` - Share property list

### Analytics & Insights
❌ `GET /properties/favorites/trends` - Get favourite trends
❌ `GET /properties/favorites/market-insights` - Get market insights
❌ `GET /properties/favorites/price-alerts` - Get price alerts
❌ `POST /properties/favorites/price-alerts` - Set price alert
❌ `DELETE /properties/favorites/price-alerts/:alertId` - Remove price alert

## Priority Implementation Order

### Phase 1: Core Favorites (High Priority)
1. Toggle favorite status
2. Get favorite statistics
3. Clear all favorites
4. Get favorite by ID

### Phase 2: Essential Features (Medium Priority)
5. Recently viewed properties
6. Bulk operations
7. Property recommendations
8. Check favorite status (status endpoint)

### Phase 3: Advanced Features (Low Priority)
9. Export/Share favorites
10. Compare properties
11. Saved searches
12. Watch lists
13. Property alerts
14. Notification settings
15. Property lists
16. Analytics & insights

## Notes

1. The frontend `removeFavourite` function expects the endpoint to accept a body with `propertyId`, but the current API uses a path parameter. Need to add the alternative DELETE endpoint or update the frontend.

2. Many advanced features may not be needed immediately and can be implemented later based on user demand.

3. Some endpoints like recommendations, analytics, and insights may require ML/AI integration.

4. Consider creating separate controllers for different feature groups:
   - `favorite.controller.ts` - Basic favorites
   - `recently-viewed.controller.ts` - Recently viewed
   - `watch-list.controller.ts` - Watch lists
   - `saved-search.controller.ts` - Saved searches
   - `property-alert.controller.ts` - Alerts
   - `property-list.controller.ts` - Custom lists

