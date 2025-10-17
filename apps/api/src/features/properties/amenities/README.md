# Nearby Amenities Service

A comprehensive amenities service for the Kenyan rental property platform, built with ElysiaJS and Mongoose. This service provides geospatial queries to find nearby amenities, calculate amenity scores, and enhance property listings with location-based information.

## Features

- **Geospatial Queries**: Find amenities near any location using MongoDB's geospatial indexing
- **Kenyan-Specific**: Tailored for Kenyan amenities including matatu stages, M-Pesa agents, SACCOs, etc.
- **Travel Time Estimates**: Calculate walking and driving times to amenities
- **Amenity Scoring**: Weighted scoring system for property locations
- **Property Integration**: Seamlessly integrates with existing property listings
- **Verification System**: Support for verified amenities
- **Bulk Import**: Efficient bulk import for seeding data

## API Endpoints

### Public Endpoints

#### Find Nearby Amenities

```http
GET /api/v1/amenities/nearby?latitude=-1.2921&longitude=36.8219&radius=5&categories=education,healthcare
```

**Query Parameters:**

- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate  
- `radius` (optional): Search radius in kilometers (default: 5)
- `categories` (optional): Array of amenity categories to filter
- `types` (optional): Array of specific amenity types to filter
- `limit` (optional): Maximum number of results (default: 50)
- `verified` (optional): Filter by verification status

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Kenyatta National Hospital",
      "type": "hospital",
      "category": "healthcare",
      "location": {},
      "distance": 1.2,
      "walkingTime": 14,
      "drivingTime": 3,
      "rating": 4.2,
      "verified": true
    }
  ],
  "count": 15
}
```

#### Find Nearby Amenities Grouped by Category

```http
GET /api/v1/amenities/nearby/grouped?latitude=-1.2921&longitude=36.8219&radius=5
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "category": "healthcare",
      "amenities": [],
      "count": 5
    },
    {
      "category": "education", 
      "amenities": [],
      "count": 8
    }
  ]
}
```

#### Get Property Amenities

```http
GET /api/v1/amenities/property/{propertyId}?radius=2
```

#### Calculate Amenity Score

```http
GET /api/v1/amenities/score?latitude=-1.2921&longitude=36.8219&radius=2
```

**Response:**

```json
{
  "success": true,
  "data": {
    "score": 85,
    "breakdown": {
      "education": 3,
      "healthcare": 2,
      "transport": 5,
      "shopping": 4
    },
    "totalAmenities": 14
  }
}
```

#### Search Amenities

```http
GET /api/v1/amenities/search?q=hospital&county=Nairobi&categories=healthcare
```

#### Get Amenities by County

```http
GET /api/v1/amenities/county/Nairobi?category=education&verified=true
```

#### Get Area Statistics

```http
GET /api/v1/amenities/stats/Nairobi?ward=Westlands
```

#### Get Amenity Metadata

```http
GET /api/v1/amenities/metadata
```

### Protected Endpoints (Require Authentication)

#### Create Amenity

```http
POST /api/v1/amenities
Content-Type: application/json

{
  "name": "New Hospital",
  "type": "hospital",
  "category": "healthcare",
  "location": {
    "county": "Nairobi",
    "address": {...},
    "coordinates": {...}
  }
}
```

#### Update Amenity

```http
PUT /api/v1/amenities/{id}
```

#### Delete Amenity

```http
DELETE /api/v1/amenities/{id}
```

#### Verify Amenity

```http
POST /api/v1/amenities/{id}/verify
```

#### Bulk Import Amenities

```http
POST /api/v1/amenities/bulk-import
```

## Amenity Categories

The service supports the following Kenyan-specific categories:

- **Education**: Primary schools, secondary schools, universities, colleges, nurseries
- **Healthcare**: Hospitals, clinics, pharmacies, dispensaries
- **Shopping**: Supermarkets, shopping malls, markets, kiosks
- **Transport**: Matatu stages, bus stops, railway stations, airports, boda-boda stages
- **Banking**: Banks, ATMs, M-Pesa agents, SACCOs
- **Entertainment**: Restaurants, bars, clubs, cinemas, parks
- **Religious**: Churches, mosques, temples
- **Government**: Police stations, government offices, post offices
- **Utilities**: Water points, electricity substations
- **Food**: Butcheries, bakeries, hotels
- **Security**: Security companies
- **Sports**: Gyms, sports grounds

## Integration with Properties

### Enhanced Property Details

Get property information with nearby amenities:

```http
GET /api/v1/properties/{id}/with-amenities?radius=2
```

### Property Service Integration

The amenities service integrates with the existing property service:

```typescript
// Get property with amenities
const property = await PropertyService.getPropertyWithAmenities(propertyId, 2);

// Update property's amenities cache
await PropertyService.updatePropertyAmenitiesCache(propertyId);
```

## Database Schema

### Amenity Model

```typescript
interface IAmenity {
  name: string;
  type: AmenityType;
  category: AmenityCategory;
  description?: string;
  location: {
    country: string;
    county: string;
    constituency?: string;
    ward?: string;
    estate?: string;
    address: {};
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  geolocation: IGeoLocation; // GeoJSON Point for geospatial queries
  contact?: {};
  operatingHours?: {};
  rating?: number;
  reviewCount?: number;
  verified: boolean;
  verifiedBy?: ObjectId;
  verifiedAt?: Date;
  tags?: string[];
  isActive: boolean;
}
```

### Indexes

- `geolocation: "2dsphere"` - Geospatial index for proximity queries
- `{ category: 1, type: 1 }` - Compound index for filtering
- `{ "location.county": 1, category: 1 }` - County-based filtering
- `{ verified: 1, isActive: 1 }` - Status filtering
- `{ name: "text", description: "text" }` - Text search

## Seeding Data

### Run the Seed Script

```bash
# Seed amenities
bun src/scripts/seed/amenities-seed.ts

# Clear existing and re-seed
bun src/scripts/seed/amenities-seed.ts --clear
```

### Add to Main Seed Script

```typescript
import { seedKenyanAmenities } from "~/features/amenities/seeds/kenyan-amenities.seed";

// In your main seed function
await seedKenyanAmenities();
```

## Usage Examples

### Find Nearby Schools

```typescript
const schools = await AmenityService.findNearbyAmenities({
  latitude: -1.2921,
  longitude: 36.8219,
  radius: 3,
  categories: [AmenityCategory.EDUCATION],
  types: [AmenityType.PRIMARY_SCHOOL, AmenityType.SECONDARY_SCHOOL],
  verified: true,
  limit: 10
});
```

### Calculate Property Amenity Score

```typescript
const score = await AmenityService.calculateAmenityScore(
  -1.2921, // latitude
  36.8219, // longitude
  2 // radius in km
);
// Returns: { score: 85, breakdown: {...}, totalAmenities: 14 }
```

### Get Amenities for Property Listing

```typescript
const propertyWithAmenities = await PropertyService.getPropertyWithAmenities(
  propertyId,
  2 // radius in km
);
```

## Performance Considerations

1. **Geospatial Indexing**: Uses MongoDB's 2dsphere index for efficient proximity queries
2. **Caching**: Property amenities are cached in the `nearbyAmenities` field
3. **Pagination**: All endpoints support limit parameters
4. **Aggregation Pipelines**: Uses efficient MongoDB aggregation for complex queries

## Kenyan Context

This service is specifically designed for the Kenyan market and includes:

- **Matatu Stages**: Public transport hubs unique to Kenya
- **M-Pesa Agents**: Mobile money transfer points
- **SACCOs**: Savings and Credit Cooperative Organizations
- **Boda-boda Stages**: Motorcycle taxi pickup points
- **County/Ward Structure**: Follows Kenya's administrative divisions
- **Local Businesses**: Includes common Kenyan business types

## Error Handling

All service methods include comprehensive error handling and logging:

```typescript
try {
  const amenities = await AmenityService.findNearbyAmenities(query);
} catch (error) {
  // Error is logged and a user-friendly message is thrown
  console.error(error.message);
}
```

## 🤖 Automated Amenity Discovery

The service now includes **automated amenity discovery** that eliminates manual entry by using external APIs:

### **Discovery Sources**

1. **Google Places API** - Comprehensive, accurate data with ratings and reviews
2. **OpenStreetMap Overpass API** - Free, open-source data as fallback

### **Automatic Population**

When you create or update a property with coordinates, the system automatically:

1. **Discovers nearby amenities** using external APIs
2. **Filters duplicates** and existing amenities  
3. **Saves new amenities** to your database
4. **Updates property cache** with nearby amenities
5. **Calculates amenity scores** for property insights

### **Discovery API Endpoints**

#### **Discover Amenities by Coordinates**

```http
POST /api/v1/amenities/discover
Content-Type: application/json

{
  "latitude": -1.2921,
  "longitude": 36.8219,
  "radius": 2000,
  "sources": ["google", "osm"],
  "autoSave": true
}
```

#### **Auto-Discover for Property**

```http
POST /api/v1/amenities/discover/property/{propertyId}
Content-Type: application/json

{
  "radius": 2000,
  "autoSave": true,
  "updatePropertyCache": true
}
```

#### **Batch Discovery for Multiple Properties**

```http
POST /api/v1/amenities/discover/batch
Content-Type: application/json

{
  "propertyIds": ["prop1", "prop2", "prop3"],
  "radius": 2000,
  "batchSize": 5,
  "delayMs": 1000
}
```

#### **County-wide Discovery**

```http
POST /api/v1/amenities/discover/county/Nairobi
Content-Type: application/json

{
  "radius": 2000,
  "batchSize": 3,
  "delayMs": 2000
}
```

### **Auto-Population Management**

#### **Service Status**

```http
GET /api/v1/amenities/auto-population/status
```

#### **Discovery Statistics**

```http
GET /api/v1/amenities/auto-population/stats?county=Nairobi
```

#### **Data Quality Validation**

```http
GET /api/v1/amenities/auto-population/validate?county=Nairobi
```

#### **Discover Missing Amenities**

```http
POST /api/v1/amenities/auto-population/discover-missing
Content-Type: application/json

{
  "county": "Nairobi",
  "batchSize": 10,
  "maxProperties": 100
}
```

#### **Refresh Stale Data**

```http
POST /api/v1/amenities/auto-population/refresh-stale
Content-Type: application/json

{
  "daysOld": 30,
  "county": "Nairobi",
  "batchSize": 5,
  "maxProperties": 50
}
```

### **Automated Workflows**

#### **Property Lifecycle Integration**

- **On Property Creation**: Automatically discovers nearby amenities
- **On Location Update**: Re-discovers amenities if coordinates change significantly (>500m)
- **Background Processing**: Uses queuing system to avoid blocking requests

#### **Scheduled Jobs**

- **Hourly**: Discover amenities for new Nairobi properties
- **Every 4 hours**: Discover amenities for other major counties
- **Daily**: Global discovery for properties without amenities
- **Weekly**: Refresh stale amenity data and detect duplicates

### **Configuration**

Set these environment variables:

```bash
# Optional - for Google Places API (more accurate data)
GOOGLE_PLACES_API_KEY=your_api_key_here

# The service automatically falls back to OpenStreetMap if Google Places isn't configured
```

### **Testing Discovery**

```bash
# Test discovery with coordinates
bun src/scripts/test-amenity-discovery.ts

# Test discovery for a specific property
bun src/scripts/test-amenity-discovery.ts --property-id=507f1f77bcf86cd799439011

# Test discovery for a county
bun src/scripts/test-amenity-discovery.ts --county=Nairobi
```

### **Usage Examples**

#### **Manual Discovery**

```typescript
// Discover amenities near coordinates
const result = await AmenityDiscoveryService.discoverNearbyAmenities(
  -1.2921, 36.8219, 
  { radius: 2000, autoSave: true }
);

// Discover for a property
const propertyResult = await AmenityDiscoveryService.discoverPropertyAmenities(
  "propertyId", 
  { radius: 2000, autoSave: true }
);
```

#### **Property Integration**

```typescript
// This happens automatically when properties are created/updated
const property = await createProperty(propertyData, memberId);
// -> Amenities are automatically discovered in the background

// Get property with discovered amenities
const enhancedProperty = await PropertyService.getPropertyWithAmenities(propertyId);
```

### **Performance & Rate Limiting**

- **Batch Processing**: Processes multiple properties with delays
- **API Respect**: Built-in delays to respect external API limits
- **Duplicate Prevention**: Automatically filters existing amenities
- **Background Queuing**: Non-blocking property operations
- **Fallback Sources**: Uses OSM if Google Places fails/unavailable

## Future Enhancements

1. **Real-time Updates**: WebSocket notifications for amenity changes
2. **User Reviews**: Allow users to rate and review amenities
3. **Photos**: Add photo support for amenities
4. **Opening Hours Validation**: Real-time validation of operating hours
5. **Enhanced Geocoding**: Better county/ward detection from coordinates
6. **Crowd-sourced Data**: Allow users to submit new amenities
7. **Analytics**: Track popular amenities and search patterns
8. **ML Enhancement**: Use machine learning to improve discovery accuracy
