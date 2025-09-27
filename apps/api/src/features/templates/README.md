# Templates Module

## Overview

The Templates module provides a flexible and powerful template management system for the KAA SaaS platform. It enables the creation, management, and rendering of dynamic templates for various purposes such as emails, documents, reports, and notifications.

## Features

### Template Management

- Create and edit templates
- Version control
- Template categories
- Template variables and placeholders
- Preview functionality
- Bulk operations

### Template Rendering

- Support for multiple template engines (Handlebars, EJS, Pug, etc.)
- Conditional logic
- Loops and iterations
- Partials and layouts
- Custom helpers and filters

### Integration

- API for template rendering
- Webhook support
- Event-driven template updates
- Multi-language support
- Preview in different contexts

## Data Models

### Template

```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  category: 'email' | 'document' | 'report' | 'notification' | 'other',
  type: string,
  subject: string,
  content: string,
  variables: Array<{
    name: string,
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object',
    required: boolean,
    defaultValue: any,
    description: string,
    validation: {
      pattern: string,
      min: number,
      max: number,
      options: any[]
    }
  }>,
  engine: 'handlebars' | 'ejs' | 'pug' | 'nunjucks',
  version: number,
  isActive: boolean,
  tags: string[],
  metadata: Record<string, any>,
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### TemplateRendering

```typescript
{
  _id: ObjectId,
  templateId: ObjectId,
  templateVersion: number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  input: Record<string, any>,
  output: {
    content: string,
    metadata: {
      renderTime: number,
      size: number,
      format: 'html' | 'pdf' | 'text' | 'docx' | 'xlsx'
    }
  },
  error: {
    code: string,
    message: string,
    stack: string
  },
  metadata: {
    userId: ObjectId,
    requestId: string,
    ipAddress: string,
    userAgent: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Templates

- `GET /api/templating` - List templates
- `POST /api/templating` - Create template
- `GET /api/templating/:id` - Get template
- `PUT /api/templating/:id` - Update template
- `DELETE /api/templating/:id` - Delete template
- `POST /api/templating/:id/duplicate` - Duplicate template
- `GET /api/templating/categories` - List categories
- `GET /api/templating/types` - List template types

### Rendering

- `POST /api/templating/render` - Render template
- `POST /api/templating/:id/render` - Render specific template
- `POST /api/templating/batch-render` - Render multiple templates
- `GET /api/templating/renders` - List renders
- `GET /api/templating/renders/:id` - Get render details

### Preview

- `POST /api/templating/preview` - Preview template
- `GET /api/templating/:id/preview` - Preview template with sample data
- `POST /api/templating/:id/test` - Send test email
- `POST /api/templating/:id/sms-preview` - Preview SMS template with metadata

### File Management

- `POST /api/templating/import` - Import templates from files
- `POST /api/templating/export` - Export templates to files

### Cache Management

- `GET /api/templating/meta/cache` - Get cache statistics
- `DELETE /api/templating/meta/cache` - Clear template cache

### Analytics

- `GET /api/templating/:id/usage` - Get template usage statistics

## New Features

### SMS Support

The templating system now includes comprehensive SMS support with:

- SMS-specific metadata (segments, encoding, cost calculation)
- SMS-optimized categories (welcome, payment, reminder, verification, maintenance, marketing)
- SMS preview with segment calculation and cost estimation
- GSM_7BIT and UCS2 encoding support

### File Import/Export

- Import templates from filesystem (.hbs, .ejs, .pug files)
- Export templates to various formats (JSON, .hbs, .ejs, .pug)
- Bulk operations for template management
- Version control integration support

### Enhanced Cache Management

- Real-time cache statistics
- Manual cache clearing
- Memory usage monitoring
- Performance optimization tools

### Usage Tracking

- Template usage analytics
- Usage history tracking
- Performance metrics
- User activity monitoring

## Usage Examples

### Create a Template

```typescript
const template = {
  name: 'welcome-email',
  description: 'Welcome email for new users',
  category: 'email',
  type: 'welcome',
  subject: 'Welcome to {{appName}}, {{user.firstName}}!',
  content: `
    <h1>Welcome to {{appName}}, {{user.firstName}}!</h1>
    <p>Thank you for signing up on {{signupDate}}.</p>
    {{#if user.company}}
      <p>We see you're from {{user.company}}.</p>
    {{/if}}
    <p>Start exploring now: <a href="{{appUrl}}">{{appUrl}}</a></p>
  `,
  variables: [
    {
      name: 'user',
      type: 'object',
      required: true,
      properties: {
        firstName: { type: 'string', required: true },
        email: { type: 'string', format: 'email', required: true },
        company: { type: 'string' }
      }
    },
    {
      name: 'appName',
      type: 'string',
      required: true,
      defaultValue: 'Our App'
    },
    {
      name: 'signupDate',
      type: 'date',
      required: true
    },
    {
      name: 'appUrl',
      type: 'string',
      format: 'url',
      required: true
    }
  ],
  engine: 'handlebars',
  tags: ['email', 'welcome', 'onboarding']
};

const response = await fetch('/api/templates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(template)
});

const createdTemplate = await response.json();
```

### Render a Template

```typescript
const renderData = {
  templateId: 'template_123',
  data: {
    user: {
      firstName: 'John',
      email: 'john@example.com',
      company: 'Acme Inc.'
    },
    appName: 'KAA SaaS',
    signupDate: new Date().toISOString(),
    appUrl: 'https://app.kaa-saas.com'
  },
  options: {
    format: 'html',
    theme: 'light',
    language: 'en'
  }
};

const response = await fetch('/api/templates/render', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(renderData)
});

const result = await response.json();
console.log(result.renderedContent);
```

### SMS Template with Metadata

```typescript
const smsTemplate = {
  name: 'payment-reminder-sms',
  description: 'SMS payment reminder',
  category: 'payment',
  type: 'reminder',
  subject: '', // No subject for SMS
  content: 'Hi {{tenantName}}, your rent payment of {{formatCurrency amount}} for unit {{unitNumber}} is due on {{formatDate dueDate}}.',
  variables: [
    {
      name: 'tenantName',
      type: 'string',
      required: true,
      description: 'Tenant name'
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      description: 'Payment amount'
    },
    {
      name: 'unitNumber',
      type: 'string',
      required: true,
      description: 'Unit number'
    },
    {
      name: 'dueDate',
      type: 'date',
      required: true,
      description: 'Due date'
    }
  ],
  engine: 'handlebars',
  smsMetadata: {
    maxLength: 160,
    encoding: 'GSM_7BIT'
  },
  tags: ['sms', 'payment', 'reminder']
};

const response = await fetch('/api/templating', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(smsTemplate)
});
```

### SMS Preview with Metadata

```typescript
const previewData = {
  sampleData: {
    tenantName: 'John Doe',
    amount: 25000,
    unitNumber: 'A101',
    dueDate: '2024-01-15'
  }
};

const response = await fetch('/api/templating/template-id/sms-preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(previewData)
});

const result = await response.json();
console.log({
  rendered: result.data.rendered,
  segments: result.data.segments,
  length: result.data.length,
  cost: result.data.cost,
  encoding: result.data.encoding
});
```

### Import Templates from Files

```typescript
const importRequest = {
  category: 'welcome',
  overwrite: false,
  directory: '/path/to/templates'
};

const response = await fetch('/api/templating/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(importRequest)
});

const result = await response.json();
console.log(`Imported ${result.data.success} templates, ${result.data.failed} failed`);
```

### Export Templates to Files

```typescript
const exportRequest = {
  templateIds: ['template1', 'template2'],
  category: 'email',
  format: 'json'
};

const response = await fetch('/api/templating/export', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(exportRequest)
});

const result = await response.json();
console.log(`Exported ${result.data.exportedCount} templates to ${result.data.filePath}`);
```

### Cache Management

```typescript
// Get cache statistics
const statsResponse = await fetch('/api/templating/meta/cache', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const stats = await statsResponse.json();
console.log(`Cache size: ${stats.data.size}, Memory usage: ${stats.data.memoryUsage}`);

// Clear cache
const clearResponse = await fetch('/api/templating/meta/cache', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Usage Analytics

```typescript
const usageResponse = await fetch('/api/templating/template-id/usage', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const usage = await usageResponse.json();
console.log({
  usageCount: usage.data.usageCount,
  lastUsedAt: usage.data.lastUsedAt,
  recentActivity: usage.data.usageHistory.slice(-5)
});
```

## Template Engines

### Handlebars

- Simple and intuitive syntax
- Helpers support
- Partials
- Block helpers
- Custom helpers

### EJS (Embedded JavaScript)

- JavaScript in templates
- Includes
- Layouts
- Filters

### Pug (formerly Jade)

- Clean, whitespace-sensitive syntax
- Mixins
- Template inheritance
- Conditionals and loops

## Security Considerations

- Input sanitization
- Sandboxed template execution
- Rate limiting
- Access control
- Audit logging
- XSS protection

## Performance Optimization

- Template compilation caching
- Pre-compilation
- CDN integration
- Minification
- Gzip compression

## Dependencies

- mjml
- handlebars / ejs / pug
- lodash (utilities)
- luxon (date handling)
- xss (XSS protection)
- Elysia Type (t) (validation)

## Support

For support, please contact:

- Email: <templates-support@kaa-saas.com>
- Phone: +254 700 000000

## License

Proprietary - All rights reserved © 2025 KAA SaaS Solutions
