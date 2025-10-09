# Legal Document Service Updates

## Summary
Updated the `legal-document.service.ts` to use Mongoose models instead of in-memory Maps for persistent storage.

## Changes Made

### 1. Import Updates
- **Added**: Mongoose model imports (`DocumentTemplate`, `GeneratedDocument`)
- **Separated**: Type imports from model imports for clarity
- **Changed**: `IDocumentTemplate` → `DocumentTemplate` (type)
- **Changed**: `IGeneratedDocument` → `GeneratedDocument` (type)

### 2. Class Structure
- **Removed**: `private readonly templates: Map<string, DocumentTemplate>` 
- Templates are now stored in MongoDB instead of memory

### 3. Template Management

#### `loadTemplates()`
- Now checks if templates exist in database before creating defaults
- Uses `DocumentTemplateModel.create()` to persist templates
- Still caches templates in Redis for performance

#### `getTemplate(templateId: string)`
- Checks Redis cache first
- Falls back to MongoDB query using `DocumentTemplateModel.findOne()`
- Caches result in Redis for future requests

#### `getTemplates(filters?)`
- Now queries MongoDB with filters instead of filtering in-memory array
- Returns lean documents for better performance

#### New Methods Added:
- `createTemplate()` - Create new template in database
- `updateTemplate()` - Update existing template
- `deleteTemplate()` - Remove template from database

### 4. Document Management

#### `generateDocument()`
- Creates document using `GeneratedDocumentModel.create()`
- Includes additional tracking fields (propertyId, tenantId, landlordId)
- Returns lean document object

#### `getDocument(documentId: string)`
- Checks Redis cache first
- Falls back to MongoDB query
- Caches result for future requests

#### New Methods Added:
- `getDocuments(filters?)` - Query documents with various filters
- `updateDocumentStatus()` - Update document status
- `signDocument()` - Record party signatures
- `archiveDocument()` - Archive documents
- `trackDocumentAccess()` - Track views and downloads

### 5. Type Safety
All method signatures now use proper TypeScript types:
- `DocumentTemplate` for template objects
- `GeneratedDocument` for generated document objects
- Separate imports for types vs models

## Benefits

1. **Persistence**: Documents and templates survive server restarts
2. **Scalability**: Can handle large numbers of documents efficiently
3. **Querying**: Rich query capabilities with MongoDB indexes
4. **Tracking**: Built-in tracking for views, downloads, signatures
5. **Caching**: Redis caching layer for performance
6. **Type Safety**: Clear separation between types and models

## Database Collections

### `document_templates`
- Stores reusable legal document templates
- Indexed on: id, type, category, status, jurisdiction, language

### `generated_documents`
- Stores generated legal documents
- Indexed on: id, templateId, type, status, generatedBy, propertyId, tenantId, landlordId
- Includes text search on title and fileName

## API Usage Examples

```typescript
// Get a template
const template = await legalDocService.getTemplate('residential-tenancy-kenya-v1');

// Generate a document
const document = await legalDocService.generateDocument({
  templateId: 'residential-tenancy-kenya-v1',
  data: { /* template data */ },
  options: { /* generation options */ },
  requesterId: 'user-123',
  propertyId: 'prop-456',
  tenantId: 'tenant-789'
});

// Get documents by property
const propertyDocs = await legalDocService.getDocuments({
  propertyId: 'prop-456',
  status: LegalDocumentStatus.SIGNED
});

// Sign a document
await legalDocService.signDocument('doc-123', 'tenant', {
  signedAt: new Date(),
  signatureHash: 'hash-value'
});

// Track access
await legalDocService.trackDocumentAccess('doc-123', 'view');
```

## Migration Notes

If you have existing data in Redis or memory:
1. The service will automatically create default templates on first run
2. Existing cached data will remain in Redis but won't be persisted
3. New documents will be saved to MongoDB going forward
4. Consider running a migration script to move any critical cached data to MongoDB
