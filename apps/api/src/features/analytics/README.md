# Analytics & Market Intelligence API

This module provides comprehensive analytics and market intelligence capabilities for the property rental platform. It consists of two main services and legacy analytics endpoints.

## Services Overview

### 1. Analytics Service (`analytics.service.ts`)
Provides property-specific tracking and performance metrics for landlords and property managers.

**Features:**
- **Event Tracking**: Track user interactions, form submissions, and property events
- **Property Performance**: Views, inquiries, engagement metrics, demographics
- **Financial Analytics**: Revenue tracking, growth analysis, portfolio metrics
- **User Behavior**: Form analytics, conversion funnels, drop-off analysis
- **Portfolio Analytics**: Property distribution, performance ranking, ROI analysis
- **Comparative Analytics**: Property performance vs. market benchmarks

### 2. Market Intelligence Service (`market-intelligence.service.ts`)
Provides market analysis and competitive intelligence for property investment decisions.

**Features:**
- **Market Data**: Average prices, demand levels, competitor analysis
- **Property Comparisons**: Find and rank similar properties with similarity scoring
- **Market Insights**: AI-powered insights on pricing, demand, timing, features
- **Demand Forecasting**: Predict future rental demand with confidence levels
- **Rental Trends**: Track price movements, supply/demand trends
- **Location Analysis**: Score locations on accessibility, amenities, safety, infrastructure
- **Investment Opportunities**: Identify buy, develop, and renovate opportunities

### 3. Legacy Analytics
Existing system-wide analytics for admin dashboards and general reporting.

## Key Data Models

### Analytics Event
```typescript
interface AnalyticsEvent {
  event: string;
  step?: string;
  field?: string;
  value?: any;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}
```

### Property Performance Metrics
```typescript
interface PropertyPerformanceMetrics {
  propertyId: string;
  views: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  inquiries: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    responseRate: number;
  };
  engagement: {
    favorites: number;
    shares: number;
    contactAttempts: number;
    viewingRequests: number;
  };
  demographics: {
    viewerAge: Array<{ range: string; percentage: number }>;
    viewerType: Array<{ type: string; percentage: number }>;
    peakTimes: Array<{ time: string; views: number }>;
  };
  performance: {
    rank: number;
    totalProperties: number;
    category: string;
    score: number;
  };
}
```

### Market Data Response
```typescript
interface MarketDataResponse {
  averagePrice: number;
  priceRange: { min: number; max: number };
  demandLevel: 'low' | 'medium' | 'high';
  seasonalAdjustment: number;
  competitorCount: number;
  averageDaysOnMarket: number;
  priceHistory: Array<{ month: string; price: number }>;
  occupancyRate: number;
  rentYield: number;
}
```

### Market Insights
```typescript
interface MarketInsight {
  type: 'pricing' | 'demand' | 'timing' | 'features' | 'location';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}
```

## API Endpoints

### Analytics Endpoints

#### Event Tracking
- `POST /analytics/track-event` - Track user interaction events
- `GET /analytics/form-analytics/:sessionId` - Get form completion analytics
- `GET /analytics/user-behavior` - Get user behavior patterns

#### Property Analytics
- `GET /analytics/property-performance/:propertyId` - Get property performance metrics
- `GET /analytics/financial/:timeframe?` - Get financial analytics (month/quarter/year)
- `GET /analytics/portfolio` - Get portfolio overview and distribution
- `GET /analytics/dashboard` - Get member dashboard analytics
- `GET /analytics/comparative/:propertyId` - Get comparative market analysis

### Market Intelligence Endpoints

#### Market Data
- `GET /analytics/market/data?location=X&propertyType=Y` - Get market data for location
- `GET /analytics/market/comparable-properties?location=X&bedrooms=Y&bathrooms=Z` - Find comparable properties
- `POST /analytics/market/insights` - Get market insights for property data

#### Market Trends
- `GET /analytics/market/demand-forecast?location=X` - Get demand forecast
- `GET /analytics/market/rental-trends?location=X&propertyType=Y&timeframe=Z` - Get rental trends
- `POST /analytics/market/location-analysis` - Get location scoring and analysis
- `GET /analytics/market/investment-opportunities?location=X&budget=Y&riskTolerance=Z` - Get investment opportunities

### Legacy Analytics (Existing)
- `GET /analytics/stats` - Dashboard statistics overview
- `GET /analytics/users?period=monthly&year=2024` - User analytics
- `GET /analytics/properties` - Property distribution analytics
- `GET /analytics/bookings?period=monthly&year=2024` - Booking analytics
- `GET /analytics/revenue?period=monthly&year=2024` - Revenue analytics

## Usage Examples

### Frontend Hook Integration

#### Analytics Hook
```typescript
// Get property performance
const { data: performance } = await useAnalytics({
  endpoint: '/analytics/property-performance/property-id',
  refresh: true
});

// Get financial analytics
const { data: financials } = await useAnalytics({
  endpoint: '/analytics/financial/month',
  refresh: false
});

// Track events
await useAnalytics({
  endpoint: '/analytics/track-event',
  method: 'POST',
  data: {
    event: 'property-view',
    sessionId: 'session-123',
    step: 'details',
    metadata: { propertyId: 'property-id' }
  }
});
```

#### Market Intelligence Hook
```typescript
// Get market data
const { data: marketData } = await useMarketIntelligence({
  endpoint: '/analytics/market/data',
  params: { location: 'Nairobi', propertyType: 'apartment' }
});

// Get comparable properties
const { data: comparables } = await useMarketIntelligence({
  endpoint: '/analytics/market/comparable-properties',
  params: { 
    location: 'Nairobi',
    bedrooms: '2',
    bathrooms: '2',
    size: '80'
  }
});

// Get market insights
const { data: insights } = await useMarketIntelligence({
  endpoint: '/analytics/market/insights',
  method: 'POST',
  data: {
    location: { county: 'Nairobi', city: 'Westlands' },
    specifications: { bedrooms: 2, bathrooms: 2, size: 80 },
    pricing: { rent: 75000 },
    amenities: ['parking', 'security', 'generator'],
    type: 'apartment'
  }
});
```

### Direct API Usage
```bash
# Get market data
curl -X GET "http://localhost:3000/api/analytics/market/data?location=Nairobi&propertyType=apartment"

# Get property performance
curl -X GET "http://localhost:3000/api/analytics/property-performance/property-id" \
  -H "Authorization: Bearer your-jwt-token"

# Track an event
curl -X POST "http://localhost:3000/api/analytics/track-event" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "event": "property-view",
    "sessionId": "session-123",
    "step": "details"
  }'
```

## Implementation Details

### Kenya-Specific Features
- **Seasonal Patterns**: Jan-Mar peak rental season
- **Location Intelligence**: Nairobi-specific market dynamics
- **Currency**: All prices in KES (Kenyan Shillings)
- **Local Amenities**: Generator, security, parking prioritized

### Performance Considerations
- Market data is calculated on-demand but can be cached
- Similarity scoring uses optimized algorithms
- Historical data aggregation is efficient with MongoDB pipelines
- Default market data is provided when no properties are found

### Dependencies
- MongoDB for data storage and aggregation
- Property, Booking, Payment, User models
- Logger utility for monitoring
- Authentication middleware

### Security & Authorization
- All endpoints require user authentication
- Property-specific analytics require property ownership
- Market intelligence is publicly accessible with rate limiting
- Consistent error handling with meaningful messages

### Future Enhancements
- Integration with external property APIs (Property24, BuyRentKenya)
- Real-time event tracking with analytics platforms
- Machine learning for better demand prediction
- Integration with Google Places API for location scoring
- Historical price tracking with dedicated analytics database

## Support

For support, please contact:
- Email: support@kaa-saas.com
- Phone: +254 700 000000

## License

Proprietary - All rights reserved © 2025 KAA SaaS Solutions
