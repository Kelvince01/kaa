# Property Virtual Tours Integration

This document describes how virtual tours are integrated with the property management system.

## Overview

Properties can now have multiple virtual tours associated with them, replacing the old single `virtualTour` string field with a new `virtualTours` array of ObjectIds that reference VirtualTour documents.

## Database Schema Changes

### Property Model Updates

```javascript
// Old schema (deprecated but maintained for backward compatibility)
media: {
  virtualTour: String,
  // ... other fields
}

// New schema
media: {
  virtualTours: [{
    type: Schema.Types.ObjectId,
    ref: "VirtualTour"
  }],
  virtualTour: String, // Deprecated - kept for backward compatibility
  // ... other fields
}
```

### New Property Methods

- `hasVirtualTours()`: Returns boolean indicating if property has virtual tours
- `getPrimaryVirtualTour()`: Returns the primary (first) virtual tour ID or null

### Virtual Population

A virtual field `virtualToursData` is available to populate all virtual tours for a property:

```javascript
const property = await Property.findById(propertyId)
  .populate('virtualToursData');
```

## API Integration

### Automatic Population

When fetching properties, virtual tours are automatically populated:

1. **Single Property** (`findOneProperty`):
   - Populates basic tour info: title, description, type, status, scenes, analytics, metadata, publishedAt

2. **Property List** (`getProperties`):
   - Populates only published tours with limited fields for performance
   - Fields: title, type, status, scenes.length, analytics.totalViews

### Creating Virtual Tours

When a virtual tour is created through the Virtual Tours API, it's automatically linked to the property:

```javascript
POST /api/virtual-tours
{
  "propertyId": "property123",
  "title": "Modern Apartment Tour",
  "type": "photo_360",
  // ... other fields
}
```

The tour will be:
1. Created in the VirtualTour collection
2. Automatically added to the property's `media.virtualTours` array

### Deleting Virtual Tours

When a tour is deleted, it's automatically unlinked from the property.

## Migration

A migration script is provided to convert existing `virtualTour` strings to proper VirtualTour documents:

```bash
# Run the migration
npm run migrate:virtual-tours

# Or directly with TypeScript
ts-node src/features/properties/migrations/migrate-virtual-tours.ts
```

The migration will:
1. Find all properties with old `virtualTour` strings
2. Create VirtualTour documents for each
3. Link them to the property's new `virtualTours` array
4. Preserve the original URL in the tour's media

## Frontend Usage

### Checking for Virtual Tours

```javascript
// Check if property has tours
if (property.media.virtualTours && property.media.virtualTours.length > 0) {
  // Property has virtual tours
}

// Or use the helper method
if (property.hasVirtualTours()) {
  // Property has virtual tours
}
```

### Accessing Virtual Tours

```javascript
// Get all tours for a property
const tours = await virtualToursService.getVirtualTours(propertyId);

// Get the primary tour
const primaryTourId = property.getPrimaryVirtualTour();
if (primaryTourId) {
  const tour = await virtualToursService.getVirtualTour(primaryTourId);
}
```

### Display in Property Details

The frontend components automatically detect and display virtual tours:

```jsx
<VirtualTour property={property} />
```

This component will:
- Show all available tours
- Display tour analytics
- Enable advanced features (AI, VR/AR, collaboration) if available
- Provide tour management for property owners

## Best Practices

1. **Always check for tours existence** before accessing
2. **Use populated data** when available to avoid extra queries
3. **Filter by status** to show only published tours to public users
4. **Limit fields** when populating in lists for performance
5. **Cache tour data** when possible as tours don't change frequently

## Backward Compatibility

The old `virtualTour` string field is maintained for backward compatibility but is deprecated. New code should use the `virtualTours` array.

## Future Enhancements

1. **Tour Ordering**: Allow property owners to set display order for multiple tours
2. **Tour Categories**: Categorize tours (main tour, renovation progress, seasonal views)
3. **Tour Templates**: Create tour templates for similar property types
4. **Bulk Operations**: Create tours for multiple properties at once
5. **Analytics Dashboard**: Property-level virtual tour analytics