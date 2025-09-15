# Email Module

## Overview
The Email module provides a unified interface for sending, receiving, and managing email communications within the KAA SaaS platform. It supports multiple email providers, templates, and tracking capabilities.

## Features

### Email Sending
- Transactional emails
- Bulk email campaigns
- Email templates with dynamic content
- Attachments and embedded images
- HTML and plain text support

### Email Management
- Email queuing and scheduling
- Delivery status tracking
- Bounce and complaint handling
- Unsubscribe management
- Email analytics

### Templates
- Drag-and-drop editor
- Responsive design
- Variable substitution
- Preview and testing
- Version control

## Data Models

### Email Message
```typescript
{
  _id: ObjectId,
  messageId: string,
  templateId: string,
  from: {
    name: string,
    email: string
  },
  to: Array<{
    name: string,
    email: string,
    type: 'to' | 'cc' | 'bcc'
  }>,
  subject: string,
  html: string,
  text: string,
  template: string,
  variables: Record<string, any>,
  attachments: Array<{
    filename: string,
    content: Buffer | string,
    contentType: string,
    cid?: string
  }>,
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed',
  provider: 'sendgrid' | 'ses' | 'smtp' | 'mailgun',
  providerId: string,
  providerResponse: any,
  metadata: {
    campaignId: string,
    userId: string,
    clientIp: string,
    userAgent: string,
    tags: string[]
  },
  scheduledAt: Date,
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  error: {
    code: string,
    message: string,
    stack: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Email Template
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  subject: string,
  html: string,
  text: string,
  variables: string[],
  category: string,
  version: number,
  isActive: boolean,
  previewUrl: string,
  tags: string[],
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Emails
- `POST /api/emails` - Send an email
- `GET /api/emails` - List sent emails
- `GET /api/emails/:id` - Get email details
- `GET /api/emails/message/:messageId` - Get email by message ID
- `POST /api/emails/bulk` - Send bulk emails
- `POST /api/emails/:id/retry` - Retry failed email

### Templates
- `GET /api/email-templates` - List email templates
- `POST /api/email-templates` - Create email template
- `GET /api/email-templates/:id` - Get email template
- `PUT /api/email-templates/:id` - Update email template
- `DELETE /api/email-templates/:id` - Delete email template
- `POST /api/email-templates/:id/duplicate` - Duplicate template
- `POST /api/email-templates/:id/preview` - Preview template

### Webhooks
- `POST /api/email/webhooks/:provider` - Provider webhook endpoint
- `GET /api/email/webhooks/events` - List webhook events

## Usage Examples

### Sending an Email
```typescript
const email = {
  to: 'recipient@example.com',
  subject: 'Welcome to Our Service',
  template: 'welcome-email',
  variables: {
    name: 'John Doe',
    activationLink: 'https://app.example.com/activate/123',
    company: 'Example Inc'
  },
  metadata: {
    userId: 'user123',
    campaignId: 'welcome2023'
  }
};

const response = await fetch('/api/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(email)
});

const result = await response.json();
```

### Creating a Template
```typescript
const template = {
  name: 'Password Reset',
  subject: 'Reset Your Password',
  html: `
    <h1>Hello {{name}},</h1>
    <p>You requested to reset your password. Click the link below to continue:</p>
    <a href="{{resetLink}}">Reset Password</a>
    <p>This link will expire in {{expiration}} hours.</p>
  `,
  text: `
    Hello {{name}},\n    \n    You requested to reset your password. Visit the following link to continue:\n    {{resetLink}}\n    \n    This link will expire in {{expiration}} hours.
  `,
  variables: ['name', 'resetLink', 'expiration'],
  category: 'authentication',
  tags: ['password', 'security']
};

const response = await fetch('/api/email-templates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(template)
});

const createdTemplate = await response.json();
```

## Configuration

### Environment Variables
```env
# Email Configuration
EMAIL_PROVIDER=sendgrid
EMAIL_FROM_NAME="KAA SaaS"
EMAIL_FROM_EMAIL=noreply@kaa-saas.com
EMAIL_REPLY_TO=support@kaa-saas.com

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key

# AWS SES
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASSWORD=password

# Mailgun
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=mg.example.com

# Rate Limiting
EMAIL_RATE_LIMIT=1000
EMAIL_RATE_LIMIT_WINDOW=3600000
```

## Security Considerations

- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure storage of credentials
- TLS for email transmission
- SPF, DKIM, and DMARC configuration
- Unsubscribe and complaint handling

## Best Practices

1. **Template Management**: Use templates for consistent branding
2. **Testing**: Test emails before sending to production
3. **Monitoring**: Monitor delivery rates and bounces
4. **Compliance**: Follow email regulations (CAN-SPAM, GDPR)
5. **Performance**: Queue emails for background processing

## Dependencies

- nodemailer (SMTP client)
- @sendgrid/mail (SendGrid client)
- aws-sdk (SES client)
- mailgun.js (Mailgun client)
- handlebars (templating)
- bullmq (queue management)

## Support

For support, please contact:
- Email: email-support@kaa-saas.com
- Phone: +254 700 000000

## License

Proprietary - All rights reserved © 2025 KAA SaaS Solutions
