# Advanced Search Implementation

This module provides comprehensive search functionality for the Kaa SaaS property management platform, featuring Elasticsearch integration, geo-search capabilities, and advanced filtering.

## Features

### 🔍 Full-Text Search

- Multi-field text search across properties and contractors
- Fuzzy matching for typo tolerance
- Relevance scoring and ranking
- Search highlighting
- Auto-complete suggestions

### 📍 Geo-Search

- Location-based search with distance filtering
- Geo-distance sorting
- Bounding box queries
- Nearby item discovery
- Kenya-specific location utilities

### 🎯 Advanced Filtering

- Property filters: type, price range, bedrooms, bathrooms, features
- Contractor filters: specialties, service areas, ratings, availability
- Combined text and filter queries
- Aggregations for faceted search

### 📊 Analytics & Monitoring

- Search query tracking
- Performance metrics (response times, popular queries)
- No-results query analysis
- User behavior insights
- Real-time search statistics

### ⚡ Performance Optimization

- Automatic indexing of data changes
- Background queue processing
- Rate limiting and validation
- Caching and optimization
- Health monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Search Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐   │
│  │   Client    │───▶│    Router    │───▶│ Controller  │   │
│  │ (Frontend)  │    │              │    │             │   │
│  └─────────────┘    └──────────────┘    └─────────────┘   │
│                             │                              │
│                             ▼                              │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐   │
│  │ Middleware  │◀───│  Validation  │───▶│ Rate Limit  │   │
│  │ (Analytics) │    │              │    │             │   │
│  └─────────────┘    └──────────────┘    └─────────────┘   │
│                             │                              │
│                             ▼                              │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐   │
│  │Elasticsearch│◀───│   Service    │───▶│  Analytics  │   │
│  │   Cluster   │    │              │    │   Service   │   │
│  └─────────────┘    └──────────────┘    └─────────────┘   │
│                             │                              │
│                             ▼                              │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐   │
│  │  Indexing   │◀───│ Integration  │───▶│ Maintenance │   │
│  │   Queue     │    │   Service    │    │   Tasks     │   │
│  └─────────────┘    └──────────────┘    └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Environment Setup

```bash
# Elasticsearch configuration
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password
```

### 2. Initialize Services

```typescript
import { initializeSearchServices } from '~/search';

// During application startup
await initializeSearchServices();
```

### 3. Basic Usage

```typescript
import { quickSearch, findNearby, getSearchSuggestions } from '~/search';

// Text search
const results = await quickSearch('2 bedroom apartment', 'properties', {
    limit: 10,
    filters: { priceRange: { min: 50000, max: 100000 } }
});

// Geo search
const nearby = await findNearby(-1.2921, 36.8219, 'properties', '5km');

// Suggestions
const suggestions = await getSearchSuggestions('apart', 'properties');
```

## API Endpoints

### Basic Search

```
GET /search?q=apartment&type=properties&page=1&limit=10
```

### Advanced Search

```
GET /search/advanced-search/properties?q=apartment&lat=-1.2921&lon=36.8219&distance=5km&minPrice=50000&maxPrice=100000&bedrooms=2&furnished=true
```

### Nearby Search

```
GET /search/advanced-search/nearby?lat=-1.2921&lon=36.8219&distance=5km&type=properties&limit=20
```

### Suggestions

```
GET /search/advanced-search/suggestions?q=apart&type=properties
```

### Health Check

```
GET /search/advanced-search/health
```

## Configuration

### Search Settings

```typescript
// apps/api/src/search/search.config.ts
export const SEARCH_CONFIG = {
    elasticsearch: {
        maxResultsPerPage: 100,
        defaultPageSize: 10,
        defaultGeoDistance: '10km',
        fuzziness: 'AUTO'
    },
    analytics: {
        maxEventsInMemory: 10000,
        slowSearchThresholdMs: 1000
    },
    rateLimiting: {
        windowMs: 60 * 1000,
        maxRequestsPerWindow: 100
    }
};
```

### Index Mappings

The service automatically creates Elasticsearch indices with optimized mappings for:

- **Properties Index**: Full-text search, geo-location, price ranges, property details
- **Contractors Index**: Skills search, location-based matching, ratings, availability

## Data Indexing

### Automatic Indexing

The system automatically indexes data changes using Mongoose middleware:

```typescript
import { createIndexingMiddleware } from '~/search';

const middleware = createIndexingMiddleware();

// Apply to Property model
PropertySchema.post('save', middleware.property.post.save);
PropertySchema.post('remove', middleware.property.post.remove);

// Apply to Contractor model
ContractorSchema.post('save', middleware.contractor.post.save);
ContractorSchema.post('remove', middleware.contractor.post.remove);
```

### Manual Indexing

```typescript
import { searchIndexingService } from '~/search';

// Queue individual items
await searchIndexingService.queuePropertyIndexing(property, 'create');
await searchIndexingService.queueContractorIndexing(contractor, 'update');

// Force process queue
await searchIndexingService.forceProcessQueue();

// Full reindex
await searchIndexingService.reindexAll();
```

## Search Analytics

### Track Search Events

```typescript
import { searchAnalyticsService } from '~/search';

searchAnalyticsService.trackSearch({
    query: 'apartment nairobi',
    resultCount: 25,
    responseTime: 150,
    userId: 'user123',
    searchType: 'properties',
    source: 'web'
});
```

### Get Analytics

```typescript
const analytics = searchAnalyticsService.getAnalytics(24); // Last 24 hours
console.log(analytics.popularQueries);
console.log(analytics.averageResponseTime);
console.log(analytics.performanceMetrics);
```

## Geo-Search Utilities

### Distance Calculations

```typescript
import { calculateDistance, createBoundingBox } from '~/search';

const distance = calculateDistance(
    { lat: -1.2921, lon: 36.8219 }, // Nairobi
    { lat: -4.0435, lon: 39.6682 }  // Mombasa
); // Returns distance in km

const bounds = createBoundingBox(
    { lat: -1.2921, lon: 36.8219 }, 
    '10km'
);
```

### Kenya-Specific Utilities

```typescript
import { KenyaGeo } from '~/search';

// Check if coordinates are within Kenya
const isInKenya = KenyaGeo.isWithinKenya({ lat: -1.2921, lon: 36.8219 });

// Find nearest major city
const nearestCity = KenyaGeo.getNearestCity({ lat: -1.2921, lon: 36.8219 });
```

## Performance Optimization

### Rate Limiting

- 100 requests per minute per client
- Configurable limits per endpoint
- Graceful degradation under load

### Caching

- Elasticsearch query result caching
- Suggestion caching
- Analytics data caching

### Queue Management

- Background processing of indexing operations
- Batch processing for efficiency
- Automatic retry mechanisms

## Monitoring & Health Checks

### Health Status

```typescript
import { getSearchHealthStatus } from '~/search';

const health = getSearchHealthStatus();
console.log(health.elasticsearch); // true/false
console.log(health.overall);       // true/false
```

### Performance Monitoring

- Response time tracking
- Slow query detection
- Error rate monitoring
- Queue depth monitoring

## Error Handling

The search system includes comprehensive error handling:

- Elasticsearch connection failures
- Invalid query parameters
- Rate limit exceeded
- Service unavailable scenarios

All errors are logged and appropriate HTTP status codes are returned.

## Testing

### Unit Tests

```bash
bun test search
```

### Integration Tests

```bash
bun test:integration search
```

### Load Testing

```bash
# Test search performance under load
bun test:load search
```

## Deployment Considerations

### Elasticsearch Setup

- Minimum 2GB RAM for development
- 4GB+ RAM for production
- SSD storage recommended
- Cluster setup for high availability

### Environment Variables

```bash
ELASTICSEARCH_URL=https://your-cluster.es.amazonaws.com
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_secure_password
NODE_ENV=production
```

### Scaling

- Horizontal scaling with multiple Elasticsearch nodes
- Load balancing across search instances
- Read replicas for high-traffic scenarios

## Troubleshooting

### Common Issues

1. **Elasticsearch Connection Failed**
   - Check ELASTICSEARCH_URL configuration
   - Verify network connectivity
   - Check authentication credentials

2. **Slow Search Performance**
   - Monitor query complexity
   - Check index optimization
   - Review aggregation usage

3. **High Memory Usage**
   - Adjust analytics retention period
   - Optimize indexing queue size
   - Review Elasticsearch heap settings

4. **Missing Search Results**
   - Check data indexing status
   - Verify index mappings
   - Review search query construction

### Debug Mode

```bash
DEBUG=search:* bun dev
```

## Contributing

When contributing to the search module:

1. Follow TypeScript best practices
2. Add comprehensive tests
3. Update documentation
4. Consider performance implications
5. Test with realistic data volumes

## License

This search implementation is part of the Kaa SaaS platform and follows the same licensing terms.
