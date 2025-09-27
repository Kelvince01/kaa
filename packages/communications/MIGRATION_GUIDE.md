# Communications Package Migration Guide

This guide explains how to migrate from the existing fragmented communication system to the new unified communications package.

## Overview

The new `@kaa/communications` package provides a unified interface for all communication types (email, SMS, push notifications) with:

- **Unified API**: Single interface for all communication types
- **Provider Abstraction**: Pluggable provider system
- **Template Engine**: Consolidated template management
- **Queue Processing**: Unified background processing
- **Analytics**: Comprehensive tracking and reporting

## Migration Steps

### 1. Update Dependencies

Add the new communications package to your `package.json`:

```json
{
  "dependencies": {
    "@kaa/communications": "workspace:*"
  }
}
```

### 2. Update Imports

Replace old imports with the new unified imports:

**Before:**
```typescript
import { emailService } from "@kaa/email";
import { smsService } from "@kaa/services";
import { templateEngine } from "@kaa/utils";
```

**After:**
```typescript
import { communicationsService, templateService } from "@kaa/communications";
```

### 3. Update Email Sending

**Before:**
```typescript
import { emailService } from "@kaa/email";

const result = await emailService.sendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  template: "welcome",
  context: { userName: "John" },
});
```

**After:**
```typescript
import { communicationsService } from "@kaa/communications";

const result = await communicationsService.sendCommunication({
  type: "email",
  to: "user@example.com",
  templateId: "welcome-template-id",
  data: { userName: "John" },
});
```

### 4. Update SMS Sending

**Before:**
```typescript
import { smsService } from "@kaa/services";

const result = await smsService.sendSms({
  to: "+254700000000",
  message: "Hello World!",
  type: "notification",
});
```

**After:**
```typescript
import { communicationsService } from "@kaa/communications";

const result = await communicationsService.sendCommunication({
  type: "sms",
  to: "+254700000000",
  content: {
    body: "Hello World!",
  },
});
```

### 5. Update Template Usage

**Before:**
```typescript
import { templateEngine } from "@kaa/utils";

const result = await templateEngine.render({
  template: smsTemplate,
  data: { userName: "John" },
});
```

**After:**
```typescript
import { templateService } from "@kaa/communications";

const result = await templateService.render({
  templateId: "template-id",
  data: { userName: "John" },
});
```

### 6. Update Controllers

Replace existing communication controllers with the new unified controller:

**Before:**
```typescript
import { smsController } from "./features/comms/sms/sms.controller";

app.use(smsController);
```

**After:**
```typescript
import { commsController } from "./features/comms/comms.controller";

app.use(commsController);
```

### 7. Update Queue Processing

Replace existing queue imports:

**Before:**
```typescript
import smsQueue from "./queues/sms.queue";
import emailQueue from "./queues/email.queue";
```

**After:**
```typescript
import communicationsQueue from "@kaa/services";
```

### 8. Update Models

The new system uses unified models. Update your model imports:

**Before:**
```typescript
import { SmsMessage, SmsTemplate } from "@kaa/models";
```

**After:**
```typescript
import { Communication, Template } from "@kaa/models";
```

## API Changes

### New Unified Endpoints

All communication types now use the same API structure:

```
POST /api/v1/comms/send          # Send any type of communication
POST /api/v1/comms/bulk          # Send bulk communications
GET  /api/v1/comms/:id           # Get communication details
GET  /api/v1/comms               # List communications
GET  /api/v1/comms/analytics     # Get analytics
POST /api/v1/comms/webhook/:provider  # Webhook endpoints
```

### Request/Response Format Changes

**Old SMS API:**
```typescript
POST /api/v1/sms/send
{
  "to": "+254700000000",
  "message": "Hello",
  "templateId": "template-123"
}
```

**New Unified API:**
```typescript
POST /api/v1/comms/send
{
  "type": "sms",
  "to": "+254700000000",
  "templateId": "template-123",
  "data": { "message": "Hello" }
}
```

## Provider Configuration

Update provider configurations in your config files:

```typescript
// config/communications.ts
export const communicationsConfig = {
  providers: {
    resend: {
      name: "resend",
      type: "email",
      enabled: true,
      credentials: {
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.EMAIL_FROM,
        fromName: "Kaa",
      },
    },
    africastalking: {
      name: "africastalking",
      type: "sms",
      enabled: true,
      credentials: {
        apiKey: process.env.AFRICASTALKING_API_KEY,
        username: process.env.AFRICASTALKING_USERNAME,
        shortcode: process.env.AFRICASTALKING_SHORTCODE,
      },
    },
  },
  defaults: {
    email: "resend",
    sms: "africastalking",
  },
};
```

## Template Migration

### Convert MJML Email Templates

Existing MJML templates need to be converted to the new format:

**Old Format:**
```mjml
<mjml>
  <mj-body>
    <mj-text>Hello {{userName}}</mj-text>
  </mj-body>
</mjml>
```

**New Format:**
Create templates using the template API:
```typescript
await templateService.createTemplate({
  name: "welcome-email",
  category: "email",
  type: "welcome",
  engine: "mjml",
  content: `<mjml>...</mjml>`,
  variables: [
    {
      name: "userName",
      type: "string",
      required: true,
    },
  ],
});
```

### Convert SMS Templates

Existing SMS templates can be imported:

```typescript
await templateService.createTemplate({
  name: "welcome-sms",
  category: "sms",
  type: "welcome",
  engine: "handlebars",
  format: "sms",
  content: "Hello {{userName}}, welcome to Kaa!",
  variables: [
    {
      name: "userName",
      type: "string",
      required: true,
    },
  ],
});
```

## Database Migration

Run database migrations to create new collections:

```javascript
// Migration script
const mongoose = require('mongoose');

// Create new collections
const Communication = mongoose.model('Communication');
const BulkCommunication = mongoose.model('BulkCommunication');
const Template = mongoose.model('Template');

// Migrate existing data...
```

## Testing

Update your tests to use the new APIs:

```typescript
describe("Communications", () => {
  it("should send email", async () => {
    const result = await communicationsService.sendCommunication({
      type: "email",
      to: "test@example.com",
      content: { body: "Test email" },
    });

    expect(result.success).toBe(true);
  });
});
```

## Rollback Plan

If you need to rollback:

1. Revert code changes
2. Restore old controller imports
3. Keep both systems running temporarily
4. Gradually migrate traffic back

## Support

For migration assistance, contact the development team or refer to the package documentation.