# Property Units Management

This module handles the management of individual units within properties, including availability, pricing, and unit-specific features.

## Features

### Unit Management
- Create and manage individual units within properties
- Unit types (apartment, office, retail space, etc.)
- Unit status tracking (available, occupied, maintenance, etc.)
- Unit-specific amenities and features
- Floor plans and unit layouts

### Availability & Booking
- Real-time availability calendar
- Minimum/maximum stay requirements
- Seasonal pricing
- Blocked dates for maintenance
- Unit-specific booking rules

### Pricing
- Base rates
- Seasonal pricing
- Special offers and discounts
- Additional fees (cleaning, service, etc.)
- Long-term stay discounts

## Data Model

### Unit
```typescript
{
  _id: ObjectId,
  property: ObjectId,            // Reference to parent property
  unitNumber: string,           // Unit identifier (e.g., 'A101')
  name: string,                // Display name (e.g., 'Garden View Suite')
  type: 'apartment' | 'office' | 'retail' | 'warehouse' | 'other',
  status: 'available' | 'occupied' | 'maintenance' | 'unavailable',
  floor: number,               // Floor number (0 for ground floor)
  size: {
    value: number,             // Size value
    unit: 'sqft' | 'sqm',      // Square feet or square meters
    bedrooms?: number,         // Number of bedrooms
    bathrooms?: number,        // Number of bathrooms
    floorArea?: number,        // Total floor area
    lotArea?: number,          // For standalone units
  },
  capacity: {
    adults: number,
    children: number,
    infants: number,
    maxOccupancy: number
  },
  amenities: string[],         // References to amenities
  features: {
    hasKitchen: boolean,
    hasAirConditioning: boolean,
    hasHeating: boolean,
    hasWorkspace: boolean,
    hasBalcony: boolean,
    isWheelchairAccessible: boolean,
    hasElevatorAccess: boolean,
    // Additional unit-specific features
  },
  layout: {
    beds: [{
      type: 'queen' | 'king' | 'single' | 'bunk' | 'sofa_bed',
      count: number,
      inBedroom: boolean
    }],
    rooms: [{
      type: 'bedroom' | 'living_room' | 'kitchen' | 'bathroom' | 'balcony',
      name?: string,
      size?: number
    }]
  },
  images: [{
    url: string,
    caption?: string,
    isPrimary: boolean,
    order: number,
    metadata: {
      width: number,
      height: number,
      format: string
    }
  }],
  floorPlan: {
    imageUrl: string,
    dimensions: string,       // e.g., '1000x800'
    description?: string
  },
  pricing: {
    baseRate: number,         // Base price per night
    currency: string,         // ISO 4217 currency code
    minStay: number,          // Minimum nights
    maxStay?: number,         // Maximum nights (optional)
    additionalGuests: {
      enabled: boolean,
      feePerNight: number,
      afterCount: number      // Number of guests included in base rate
    },
    seasonalPricing: [{
      startDate: Date,
      endDate: Date,
      rate: number,
      minStay: number
    }],
    weeklyDiscount?: number,  // Percentage discount for weekly stays
    monthlyDiscount?: number, // Percentage discount for monthly stays
    cleaningFee: number,
    securityDeposit: number,
    extraFees: [{
      name: string,
      amount: number,
      type: 'per_stay' | 'per_night' | 'per_guest',
      mandatory: boolean,
      taxable: boolean
    }]
  },
  availability: {
    calendar: [{
      date: Date,
      available: boolean,
      price?: number,         // Override price for specific date
      minStay?: number,       // Override min stay for specific date
      maxStay?: number,       // Override max stay for specific date
      status: 'available' | 'blocked' | 'booked' | 'maintenance',
      notes?: string
    }],
    bookingWindow: {
      minDaysInAdvance: number,  // 0 for same-day booking
      maxMonthsInAdvance: number // 0 for no limit
    },
    preparationTime: number,  // Hours needed between bookings
    sameDayCutoff: string     // e.g., '14:00' for 2 PM cutoff
  },
  restrictions: {
    noPets: boolean,
    noSmoking: boolean,
    noParties: boolean,
    noChildren: boolean,
    minAgePrimaryGuest: number,  // Minimum age to book
    // Additional restrictions
  },
  metadata: {
    lastRenovated?: Date,
    floorLevel?: 'basement' | 'ground' | 'mezzanine' | number,
    view?: 'city' | 'garden' | 'pool' | 'street' | 'ocean' | 'mountain',
    // Additional metadata
  },
  createdAt: Date,
  updatedAt: Date,
  publishedAt?: Date,        // When unit was made available
  publishedBy?: ObjectId,     // User who published the unit
  deactivatedAt?: Date,       // When unit was deactivated
  deactivatedBy?: ObjectId,   // User who deactivated the unit
  deactivationReason?: string
}
```

## API Endpoints

### Units
- `GET /units` - List units (with filters)
- `POST /units` - Create new unit
- `GET /units/:id` - Get unit details
- `PUT /units/:id` - Update unit
- `DELETE /units/:id` - Delete unit (soft delete)
- `GET /properties/:propertyId/units` - List units by property
- `POST /units/:id/publish` - Publish unit
- `POST /units/:id/unpublish` - Unpublish unit

### Availability
- `GET /units/availability` - Check unit availability
- `POST /units/:id/block` - Block dates
- `DELETE /units/:id/block/:blockId` - Remove date block
- `GET /units/:id/calendar` - Get availability calendar
- `PUT /units/:id/calendar` - Bulk update calendar

### Pricing
- `GET /units/:id/pricing` - Get pricing details
- `PUT /units/:id/pricing` - Update pricing
- `POST /units/:id/seasonal-pricing` - Add seasonal pricing
- `DELETE /units/:id/seasonal-pricing/:pricingId` - Remove seasonal pricing

### Media
- `POST /units/:id/images` - Upload unit images
- `PUT /units/:id/images/:imageId` - Update image
- `DELETE /units/:id/images/:imageId` - Delete image
- `POST /units/:id/floor-plan` - Upload floor plan
- `DELETE /units/:id/floor-plan` - Remove floor plan

## Usage Examples

### Create a New Unit
```typescript
const unitData = {
  property: 'property123',
  unitNumber: 'A101',
  name: 'Luxury One-Bedroom Suite',
  type: 'apartment',
  status: 'available',
  floor: 1,
  size: {
    value: 75,
    unit: 'sqm',
    bedrooms: 1,
    bathrooms: 1,
    floorArea: 75
  },
  capacity: {
    adults: 2,
    children: 1,
    infants: 1,
    maxOccupancy: 3
  },
  amenities: ['wifi', 'air_conditioning', 'tv', 'kitchen'],
  features: {
    hasKitchen: true,
    hasAirConditioning: true,
    hasBalcony: true,
    isWheelchairAccessible: false
  },
  pricing: {
    baseRate: 15000,  // In smallest currency unit (e.g., cents)
    currency: 'KES',
    minStay: 2,
    cleaningFee: 2000,
    securityDeposit: 10000,
    weeklyDiscount: 10,  // 10% off for weekly stays
    monthlyDiscount: 20  // 20% off for monthly stays
  },
  availability: {
    bookingWindow: {
      minDaysInAdvance: 1,
      maxMonthsInAdvance: 12
    },
    preparationTime: 4,  // 4 hours between bookings
    sameDayCutoff: '14:00'
  }
};

const response = await fetch('/api/units', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(unitData)
});

const { unit } = await response.json();
```

### Check Unit Availability
```typescript
const params = new URLSearchParams({
  startDate: '2025-07-01',
  endDate: '2025-07-07',
  adults: 2,
  children: 1,
  units: 'unit123,unit456'  // Optional: specific units to check
});

const response = await fetch(`/api/units/availability?${params}`);
const { availableUnits, totalPrice, currency } = await response.json();
```

## Error Handling

Common error codes:
- `UNIT_NOT_FOUND`
- `UNIT_NOT_AVAILABLE`
- `INVALID_DATE_RANGE`
- `MAX_OCCUPANCY_EXCEEDED`
- `MINIMUM_STAY_REQUIRED`
- `UNIT_ALREADY_BOOKED`
- `UNIT_PUBLISH_ERROR`
- `INVALID_PRICING`

## Security Considerations
- Validate all date ranges
- Implement proper access controls
- Sanitize file uploads
- Rate limit availability checks
- Cache availability data
- Handle timezones correctly
- Validate pricing calculations
- Implement proper error handling
- Log important actions
- Protect against overbooking

## Dependencies
- Date handling library (luxon)
- Image processing
- File storage service
- Caching layer
- Rate limiting
- Database for unit data
- Search service
- Calendar service

## Best Practices
1. Use consistent unit measurements
2. Implement proper validation
3. Cache availability data
4. Optimize for mobile
5. Handle timezones correctly
6. Implement proper error handling
7. Use proper indexing for queries
8. Monitor performance
9. Regularly update calendar data
10. Implement proper backup strategy
