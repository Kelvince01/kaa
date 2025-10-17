# Migration Guide: Legal Document Service

## Overview

This guide helps you migrate from the old legal document service to the production-ready enhanced version.

## What's Changed?

### Import Path
```typescript
// Old (still works but deprecated)
import legalDocService from './legal-document.service';

// New (recommended)
import { legalDocumentService } from '@kaa/services';
// or
import legalDocumentService from '@kaa/services/legal-document.service.enhanced';
```

### API Compatibility

✅ **Good News**: The enhanced service is 100% backward compatible!

All existing methods work exactly the same:
- `generateDocument()`
- `getTemplate()`
- `getTemplates()`
- `getDocument()`
- `getDocuments()`

### New Features Available

The enhanced service adds these new capabilities without breaking existing code:

1. **Automatic Cloud Storage**: Documents are automatically uploaded to Vercel Blob
2. **Real Encryption**: Use `encryption: true` in options for AES-256-GCM encryption
3. **Real Delivery**: Email/SMS/WhatsApp actually send now
4. **Document Verification**: New `verifyDocument()` method
5. **Better Tracking**: `trackDocumentAccess()` for views/downloads
6. **Document Signing**: `signDocument()` for party signatures
7. **Archival**: `archiveDocument()` for document lifecycle
8. **Deletion**: `deleteDocument()` with cloud cleanup

## Step-by-Step Migration

### Step 1: Update Imports (Optional but Recommended)

```typescript
// In your controllers/services
- import legalDocService from '@kaa/services/legal-document.service';
+ import { legalDocumentService } from '@kaa/services';
```

### Step 2: No Code Changes Required!

Your existing code will work as-is:

```typescript
// This code works with both old and new service
const document = await legalDocumentService.generateDocument({
  templateId: 'residential-tenancy-kenya-v1',
  data: { /* ... */ },
  options: { /* ... */ },
  requesterId: userId
});
```

### Step 3: Enable New Features (Optional)

Take advantage of new features by updating your options:

```typescript
const document = await legalDocumentService.generateDocument({
  templateId: 'residential-tenancy-kenya-v1',
  data: {
    landlordEmail: 'landlord@example.com', // Now actually sends email!
    tenantPhone: '+254712345678', // Now actually sends SMS!
    // ... other data
  },
  options: {
    format: 'pdf',
    language: Language.BILINGUAL,
    digitalSignature: true, // Real cryptographic signature
    encryption: true, // Real AES-256-GCM encryption
    password: 'secure-password', // For encrypted documents
    watermark: 'CONFIDENTIAL',
    delivery: [
      DeliveryMethod.EMAIL, // Actually sends email now!
      DeliveryMethod.SMS, // Actually sends SMS now!
      DeliveryMethod.WHATSAPP // Actually sends WhatsApp now!
    ]
  },
  requesterId: userId,
  propertyId: propertyId, // Now tracked in database
  tenantId: tenantId, // Now tracked in database
  landlordId: landlordId // Now tracked in database
});

// Document now has cloud URLs
console.log(document.filePath); // Vercel Blob URL
console.log(document.metadata.cdnUrl); // CDN URL
```

### Step 4: Add Document Verification (New Feature)

```typescript
// Add verification endpoint
app.get('/api/v1/legal-documents/verify/:documentId', async (req, res) => {
  const { documentId } = req.params;
  const { checksum } = req.query;

  const result = await legalDocumentService.verifyDocument(documentId, checksum);

  res.json(result);
});
```

### Step 5: Track Document Access (New Feature)

```typescript
// When user views document
app.get('/api/v1/legal-documents/:documentId', async (req, res) => {
  const { documentId } = req.params;

  // Track the view
  await legalDocumentService.trackDocumentAccess(documentId, 'view');

  const document = await legalDocumentService.getDocument(documentId);
  res.json(document);
});

// When user downloads document
app.get('/api/v1/legal-documents/:documentId/download', async (req, res) => {
  const { documentId } = req.params;

  // Track the download
  await legalDocumentService.trackDocumentAccess(documentId, 'download');

  const document = await legalDocumentService.getDocument(documentId);
  // ... send file
});
```

### Step 6: Implement Document Signing (New Feature)

```typescript
// When tenant signs document
app.post('/api/v1/legal-documents/:documentId/sign', async (req, res) => {
  const { documentId } = req.params;
  const { partyType, signatureHash } = req.body;

  const document = await legalDocumentService.signDocument(
    documentId,
    partyType, // 'tenant', 'landlord', etc.
    {
      signedAt: new Date(),
      signatureHash
    }
  );

  res.json(document);
});
```

## Environment Variables

Add these to your `.env` file:

```env
# Cloud Storage (already configured if using Vercel)
USE_CLOUD_STORAGE=true

# API Base URL (for QR code verification)
API_BASE_URL=https://your-domain.com

# Email Service (if not already configured)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Kaa Rentals

# SMS Service (if not already configured)
AFRICASTALKING_API_KEY=your-api-key
AFRICASTALKING_USERNAME=your-username

# WhatsApp Service (if not already configured)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

## Testing Migration

### 1. Test Basic Generation

```typescript
const testDoc = await legalDocumentService.generateDocument({
  templateId: 'residential-tenancy-kenya-v1',
  data: {
    landlordName: 'Test Landlord',
    landlordId: '12345678',
    landlordPhone: '+254712345678',
    tenantName: 'Test Tenant',
    tenantId: '87654321',
    tenantPhone: '+254787654321',
    propertyAddress: 'Test Address',
    county: 'Nairobi',
    rentAmount: '50000',
    depositAmount: '100000',
    startDate: '2025-01-01',
    duration: '12',
    rentDueDate: '5'
  },
  options: {
    format: 'pdf',
    language: Language.ENGLISH,
    digitalSignature: false,
    delivery: []
  },
  requesterId: 'test-user'
});

console.log('✅ Document generated:', testDoc.id);
console.log('✅ Cloud URL:', testDoc.filePath);
```

### 2. Test Verification

```typescript
const verification = await legalDocumentService.verifyDocument(
  testDoc.id,
  testDoc.checksum
);

console.log('✅ Verification:', verification.valid ? 'PASSED' : 'FAILED');
```

### 3. Test Delivery (Optional)

```typescript
const deliveryDoc = await legalDocumentService.generateDocument({
  // ... same data as above
  data: {
    // ... other fields
    tenantEmail: 'test@example.com', // Use real email for testing
  },
  options: {
    format: 'pdf',
    language: Language.ENGLISH,
    delivery: [DeliveryMethod.EMAIL] // Test email delivery
  },
  requesterId: 'test-user'
});

console.log('✅ Document delivered via email');
```

## Rollback Plan

If you need to rollback:

1. The old service file still exists at `legal-document.service.ts`
2. Simply change imports back:
```typescript
import legalDocService from './legal-document.service';
```

3. No database changes needed - both services use the same models

## Common Issues

### Issue: "Module not found"
**Solution**: Make sure you've rebuilt the packages:
```bash
bun install
bun run build
```

### Issue: "Cloud storage not working"
**Solution**: Check environment variables:
```bash
# Verify Vercel Blob is configured
echo $BLOB_READ_WRITE_TOKEN
```

### Issue: "Delivery not working"
**Solution**: Check service configurations:
- Email: Verify Resend API key
- SMS: Verify Africa's Talking credentials
- WhatsApp: Verify Twilio credentials

### Issue: "Documents not found"
**Solution**: Check MongoDB connection and ensure documents collection exists

## Benefits of Migration

1. ✅ **Scalability**: Cloud storage handles unlimited documents
2. ✅ **Performance**: CDN delivery for fast global access
3. ✅ **Security**: Real encryption and digital signatures
4. ✅ **Reliability**: Automatic delivery with retry logic
5. ✅ **Tracking**: Complete audit trail of document access
6. ✅ **Compliance**: Better compliance with data protection laws
7. ✅ **Monitoring**: Structured logging for better debugging
8. ✅ **Integration**: Works with existing file service

## Timeline

- **Week 1**: Test in development environment
- **Week 2**: Deploy to staging and test all features
- **Week 3**: Monitor staging for issues
- **Week 4**: Deploy to production with gradual rollout

## Support

If you encounter issues:

1. Check the logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with a simple document generation first
4. Check cloud storage dashboard for upload issues
5. Verify email/SMS/WhatsApp service credentials

## Questions?

Contact the development team or check:
- `LEGAL_DOCUMENT_SERVICE_PRODUCTION_READY.md` for detailed documentation
- `legal-document.service.enhanced.ts` for implementation details
- Existing service tests for usage examples
