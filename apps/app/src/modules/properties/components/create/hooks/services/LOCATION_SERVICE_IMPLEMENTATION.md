# Location Service Implementation

This document outlines the complete location service implementation that provides real-world address search, validation, and geocoding capabilities for the Kaa Property Platform.

## Overview

The location service replaces mock location data with real geocoding services, providing:

- **Address Search**: Find places and addresses using multiple geocoding providers
- **Reverse Geocoding**: Convert coordinates to readable addresses
- **Address Validation**: Validate and suggest improvements for address data
- **Autocomplete**: Fast suggestions for counties, neighborhoods, and other location fields
- **Geolocation**: Browser-based current location detection

## Architecture

### Backend Implementation (API-MVP)

#### 1. Location Service (`api/src/features/location/location.service.ts`)

A comprehensive service that:

- Uses multiple geocoding providers (Geoapify, Nominatim)
- Implements caching for performance
- Falls back to local Kenyan data when APIs are unavailable
- Provides address validation and formatting

**Key Features:**

- Multi-provider geocoding with automatic fallback
- In-memory caching with TTL
- Local Kenyan administrative data for fast responses
- Address parsing and validation
- Distance calculations

#### 2. Location Controller (`api/src/features/location/location.controller.ts`)

RESTful API endpoints for location operations:

```typescript
GET    /api/v1/location/search                    // Search places
GET    /api/v1/location/reverse                   // Reverse geocode
POST   /api/v1/location/validate                  // Validate address
GET    /api/v1/location/place/:placeId            // Get place details
GET    /api/v1/location/autocomplete/counties     // County suggestions
GET    /api/v1/location/autocomplete/neighborhoods // Neighborhood suggestions
GET    /api/v1/location/nearby                    // Find nearby places
```

### Frontend Implementation (App-MVP)

#### 1. Location Service Client (`modules/properties/components/create/hooks/services/location.service.ts`)

A client-side service that communicates with backend APIs:

- Uses the enhanced HTTP client with caching and retry logic
- Provides TypeScript interfaces for all location data
- Handles browser geolocation API
- Includes utility functions for address formatting and distance calculation

#### 2. Smart Address Input Component (`apps/app/src/components/common/form-fields/smart-address-input.tsx`)

Advanced address input component that:

- **Real-time Search**: Uses real location service with debounced search
- **Current Location**: Browser geolocation integration with one-click access
- **Address Validation**: Real-time validation with confidence scores
- **Rich UI**: Category icons, confidence indicators, and detailed feedback
- **Accessibility**: Full keyboard navigation and screen reader support
- **Smart Suggestions**: Prioritizes current location and shows provider info

#### 3. useSmartAddress Hook (`apps/app/src/hooks/use-smart-address.ts`)

Custom hook for managing address state:

- Centralized address and coordinate management
- Automatic validation and geocoding
- Current location detection
- Format utilities and validation helpers

#### 4. Enhanced Address Autocomplete (`apps/app/src/components/common/form-fields/address-autocomplete-input.tsx`)

Updated legacy component that:

- Uses real location service instead of mock data
- Provides enhanced UX with loading states and error handling
- Shows place categories and confidence scores
- Supports keyboard navigation and accessibility

## API Reference

### Search Places

```typescript
GET /api/v1/location/search?q=Kilimani&limit=10&countryCode=ke

Response:
{
  "status": "success",
  "data": {
    "query": "Kilimani",
    "suggestions": [
      {
        "id": "geoapify-123",
        "displayName": "Kilimani, Nairobi, Kenya",
        "address": {
          "line1": "Kilimani Road",
          "town": "Nairobi",
          "county": "Nairobi",
          "constituency": "Dagoretti North",
          "postalCode": "00100",
          "country": "Kenya"
        },
        "coordinates": {
          "lat": -1.2958,
          "lng": 36.7825
        },
        "confidence": 0.9,
        "category": "residential"
      }
    ],
    "count": 1
  }
}
```

### Reverse Geocoding

```typescript
GET /api/v1/location/reverse?lat=-1.2958&lng=36.7825

Response:
{
  "status": "success",
  "data": {
    "id": "reverse-geoapify",
    "displayName": "Kilimani Road, Nairobi, Kenya",
    "address": { /* address object */ },
    "coordinates": { "lat": -1.2958, "lng": 36.7825 },
    "confidence": 0.9,
    "category": "residential"
  }
}
```

### Address Validation

```typescript
POST /api/v1/location/validate
Content-Type: application/json

{
  "address": {
    "line1": "Kilimani Road",
    "town": "Nairobi",
    "county": "Nairobi",
    "postalCode": "00100",
    "country": "Kenya"
  }
}

Response:
{
  "status": "success",
  "data": {
    "isValid": true,
    "confidence": 0.95,
    "suggestions": [ /* enhanced address suggestions */ ],
    "issues": []
  }
}
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Optional: Geoapify API key for enhanced geocoding
GEOAPIFY_API_KEY=your_geoapify_api_key_here

# Optional: Google Maps API key (for future use)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Geocoding Providers

The service uses multiple providers in order of preference:

1. **Geoapify** (if API key is provided)
   - High-quality commercial geocoding
   - Good coverage for Kenya
   - Rate limits apply based on plan

2. **Nominatim (OpenStreetMap)**
   - Free and open-source
   - Good global coverage
   - Rate-limited to 1 request/second
   - Used as fallback

3. **Local Kenyan Data**
   - Fast local suggestions
   - Counties, neighborhoods, constituencies
   - Always available as fallback

## Integration Guide

### 1. Backend Setup

The location controller is already registered in `app.routes.ts`. To use:

```typescript
import { locationController } from './features/location/location.controller';

// Already included in routes
app.use(locationController);
```

### 2. Frontend Usage

```typescript
import { locationService } from '@/lib/location';

// Search for places
const suggestions = await locationService.searchPlaces('Kilimani', {
  limit: 10,
  countryCode: 'ke'
});

// Get current location
const coordinates = await locationService.getCurrentLocation();

// Reverse geocode
const address = await locationService.reverseGeocode(coordinates);

// Validate address
const validation = await locationService.validateAddress({
  line1: 'Kilimani Road',
  town: 'Nairobi',
  county: 'Nairobi'
});
```

### 3. Using SmartAddressInput (Recommended)

The new `SmartAddressInput` component with the `useSmartAddress` hook:

```typescript
import SmartAddressInput from '@/components/common/form-fields/smart-address-input';
import useSmartAddress from '@/hooks/use-smart-address';

function PropertyForm() {
  const {
    address,
    coordinates,
    handleAddressChange,
    handleCoordinatesChange,
    isValid,
    hasCoordinates,
    formatAddress,
    clearAddress
  } = useSmartAddress({
    validateOnChange: true,
    countryCode: 'ke'
  });

  return (
    <div className="space-y-4">
      <SmartAddressInput
        value={address}
        onChange={handleAddressChange}
        onCoordinatesChange={handleCoordinatesChange}
        placeholder="Search for a property address..."
        showCurrentLocation={true}
        showValidation={true}
        countryCode="ke"
        required={true}
      />
      
      {/* Display selected address info */}
      {address && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium">Selected Address:</p>
          <p className="text-sm">{formatAddress()}</p>
          {coordinates && (
            <p className="text-xs text-muted-foreground mt-1">
              Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

### 4. Using Enhanced AddressAutoCompleteInput (Legacy)

The updated legacy component that uses the real service:

```typescript
import AddressAutoCompleteInput from '@/components/common/form-fields/address-autocomplete-input';

function PropertyForm() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AddressAutoCompleteInput
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      selectedPlaceId={selectedPlaceId}
      setSelectedPlaceId={setSelectedPlaceId}
      setIsOpenDialog={setIsOpen}
      placeholder="Enter property address"
    />
  );
}
```

### 5. Advanced Usage with Validation

```typescript
import SmartAddressInput from '@/components/common/form-fields/smart-address-input';
import useSmartAddress from '@/hooks/use-smart-address';
import { useEffect } from 'react';

function AdvancedPropertyForm() {
  const {
    address,
    coordinates,
    validation,
    selectedSuggestion,
    handleAddressChange,
    handleCoordinatesChange,
    isValid,
    validationScore,
    validateAddress,
    getCurrentLocation
  } = useSmartAddress({
    validateOnChange: true,
    required: true,
    countryCode: 'ke'
  });

  // Auto-get current location on mount
  useEffect(() => {
    getCurrentLocation().catch(console.error);
  }, [getCurrentLocation]);

  const handleSubmit = async () => {
    if (!isValid) {
      const result = await validateAddress();
      if (!result?.isValid) {
        alert('Please provide a valid address');
        return;
      }
    }
    
    // Submit form with address and coordinates
    console.log('Submitting:', { address, coordinates });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Property Address *
        </label>
        <SmartAddressInput
          value={address}
          onChange={handleAddressChange}
          onCoordinatesChange={handleCoordinatesChange}
          placeholder="Search for property location..."
          showCurrentLocation={true}
          showValidation={true}
          required={true}
          error={validation?.issues?.[0]?.message}
        />
      </div>
      
      {/* Validation feedback */}
      {validation && (
        <div className={`text-sm ${
          validation.isValid ? 'text-green-600' : 'text-yellow-600'
        }`}>
          Address confidence: {Math.round(validationScore * 100)}%
          {!validation.isValid && validation.issues && (
            <ul className="mt-1 ml-4 list-disc">
              {validation.issues.map((issue, i) => (
                <li key={i}>{issue.field}: {issue.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={!address || !isValid}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Save Property
      </button>
    </form>
  );
}
```

## Performance Considerations

### Caching Strategy

- **Backend Cache**: In-memory cache with 30-minute TTL
- **HTTP Client Cache**: Request-level caching with deduplication
- **Local Data**: Instant responses for common Kenyan locations

### Rate Limiting

- **Geoapify**: Respects API rate limits
- **Nominatim**: Limited to 1 request/second with proper User-Agent
- **Fallback**: Local data ensures service availability

### Optimization Tips

1. **Debounce Search**: Input debounced to 500ms to reduce API calls
2. **Limit Results**: Default limit of 10 suggestions
3. **Cache Responses**: Automatic caching reduces repeated requests
4. **Progressive Enhancement**: Works with local data if APIs fail

## Error Handling

The service implements comprehensive error handling:

```typescript
// Service-level error handling
try {
  const results = await locationService.searchPlaces(query);
} catch (error) {
  console.error('Location search failed:', error);
  // Falls back to local data
}

// Component-level error states
const { data, isLoading, error } = useQuery({
  queryKey: ['location-search', query],
  queryFn: () => locationService.searchPlaces(query),
  retry: 2,
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

## Testing

### Manual Testing

1. **Search Functionality**

   ```bash
   curl "http://localhost:5000/api/v1/location/search?q=Kilimani&limit=5"
   ```

2. **Reverse Geocoding**

   ```bash
   curl "http://localhost:5000/api/v1/location/reverse?lat=-1.2958&lng=36.7825"
   ```

3. **Address Validation**

   ```bash
   curl -X POST "http://localhost:5000/api/v1/location/validate" \
        -H "Content-Type: application/json" \
        -d '{"address":{"line1":"Kilimani Road","town":"Nairobi"}}'
   ```

### Frontend Testing

Open the property creation form and test:

- Address search autocomplete
- Selection of suggestions
- Error states (network failures)
- Loading states

## Monitoring

### Metrics Available

- Search response times
- Cache hit rates
- API success/failure rates
- Provider fallback usage

### Health Checks

The location service participates in the application health check system:

```typescript
GET /api/v1/health
// Includes location service status
```

## Troubleshooting

### Common Issues

1. **No Search Results**
   - Check API keys are set correctly
   - Verify network connectivity
   - Ensure search query is at least 3 characters

2. **Slow Response Times**
   - Check cache hit rates
   - Verify API provider status
   - Consider increasing cache TTL

3. **Import Errors**
   - Ensure all dependencies are installed
   - Check TypeScript path mappings
   - Verify barrel exports are correct

### Debug Mode

Enable debug logging:

```typescript
// In development
localStorage.setItem('debug', 'location:*');
```

## Future Enhancements

1. **Additional Providers**: Integration with Google Maps, MapBox
2. **Geospatial Queries**: Polygon search, boundary detection
3. **Offline Support**: Service worker caching for offline access
4. **Analytics**: Usage tracking and performance monitoring
5. **Machine Learning**: Smart suggestions based on user behavior

## Security Considerations

- API keys stored securely in environment variables
- Rate limiting prevents abuse
- Input sanitization prevents injection attacks
- HTTPS required for geolocation API
- Request signing for API authentication

This implementation provides a robust, scalable location service that enhances the user experience while maintaining good performance and reliability.
