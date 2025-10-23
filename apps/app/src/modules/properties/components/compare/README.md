# Property Comparison Component

A comprehensive React component for comparing multiple properties side by side, built with TypeScript and modern UI components.

## Features

- **Multi-Property Comparison**: Compare up to 8 properties side by side
- **Multiple Views**: Table, card, and chart views for different comparison styles
- **Enhanced Charts with shadcn/ui**: Professional charts with consistent theming, enhanced tooltips, and better accessibility
- **Interactive Visualizations**: Bar charts, radar charts, and pie charts with shadcn/ui styling
- **Smart Property Selector**: Search, filter, and select properties with validation
- **Categorized Fields**: Organized comparison fields by category (Basic, Pricing, Location, etc.)
- **Similar Properties**: AI-powered suggestions for similar properties
- **Export & Share**: Share comparisons via URL or export data
- **Consistent Theming**: Seamless integration with your design system using shadcn/ui components
- **Enhanced Tooltips**: Rich, accessible tooltips with proper formatting and theming
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Customizable Fields**: Define custom comparison fields
- **Performance Optimized**: Efficient rendering and data handling

## Installation

The component is already included in your properties module. Import it like this:

```tsx
import { PropertyCompare } from '@/modules/properties/components/compare';
// or
import { PropertyCompare } from '@/modules/properties/components/compare/property-compare';
```

## Basic Usage

```tsx
import React from 'react';
import { PropertyCompare } from '@/modules/properties/components/compare';

function ComparisonPage() {
  const [properties] = useProperties(); // Your properties data

  return (
    <PropertyCompare
      availableProperties={properties}
      maxProperties={4}
      onPropertiesChange={(selected) => console.log(selected)}
      onShare={(properties) => handleShare(properties)}
    />
  );
}
```

## Props

### `PropertyCompareProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialProperties` | `Property[]` | `[]` | Properties to show initially |
| `maxProperties` | `number` | `4` | Maximum number of properties that can be compared |
| `showSelector` | `boolean` | `true` | Whether to show the property selector |
| `availableProperties` | `Property[]` | `[]` | Properties available for selection |
| `onPropertiesChange` | `(properties: Property[]) => void` | - | Callback when selected properties change |
| `onShare` | `(properties: Property[]) => void` | - | Callback when sharing comparison |
| `customFields` | `ComparisonField[]` | - | Custom fields to show (uses defaults if not provided) |
| `showSimilarProperties` | `boolean` | `true` | Whether to show similar property suggestions |

## Custom Fields

You can define custom comparison fields:

```tsx
const customFields = [
  {
    key: "title",
    label: "Property Name",
    category: "Basic",
    type: "text",
    important: true
  },
  {
    key: "pricing.rentAmount",
    label: "Monthly Rent",
    category: "Pricing",
    type: "price",
    important: true,
    format: (value) => `KES ${value.toLocaleString()}/month`
  },
  {
    key: "details.bedrooms",
    label: "Bedrooms",
    category: "Space",
    type: "number",
    important: true
  }
];
```

### Field Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Plain text display | Property title, location |
| `number` | Numeric values | Bedrooms, bathrooms |
| `price` | Currency formatting | Rent amount, deposit |
| `boolean` | Yes/No display with icons | Parking, furnished |
| `badge` | Colored badges | Status, property type |
| `list` | Arrays with smart truncation | Amenities, features |

## Advanced Usage

### With Custom Sharing

```tsx
const handleShare = async (properties) => {
  const propertyIds = properties.map(p => p._id);
  const shareData = {
    title: 'Property Comparison',
    text: `Compare ${properties.length} properties`,
    url: `${window.location.origin}/compare?ids=${propertyIds.join(',')}`
  };
  
  if (navigator.share) {
    await navigator.share(shareData);
  } else {
    // Fallback to clipboard
    navigator.clipboard.writeText(shareData.url);
  }
};
```

### With URL State Management

```tsx
const [selectedIds, setSelectedIds] = useSearchParams();

const handlePropertiesChange = (properties) => {
  const ids = properties.map(p => p._id).join(',');
  setSelectedIds({ ids });
};
```

## Components

The comparison system consists of several sub-components:

### `PropertySelector`
Handles property search, filtering, and selection.

### `ComparisonTable`
Displays properties in a detailed table format with category grouping.

### `ComparisonChart`
Shows interactive charts for numeric data comparison.

### `SimilarProperties`
AI-powered similar property recommendations.

## Styling

The component uses Tailwind CSS and shadcn/ui components. It's fully responsive and supports:

- Dark/light mode
- Mobile-first design
- Accessible UI components
- Smooth animations with Framer Motion

## Data Requirements

The component expects properties to follow the `Property` interface defined in your property types. Key fields include:

- `_id`: Unique identifier
- `title`: Property title
- `pricing`: Pricing information
- `location`: Location details
- `details`: Property specifications
- `media`: Photos and media
- `amenities`: Property amenities
- `features`: Property features

## Performance

- **Optimized rendering**: Only re-renders when necessary
- **Efficient filtering**: Smart memoization of search results
- **Lazy loading**: Charts only render when visible
- **Memory efficient**: Proper cleanup of resources

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Troubleshooting

### Missing Dependencies
Make sure you have these dependencies installed:
- `recharts` (for charts)
- `framer-motion` (for animations)
- All shadcn/ui components

### TypeScript Errors
Ensure your Property type matches the expected interface. Check:
- All required fields are present
- Nested objects match expected structure
- Array types are correctly typed

### Performance Issues
For large datasets:
- Implement virtualization
- Add pagination to property selector
- Use React.memo for sub-components

## Examples

See `example.tsx` for a complete working example with mock data.

## Contributing

When adding new features:
1. Follow existing patterns
2. Add TypeScript types
3. Include proper error handling
4. Update documentation
5. Test with various data sets
