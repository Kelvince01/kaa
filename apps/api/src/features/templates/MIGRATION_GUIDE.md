# Migration Guide: From `features/templates` to `features/templating`

## Overview

This guide helps you migrate from the older `features/templates` system to the enhanced `features/templating` system. The new system provides better SMS support, file management, cache optimization, and usage tracking.

## Key Differences

### 1. API Endpoints

- **Old**: `/api/templates/*`
- **New**: `/api/templating/*`

### 2. SMS Support

- **Old**: Basic SMS templates with limited metadata
- **New**: Full SMS support with segments, encoding, cost calculation

### 3. Template Categories

- **Old**: Limited categories
- **New**: Extended categories including SMS-specific ones

### 4. File Management

- **Old**: No file import/export
- **New**: Full file import/export capabilities

## Migration Steps

### Step 1: Update API Endpoints

```typescript
// Old
const response = await fetch('/api/templates', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
});

// New
const response = await fetch('/api/templating', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Step 2: Update Template Creation

```typescript
// Old SMS template
const oldTemplate = {
  name: 'payment-reminder',
  description: 'Payment reminder SMS',
  category: 'payment',
  content: 'Hi {{tenantName}}, your payment is due.',
  variables: [
    {
      name: 'tenantName',
      type: 'string',
      required: true
    }
  ],
  maxLength: 160,
  encoding: 'GSM_7BIT'
};

// New SMS template with enhanced metadata
const newTemplate = {
  name: 'payment-reminder',
  description: 'Payment reminder SMS',
  category: 'payment', // Now supports SMS-specific categories
  type: 'reminder',
  subject: '', // No subject for SMS
  content: 'Hi {{tenantName}}, your payment is due.',
  variables: [
    {
      name: 'tenantName',
      type: 'string',
      required: true,
      description: 'Tenant name',
      validation: {
        min: 1,
        max: 100
      }
    }
  ],
  engine: 'handlebars',
  smsMetadata: {
    maxLength: 160,
    encoding: 'GSM_7BIT'
  },
  tags: ['sms', 'payment', 'reminder']
};
```

## New Features Available

### 1. SMS-Specific Helpers

```handlebars
{{smsLimit text 160}}        <!-- Limit text to SMS length -->
{{smsSegment text "GSM_7BIT"}} <!-- Calculate SMS segments -->
{{smsCost text 0.01}}        <!-- Calculate SMS cost -->
{{formatPhone phone "local"}} <!-- Format phone numbers -->
{{shortUrl url 20}}          <!-- Shorten URLs for SMS -->
```

### 2. File Import/Export

```typescript
// Import templates from files
await fetch('/api/templating/import', {
  method: 'POST',
  body: JSON.stringify({
    category: 'sms',
    overwrite: false,
    directory: '/path/to/templates'
  })
});

// Export templates to files
await fetch('/api/templating/export', {
  method: 'POST',
  body: JSON.stringify({
    templateIds: ['id1', 'id2'],
    format: 'json'
  })
});
```

### 3. Enhanced Categories

- `welcome` - Welcome messages
- `payment` - Payment-related messages
- `reminder` - Reminder messages
- `verification` - Verification codes
- `maintenance` - Maintenance notifications
- `marketing` - Marketing messages
- `notification` - General notifications
- `other` - Other messages

### 4. Usage Tracking

- Automatic usage counting
- Usage history tracking
- Performance analytics
- User activity monitoring

## Conclusion

The new `templating` system provides significant improvements over the old `templates` system:

- **Better SMS support** with metadata and cost calculation
- **File management** for bulk operations
- **Enhanced caching** for better performance
- **Usage tracking** for analytics
- **More flexible categories** and validation
- **Better error handling** and logging

The migration process is straightforward and the new system is backward compatible for most use cases.
