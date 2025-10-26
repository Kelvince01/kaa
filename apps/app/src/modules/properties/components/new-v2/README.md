# Property Form V2

A modern, responsive property listing form combining the best features from both `create` and `new` components.

## Features

### Core Functionality
- **8-Step Wizard**: Guided form flow with validation at each step
- **Auto-Save Draft**: Automatic draft saving using Zustand store
- **Form Validation**: Zod schema validation with real-time feedback
- **Progress Tracking**: Visual stepper showing completion status
- **Responsive Design**: Mobile-first approach, fully responsive across all devices

### Step Breakdown

1. **Basic Information**
   - Property title, type, and description
   - Tags for better searchability
   - Character counters for user guidance

2. **Location Details**
   - County and estate selection (with Kenya counties autocomplete)
   - GPS coordinates with "Use Current Location" feature
   - Nearby amenities tagging
   - Building name and plot number (optional)

3. **Specifications**
   - Bedrooms and bathrooms count
   - Total area in square meters
   - Furnishing status
   - Property condition with detailed descriptions

4. **Pricing Information**
   - Monthly rent amount
   - Payment frequency (monthly/quarterly/annually)
   - Deposit calculation (in months)
   - Service fees
   - Real-time cost summary calculator

5. **Amenities & Features**
   - Categorized amenities (Essential, Comfort, Luxury, Outdoor)
   - Visual selection with icons
   - Selected amenities summary

6. **Media Upload**
   - Drag-and-drop image upload
   - Image reordering and primary image selection
   - Preview gallery with thumbnails
   - Photography tips for better listings

7. **Availability & Contact**
   - Available from date selection
   - Viewing contact information
   - Guidance on next steps

8. **Rules & Policies**
   - Pet policy toggle
   - Minimum lease period
   - Additional policy guidance

9. **Review & Submit**
   - Complete listing summary
   - All information review before submission
   - Validation status indicators

## Technical Stack

- **Form Management**: react-hook-form with zodResolver
- **Validation**: Zod schemas with custom validation rules
- **State Management**: Custom `useFormWithDraft` hook (Zustand-based)
- **UI Components**: Shadcn/ui components
- **Stepper**: Custom responsive stepper component
- **Icons**: Lucide React
- **Notifications**: Sonner toast notifications

## Responsive Design

### Breakpoints
- **Mobile**: < 640px (sm) - Single column layout
- **Tablet**: 640px - 1024px (md to lg) - Two column layout
- **Desktop**: > 1024px (lg+) - Three column layout where applicable

### Stepper Behavior
- **Mobile** (< 768px): Vertical orientation with scrollable steps
- **Tablet/Desktop** (>= 768px): Horizontal orientation with full visibility

## Usage

```tsx
import { PropertyFormV2 } from "@/modules/properties/components/new-v2";

export default function NewPropertyPage() {
  return <PropertyFormV2 />;
}
```

## Schema Structure

The form follows the `CreatePropertyData` type from `@kaa/models/types/property.type.ts`:

```typescript
type CreatePropertyData = {
  title: string;
  description: string;
  type: PropertyType;
  county: string;
  estate: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  bedrooms: number;
  bathrooms: number;
  furnished: FurnishedStatus;
  totalArea?: number;
  condition: PropertyCondition;
  rent: number;
  deposit: number;
  serviceFee?: number;
  paymentFrequency: "monthly" | "quarterly" | "annually";
  advanceMonths: number;
  depositMonths: number;
  amenities: string[];
  images: string[];
  availableFrom?: string;
  viewingContact: {
    name: string;
    phone: string;
  };
  petsAllowed: boolean;
  minimumLease: number;
  tags?: string[];
};
```

## Draft Storage

- Draft data is stored in local storage via Zustand
- Unique form ID: `"property-form"`
- Auto-saves on every form change (debounced)
- Draft restored on page reload
- Draft cleared on successful submission

## Validation

Each step has its own schema for granular validation:
- Minimum/maximum character limits
- Required field validation
- Type validation (numbers, dates, etc.)
- Custom validation rules (e.g., coordinates bounds)

## File Structure

```
new-v2/
├── schema.ts                 # Zod schemas and types
├── property-form.tsx         # Main form component with stepper
├── index.tsx                 # Public API exports
├── README.md                 # This file
└── steps/
    ├── index.ts              # Step exports
    ├── basic-info-step.tsx   # Step 1
    ├── location-step.tsx     # Step 2
    ├── specifications-step.tsx # Step 3
    ├── pricing-step.tsx      # Step 4
    ├── amenities-step.tsx    # Step 5
    ├── media-step.tsx        # Step 6
    ├── availability-step.tsx # Step 7
    ├── rules-step.tsx        # Step 8
    └── review-step.tsx       # Step 9 (Final review)
```

## Customization

### Adding New Steps

1. Create a new step component in `steps/`
2. Define the schema in `schema.ts`
3. Add to `propertyFormSteps` array
4. Add to `STEP_COMPONENTS` mapping in `property-form.tsx`
5. Export from `steps/index.ts`

### Modifying Validation

Edit the relevant schema in `schema.ts`:

```typescript
export const customSchema = z.object({
  fieldName: z.string()
    .min(5, "Custom error message")
    .max(100)
    .optional(),
});
```

### Styling

All components use Tailwind CSS with shadcn/ui conventions:
- Dark mode support via `dark:` variants
- Responsive utilities (`md:`, `lg:`, etc.)
- Custom colors via CSS variables

## API Integration

To integrate with your backend, modify the `onSubmit` function in `property-form.tsx`:

```typescript
const onSubmit = async (data: PropertyFormData) => {
  setIsSubmitting(true);
  try {
    const response = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Submission failed");

    const result = await response.json();
    toast.success("Property submitted successfully!");
    router.push(`/properties/${result.id}`);
  } catch (error) {
    toast.error("Failed to submit property");
  } finally {
    setIsSubmitting(false);
  }
};
```

## Image Upload

The media step includes a placeholder for image upload. Implement your storage solution:

```typescript
// In media-step.tsx
const handleFileUpload = async (files: FileList) => {
  for (const file of files) {
    // Upload to your storage (S3, Cloudinary, etc.)
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const { url } = await response.json();
    uploadedUrls.push(url);
  }

  form.setValue("images", [...images, ...uploadedUrls]);
};
```

## Best Practices

1. **Mobile-First**: Design for mobile, enhance for desktop
2. **Progressive Enhancement**: Core functionality works without JavaScript
3. **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
4. **Performance**: Lazy load images, debounce form changes
5. **User Feedback**: Toast notifications, loading states, error messages
6. **Data Privacy**: Clear draft data after submission

## Future Enhancements

- [ ] Image compression before upload
- [ ] Video upload support
- [ ] Virtual tour integration
- [ ] Map integration for location selection
- [ ] AI-powered description suggestions
- [ ] Bulk property import
- [ ] Property duplication feature
- [ ] Multi-language support

## Support

For issues or questions:
- Check the [property listing guide](/help)
- Contact support
- Review the component source code
