# Legal Documents API

Complete API for generating, managing, and automating legal documents for the Kenyan rental market.

## Features

- ✅ Generate legal documents from templates
- ✅ Multiple formats (PDF, HTML, DOCX)
- ✅ Bilingual support (English & Swahili)
- ✅ Digital signatures
- ✅ Document encryption
- ✅ Multi-channel delivery (Email, SMS, WhatsApp)
- ✅ Document verification
- ✅ Document signing workflow
- ✅ Access tracking
- ✅ Template management

## Endpoints

### Documents

#### Generate Document
```http
POST /api/legal-documents/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "templateId": "residential-tenancy-kenya-v1",
  "data": {
    "landlordName": "John Doe",
    "landlordId": "12345678",
    "landlordPhone": "+254712345678",
    "landlordEmail": "landlord@example.com",
    "tenantName": "Jane Smith",
    "tenantId": "87654321",
    "tenantPhone": "+254787654321",
    "tenantEmail": "tenant@example.com",
    "propertyAddress": "123 Main Street, Apartment 4B",
    "county": "Nairobi",
    "rentAmount": "50000",
    "depositAmount": "100000",
    "startDate": "2025-01-01",
    "duration": "12",
    "rentDueDate": "5"
  },
  "format": "pdf",
  "language": "en-sw",
  "digitalSignature": true,
  "watermark": "CONFIDENTIAL",
  "delivery": ["email", "sms"]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Document generated successfully",
  "document": {
    "id": "doc-uuid",
    "templateId": "residential-tenancy-kenya-v1",
    "type": "tenancy_agreement",
    "title": "Residential Tenancy Agreement",
    "fileName": "doc-uuid.pdf",
    "filePath": "https://blob.vercel-storage.com/...",
    "fileSize": 245678,
    "format": "pdf",
    "language": "en-sw",
    "checksum": "sha256-hash",
    "qrCode": "data:image/png;base64,...",
    "digitalSignature": "signature-hash",
    "status": "generated",
    "parties": [
      {
        "type": "landlord",
        "name": "John Doe",
        "signed": false
      },
      {
        "type": "tenant",
        "name": "Jane Smith",
        "signed": false
      }
    ],
    "createdAt": "2025-01-10T10:00:00Z"
  }
}
```

#### Get Document
```http
GET /api/legal-documents/:documentId
Authorization: Bearer <token>
```

#### List Documents
```http
GET /api/legal-documents?propertyId=prop-123&status=signed
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` - Filter by document type
- `status` - Filter by status
- `propertyId` - Filter by property
- `tenantId` - Filter by tenant
- `landlordId` - Filter by landlord
- `startDate` - Filter by start date
- `endDate` - Filter by end date

#### Verify Document
```http
GET /api/legal-documents/verify/:documentId?checksum=sha256-hash
```

**Response:**
```json
{
  "status": "success",
  "valid": true,
  "document": { ... }
}
```

#### Sign Document
```http
POST /api/legal-documents/:documentId/sign
Authorization: Bearer <token>
Content-Type: application/json

{
  "partyType": "tenant",
  "signatureHash": "signature-hash-from-frontend"
}
```

#### Update Document Status
```http
PATCH /api/legal-documents/:documentId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "executed"
}
```

#### Archive Document
```http
POST /api/legal-documents/:documentId/archive
Authorization: Bearer <token>
```

#### Delete Document
```http
DELETE /api/legal-documents/:documentId
Authorization: Bearer <token>
```

#### Track Download
```http
POST /api/legal-documents/:documentId/download
Authorization: Bearer <token>
```

### Templates

#### List Templates
```http
GET /api/legal-documents/templates?status=active&jurisdiction=kenya
Authorization: Bearer <token>
```

#### Get Template
```http
GET /api/legal-documents/templates/:templateId
Authorization: Bearer <token>
```

#### Create Template (Admin)
```http
POST /api/legal-documents/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "custom-template-v1",
  "name": "Custom Agreement",
  "type": "lease_agreement",
  "category": "contracts",
  "version": "1.0",
  "language": "en",
  "jurisdiction": "kenya",
  "status": "active",
  "fields": [ ... ],
  "content": "...",
  "metadata": { ... },
  "compliance": [ ... ]
}
```

#### Update Template (Admin)
```http
PATCH /api/legal-documents/templates/:templateId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active"
}
```

#### Delete Template (Admin)
```http
DELETE /api/legal-documents/templates/:templateId
Authorization: Bearer <token>
```

## Available Templates

### 1. Residential Tenancy Agreement
**ID:** `residential-tenancy-kenya-v1`

**Required Fields:**
- `landlordName`, `landlordId`, `landlordPhone`, `landlordEmail`
- `tenantName`, `tenantId`, `tenantPhone`, `tenantEmail`
- `propertyAddress`, `county`
- `rentAmount`, `depositAmount`
- `startDate`, `duration`, `rentDueDate`

### 2. Notice to Quit
**ID:** `notice-to-quit-kenya-v1`

**Required Fields:**
- `landlordName`, `tenantName`
- `propertyAddress`
- `reason`, `noticePeriod`
- `noticeDate`, `quitDate`

## Document Formats

### PDF
- Professional formatting
- Digital signatures
- QR codes for verification
- Watermarks
- Signature sections

### HTML
- Web-friendly format
- Responsive design
- Easy to view in browsers
- Printable

### DOCX
- Microsoft Word format
- Editable
- Professional formatting
- Compatible with Word, Google Docs, LibreOffice

## Languages

### English (`en`)
Full English document

### Swahili (`sw`)
Full Swahili document with comprehensive legal translations

### Bilingual (`en-sw`)
Both English and Swahili versions in one document

## Delivery Methods

### Email
Professional email with document link and details

### SMS
SMS notification with document link (via Africa's Talking)

### WhatsApp
WhatsApp message with document details (via Twilio)

### Download
Direct download only (no delivery)

## Document Status Flow

```
generated → signed → executed → archived
         ↓
      cancelled
         ↓
      expired
```

## Security Features

### Encryption
- AES-256-GCM encryption
- Password-protected documents
- Secure key derivation

### Digital Signatures
- Cryptographic signatures
- Tamper detection
- Non-repudiation

### Verification
- SHA-256 checksums
- QR code verification
- Public verification endpoint

### Access Control
- User-based permissions
- Role-based access (RBAC)
- Audit logging

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- Standard rate limits apply per user
- Higher limits for verified accounts
- Contact support for enterprise limits

## Examples

### Generate and Email Document
```bash
curl -X POST https://api.example.com/api/legal-documents/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "residential-tenancy-kenya-v1",
    "data": {
      "landlordName": "John Doe",
      "tenantName": "Jane Smith",
      ...
    },
    "format": "pdf",
    "language": "en",
    "delivery": ["email"]
  }'
```

### Verify Document
```bash
curl https://api.example.com/api/legal-documents/verify/doc-uuid?checksum=sha256-hash
```

### Sign Document
```bash
curl -X POST https://api.example.com/api/legal-documents/doc-uuid/sign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partyType": "tenant",
    "signatureHash": "signature-hash"
  }'
```

## Best Practices

1. **Always validate input data** before generating documents
2. **Use encryption** for sensitive documents
3. **Track document access** for audit trails
4. **Verify documents** when authenticity matters
5. **Handle delivery failures** gracefully
6. **Archive old documents** to keep database clean
7. **Use proper error handling** in production

## Support

For issues or questions:
- API Documentation: `/api/swagger`
- Service Documentation: `packages/services/LEGAL_DOCUMENT_SERVICE_PRODUCTION_READY.md`
- Migration Guide: `packages/services/MIGRATION_GUIDE.md`

## Changelog

### v1.0.0 (2025-01-10)
- Initial release
- Document generation (PDF, HTML, DOCX)
- Bilingual support (English & Swahili)
- Multi-channel delivery
- Document verification
- Digital signatures
- Template management
