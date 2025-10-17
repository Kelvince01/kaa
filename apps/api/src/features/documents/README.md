# Documents Management

This module handles document storage, versioning, and management for various document types including contracts, identification, and property-related documents.

## Features

### Document Management

- Upload, download, and manage documents
- Support for multiple file types
- Document versioning
- Metadata management
- Document organization with folders and tags

### Security & Access Control

- Role-based access control
- Document sharing and permissions
- Secure file storage
- Audit logging
- Digital signatures

### Processing

- Document conversion
- OCR (Optical Character Recognition)
- File compression
- Thumbnail generation
- Virus scanning

## Data Model

### Document

```typescript
{
  _id: ObjectId,
  name: string,                  // Original filename
  description?: string,          // Optional description
  filename: string,             // Stored filename
  path: string,                 // Storage path
  mimeType: string,             // MIME type
  size: number,                 // File size in bytes
  owner: ObjectId,              // User who uploaded the document
  type: 'contract' | 'id' | 'property' | 'other',
  status: 'pending' | 'verified' | 'rejected' | 'expired',
  metadata: {
    propertyId?: ObjectId,     // If related to a property
    bookingId?: ObjectId,      // If related to a booking
    userId?: ObjectId,         // If related to a user
    // Type-specific metadata
    expiryDate?: Date,
    verifiedBy?: ObjectId,
    verifiedAt?: Date,
    rejectionReason?: string,
    tags?: string[],
    customFields?: Record<string, any>
  },
  versions: [{
    version: number,
    filename: string,
    path: string,
    size: number,
    mimeType: string,
    uploadedBy: ObjectId,
    uploadedAt: Date,
    changes?: string,          // Description of changes
    signature?: {
      signer: ObjectId,
      signedAt: Date,
      signatureData: string,   // Encrypted signature data
      publicKey: string       // Public key for verification
    }
  }],
  accessControl: [{
    user: ObjectId,
    role: 'viewer' | 'editor' | 'admin',
    grantedBy: ObjectId,
    grantedAt: Date,
    expiresAt?: Date
  }],
  isPublic: boolean,
  isEncrypted: boolean,
  storageProvider: 'local' | 's3' | 'google-drive',
  storageMetadata: any,         // Provider-specific metadata
  auditLog: [{
    action: string,            // 'upload', 'download', 'update', 'delete', etc.
    performedBy: ObjectId,
    performedAt: Date,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  }],
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date             // For soft delete
}
```

## API Endpoints

### Documents

- `POST /documents` - Upload a new document
- `GET /documents` - List documents (with filters)
- `GET /documents/:id` - Get document details
- `GET /documents/:id/download` - Download document
- `GET /documents/:id/versions` - List document versions
- `GET /documents/:id/versions/:version` - Get specific version
- `PUT /documents/:id` - Update document metadata
- `DELETE /documents/:id` - Delete document (soft delete)
- `POST /documents/:id/restore` - Restore deleted document
- `POST /documents/:id/versions` - Upload new version
- `GET /documents/:id/versions/:version/download` - Download specific version

### Sharing & Permissions

- `POST /documents/:id/share` - Share document with user
- `GET /documents/:id/access` - List users with access
- `PUT /documents/:id/access/:userId` - Update access level
- `DELETE /documents/:id/access/:userId` - Revoke access
- `POST /documents/:id/request-access` - Request access

### Signatures

- `POST /documents/:id/request-signature` - Request signature
- `POST /documents/:id/sign` - Sign document
- `GET /documents/:id/signature-status` - Get signature status

## Usage Examples

### Upload a Document

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('type', 'contract');
formData.append('metadata[propertyId]', 'property123');
formData.append('metadata[expiryDate]', '2025-12-31');

const response = await fetch('/api/documents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { document } = await response.json();
```

### Share a Document

```typescript
const shareData = {
  userId: 'user456',
  role: 'viewer',
  message: 'Please review this document'
};

const response = await fetch('/api/documents/doc123/share', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(shareData)
});
```

## Error Handling

Common error codes:

- `DOCUMENT_NOT_FOUND`
- `INVALID_FILE_TYPE`
- `FILE_TOO_LARGE`
- `PERMISSION_DENIED`
- `SIGNATURE_REQUIRED`
- `DOCUMENT_EXPIRED`
- `STORAGE_QUOTA_EXCEEDED`
- `VERSION_CONFLICT`

## Security Considerations

- Validate file types and sizes
- Scan uploads for viruses
- Implement proper access controls
- Encrypt sensitive documents
- Use secure file storage
- Implement rate limiting
- Log all access attempts
- Set appropriate file permissions
- Handle file cleanup for failed uploads
- Implement secure file deletion

## Dependencies

- File storage service (e.g., AWS S3, Google Cloud Storage)
- File processing libraries (e.g., multer, sharp for images)
- PDF processing (e.g., pdf-lib, pdfkit)
- Virus scanning service
- Encryption libraries (e.g., crypto-js)
- Digital signature libraries
- OCR service (e.g., Tesseract.js)

## Best Practices

1. Use content-type validation
2. Implement file size limits
3. Use secure file naming
4. Implement proper error handling
5. Use streaming for large files
6. Implement proper cleanup jobs
7. Use CDN for file delivery
8. Implement proper backup strategy
9. Monitor storage usage
10. Regularly audit document access
