# Enhanced MJML Email System

## Overview

The Kaa SaaS platform features a comprehensive email system built on top of MJML (Mailjet Markup Language) that provides:

- 🎨 **Theme System**: Consistent branding across all email templates
- 🔧 **Development Tools**: Hot reload, validation, and preview capabilities  
- 📱 **Responsive Design**: Mobile-first email templates
- 🧩 **Component Library**: Reusable email components
- 🚀 **Performance**: Template compilation caching and optimization
- 🧪 **Testing Framework**: Comprehensive test suite for email templates

## Features

### Theme System

Our theme system allows for consistent branding across all email templates:

```typescript
// Available themes
- default: Modern, clean design
- kaa-brand: Official Kaa branding colors and fonts
```

**Theme Structure:**
```typescript
interface MJMLTheme {
  name: string;
  colors: {
    primary: string;      // Main brand color
    secondary: string;    // Secondary accent color
    background: string;   // Email background
    text: string;         // Primary text color
    muted: string;        // Muted/secondary text
    success: string;      // Success states
    warning: string;      // Warning states
    error: string;        // Error states
  };
  fonts: {
    primary: string;      // Body text font
    heading: string;      // Heading font
    mono: string;         // Monospace font
  };
  spacing: {
    small: string;        // Small spacing
    medium: string;       // Medium spacing
    large: string;        // Large spacing
  };
  borderRadius: string;   // Border radius for elements
}
```

### Development Tools

#### MJML CLI Tools

```bash
# Validate all templates
bun run mjml:validate

# Build templates to HTML
bun run mjml:build

# Watch templates for changes
bun run mjml:watch

# Start development with hot reload
bun run templates:dev
```

#### Email Preview Server

Start the preview server to test templates:

```bash
bun run templates:preview
```

Then open http://localhost:3001 to:
- Preview templates with different themes
- Test with sample data
- Validate MJML syntax
- View mobile/desktop renderings

### Template Development

#### Using Themes in Templates

```mjml
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="{{theme.fonts.primary}}" />
      <mj-text color="{{theme.colors.text}}" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="{{theme.colors.background}}">
    <mj-section>
      <mj-column>
        <mj-button background-color="{{theme.colors.primary}}">
          Action Button
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

#### Handlebars Helpers

Built-in helpers for common operations:

```handlebars
<!-- Format currency -->
{{formatCurrency amount "KES"}}

<!-- Format dates -->
{{formatDate createdAt}}

<!-- Generate URLs -->
{{generateUrl "/dashboard"}}

<!-- Conditional rendering -->
{{#ifEquals status "active"}}
  <p>Your account is active!</p>
{{/ifEquals}}

<!-- Theme colors -->
<div style="color: {{themeColor 'primary' 'kaa-brand'}}">
  Branded content
</div>
```

#### Reusable Components

Use predefined components for consistency:

```mjml
<!-- Header component -->
<mj-include path="./components/kaa-header.mjml" />

<!-- Custom button -->
<mj-include path="./components/kaa-button.mjml" />

<!-- Footer component -->
<mj-include path="./components/kaa-footer.mjml" />
```

### API Usage

#### Basic Email Sending

```typescript
import emailService from '~/email/email.service';

// Send with template
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Kaa!',
  template: 'welcome',
  context: {
    firstName: 'John',
    lastName: 'Doe',
    logoUrl: 'https://kaapro.dev/logo.png',
    supportEmail: 'support@kaapro.dev',
    year: new Date().getFullYear()
  }
});
```

#### Advanced MJML Service

```typescript
import mjmlService from '~/email/mjml.service';

// Compile template with theme
const result = mjmlService.compileTemplate('welcome', {
  theme: 'kaa-brand',
  minify: true
});

// Render with data
const rendered = mjmlService.renderTemplate('welcome', {
  firstName: 'Jane',
  email: 'jane@example.com'
}, {
  theme: 'kaa-brand'
});

// Validate template
const validation = mjmlService.validateTemplate('welcome');
if (!validation.isValid) {
  console.error('Template errors:', validation.errors);
}

// Generate preview
const preview = mjmlService.previewTemplate('welcome', sampleData, {
  theme: 'kaa-brand'
});
```

### Available Templates

| Template | Purpose | Key Variables |
|----------|---------|---------------|
| `welcome` | New user welcome | `firstName`, `loginUrl` |
| `verification` | Email verification | `verificationUrl`, `expiresIn` |
| `password-reset` | Password reset | `resetUrl`, `expiresIn` |
| `notification` | General notifications | `title`, `message`, `actionUrl` |
| `booking-notification` | Property booking alerts | `propertyName`, `checkIn`, `checkOut` |
| `booking-status-update` | Booking status changes | `bookingId`, `status`, `message` |
| `booking-cancellation` | Booking cancellations | `bookingId`, `reason`, `refundAmount` |
| `payment-reminder` | Payment reminders | `amount`, `dueDate`, `paymentUrl` |
| `payment-receipt` | Payment confirmations | `amount`, `transactionId`, `date` |
| `payment-overdue` | Overdue payments | `amount`, `overdueDays`, `paymentUrl` |
| `monthly-report` | Monthly activity reports | `stats`, `period`, `highlights` |
| `incident-notification` | System incidents | `title`, `description`, `status` |

### Template Variables

#### Common Variables (Available in all templates)

```typescript
{
  // User information
  firstName?: string;
  lastName?: string;
  email: string;
  
  // Branding
  logoUrl: string;
  supportEmail: string;
  year: string;
  
  // URLs
  appUrl: string;
  loginUrl?: string;
}
```

#### Template-Specific Variables

**Welcome Template:**
```typescript
{
  userName?: string;
  welcomeMessage?: string;
}
```

**Booking Templates:**
```typescript
{
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  bookingId: string;
  guestCount?: number;
}
```

**Payment Templates:**
```typescript
{
  amount: number;
  currency?: string;
  paymentMethod?: string;
  transactionId: string;
  date: string;
  description?: string;
}
```

### Testing

#### Running Tests

```bash
# Run all email tests
bun test src/__tests__/email/

# Run specific MJML tests
bun test src/__tests__/email/mjml.test.ts

# Run with coverage
bun test --coverage src/__tests__/email/
```

#### Test Categories

- **Template Management**: Loading, validation, theme management
- **Compilation**: MJML to HTML conversion with various options
- **Rendering**: Template rendering with data and themes
- **Validation**: Template syntax and structure validation
- **Performance**: Compilation speed and caching
- **Error Handling**: Graceful error handling and recovery

### Best Practices

#### Template Development

1. **Use Themes**: Always use theme variables for colors, fonts, and spacing
2. **Mobile First**: Design for mobile devices first
3. **Accessibility**: Include alt text for images and proper contrast
4. **Fallbacks**: Provide text fallbacks for HTML-only content
5. **Testing**: Test across multiple email clients

#### Performance

1. **Image Optimization**: Use optimized images with proper dimensions
2. **Template Caching**: Compiled templates are automatically cached
3. **Minification**: Use minification for production emails
4. **Font Loading**: Use web-safe fonts with proper fallbacks

#### Security

1. **Input Sanitization**: All template variables are automatically escaped
2. **URL Validation**: Validate and sanitize URLs in templates
3. **Content Security**: Be cautious with user-generated content

### Troubleshooting

#### Common Issues

**Template Not Found:**
```
Error: Template "template-name" not found
```
- Verify template exists in `src/templates/`
- Check template is loaded in MJML service
- Ensure correct file extension (`.mjml`)

**MJML Validation Errors:**
```
MJML compilation warnings: [...]
```
- Use `bun run mjml:validate` to check syntax
- Verify all MJML components are properly closed
- Check for invalid attributes or nesting

**Theme Variables Not Working:**
```
{{theme.colors.primary}} not rendering
```
- Ensure theme is specified in compilation options
- Verify theme exists in theme registry
- Check theme variable syntax

#### Debug Mode

Enable debug logging:

```typescript
// In your service
import { logger } from '~/utils/logger.util';

logger.level = 'debug';
```

### Deployment

#### Production Configuration

1. **Environment Variables:**
   ```env
   EMAIL_FROM=noreply@kaapro.dev
   EMAIL_FROM_NAME=Kaa
   RESEND_API_KEY=your_resend_key
   APP_URL=https://app.kaapro.dev
   ```

2. **Template Compilation:**
   ```bash
   # Pre-compile templates for production
   bun run mjml:build
   ```

3. **Monitoring:**
   - Monitor email delivery rates
   - Track template rendering performance
   - Log compilation errors and warnings

### Integration Examples

#### Express/Elysia Route

```typescript
app.post('/send-welcome', async ({ body }) => {
  const { email, firstName } = body;
  
  const success = await emailService.sendEmail({
    to: email,
    subject: 'Welcome to Kaa!',
    template: 'welcome',
    context: {
      firstName,
      logoUrl: process.env.LOGO_URL,
      supportEmail: process.env.SUPPORT_EMAIL,
      year: new Date().getFullYear(),
      loginUrl: `${process.env.APP_URL}/login`
    }
  });
  
  return { success };
});
```

#### Queue Integration

```typescript
import { Queue } from 'bullmq';

const emailQueue = new Queue('email');

// Add email job
await emailQueue.add('send-template', {
  to: 'user@example.com',
  template: 'welcome',
  data: { firstName: 'John' },
  theme: 'kaa-brand'
});
```

### Support

For issues related to the MJML email system:

1. Check the [troubleshooting guide](#troubleshooting)
2. Review template validation with `bun run mjml:validate`
3. Test templates in the preview server
4. Check logs for compilation errors
5. Contact the development team

---

**Last Updated:** January 2025  
**Version:** 2.0.0  
**Maintainer:** Kaa Development Team
