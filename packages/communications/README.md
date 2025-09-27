# @kaa/communications

Unified communication framework for email, SMS, push notifications, and other channels.

## Features

- **Unified API**: Single interface for all communication types (email, SMS, push)
- **Provider Abstraction**: Pluggable provider system (Resend, Africa's Talking, Mock)
- **Template Engine**: Consolidated template management with Handlebars/MJML support
- **Queue Processing**: Background processing with BullMQ and Redis
- **Advanced Analytics**: Comprehensive tracking, reporting, and performance metrics
- **Scheduling**: Schedule communications for future delivery
- **Bulk Operations**: Send communications to multiple recipients efficiently
- **Real-time Status**: Track delivery status and retry failed messages
- **Webhook Support**: Provider webhook handling for status updates
- **Template Management**: Full CRUD operations with preview and testing
- **Type Safety**: Full TypeScript support with runtime validation

## Installation

```bash
bun add @kaa/communications
```

## Quick Start

### Basic Usage

```typescript
import { communicationsService } from "@kaa/communications";

// Send an email
const emailResult = await communicationsService.sendCommunication({
  type: "email",
  to: "user@example.com",
  templateId: "welcome-email",
  data: { userName: "John" },
});

// Send an SMS
const smsResult = await communicationsService.sendCommunication({
  type: "sms",
  to: "+254700000000",
  content: {
    body: "Hello, welcome to our service!",
  },
});
```

### Using Templates

```typescript
import { templateService } from "@kaa/communications";

// Create a template
const template = await templateService.createTemplate({
  name: "welcome-email",
  description: "Welcome email for new users",
  category: "email",
  type: "welcome",
  subject: "Welcome to {{appName}}!",
  content: "<h1>Hello {{userName}}</h1><p>Welcome to {{appName}}!</p>",
  engine: "handlebars",
  variables: [
    {
      name: "userName",
      type: "string",
      required: true,
      description: "User's name",
    },
    {
      name: "appName",
      type: "string",
      required: false,
      defaultValue: "Our App",
    },
  ],
});

// Render a template
const result = await templateService.render({
  templateId: template._id,
  data: { userName: "John", appName: "Kaa" },
});

console.log(result.content); // Rendered HTML
```

### Bulk Communications

```typescript
// Send bulk SMS
const bulkResult = await communicationsService.sendBulkCommunication({
  name: "Monthly Newsletter",
  type: "email",
  recipients: [
    { email: "user1@example.com", name: "User 1" },
    { email: "user2@example.com", name: "User 2" },
  ],
  templateId: "newsletter-template",
  data: { month: "December" },
});
```

## Configuration

### Provider Setup

```typescript
import { providerRegistry } from "@kaa/communications";

// Initialize providers
await providerRegistry.initializeProvider("resend", {
  name: "resend",
  type: "email",
  enabled: true,
  credentials: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: "noreply@yourapp.com",
    fromName: "Your App",
  },
});

await providerRegistry.initializeProvider("africastalking", {
  name: "africastalking",
  type: "sms",
  enabled: true,
  credentials: {
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME,
    shortcode: process.env.AFRICASTALKING_SHORTCODE,
  },
});
```

### Environment Variables

```env
# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourapp.com
EMAIL_FROM_NAME=Your App

# SMS (Africa's Talking)
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_SHORTCODE=your_shortcode

# Redis (for queues)
REDIS_URL=redis://localhost:6379
```

## API Reference

### CommunicationsService

#### sendCommunication(request)
Send a single communication.

```typescript
const result = await communicationsService.sendCommunication({
  type: "email" | "sms" | "push",
  to: string | string[] | Recipient[],
  templateId?: string,
  data?: Record<string, any>,
  content?: CommunicationContent,
  priority?: "low" | "normal" | "high" | "urgent",
  scheduledAt?: Date,
  context?: CommunicationContext,
  settings?: CommunicationSettings,
});
```

#### sendBulkCommunication(request)
Send bulk communications.

```typescript
const result = await communicationsService.sendBulkCommunication({
  name: string,
  type: "email" | "sms" | "push",
  recipients: Recipient[],
  templateId?: string,
  data?: Record<string, any>,
  priority?: "low" | "normal" | "high" | "urgent",
  scheduledAt?: Date,
  context?: CommunicationContext,
  settings?: CommunicationSettings,
});
```

### TemplateService

#### createTemplate(request)
Create a new template.

```typescript
const template = await templateService.createTemplate({
  name: string,
  description: string,
  category: TemplateCategory,
  type: string,
  subject?: string,
  content: string,
  variables: TemplateVariable[],
  engine: TemplateEngine,
  format: TemplateFormat,
  theme?: string,
});
```

#### render(request)
Render a template with data.

```typescript
const result = await templateService.render({
  templateId?: string,
  template?: Template,
  data: Record<string, any>,
  options?: TemplateRenderOptions,
});
```

## REST API

### Send Communication
```http
POST /api/v1/comms/send
Content-Type: application/json

{
  "type": "email",
  "to": "user@example.com",
  "templateId": "template-123",
  "data": {
    "userName": "John"
  }
}
```

### List Communications
```http
GET /api/v1/comms?type=email&page=1&limit=20
```

### Get Analytics
```http
GET /api/v1/comms/analytics?startDate=2024-01-01&endDate=2024-01-31
```

## Supported Providers

- **Email**: Resend, SMTP
- **SMS**: Africa's Talking, Twilio, AWS SNS
- **Push**: FCM, APNS (planned)

## Template Engines

- **Handlebars**: Flexible templating with helpers
- **MJML**: Email-specific markup with responsive design
- **EJS**: Embedded JavaScript (planned)
- **Pug**: Clean HTML templating (planned)

## Queue Processing

Communications are processed asynchronously using BullMQ:

- Automatic retries with exponential backoff
- Priority queuing
- Scheduled communications
- Bulk processing
- Webhook handling

## Analytics & Monitoring

- Delivery rates and success metrics
- Template performance tracking
- Provider usage statistics
- Real-time monitoring
- Cost analysis

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Type checking
bun run typecheck
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure type safety

## License

Proprietary - All rights reserved © 2025 KAA SaaS Solutions