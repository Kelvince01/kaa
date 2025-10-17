# Amenities Integration Guide

This guide shows how the automated amenity discovery service is integrated into the app properties module.

## 🏗️ Architecture Overview

```
API (api)                     Frontend (app)
├── amenity.model.ts             ├── amenities/
├── amenity.service.ts           │   ├── amenity.type.ts
├── amenity.controller.ts        │   ├── amenity.service.ts
├── discovery.service.ts         │   ├── amenity.queries.ts
├── auto-population.service.ts   │   └── components/
└── amenity-cron.service.ts      │       ├── AmenityCard.tsx
                                 │       ├── AmenityApprovalPanel.tsx
                                 │       ├── CreateAmenityForm.tsx
                                 │       ├── PropertyAmenitiesView.tsx
                                 │       └── AmenityManagementDashboard.tsx
                                 └── pages/
                                     ├── amenities/page.tsx
                                     └── amenities/approvals/page.tsx
```

## 🔄 Auto-Discovery Workflow

### 1. Property Creation/Update Triggers
When a property is created or location updated:

```typescript
// In property.service.ts
export const createProperty = async (propertyData, memberId) => {
  const newProperty = await Property.create({...});
  
  // ✨ Automatic amenity discovery triggered
  if (newProperty && newProperty.location?.coordinates) {
    AutoPopulationService.handlePropertyCreated(newProperty);
  }
  
  return newProperty;
};
```

### 2. Background Discovery Process
```typescript
// Auto-population service queues and processes discovery
AutoPopulationService.onPropertyCreated(propertyId)
  → Adds to discovery queue
  → Background processing discovers amenities via APIs
  → Saves new amenities with source = "auto_discovered_google/osm"
  → Sets approvalStatus = "pending"
  → Updates property cache
```

### 3. Admin Approval Workflow
```typescript
// Admin reviews pending amenities
GET /api/v1/amenities/pending
  → Returns amenities with approvalStatus = "pending"
  
// Admin approves/rejects
POST /api/v1/amenities/{id}/approve
POST /api/v1/amenities/{id}/reject
  → Updates approvalStatus and verification status
```

## 🎯 Key Features Implemented

### ✅ API Schema Updates
- **`source`**: Distinguishes manual vs auto-discovered amenities
- **`approvalStatus`**: Tracks approval workflow (pending/approved/rejected)
- **Discovery metadata**: `discoveredAt`, `approvedBy`, `rejectedBy`, etc.

### ✅ Frontend Integration
- **Property View**: Added "Nearby Amenities" tab to property details
- **Approval Panel**: Dedicated interface for reviewing auto-discovered amenities
- **Management Dashboard**: Comprehensive amenity management with analytics
- **Manual Entry Form**: Form for manually adding amenities

### ✅ Automated Workflows
- **Property Lifecycle Hooks**: Auto-discovery on property creation/update
- **Background Processing**: Queued discovery to avoid blocking requests
- **Scheduled Jobs**: Hourly/daily discovery for missing amenities
- **Duplicate Prevention**: Smart filtering of existing amenities

## 🚀 Usage Examples

### Property Details with Amenities
```typescript
// Property view now includes amenities tab
<PropertyViewSheet property={property} />
  → Shows "Details", "Location", "Nearby Amenities" tabs
  → Amenities tab displays grouped amenities with scores
  → "Discover More" button triggers manual discovery
```

### Admin Amenity Management
```typescript
// Navigate to /properties/amenities
<AmenityManagementDashboard county="Nairobi" />
  → Overview: Key metrics and quick actions
  → Approvals: Review pending auto-discovered amenities
  → Discovery: Trigger manual discovery processes
  → Analytics: Charts and data quality insights
```

### Approval Workflow
```typescript
// Admin reviews pending amenities
<AmenityApprovalPanel county="Nairobi" />
  → Shows pending amenities with source badges
  → Bulk select and approve multiple amenities
  → Individual approve/reject with reasons
  → Real-time stats and filtering
```

## 📱 User Interface Components

### AmenityCard
- **Visual Design**: Category icons, source badges, approval status
- **Information Display**: Location, contact, hours, ratings, travel times
- **Actions**: Approve/reject buttons for pending amenities

### PropertyAmenitiesView  
- **Grouped Display**: Amenities organized by category
- **Location Score**: AI-powered amenity score (0-100)
- **Travel Times**: Walking and driving estimates
- **Discovery Action**: "Discover More" button for manual triggers

### AmenityApprovalPanel
- **Filtering**: By source, county, search terms
- **Bulk Operations**: Select all, bulk approve
- **Statistics**: Pending/approved/rejected counts
- **Quality Insights**: Data validation and suggestions

## 🔧 Configuration

### Environment Variables
```bash
# Optional - for Google Places API (better data quality)
GOOGLE_PLACES_API_KEY=your_api_key_here

# Auto-discovery will use OpenStreetMap if Google Places not configured
```

### Scheduled Jobs
The system automatically runs these jobs:
- **Hourly**: Discover amenities for new Nairobi properties
- **Every 4 hours**: Discover for other major counties
- **Daily**: Global discovery for properties without amenities
- **Weekly**: Data quality checks and duplicate detection

## 🎨 Frontend Pages

### Main Amenities Management
```
/properties/amenities
├── Overview tab: Key metrics, quick actions
├── Approvals tab: Review pending amenities  
├── Discovery tab: Manual discovery tools
└── Analytics tab: Charts and insights
```

### Dedicated Approvals Page
```
/properties/amenities/approvals?county=Nairobi
├── Filtered pending amenities
├── Bulk approval actions
├── Source filtering (Google/OSM/Manual)
└── Search and pagination
```

## 🔄 Data Flow

### 1. Property Creation
```
User creates property with coordinates
  ↓
Property saved to database
  ↓
AutoPopulationService.handlePropertyCreated() triggered
  ↓
Property added to discovery queue
  ↓
Background process discovers amenities via APIs
  ↓
New amenities saved with source="auto_discovered_*"
  ↓
Property cache updated with nearby amenities
```

### 2. Admin Approval
```
Admin visits /properties/amenities/approvals
  ↓
Pending amenities loaded (approvalStatus="pending")
  ↓
Admin reviews and approves/rejects
  ↓
Amenity status updated (approvalStatus="approved/rejected")
  ↓
Verified amenities become visible in property listings
```

### 3. Property Viewing
```
User views property details
  ↓
PropertyAmenitiesView component loads
  ↓
Displays approved amenities grouped by category
  ↓
Shows amenity score and travel times
  ↓
Option to discover more amenities manually
```

## 🎯 Benefits

### For Property Managers
- **Zero Manual Work**: Amenities auto-populated on property creation
- **Quality Control**: Approval workflow ensures data accuracy
- **Rich Listings**: Properties enhanced with location context
- **Insights**: AI-powered location scoring

### For Users/Tenants
- **Comprehensive Info**: See all nearby amenities with travel times
- **Location Scoring**: Understand area desirability (0-100 score)
- **Real Data**: Verified amenities with contact info and hours
- **Visual Interface**: Category-organized, easy-to-scan layout

### For Platform
- **Scalability**: Automated system scales with property growth
- **Data Quality**: Multi-source discovery with verification
- **User Experience**: Rich, informative property listings
- **Competitive Edge**: Unique location intelligence features

## 🚀 Getting Started

### 1. Seed Initial Data
```bash
cd apps/api
bun src/scripts/seed/amenities-seed.ts
```

### 2. Test Discovery
```bash
# Test coordinate discovery
bun src/scripts/test-amenity-discovery.ts

# Test property discovery  
bun src/scripts/test-amenity-discovery.ts --property-id=YOUR_PROPERTY_ID
```

### 3. Configure APIs (Optional)
```bash
# Add to .env for better discovery quality
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### 4. Access Admin Interface
- Navigate to `/properties/amenities` for management dashboard
- Navigate to `/properties/amenities/approvals` for approval workflow
- View property details to see amenities integration

## 🔮 Next Steps

1. **Enhanced Geocoding**: Better county/ward detection from coordinates
2. **Map Integration**: Visual amenity display on maps
3. **User Reviews**: Allow users to rate and review amenities  
4. **Photo Support**: Add images to amenity listings
5. **Real-time Updates**: WebSocket notifications for new discoveries
6. **ML Enhancement**: Machine learning for discovery accuracy
7. **Mobile App**: Extend to mobile app with location-based features

The amenities system is now fully integrated and ready for production use! 🎉