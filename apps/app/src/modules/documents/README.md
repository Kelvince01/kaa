# 📄 Documents Module

A comprehensive, production-ready document management system for KAA SaaS with industry-standard features rivaling Google Drive, Dropbox, and Adobe Document Cloud.

## 🎯 **Overview**

The Documents Module provides complete document lifecycle management with advanced features including drag & drop uploads, industry-standard PDF viewing with annotations, real-time verification tracking, and powerful bulk operations.

## 📋 **Components**

### Core Components

| Component | Description | Key Features |
|-----------|-------------|--------------|
| `DocumentUploader` | Advanced document upload interface | Drag & drop, camera capture, batch upload, validation |
| `DocumentList` | Comprehensive document listing | Grid/list/table views, filtering, bulk selection |
| `DocumentViewer` | Industry-standard document viewer | PDF viewing, annotations, search, multi-format |
| `DocumentVerificationStatus` | Verification progress tracking | Real-time status, category progress, alerts |
| `DocumentCategoryFilter` | Advanced filtering system | Multiple variants, counts, status filtering |
| `DocumentBulkActions` | Bulk operations management | Multi-select actions, progress tracking |
| `DocumentMetadataEditor` | Document metadata editing | Form validation, tag management, date picker |

## 🚀 **Key Features**

### Document Upload

- ✅ **Drag & Drop Interface** - Modern, intuitive file dropping with visual feedback
- ✅ **Camera Integration** - Direct document scanning from mobile devices
- ✅ **Batch Upload** - Upload multiple files simultaneously with progress tracking
- ✅ **Smart Validation** - File type and size validation by document category
- ✅ **Metadata Collection** - Tags, descriptions, expiry dates, and priorities
- ✅ **Preview Generation** - Automatic thumbnail creation for supported formats
- ✅ **File Recommendations** - Smart suggestions for optimal file types

### Document Viewing

- ✅ **Industry-Standard PDF Viewer** - Professional-grade viewing experience
- ✅ **Advanced Zoom Controls** - 25% to 500% zoom with fit-to-width/height options
- ✅ **Full-Text Search** - Search within documents with result highlighting
- ✅ **Annotation System** - Highlights, notes, shapes, and text annotations
- ✅ **Multi-Format Support** - PDF, images, video, audio, and generic files
- ✅ **Keyboard Shortcuts** - Power user navigation and controls
- ✅ **Fullscreen Mode** - Distraction-free document viewing
- ✅ **Page Thumbnails** - Quick navigation sidebar with page previews

### Document Management

- ✅ **Multiple View Modes** - Grid, list, and table layouts
- ✅ **Advanced Filtering** - Category, status, date range, and tag filtering
- ✅ **Bulk Operations** - Multi-select actions with progress tracking
- ✅ **Real-Time Search** - Instant document discovery
- ✅ **Favorites System** - Star documents for quick access
- ✅ **Smart Sorting** - Multiple sorting criteria with visual indicators

### Verification & Status

- ✅ **Real-Time Progress** - Live verification status updates
- ✅ **Category Tracking** - Per-category verification progress
- ✅ **Visual Indicators** - Color-coded status and priority badges
- ✅ **Actionable Alerts** - Smart notifications for required actions
- ✅ **Progress Analytics** - Completion percentages and statistics

## 📦 **Installation & Setup**

```bash
# The module is already integrated into your KAA SaaS project
# Import components as needed:

import {
  DocumentUploader,
  DocumentList,
  DocumentViewer,
  DocumentVerificationStatus,
  DocumentCategoryFilter,
  DocumentBulkActions,
  DocumentMetadataEditor,
  // Types and utilities
  DocumentCategory,
  DocumentStatus,
  DocumentPriority,
  useDocuments,
  useDocumentStore,
} from "@/modules/documents";
```

## 🎨 **Basic Usage**

### Document Upload

```tsx
import { DocumentUploader } from "@/modules/documents";

function UploadPage() {
  return (
    <DocumentUploader
      category={DocumentCategory.IDENTITY}
      onSuccess={(documentId) => console.log('Uploaded:', documentId)}
      onError={(error) => console.error('Upload failed:', error)}
      allowBatch={true}
      maxFiles={5}
      showMetadata={true}
      autoVerify={true}
    />
  );
}
```

### Document List

```tsx
import { DocumentList } from "@/modules/documents";

function DocumentsPage() {
  return (
    <DocumentList
      showHeader={true}
      showFilters={true}
      showPagination={true}
      onDocumentClick={(doc) => console.log('View:', doc)}
      onDocumentSelect={(doc) => console.log('Selected:', doc)}
    />
  );
}
```

### PDF Viewer

```tsx
import { DocumentViewer } from "@/modules/documents";

function ViewerPage() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <DocumentViewer
      documentId="doc-123"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showAdvanced={true}
    />
  );
}
```

### Verification Status

```tsx
import { DocumentVerificationStatus } from "@/modules/documents";

function StatusPage() {
  return (
    <DocumentVerificationStatus
      showDetails={true}
      showProgress={true}
      compact={false}
      onCategoryClick={(category) => console.log('Filter by:', category)}
    />
  );
}
```

## 🛠 **Advanced Usage**

### Custom Document List with Filtering

```tsx
import { 
  DocumentList, 
  DocumentCategoryFilter, 
  useDocumentStore 
} from "@/modules/documents";

function AdvancedDocumentsPage() {
  const { filter, setFilter } = useDocumentStore();
  
  return (
    <div className="space-y-4">
      <DocumentCategoryFilter
        selectedCategories={filter.category || []}
        onCategoriesChange={(categories) => setFilter({ category: categories })}
        variant="chips"
        showStatusFilter={true}
      />
      
      <DocumentList
        showHeader={true}
        maxHeight="600px"
        onDocumentClick={(doc) => {
          // Custom click handler
          window.open(`/documents/${doc._id}`, '_blank');
        }}
      />
    </div>
  );
}
```

### Bulk Operations Integration

```tsx
import { 
  DocumentList, 
  DocumentBulkActions, 
  useDocumentStore 
} from "@/modules/documents";

function BulkManagementPage() {
  const { selectedDocuments, clearSelection } = useDocumentStore();
  
  return (
    <div className="space-y-4">
      <DocumentBulkActions
        selectedDocuments={selectedDocuments}
        variant="expanded"
        onAction={(action, ids, params) => {
          console.log('Bulk action:', action, ids, params);
        }}
        onClearSelection={clearSelection}
      />
      
      <DocumentList />
    </div>
  );
}
```

### Custom Metadata Editor

```tsx
import { DocumentMetadataEditor } from "@/modules/documents";

function EditDocumentPage({ document }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <DocumentMetadataEditor
      document={document}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      variant="sheet"
      showAdvanced={true}
      onSave={(data) => {
        console.log('Saving:', data);
        // Custom save logic
      }}
    />
  );
}
```

## 🎯 **Component Props Reference**

### DocumentUploader Props

```tsx
interface DocumentUploaderProps {
  category?: DocumentCategory;
  onSuccess?: (documentId: string) => void;
  onError?: (error: Error) => void;
  allowBatch?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  showMetadata?: boolean;
  showPreview?: boolean;
  autoVerify?: boolean;
  className?: string;
}
```

### DocumentList Props

```tsx
interface DocumentListProps {
  className?: string;
  category?: DocumentCategory;
  showHeader?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  maxHeight?: string;
  onDocumentClick?: (document: IDocument) => void;
  onDocumentSelect?: (document: IDocument) => void;
}
```

### DocumentViewer Props

```tsx
interface DocumentViewerProps {
  documentId?: string;
  document?: IDocument;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}
```

### DocumentVerificationStatus Props

```tsx
interface DocumentVerificationStatusProps {
  className?: string;
  showDetails?: boolean;
  showProgress?: boolean;
  compact?: boolean;
  onCategoryClick?: (category: DocumentCategory) => void;
}
```

### DocumentCategoryFilter Props

```tsx
interface DocumentCategoryFilterProps {
  selectedCategories: DocumentCategory[];
  selectedStatuses?: DocumentStatus[];
  onCategoriesChange: (categories: DocumentCategory[]) => void;
  onStatusesChange?: (statuses: DocumentStatus[]) => void;
  onClear?: () => void;
  className?: string;
  variant?: "dropdown" | "chips" | "sidebar";
  showStatusFilter?: boolean;
  showClearButton?: boolean;
  disabled?: boolean;
  counts?: Record<DocumentCategory, number>;
  statusCounts?: Record<DocumentStatus, number>;
}
```

### DocumentBulkActions Props

```tsx
interface DocumentBulkActionsProps {
  selectedDocuments: string[];
  totalDocuments?: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onAction?: (action: string, documentIds: string[], parameters?: any) => void;
  className?: string;
  variant?: "compact" | "expanded" | "dropdown";
  disabled?: boolean;
  showSelectAll?: boolean;
}
```

### DocumentMetadataEditor Props

```tsx
interface DocumentMetadataEditorProps {
  document: IDocument;
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (data: DocumentUpdateInput) => void;
  className?: string;
  variant?: "dialog" | "sheet" | "inline";
  showAdvanced?: boolean;
}
```

## 🗂 **Document Types**

```tsx
enum DocumentCategory {
  GENERAL = "general",
  IDENTITY = "identity",
  ADDRESS = "address",
  INCOME = "income",
  REFERENCES = "references",
  OTHER = "other",
}

enum DocumentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  VERIFIED = "verified",
  REJECTED = "rejected",
  EXPIRED = "expired",
  ERROR = "error",
}

enum DocumentPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
}

interface IDocument {
  _id: string;
  tenant: string | User;
  name: string;
  type: string;
  category: DocumentCategory;
  file: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  priority: DocumentPriority;
  expiryDate?: string;
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  preview?: string;
  metadata?: DocumentMetadata;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

## 🔧 **State Management**

### Document Store (Zustand)

```tsx
import { useDocumentStore } from "@/modules/documents";

function MyComponent() {
  const {
    // Selection state
    selectedDocuments,
    toggleDocumentSelection,
    clearSelection,
    hasSelection,
    selectionCount,
    
    // Filter state
    filter,
    setFilter,
    clearFilter,
    
    // View state
    viewMode,
    setViewMode,
    itemsPerPage,
    setItemsPerPage,
    
    // Modal state
    isUploadModalOpen,
    setUploadModalOpen,
    isViewerModalOpen,
    setViewerModalOpen,
    currentDocument,
    setCurrentDocument,
    
    // Favorites
    favoriteDocuments,
    toggleFavorite,
    isFavorite,
  } = useDocumentStore();
  
  return (
    // Your component JSX
  );
}
```

### React Query Hooks

```tsx
import {
  useDocuments,
  useDocument,
  useVerificationStatus,
  useUploadDocument,
  useUpdateDocument,
  useDeleteDocument,
  useBulkDocumentOperation,
} from "@/modules/documents";

function MyComponent() {
  // Fetch documents
  const { data: documents, isLoading } = useDocuments(filter);
  
  // Upload document
  const uploadMutation = useUploadDocument();
  
  // Update document
  const updateMutation = useUpdateDocument();
  
  // Bulk operations
  const bulkMutation = useBulkDocumentOperation();
  
  return (
    // Your component JSX
  );
}
```

## ⌨️ **Keyboard Shortcuts**

### Document Viewer

- `Ctrl/Cmd + =` - Zoom in
- `Ctrl/Cmd + -` - Zoom out
- `Ctrl/Cmd + 0` - Reset zoom to 100%
- `Ctrl/Cmd + F` - Toggle fullscreen
- `Ctrl/Cmd + S` - Download document
- `Ctrl/Cmd + P` - Print document
- `←/→` - Previous/Next page
- `Home/End` - First/Last page
- `Esc` - Close viewer or exit fullscreen

### Document List

- `Ctrl/Cmd + A` - Select all documents
- `Delete` - Delete selected documents
- `Ctrl/Cmd + F` - Focus search
- `Esc` - Clear selection or close modals

## 🎨 **Styling & Theming**

The module uses your existing KAA UI components and follows your design system:

```tsx
// Custom styling example
<DocumentList className="my-custom-styles" />

// Theme-aware components automatically adapt to light/dark modes
<DocumentViewer className="dark:bg-gray-900 light:bg-white" />
```

## 🔐 **Security Features**

- **File Type Validation** - Strict MIME type checking
- **Size Limits** - Configurable per category
- **Virus Scanning** - Integration ready
- **Access Control** - Permission-based viewing
- **Audit Trails** - Complete action logging
- **Secure Upload** - Encrypted file transfer
- **Data Privacy** - GDPR/CCPA compliant

## 🚀 **Performance Optimizations**

- **Lazy Loading** - Components and images loaded on demand
- **Virtual Scrolling** - Efficient large list rendering
- **Memoization** - Optimized re-render prevention
- **Image Optimization** - Automatic thumbnail generation
- **Caching** - Smart React Query caching strategies
- **Bundle Splitting** - Code splitting for optimal loading

## 🧪 **Testing**

```bash
# Run component tests
npm run test:documents

# Run E2E tests
npm run test:e2e:documents

# Visual regression tests
npm run test:visual:documents
```

## 📱 **Mobile Support**

- **Touch Optimized** - Gesture-friendly interactions
- **Responsive Design** - Adapts to all screen sizes
- **Camera Integration** - Native document scanning
- **Offline Support** - Progressive Web App features
- **Performance** - Optimized for mobile networks

## 🔧 **Development**

### Adding New Document Types

```tsx
// Extend the DocumentCategory enum
export enum DocumentCategory {
  // ... existing categories
  MEDICAL = "medical",
  EDUCATION = "education",
}

// Update category configuration
const categoryConfig = {
  [DocumentCategory.MEDICAL]: {
    label: "Medical Records",
    icon: Heart,
    color: "bg-red-100",
    description: "Medical documents and records",
    allowedTypes: ["application/pdf", "image/*"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  // ... other categories
};
```

### Custom Validators

```tsx
// Add custom validation logic
const customValidators = {
  [DocumentCategory.MEDICAL]: (file: File) => {
    // Custom medical document validation
    if (!file.name.includes('medical')) {
      return 'Medical documents must contain "medical" in filename';
    }
    return null;
  },
};
```

## 🐛 **Troubleshooting**

### Common Issues

**Upload Fails**

```tsx
// Check file size and type restrictions
const isValidFile = validateDocumentFile(file, category);
if (!isValidFile.valid) {
  console.error('Validation failed:', isValidFile.errors);
}
```

**Viewer Not Loading**

```tsx
// Ensure document exists and is accessible
const { data: document, error } = useDocument(documentId);
if (error) {
  console.error('Document load failed:', error);
}
```

**State Not Updating**

```tsx
// Check if store is properly connected
const store = useDocumentStore();
console.log('Store state:', store);
```

## 📄 **API Integration**

The module integrates seamlessly with your existing API endpoints:

```
POST   /api/documents/verification     - Upload documents
GET    /api/documents                  - List documents
GET    /api/documents/:id              - Get document details
PATCH  /api/documents/:id              - Update document
DELETE /api/documents/:id              - Delete document
GET    /api/documents/:id/download     - Download document
GET    /api/documents/:id/preview      - Get preview
POST   /api/documents/:id/verify       - Start verification
POST   /api/documents/bulk             - Bulk operations
GET    /api/documents/verification/status - Verification status
```

## 🤝 **Contributing**

1. Follow the existing component patterns
2. Add comprehensive TypeScript types
3. Include unit tests for new features
4. Update documentation for API changes
5. Test across different browsers and devices

## 📞 **Support**

For issues and feature requests, please refer to:

- Internal documentation
- Code review guidelines
- Testing procedures
- Deployment processes

## 🏆 **Credits**

Built with modern React patterns, TypeScript, and industry best practices to provide a world-class document management experience for KAA SaaS users.
