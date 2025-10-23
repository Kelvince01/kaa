# Enhanced Media Form Components

This directory contains enhanced components for handling media uploads and management in the property creation flow. The components provide a modern, user-friendly experience with advanced features like drag-and-drop reordering, tagging, bulk operations, and comprehensive validation.

## Components Overview

### 1. EnhancedDropzone (`enhanced-dropzone.tsx`)
A robust file upload component with improved UX and validation.

**Features:**
- Multi-media type support (photos, videos, virtual tours, floor plans, EPCs)
- Drag and drop file uploads
- File validation (size, format, type)
- Upload progress tracking
- Quality settings for photos
- URL input for virtual tours
- Contextual tips and guidance
- Error handling and user feedback

**Usage:**
```tsx
<EnhancedDropzone
  onDrop={handleFileDrop}
  onUrlSubmit={handleUrlSubmit}
  mediaType="photos"
  accept="image/*"
  multiple={true}
  maxFiles={50}
  maxFileSize={10 * 1024 * 1024} // 10MB
  quality="high"
  disabled={isUploading}
/>
```

### 2. EnhancedMediaPreview (`enhanced-media-preview.tsx`)
Advanced media preview component with comprehensive management features.

**Features:**
- Multiple view modes (grid, list, detailed)
- Drag-and-drop reordering
- Bulk selection and operations
- Inline caption editing
- Tag management with autocomplete
- Primary photo designation
- Context menus with actions
- Real-time upload progress
- Responsive design

**Usage:**
```tsx
<EnhancedMediaPreview
  items={mediaItems}
  onItemUpdate={handleItemUpdate}
  onItemDelete={handleItemDelete}
  onItemsReorder={handleReorder}
  onBulkSelect={handleBulkSelect}
  onBulkDelete={handleBulkDelete}
  onSetPrimary={handleSetPrimary}
  previewMode="grid"
  allowReordering={true}
  allowBulkActions={true}
  showTags={true}
  suggestedTags={availableTags}
/>
```

## Enhanced Features

### Media Type Configuration
```typescript
const mediaTypeConfig = {
  photos: {
    icon: ImageIcon,
    label: "Property Photos",
    description: "Upload high-quality images",
    tips: ["Use natural lighting", "Capture multiple angles", "Include exterior and interior shots"],
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: ["JPEG", "PNG", "WebP"],
  },
  videos: {
    // ... video configuration
  },
  // ... other media types
};
```

### File Validation
- **Size validation**: Configurable per media type
- **Format validation**: Supports multiple formats per type
- **Type validation**: Ensures correct file types
- **Custom validation**: Extensible validation rules
- **Real-time feedback**: Immediate error display

### Upload Features
- **Progress tracking**: Real-time upload progress
- **Compression**: Automatic image compression
- **Quality analysis**: Image quality assessment
- **Batch uploads**: Multiple files simultaneously
- **Resume capability**: Pause/resume uploads
- **Offline queuing**: Queue uploads when offline

### Preview & Management
- **Multiple layouts**: Grid, list, and detailed views
- **Drag reordering**: Visual drag-and-drop interface
- **Bulk operations**: Select multiple items for actions
- **Tagging system**: Add, remove, and filter by tags
- **Caption editing**: Inline caption management
- **Primary designation**: Mark primary photos
- **Context actions**: Copy URLs, preview, delete

## Integration with Main Form

The enhanced components integrate seamlessly with the main media form (`media-info.tsx`):

```tsx
// Convert photos to media items
const mediaItems = photos.map((photo) => ({
  id: photo.id || `photo-${photo.url}`,
  url: photo.url,
  type: "photo" as const,
  caption: photo.caption,
  tags: photo.tags,
  isPrimary: photo.isPrimary,
  isSelected: selectedPhotoIds.includes(photo.id || ""),
  uploadProgress: photo.uploadProgress,
  file: photo.file,
}));

// Handle operations
const handleMediaItemUpdate = useCallback((id: string, updates: any) => {
  const currentPhotos = getValues("photos") || [];
  const updatedPhotos = currentPhotos.map((photo) =>
    photo.id === id ? { ...photo, ...updates } : photo
  );
  setValue("photos", updatedPhotos, { shouldDirty: true });
}, [getValues, setValue]);
```

## Enhanced UX States

The form now includes advanced UX states for better user experience:

```tsx
// Enhanced UX states
const [previewMode, setPreviewMode] = useState<"grid" | "list" | "detailed">("grid");
const [allowReordering, setAllowReordering] = useState(true);
const [showTags, setShowTags] = useState(true);
const [autoTagging, setAutoTagging] = useState(true);
const [showUploadTips, setShowUploadTips] = useState(true);
```

## Available Tags System

Predefined tags for better organization:

```typescript
const availableTags = [
  "bedroom", "kitchen", "bathroom", "living-room",
  "exterior", "garden", "parking", "security",
  "water", "power", "dining-room", "balcony",
  "terrace", "storage"
];
```

## Error Handling & Validation

### Client-side Validation
- **Required fields**: At least one photo required
- **Upload validation**: All photos must have valid URLs
- **Primary photo**: Ensures one photo is marked as primary
- **Format validation**: Checks file formats and sizes

### Error Display
```tsx
{form.formState.errors.photos && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      {form.formState.errors.photos.message}
    </AlertDescription>
  </Alert>
)}
```

## Performance Optimizations

### Image Compression
- **Automatic compression**: Reduces file sizes before upload
- **Quality settings**: User-configurable quality levels
- **Format optimization**: Convert to optimal formats

### Lazy Loading
- **Progressive loading**: Load images as they come into view
- **Thumbnail generation**: Create thumbnails for faster preview
- **Memory management**: Efficient image handling

### Upload Optimization
- **Concurrent uploads**: Multiple files upload simultaneously
- **Retry mechanism**: Automatic retry for failed uploads
- **Bandwidth adaptation**: Adjust based on connection speed

## Accessibility Features

### Keyboard Navigation
- **Tab navigation**: Full keyboard accessibility
- **Arrow key selection**: Navigate through media items
- **Shortcut keys**: Quick actions with keyboard shortcuts

### Screen Reader Support
- **ARIA labels**: Comprehensive labeling
- **Live regions**: Status updates for screen readers
- **Semantic markup**: Proper HTML structure

### Visual Accessibility
- **High contrast**: Support for high contrast themes
- **Focus indicators**: Clear focus states
- **Color alternatives**: Non-color-dependent interfaces

## Mobile Responsive Design

### Touch Interactions
- **Touch drag**: Mobile drag-and-drop support
- **Gesture support**: Pinch to zoom, swipe actions
- **Touch targets**: Appropriately sized touch areas

### Layout Adaptation
- **Responsive grids**: Adapts to screen sizes
- **Mobile layouts**: Optimized for mobile devices
- **Portrait/landscape**: Works in both orientations

## Future Enhancements

### Planned Features
1. **AI-powered tagging**: Automatic image recognition and tagging
2. **Advanced filters**: More sophisticated filtering options
3. **Batch editing**: Edit multiple items simultaneously
4. **Cloud integration**: Direct cloud storage uploads
5. **Image editing**: Basic editing tools (crop, rotate, adjust)
6. **Video thumbnails**: Generate thumbnails for videos
7. **Metadata extraction**: EXIF data extraction and display
8. **Social sharing**: Share media directly from the interface

### Performance Improvements
1. **Virtual scrolling**: Handle large numbers of media items
2. **WebGL acceleration**: Hardware-accelerated operations
3. **Service workers**: Background processing
4. **CDN integration**: Optimized media delivery

## Testing

### Unit Tests
- Component rendering tests
- Event handling tests
- Validation logic tests
- State management tests

### Integration Tests
- Form submission flows
- File upload scenarios
- Error handling paths
- Accessibility compliance

### E2E Tests
- Complete user workflows
- Cross-browser compatibility
- Mobile device testing
- Performance benchmarks

## API Integration

### Upload Endpoints
```typescript
// Photo upload
POST /api/properties/media/photos
Content-Type: multipart/form-data

// Video upload
POST /api/properties/media/videos
Content-Type: multipart/form-data

// Virtual tour URL
POST /api/properties/media/virtual-tour
Content-Type: application/json
```

### Response Format
```typescript
interface UploadResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
  metadata: {
    size: number;
    dimensions: { width: number; height: number };
    format: string;
  };
}
```

## Configuration Options

### Environment Variables
```bash
# Upload limits
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
NEXT_PUBLIC_MAX_FILES_PER_PROPERTY=50

# Feature flags
NEXT_PUBLIC_ENABLE_AUTO_TAGGING=true
NEXT_PUBLIC_ENABLE_IMAGE_COMPRESSION=true
NEXT_PUBLIC_ENABLE_BULK_OPERATIONS=true

# CDN settings
NEXT_PUBLIC_MEDIA_CDN_URL=https://cdn.example.com
```

This enhanced media form system provides a comprehensive, user-friendly experience for managing property media with modern features, robust validation, and excellent performance.
