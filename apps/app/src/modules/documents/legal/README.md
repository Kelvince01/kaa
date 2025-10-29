# 📜 Legal Documents Module

A comprehensive legal document management system for KAA SaaS, providing document generation, signing, verification, and management for the Kenyan rental market.

## 🎯 Overview

The Legal Documents Module enables landlords, tenants, and property managers to generate, sign, and manage legally binding documents such as lease agreements, termination notices, and other rental-related legal documents.

## 🚀 Features

### Document Generation
- ✅ **Template-based generation** - Generate documents from pre-configured templates
- ✅ **Dynamic field validation** - Smart form validation based on template requirements
- ✅ **Multiple formats** - Support for PDF, HTML, and DOCX formats
- ✅ **Multi-language support** - English and Swahili language options
- ✅ **Digital signatures** - Enable cryptographic digital signatures
- ✅ **Watermarks** - Add custom watermarks to documents
- ✅ **Encryption** - Password-protect sensitive documents
- ✅ **Delivery options** - Email, SMS, and other delivery methods

### Document Management
- ✅ **List and filter** - View documents with advanced filtering
- ✅ **Status tracking** - Track document lifecycle status
- ✅ **Search** - Find documents quickly
- ✅ **Download** - Download documents in generated format
- ✅ **Archive** - Archive old documents
- ✅ **Access log** - Track all document access and actions

### Digital Signing
- ✅ **Multi-party signing** - Support for landlord, tenant, guarantor, witness, and agent signatures
- ✅ **Signature verification** - Cryptographic signature hashing
- ✅ **Signature tracking** - View all signatures with timestamps
- ✅ **Legal compliance** - Legally binding digital signatures

### Template Management
- ✅ **Template library** - Browse available document templates
- ✅ **Template filtering** - Filter by type, jurisdiction, and status
- ✅ **Template preview** - View template details before use
- ✅ **Usage tracking** - Track template usage statistics

## 📦 Installation

```typescript
// Import what you need
import {
  // Components
  DocumentGenerator,
  LegalDocumentList,
  LegalDocumentViewer,
  DocumentSigning,
  TemplateSelector,
  
  // Hooks
  useLegalDocuments,
  useLegalDocument,
  useGenerateDocument,
  useSignDocument,
  useTemplates,
  
  // Store
  useLegalDocumentStore,
  
  // Types
  ILegalDocument,
  ILegalDocumentTemplate,
  LegalDocumentFilter,
} from "@/modules/documents/legal";
```

## 🎨 Usage Examples

### Basic Document List

```typescript
import { LegalDocumentList } from "@/modules/documents/legal";

function DocumentsPage() {
  return (
    <LegalDocumentList
      propertyId="prop-123"
      showFilters={true}
    />
  );
}
```

### Generate Document

```typescript
import { DocumentGenerator } from "@/modules/documents/legal";

function GenerateDocumentPage() {
  return (
    <DocumentGenerator
      templateId="rental-agreement"
      propertyId="prop-123"
      tenantId="tenant-123"
      landlordId="landlord-123"
    />
  );
}
```

### Sign Document

```typescript
import { DocumentSigning } from "@/modules/documents/legal";

function SignDocumentPage() {
  return (
    <DocumentSigning
      documentId="doc-123"
    />
  );
}
```

### Template Selection

```typescript
import { TemplateSelector } from "@/modules/documents/legal";

function SelectTemplatePage() {
  const handleSelect = (template) => {
    console.log("Selected template:", template);
  };
  
  return (
    <TemplateSelector
      onSelect={handleSelect}
      showGenerateButton={true}
    />
  );
}
```

### Document Viewer

```typescript
import { LegalDocumentViewer } from "@/modules/documents/legal";

function ViewDocumentPage() {
  return (
    <LegalDocumentViewer
      documentId="doc-123"
    />
  );
}
```

## 🔧 API Hooks

### Document Queries

```typescript
// Get documents with filters
const { data, isLoading } = useLegalDocuments({
  type: "RENTAL_AGREEMENT",
  status: "ACTIVE",
  propertyId: "prop-123",
});

// Get single document
const { data: document } = useLegalDocument("doc-123");
```

### Document Mutations

```typescript
// Generate document
const { mutate: generateDocument } = useGenerateDocument();

generateDocument({
  templateId: "template-123",
  data: {
    landlordName: "John Doe",
    tenantName: "Jane Smith",
    monthlyRent: 25000,
  },
  format: "pdf",
  language: Language.ENGLISH,
});

// Sign document
const { mutate: signDocument } = useSignDocument();

signDocument({
  documentId: "doc-123",
  partyType: "tenant",
  signatureHash: "...",
});

// Download document
const { mutate: downloadDocument } = useDownloadDocument();

downloadDocument({
  documentId: "doc-123",
  filename: "rental-agreement.pdf",
});
```

### Template Queries

```typescript
// Get templates
const { data: templates } = useTemplates({
  type: "RENTAL_AGREEMENT",
  jurisdiction: "Kenya",
});

// Get single template
const { data: template } = useTemplate("template-123");
```

## 🗄️ State Management

```typescript
import { useLegalDocumentStore } from "@/modules/documents/legal";

function MyComponent() {
  const {
    currentDocument,
    setCurrentDocument,
    isGenerateModalOpen,
    setGenerateModalOpen,
    documentFilter,
    setDocumentFilter,
  } = useLegalDocumentStore();
  
  // Use store methods...
}
```

## 📋 Component Props

### DocumentGenerator

```typescript
interface DocumentGeneratorProps {
  open?: boolean;
  onClose?: () => void;
  templateId?: string;
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;
}
```

### LegalDocumentList

```typescript
interface LegalDocumentListProps {
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;
  showFilters?: boolean;
  onDocumentClick?: (documentId: string) => void;
}
```

### LegalDocumentViewer

```typescript
interface LegalDocumentViewerProps {
  open?: boolean;
  onClose?: () => void;
  documentId?: string;
  document?: ILegalDocument;
}
```

### DocumentSigning

```typescript
interface DocumentSigningProps {
  open?: boolean;
  onClose?: () => void;
  documentId?: string;
}
```

### TemplateSelector

```typescript
interface TemplateSelectorProps {
  onSelect?: (template: ILegalDocumentTemplate) => void;
  showGenerateButton?: boolean;
}
```

## 🔐 Security Features

- **Encryption** - Password-protect sensitive documents
- **Digital signatures** - Cryptographically secure signatures
- **Access logging** - Track all document access
- **Checksum verification** - Verify document authenticity
- **Audit trail** - Complete history of document actions

## 🌍 Internationalization

- **English** - Full support
- **Swahili** - Full support
- **Extensible** - Easy to add more languages

## 📊 Document Types

Supported document types:
- Rental Agreement
- Lease Agreement
- Termination Notice
- Eviction Notice
- Rent Receipt
- Payment Agreement
- Maintenance Request
- Property Inspection Report
- And more...

## ⚖️ Legal Compliance

- **Kenyan law compliant** - Templates comply with Kenyan rental laws
- **Digital signatures** - Legally binding electronic signatures
- **Audit trail** - Complete record keeping for legal purposes
- **Verification** - Document authenticity verification

## 🤝 Integration

### With Property Module

```typescript
import { LegalDocumentList } from "@/modules/documents/legal";

function PropertyDetailsPage({ property }) {
  return (
    <LegalDocumentList
      propertyId={property.id}
      showFilters={true}
    />
  );
}
```

### With Tenant Module

```typescript
import { LegalDocumentList } from "@/modules/documents/legal";

function TenantProfilePage({ tenant }) {
  return (
    <LegalDocumentList
      tenantId={tenant.id}
      showFilters={true}
    />
  );
}
```

## 🐛 Troubleshooting

### Document generation fails

Check that:
- Template ID is valid
- All required fields are provided
- User has necessary permissions

### Signature not working

Ensure:
- Document status is "PENDING_SIGNATURE"
- Party type is correct
- Signature data is valid

### Download fails

Verify:
- Document exists
- User has access
- Network connection is stable

## 📚 Related Modules

- `@/modules/documents` - General document management
- `@/modules/properties` - Property management
- `@/modules/tenants` - Tenant management
- `@/modules/contracts` - Contract management

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Document generation
- Digital signing
- Template management
- Document viewer
- Full CRUD operations

## 📝 License

Part of KAA SaaS platform - All rights reserved

