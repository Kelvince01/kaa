# Property Type Migration Guide

## Quick Reference: Old vs New Fields

This guide helps developers migrate from legacy property fields to the new structured interfaces.

## Field Mapping

### Property Specifications

| Old Field (details.*) | New Field (specifications.*) | Notes |
|----------------------|------------------------------|-------|
| `details.bedrooms` | `specifications.bedrooms` | Same type |
| `details.bathrooms` | `specifications.bathrooms` | Same type |
| N/A | `specifications.halfBaths` | New field |
| N/A | `specifications.kitchens` | New field (default: 1) |
| N/A | `specifications.livingRooms` | New field (default: 1) |
| N/A | `specifications.diningRooms` | New field (default: 0) |
| `details.size` | `specifications.totalArea` | Renamed for clarity |
| N/A | `specifications.builtUpArea` | New field |
| N/A | `specifications.plotSize` | New field |
| `details.totalFloors` | `specifications.floors` | Renamed |
| `details.yearBuilt` | `specifications.yearBuilt` | Same |
| N/A | `specifications.condition` | New enum field |
| `details.furnishedStatus` | `specifications.furnished` | Type changed to FurnishedStatus |
| N/A | `specifications.roofType` | New field |
| N/A | `specifications.wallType` | New field |
| N/A | `specifications.floorType` | New field |

### Pricing

| Old Field (pricing.*) | New Field (pricing.*) | Notes |
|----------------------|----------------------|-------|
| `pricing.rentAmount` | `pricing.rent` | Renamed |
| `pricing.securityDeposit` | `pricing.deposit` | Renamed |
| `pricing.serviceCharge` | `pricing.serviceFee` | Renamed |
| N/A | `pricing.agentFee` | New field |
| N/A | `pricing.legalFee` | New field |
| `pricing.paymentFrequency` | `pricing.paymentFrequency` | Same |
| N/A | `pricing.advanceMonths` | New field |
| N/A | `pricing.depositMonths` | New field |
| `pricing.utilitiesIncluded` (array) | `pricing.utilitiesIncluded` (object) | Changed to boolean object |
| N/A | `pricing.priceHistory` | New field for tracking |

### Amenities

| Old Field | New Field (amenities.*) | Notes |
|-----------|------------------------|-------|
| `details.parking` | `amenities.parking` | Moved to amenities |
| `details.garden` | `amenities.garden` | Moved to amenities |
| `details.security` | `amenities.security` | Moved to amenities |
| `details.generator` | `amenities.generator` | Moved to amenities |
| `details.borehole` | `amenities.borehole` | Moved to amenities |
| `details.water` | `amenities.water` | Moved to amenities |
| `details.electricity` | `amenities.electricity` | Moved to amenities |
| `details.internetReady` | `amenities.internet` | Renamed |
| N/A | `amenities.swimmingPool` | New field |
| N/A | `amenities.gym` | New field |
| N/A | `amenities.lift` | New field |
| N/A | `amenities.solarPower` | New field |
| N/A | `amenities.dstv` | New field |
| N/A | `amenities.cableTv` | New field |
| N/A | `amenities.storeRoom` | New field |
| N/A | `amenities.servantQuarter` | New field |
| N/A | `amenities.studyRoom` | New field |
| N/A | `amenities.balcony` | New field |
| N/A | `amenities.compound` | New field |
| N/A | `amenities.gate` | New field |
| N/A | `amenities.perimeter` | New field |
| N/A | `amenities.laundry` | New field |
| N/A | `amenities.cleaning` | New field |
| N/A | `amenities.caretaker` | New field |
| N/A | `amenities.cctv` | New field |

### Location

| Old Field (location.*) | New Field (location.*) | Notes |
|-----------------------|------------------------|-------|
| `location.county` | `location.county` | Same |
| `location.estate` | `location.estate` | Same |
| `location.coordinates` | `location.coordinates` | Same |
| N/A | `location.plotNumber` | New field |
| N/A | `location.buildingName` | New field |
| N/A | `location.floor` | New field |
| N/A | `location.unitNumber` | New field |
| N/A | `location.nearbyTransport` | New array field |
| N/A | `location.walkingDistanceToRoad` | New field (meters) |
| N/A | `location.accessRoad` | New enum field |
| N/A | `location.nearbySchools` | New array field |
| N/A | `location.nearbyHospitals` | New array field |
| N/A | `location.nearbyShopping` | New array field |
| N/A | `location.nearbyChurches` | New array field |
| `location.nearbyAmenities` | `location.nearbyAmenities` | Same |

### Rules & Policies

| Old Field | New Field (rules.*) | Notes |
|-----------|-------------------|-------|
| `details.petFriendly` | `rules.petsAllowed` | Renamed for clarity |
| `details.smokingAllowed` | `rules.smokingAllowed` | Moved to rules |
| `details.sublettingAllowed` | `rules.sublettingAllowed` | Moved to rules |
| `minimumTenancy` | `rules.minimumLease` | Moved to rules |
| `maxTenants` | `rules.maxOccupants` | Renamed and moved |
| N/A | `rules.partiesAllowed` | New field |
| N/A | `rules.childrenAllowed` | New field |
| N/A | `rules.quietHours` | New field |
| N/A | `rules.maximumLease` | New field |
| N/A | `rules.renewalTerms` | New field |
| N/A | `rules.creditCheckRequired` | New field |
| N/A | `rules.employmentVerification` | New field |
| N/A | `rules.previousLandlordReference` | New field |
| N/A | `rules.customRules` | New array field |

### Availability

| Old Field | New Field (availability.*) | Notes |
|-----------|---------------------------|-------|
| `available` | `availability.isAvailable` | Renamed |
| `availableFrom` | `availability.availableFrom` | Moved |
| `availableTo` | `availability.availableTo` | Moved |
| N/A | `availability.viewingDays` | New array field |
| N/A | `availability.viewingContact` | New object field |
| N/A | `availability.viewingFee` | New field |
| N/A | `availability.bookingDeposit` | New field |

### Media

| Old Field (media.*) | New Field (media.*) | Notes |
|--------------------|-------------------|-------|
| `media.photos` | `media.images` | Enhanced with more fields |
| `media.videos` | `media.videos` | Enhanced with metadata |
| `media.virtualTour` | `media.virtualTour` | Enhanced structure |
| `media.floorPlan` | `media.floorPlans` | Now supports multiple |

### Statistics & Moderation

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `metrics.viewCount` | `stats.views` | Moved to stats |
| `metrics.inquiryCount` | `stats.inquiries` | Moved to stats |
| `metrics.applicationCount` | `stats.applications` | Moved to stats |
| N/A | `stats.bookmarks` | New field |
| N/A | `stats.averageRating` | New field |
| N/A | `stats.totalReviews` | New field |
| N/A | `moderationStatus` | New enum field |
| N/A | `moderationNotes` | New field |
| N/A | `moderatedBy` | New field |
| N/A | `moderatedAt` | New field |

## Code Migration Examples

### Reading Property Data

#### Before

```typescript
const bedrooms = property.details.bedrooms;
const rent = property.pricing.rentAmount;
const hasParking = property.details.parking;
const isPetFriendly = property.details.petFriendly;
```

#### After (with fallback for compatibility)

```typescript
const bedrooms = property.specifications?.bedrooms ?? property.details.bedrooms;
const rent = property.pricing.rent ?? property.pricing.rentAmount;
const hasParking = property.amenities?.parking ?? property.details.parking;
const isPetFriendly = property.rules?.petsAllowed ?? property.details.petFriendly;
```

#### After (new code - no fallback)

```typescript
const bedrooms = property.specifications.bedrooms;
const rent = property.pricing.rent;
const hasParking = property.amenities.parking;
const isPetFriendly = property.rules.petsAllowed;
```

### Creating a Property

#### Before

```typescript
const property = {
  title: "Modern Apartment",
  type: PropertyType.APARTMENT,
  details: {
    bedrooms: 3,
    bathrooms: 2,
    size: 120,
    furnished: true,
    furnishedStatus: "Semi-furnished",
    parking: true,
    security: true,
    water: true,
    electricity: true,
    petFriendly: false
  },
  pricing: {
    rentAmount: 85000,
    currency: "KES",
    securityDeposit: 170000,
    paymentFrequency: "monthly"
  }
};
```

#### After

```typescript
const property = {
  title: "Modern Apartment",
  type: PropertyType.APARTMENT,
  specifications: {
    bedrooms: 3,
    bathrooms: 2,
    halfBaths: 0,
    kitchens: 1,
    livingRooms: 1,
    diningRooms: 1,
    totalArea: 120,
    condition: "excellent",
    furnished: "semi_furnished",
    floors: 1
  },
  amenities: {
    parking: true,
    security: true,
    water: true,
    electricity: true,
    internet: true,
    // ... set all other amenities
  },
  pricing: {
    rent: 85000,
    currency: "KES",
    deposit: 170000,
    paymentFrequency: "monthly",
    advanceMonths: 1,
    depositMonths: 2,
    utilitiesIncluded: {
      water: true,
      electricity: false,
      internet: false,
      garbage: true,
      security: true
    },
    negotiable: false
  },
  rules: {
    petsAllowed: false,
    smokingAllowed: false,
    partiesAllowed: false,
    childrenAllowed: true,
    minimumLease: 12,
    creditCheckRequired: true,
    employmentVerification: true,
    previousLandlordReference: true,
    customRules: []
  },
  availability: {
    isAvailable: true,
    viewingDays: [
      {
        day: "saturday",
        startTime: "10:00",
        endTime: "16:00"
      }
    ],
    viewingContact: {
      name: "Agent Name",
      phone: "+254712345678",
      preferredMethod: "whatsapp"
    }
  },
  // Keep legacy fields for compatibility
  details: { /* ... legacy data ... */ }
};
```

### Searching for Properties

#### Before

```typescript
const results = await searchProperties({
  minBedrooms: 2,
  maxBedrooms: 4,
  minPrice: 50000,
  maxPrice: 100000,
  features: ["parking", "security"]
});
```

#### After

```typescript
const filters: PropertySearchFilters = {
  minBedrooms: 2,
  maxBedrooms: 4,
  minRent: 50000,
  maxRent: 100000,
  amenities: ["parking", "security"],
  verified: true,
  county: "Nairobi",
  page: 1,
  limit: 20
};

const results = await searchProperties(filters);
```

## Helper Functions for Migration

### 1. Convert Legacy to New Structure

```typescript
function migratePropertyData(oldProperty: any): Partial<IProperty> {
  return {
    specifications: {
      bedrooms: oldProperty.details.bedrooms,
      bathrooms: oldProperty.details.bathrooms,
      halfBaths: 0,
      kitchens: 1,
      livingRooms: 1,
      diningRooms: 0,
      totalArea: oldProperty.details.size,
      condition: "good",
      furnished: oldProperty.details.furnishedStatus === "Furnished" 
        ? "fully_furnished" 
        : oldProperty.details.furnishedStatus === "Unfurnished"
        ? "unfurnished"
        : "semi_furnished",
      floors: oldProperty.details.totalFloors || 1,
      yearBuilt: oldProperty.details.yearBuilt
    },
    amenities: {
      water: oldProperty.details.water ?? false,
      electricity: oldProperty.details.electricity ?? false,
      parking: oldProperty.details.parking ?? false,
      security: oldProperty.details.security ?? false,
      garden: oldProperty.details.garden ?? false,
      generator: oldProperty.details.generator ?? false,
      borehole: oldProperty.details.borehole ?? false,
      internet: oldProperty.details.internetReady ?? false,
      // Set defaults for new fields
      swimmingPool: false,
      gym: false,
      lift: false,
      solarPower: false,
      dstv: false,
      cableTv: false,
      storeRoom: false,
      servantQuarter: false,
      studyRoom: false,
      balcony: false,
      compound: false,
      gate: false,
      perimeter: false,
      laundry: false,
      cleaning: false,
      caretaker: false,
      cctv: false
    },
    pricing: {
      rent: oldProperty.pricing.rentAmount,
      currency: oldProperty.pricing.currency,
      deposit: oldProperty.pricing.securityDeposit,
      serviceFee: oldProperty.pricing.serviceCharge,
      paymentFrequency: oldProperty.pricing.paymentFrequency,
      advanceMonths: 1,
      depositMonths: 2,
      utilitiesIncluded: {
        water: oldProperty.pricing.waterBill === "Included",
        electricity: oldProperty.pricing.electricityBill === "Included",
        internet: false,
        garbage: false,
        security: false
      },
      negotiable: oldProperty.pricing.negotiable ?? false
    },
    rules: {
      petsAllowed: oldProperty.details.petFriendly ?? false,
      smokingAllowed: oldProperty.details.smokingAllowed ?? false,
      partiesAllowed: false,
      childrenAllowed: true,
      minimumLease: oldProperty.minimumTenancy ?? 12,
      creditCheckRequired: false,
      employmentVerification: false,
      previousLandlordReference: false,
      sublettingAllowed: oldProperty.details.sublettingAllowed ?? false,
      customRules: []
    },
    availability: {
      isAvailable: oldProperty.available,
      availableFrom: oldProperty.availableFrom,
      availableTo: oldProperty.availableTo,
      viewingDays: [],
      viewingContact: {
        name: "",
        phone: "",
        preferredMethod: "call"
      }
    }
  };
}
```

### 2. Access with Fallback

```typescript
function getPropertyBedrooms(property: IProperty): number {
  return property.specifications?.bedrooms ?? property.details?.bedrooms ?? 0;
}

function getPropertyRent(property: IProperty): number {
  return property.pricing.rent ?? property.pricing.rentAmount ?? 0;
}

function isParking Available(property: IProperty): boolean {
  return property.amenities?.parking ?? property.details?.parking ?? false;
}
```

## Database Migration Script

```typescript
async function migrateAllProperties() {
  const properties = await Property.find({});
  
  for (const property of properties) {
    const updates = migratePropertyData(property);
    
    await Property.findByIdAndUpdate(property._id, {
      $set: updates
    });
  }
  
  console.log(`Migrated ${properties.length} properties`);
}
```

## Testing Checklist

- [ ] All properties can be read with new structure
- [ ] Legacy fields still work as fallback
- [ ] Search works with new filters
- [ ] Property creation uses new structure
- [ ] Property updates maintain both structures
- [ ] API responses include new fields
- [ ] Frontend displays new data correctly
- [ ] Migration script tested on staging
- [ ] Performance benchmarks meet requirements
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass

## Rollout Plan

### Phase 1: Dual Write (Week 1-2)

- Update code to write to both old and new fields
- Deploy to staging
- Test thoroughly

### Phase 2: Dual Read (Week 3-4)

- Update code to read from new fields with fallback
- Run migration script on production
- Monitor for issues

### Phase 3: New Only (Week 5-6)

- Remove fallback code
- Use only new structured fields
- Clean up legacy field documentation

### Phase 4: Cleanup (Week 7-8)

- Remove legacy fields from models (optional)
- Update all documentation
- Archive migration code

## Common Issues & Solutions

### Issue: Cannot find property on new field

**Solution**: Use fallback pattern

```typescript
const bedrooms = property.specifications?.bedrooms ?? property.details?.bedrooms ?? 0;
```

### Issue: TypeScript errors on new fields

**Solution**: Update TypeScript types

```typescript
import type { PropertySpecs, PropertyAmenities } from '@/models/types/property.type';
```

### Issue: Old API consumers break

**Solution**: Create adapter middleware

```typescript
function adaptLegacyResponse(property: IProperty) {
  return {
    ...property,
    details: {
      ...property.details,
      bedrooms: property.specifications?.bedrooms ?? property.details.bedrooms
    }
  };
}
```

## Support

For questions or issues during migration:

- Check this guide first
- Review the [Property Type Updates](./PROPERTY_TYPE_UPDATES.md) document
- Contact the development team
- Create an issue in the repository

## Version History

- **v2.0.0** (2025-10-13): Complete property type enhancement
- **v1.0.0** (Initial): Legacy property structure
