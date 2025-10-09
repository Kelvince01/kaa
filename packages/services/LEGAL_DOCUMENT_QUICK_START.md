# Legal Document Service - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Import the Service

```typescript
import { legalDocumentService } from '@kaa/services';
```

### 2. Generate Your First Document

```typescript
const document = await legalDocumentService.generateDocument({
  templateId: 'residential-tenancy-kenya-v1',
  data: {
    landlordName: 'John Doe',
    landlordId: '12345678',
    landlordPhone: '+254712345678',
    landlordEmail: 'landlord@example.com',
    tenantName: 'Jane Smith',
    tenantId: '87654321',
    tenantPhone: '+254787654321',
    tenantEmail: 'tenant@example.com',
    propertyAddress: '123 Main Street, Apartment 4B',
    county: 'Nairobi',
    rentAmount: '50000',
    depositAmount: '100000',
    startDate: '2025-01-01',
    duration: '12',
    rentDueDate: '5'
  },
  options: {
    format: 'pdf',
    language: 'en',
    digitalSignature: true,
    delivery: ['email', 'sms']
  },
  requesterId: 'user-123'
});

console.log('Document generated:', document.id);
console.log('Download URL:', document.filePath);
```

### 3. That's It! 🎉

Your document is:
- ✅ Generated as PDF
- ✅ Uploaded to cloud storage
- ✅ Delivered via email and SMS
- ✅ Digitally signed
- ✅ Tracked in database

## Common Use Cases

### Generate and Email Only

```typescript
const document = await legalDocumentService.generateDocument({
  templateId: 'residential-tenancy-kenya-v1',
  data: { /* ... */ },
  options: {
    format: 'pdf',
    language: 'en',
    delivery: ['email'] // Email only
  },
  requesterId: userId
});
```

### Generate with Encryption

```typescript
const document = await legalDocumentService.generateDocument({
  templateId: 'residential-tenancy-kenya-v1',
  data: { /* ... */ },
  options: {
    format: 'pdf',
    language: 'en',
    encryption: true,
    password: 'secure-password-123'
  },
  requesterId: userId
});
```

### Generate Bilingual Document

```typescript
const document = await legalDocumentService.generateDocument({
  templateId: 'residential-tenancy-kenya-v1',
  data: { /* ... */ },
  options: {
    format: 'pdf',
    language: 'en-sw', // Bilingual (English & Swahili)
    delivery: []
  },
  requesterId: userId
});
```

### Verify Document

```typescript
const result = await legalDocumentService.verifyDocument(
  documentId,
  checksum
);

if (result.valid) {
  console.log('Document is authentic!');
} else {
  console.log('Document verification failed:', result.error);
}
```

### Track Document Access

```typescript
// When user views document
await legalDocumentService.trackDocumentAccess(documentId, 'view');

// When user downloads document
await legalDocumentService.trackDocumentAccess(documentId, 'download');
```

### Sign Document

```typescript
await legalDocumentService.signDocument(
  documentId,
  'tenant', // or 'landlord', 'guarantor', 'witness', 'agent'
  {
    signedAt: new Date(),
    signatureHash: 'signature-hash-from-frontend'
  }
);
```

## Available Templates

### 1. Residential Tenancy Agreement
```typescript
templateId: 'residential-tenancy-kenya-v1'
```
**Required Fields:**
- landlordName, landlordId, landlordPhone
- tenantName, tenantId, tenantPhone
- propertyAddress, county
- rentAmount, depositAmount
- startDate, duration, rentDueDate

### 2. Notice to Quit
```typescript
templateId: 'notice-to-quit-kenya-v1'
```
**Required Fields:**
- landlordName, tenantName
- propertyAddress
- reason, noticePeriod
- noticeDate, quitDate

## Document Formats

- `pdf` - PDF document (recommended)
- `html` - HTML document
- `docx` - Word document

## Languages

- `en` - English only
- `sw` - Swahili only
- `en-sw` - Bilingual (English & Swahili)

## Delivery Methods

- `email` - Send via email
- `sms` - Send via SMS
- `whatsapp` - Send via WhatsApp
- `download` - Download only (no delivery)

## Quick API Endpoints

### Generate Document
```typescript
POST /api/v1/legal-documents/generate
{
  "templateId": "residential-tenancy-kenya-v1",
  "data": { /* ... */ },
  "options": { /* ... */ }
}
```

### Get Document
```typescript
GET /api/v1/legal-documents/:documentId
```

### Verify Document
```typescript
GET /api/v1/legal-documents/verify/:documentId?checksum=xxx
```

### Sign Document
```typescript
POST /api/v1/legal-documents/:documentId/sign
{
  "partyType": "tenant",
  "signatureHash": "xxx"
}
```

### List Documents
```typescript
GET /api/v1/legal-documents?propertyId=xxx&status=signed
```

## Environment Setup

Add to your `.env`:

```env
# Required
API_BASE_URL=https://your-domain.com
USE_CLOUD_STORAGE=true

# Email (Resend)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Kaa Rentals

# SMS (Africa's Talking)
AFRICASTALKING_API_KEY=your-key
AFRICASTALKING_USERNAME=your-username

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

## Error Handling

```typescript
try {
  const document = await legalDocumentService.generateDocument({...});
} catch (error) {
  if (error.message.includes('Template')) {
    // Template not found
  } else if (error.message.includes('Required field')) {
    // Missing required field
  } else if (error.message.includes('Invalid')) {
    // Validation error
  } else {
    // Other error
  }
}
```

## Events

Listen to events for monitoring:

```typescript
legalDocumentService.on('document.generated', (data) => {
  console.log('Document generated:', data.document.id);
});

legalDocumentService.on('document.generation.failed', (data) => {
  console.error('Generation failed:', data.error);
});

legalDocumentService.on('document.delivery', (data) => {
  console.log(`Delivered via ${data.method} to ${data.recipient}`);
});
```

## Tips & Best Practices

1. **Always validate input data** before calling generateDocument()
2. **Use encryption** for sensitive documents
3. **Track document access** for audit trails
4. **Cache frequently used templates** (done automatically)
5. **Handle delivery failures** gracefully
6. **Verify documents** when authenticity matters
7. **Archive old documents** to keep database clean
8. **Use proper error handling** for production code

## Need Help?

- 📖 Full Documentation: `LEGAL_DOCUMENT_SERVICE_PRODUCTION_READY.md`
- 🔄 Migration Guide: `MIGRATION_GUIDE.md`
- 📊 Summary: `LEGAL_DOCUMENT_SERVICE_SUMMARY.md`
- 💻 Source Code: `legal-document.service.enhanced.ts`

## Next Steps

1. ✅ Generate your first document
2. ✅ Test delivery channels
3. ✅ Implement verification endpoint
4. ✅ Add document signing
5. ✅ Set up monitoring
6. ✅ Deploy to production

Happy documenting! 🎉
