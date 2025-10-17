# Property Type Updates - Complete Enhancement

## Overview

Updated the property type definitions in `packages/models/src/types/property.type.ts` with comprehensive interfaces for a Kenyan real estate platform.

## Changes Made

### 1. Enhanced Property Types

Added new property types:

- `BEDSITTER` - Common Kenyan housing type
- `PENTHOUSE` - Luxury apartments
- `MAISONETTE` - Multi-level housing

### 2. New Type Definitions

#### PropertyCondition

```typescript
export type PropertyCondition = "new" | "excellent" | "good" | "fair" | "needs_renovation";
```

#### AccessRoadType

```typescript
export type AccessRoadType = "tarmac" | "murram" | "earth";
```

#### Construction Types

- `RoofType`: iron_sheets, tiles, concrete, thatch
- `WallType`: stone, brick, block, wood, mixed
- `FloorType`: tiles, concrete, wood, marble, terrazzo

#### FurnishedStatus (Updated)

Changed from "partially furnished" to "semi_furnished" for consistency

### 3. Comprehensive Property Interfaces

#### PropertyAmenities

Complete amenities tracking with:

- **Basic amenities**: water, electricity, parking, security, garden
- **Luxury amenities**: swimmingPool, gym, lift, generator, solarPower
- **Connectivity**: internet, dstv, cableTv
- **Storage & Extra Rooms**: storeRoom, servantQuarter, studyRoom, balcony
- **Outdoor features**: compound, gate, perimeter, borehole
- **Services**: laundry, cleaning, caretaker, cctv

#### PropertyPricing

Enhanced pricing structure with:

- Core pricing: rent, deposit, currency (KES/USD)
- Fees: serviceFee, agentFee, legalFee
- Payment terms: paymentFrequency, advanceMonths, depositMonths
- Utilities tracking: water, electricity, internet, garbage, security
- Legacy fields for backward compatibility
- Price history tracking

#### PropertyLocation

Kenyan-specific location data:

- Administrative divisions: country, county, constituency, ward, estate
- Enhanced address with plotNumber, buildingName, floor, unitNumber
- Transportation: nearbyTransport (Matatu, bus stops, SGR), walkingDistanceToRoad, accessRoad type
- Nearby facilities: schools, hospitals, shopping, churches
- Geographic data: coordinates, boundingBox for searches

#### PropertyMedia

Structured media management:

- Images: with id, url, thumbnailUrl, caption, order, uploadedAt
- Videos: with thumbnails, duration, captions
- Virtual tours: provider support (matterport, custom)
- Floor plans: structured with IDs and names
- Legacy fields maintained for backward compatibility

#### PropertySpecs

Detailed property specifications:

- Room counts: bedrooms, bathrooms, halfBaths, kitchens, livingRooms, diningRooms
- Measurements: totalArea, builtUpArea, plotSize
- Building details: floors, yearBuilt, condition, furnished status
- Construction details: roofType, wallType, floorType
- Legacy fields for backward compatibility

#### PropertyRules

Property policies and lease terms:

- Restrictions: petsAllowed, smokingAllowed, partiesAllowed, childrenAllowed
- Occupancy: maxOccupants, quietHours
- Lease terms: minimumLease, maximumLease, renewalTerms
- Requirements: creditCheck, employmentVerification, landlordReference
- Custom rules support

#### PropertyAvailability

Viewing and availability management:

- Availability status and dates
- Viewing schedule: days and times
- Contact information: name, phone, preferredMethod (call/whatsapp/sms)
- Booking requirements: viewingFee, bookingDeposit

### 4. Enhanced IProperty Interface

Added new structured fields:

- `specifications: PropertySpecs` - Replaces scattered details
- `amenities: PropertyAmenities` - Structured amenities tracking
- `pricing: PropertyPricing` - Enhanced with payment terms
- `rules: PropertyRules` - Lease terms and policies
- `availability: PropertyAvailability` - Viewing schedules

Added SEO & Marketing:

- `tags: string[]` - For search optimization
- `featured: boolean` - Featured listings

Added Statistics:

```typescript
stats: {
  views: number;
  inquiries: number;
  applications: number;
  bookmarks: number;
  averageRating?: number;
  totalReviews?: number;
}
```

Added Moderation:

```typescript
moderationStatus: "pending" | "approved" | "rejected" | "flagged";
moderationNotes?: string;
moderatedBy?: mongoose.Types.ObjectId;
moderatedAt?: Date;
```

Added Computed Fields:

- `pricePerSqm?: number` - Price per square meter
- `isPromoted: boolean` - Promotion status
- `distanceFromCenter?: number` - Distance from city center (km)

### 5. Data Transfer Objects

#### CreatePropertyData

For creating new properties with essential fields:

- Basic info: title, description, type
- Location: county, estate, address, coordinates
- Specs: bedrooms, bathrooms, furnished, condition
- Pricing: rent, deposit, payment terms
- Media: images
- Contact: viewingContact

#### UpdatePropertyData

For partial updates to existing properties (all fields optional)

#### PropertySearchFilters

Comprehensive search and filtering:

- Basic: type, status
- Location: county, estate, coordinates, radius
- Price range: minRent, maxRent, currency
- Specs: bedroom/bathroom ranges, furnished status
- Features: amenities, images, verified, featured
- Owner filters: owner, agent
- Date filters: publishedAfter, publishedBefore
- Pagination: page, limit, sort, order

#### PropertyResponse

Full property details for API responses with:

- Complete property information
- Owner details
- Statistics
- Timestamps

#### PropertyCardResponse

Lightweight property data for list views:

- Essential info: title, type, location
- Basic specs: bedrooms, bathrooms
- Pricing: rent, currency
- Media: primaryImage, imageCount
- Status indicators
- Distance calculation support

## Backward Compatibility

The update maintains backward compatibility by:

1. Keeping legacy fields in the main `IProperty` interface
2. Adding optional new structured fields alongside old ones
3. Including legacy fields in new interfaces (marked as optional)
4. Maintaining existing field names and types

## Migration Path

To migrate existing code:

### Phase 1: Read Both Old and New

```typescript
// Access new structured data if available, fall back to legacy
const bedrooms = property.specifications?.bedrooms ?? property.details.bedrooms;
const rent = property.pricing.rent ?? property.pricing.rentAmount;
```

### Phase 2: Write to Both

```typescript
// When creating/updating, populate both structures
{
  specifications: {
    bedrooms: 3,
    bathrooms: 2,
    // ... other new fields
  },
  details: {
    bedrooms: 3,
    bathrooms: 2,
    // ... legacy fields
  }
}
```

### Phase 3: Migrate Data

Run a migration script to populate new structured fields from legacy data.

### Phase 4: Remove Legacy Fields

Once all code is updated, remove legacy field support.

## Benefits

1. **Type Safety**: All fields are properly typed
2. **Kenyan Context**: Location and amenities specific to Kenyan market
3. **Better Search**: Comprehensive filters for property search
4. **Rich Media**: Structured media management
5. **Transparency**: Clear pricing with history tracking
6. **User Experience**: Viewing schedules and contact preferences
7. **Moderation**: Built-in content moderation support
8. **Analytics**: Statistics tracking for property performance
9. **Scalability**: Structured data enables better querying and indexing
10. **Documentation**: Self-documenting types with clear field purposes

## Usage Examples

### Creating a Property

```typescript
const newProperty: CreatePropertyData = {
  title: "Modern 3BR Apartment in Kilimani",
  description: "Spacious apartment with modern amenities",
  type: PropertyType.APARTMENT,
  county: "Nairobi",
  estate: "Kilimani",
  address: "Off Ngong Road",
  coordinates: { latitude: -1.2921, longitude: 36.7856 },
  bedrooms: 3,
  bathrooms: 2,
  furnished: "semi_furnished",
  condition: "excellent",
  rent: 85000,
  deposit: 170000,
  paymentFrequency: "monthly",
  advanceMonths: 1,
  depositMonths: 2,
  amenities: ["water", "electricity", "parking", "security"],
  images: ["url1", "url2"],
  viewingContact: {
    name: "John Doe",
    phone: "+254712345678"
  },
  petsAllowed: false,
  minimumLease: 12
};
```

### Searching for Properties

```typescript
const filters: PropertySearchFilters = {
  county: "Nairobi",
  minRent: 50000,
  maxRent: 100000,
  minBedrooms: 2,
  amenities: ["parking", "security", "water"],
  verified: true,
  page: 1,
  limit: 20
};
```

### Displaying Property Cards

```typescript
const card: PropertyCardResponse = {
  id: "prop123",
  title: "Modern 3BR Apartment",
  type: PropertyType.APARTMENT,
  county: "Nairobi",
  estate: "Kilimani",
  bedrooms: 3,
  bathrooms: 2,
  rent: 85000,
  currency: "KES",
  primaryImage: "url",
  imageCount: 10,
  isAvailable: true,
  verified: true,
  featured: false,
  ownerName: "John Doe",
  ownerVerified: true,
  views: 245
};
```

## Next Steps

1. **Update Models**: Update Mongoose models to match new types
2. **Update API**: Update API endpoints to support new fields
3. **Update Frontend**: Update UI to display new structured data
4. **Data Migration**: Migrate existing properties to new structure
5. **Testing**: Comprehensive testing of all property operations
6. **Documentation**: Update API documentation with new types

## Files Modified

- `/packages/models/src/types/property.type.ts` - Main property type definitions

## Related Documentation

- [Property Model](../packages/models/src/property.model.ts)
- [Property API](../apps/api/src/routers/property/)
- [Property Service](../packages/services/src/properties/property.service.ts)
