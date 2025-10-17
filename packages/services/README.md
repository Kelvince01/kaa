# @kaa/services

Core business logic services and engines for the KAA platform.

## 📁 Directory Structure

```text
packages/services/
├── docs/                          # Documentation
│   ├── ai/                        # AI & ML related docs
│   ├── implementation/            # Implementation guides
│   ├── legal/                     # Legal documents service docs
│   ├── reviews/                   # Reviews system docs
│   ├── setup/                     # Setup & migration guides
│   ├── types/                     # TypeScript types docs
│   └── webrtc/                    # WebRTC implementation docs
├── src/
│   ├── accounts/                  # User account services
│   │   ├── api-key.service.ts
│   │   ├── auth.service.ts
│   │   ├── landlord.service.ts
│   │   ├── passkey-v2.service.ts
│   │   ├── tenant-screening.service.ts
│   │   ├── tenant.service.ts
│   │   └── user.service.ts
│   ├── comms/                     # Communication services
│   │   ├── email.service.ts
│   │   ├── message.service.ts
│   │   ├── notification.service.ts
│   │   ├── push-notification.service.ts
│   │   ├── resend.service.ts
│   │   ├── sendgrid.service.ts
│   │   ├── sms.service.ts
│   │   ├── ussd.service.ts
│   │   └── whatsapp.service.ts
│   ├── documents/                 # Document processing
│   │   └── legal-document.service.ts
│   ├── engines/                   # Core engines
│   │   ├── security.engine.ts
│   │   ├── template.engine.ts
│   │   ├── video-calling-webrtc.engine.ts
│   │   └── webrtc/                # WebRTC engines
│   │       ├── webrtc-media-server.engine.ts
│   │       ├── webrtc-peer.engine.ts
│   │       ├── webrtc-recording.engine.ts
│   │       ├── webrtc-sfu.engine.ts
│   │       ├── webrtc-signaling.engine.ts
│   │       └── webrtc-storage.engine.ts
│   ├── examples/                  # Usage examples
│   │   └── file-watermark-examples.ts
│   ├── files/                     # File management
│   │   ├── file-v2.service.ts
│   │   └── file.service.ts
│   ├── managers/                  # Business logic managers
│   │   └── permission.manager.ts
│   ├── misc/                      # Miscellaneous services
│   │   ├── api-version.service.ts
│   │   ├── audit.service.ts
│   │   ├── backup.service.ts
│   │   ├── monitoring.service.ts
│   │   └── webhook.service.ts
│   ├── org/                       # Organization services
│   │   ├── billing.service.ts
│   │   ├── member.service.ts
│   │   └── subscription.service.ts
│   ├── payments/                  # Payment integrations
│   │   ├── airtel-money.service.ts
│   │   ├── mpesa/
│   │   ├── multi-bank.gateway.ts
│   │   ├── payment-method.service.ts
│   │   ├── provider.service.ts
│   │   └── stripe.service.ts
│   ├── properties/                # Property services
│   │   ├── property.service.ts
│   │   ├── review.service.ts
│   │   └── sentiment-analyzer.service.ts
│   ├── queues/                    # Background job queues
│   │   ├── comms.queue.ts
│   │   ├── email.queue.ts
│   │   ├── sms.queue.ts
│   │   └── webhook.queue.ts
│   ├── rbac/                      # Role-based access control
│   │   ├── permission.service.ts
│   │   ├── rbac.service.ts
│   │   └── role.service.ts
│   └── repositories/              # Data repositories
│       └── webhooks.repository.ts
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

### Installation

```bash
bun install @kaa/services
```

### Basic Usage

```typescript
import { UserService } from '@kaa/services/accounts';
import { EmailService } from '@kaa/services/comms';
import { PropertyService } from '@kaa/services/properties';

// Initialize services
const userService = new UserService();
const emailService = new EmailService();
const propertyService = new PropertyService();

// Use services
const user = await userService.getUserById(userId);
await emailService.sendWelcomeEmail(user.email);
const properties = await propertyService.getPropertiesByOwnerId(userId);
```

## 📚 Service Categories

### 👤 Account Services

- **User Management**: Authentication, registration, profile management
- **Landlord Services**: Landlord-specific operations
- **Tenant Services**: Tenant operations and screening
- **API Key Management**: API key generation and validation
- **Passkey v2**: Modern passwordless authentication

### 💬 Communication Services

- **Email**: SendGrid and Resend integrations
- **SMS**: SMS gateway integration
- **WhatsApp**: WhatsApp Business API
- **Push Notifications**: Mobile and web push
- **USSD**: USSD menu system
- **Notifications**: Multi-channel notification system

### 📄 Document Services

- **Legal Documents**: Contract generation and management
- **File Processing**: Upload, watermark, malware scanning
- **Document Templates**: Template engine for documents

### 🎥 WebRTC Services

- **Signaling**: WebRTC signaling server
- **Media Server**: SFU (Selective Forwarding Unit)
- **Recording**: Call recording and storage
- **Peer Management**: Peer connection lifecycle

### 💳 Payment Services

- **M-Pesa**: M-Pesa payment integration
- **Airtel Money**: Airtel Money integration
- **Stripe**: Stripe payment processing
- **Multi-Bank**: Multi-bank gateway

### 🏢 Organization Services

- **Billing**: Subscription and billing management
- **Members**: Organization member management
- **Subscriptions**: Plan and feature management

### 🏠 Property Services

- **Properties**: Property CRUD operations
- **Reviews**: Property review system
- **Sentiment Analysis**: AI-powered sentiment analysis

### 🔐 RBAC Services

- **Permissions**: Permission management
- **Roles**: Role definition and assignment
- **Access Control**: Authorization logic

### 🔧 Utility Services

- **Queues**: Background job processing
- **Webhooks**: Webhook delivery and retry
- **Monitoring**: System health monitoring
- **Audit**: Audit log tracking

## 📖 Documentation

All documentation is organized in the `docs/` directory:

- **[AI & ML](./docs/ai/)** - Sentiment analysis and AI features
- **[Implementation Guides](./docs/implementation/)** - System implementation docs
- **[Legal Documents](./docs/legal/)** - Legal document service guides
- **[Font Setup Guide](./docs/FONT_SETUP_GUIDE.md)** - Custom font configuration for PDFs
- **[Canvas Usage Guide](./docs/legal/CANVAS_USAGE_GUIDE.md)** - Using canvas for graphics and charts
- **[Reviews System](./docs/reviews/)** - Review system documentation
- **[Setup Guides](./docs/setup/)** - Installation and migration guides
- **[WebRTC](./docs/webrtc/)** - WebRTC implementation details

## 🔍 Examples

Check out the `src/examples/` directory for usage examples:

- **[File Watermarking Examples](./src/examples/file-watermark-examples.ts)** - File upload, watermarking, and malware scanning

## 🛠️ Development

### Running Tests

```bash
bun test
```

### Type Checking

```bash
bun run type-check
```

### Linting

```bash
bun run lint
```

## 📦 Key Features

### File Management

- ✅ Cloud storage integration (S3, CDN)
- ✅ Image watermarking (text and logo)
- ✅ Malware scanning with ClamAV
- ✅ Image processing and optimization
- ✅ File versioning and metadata

### Communication

- ✅ Multi-channel notifications
- ✅ Template-based emails
- ✅ SMS delivery with retry
- ✅ WhatsApp Business messaging
- ✅ Push notifications

### WebRTC

- ✅ Real-time video calling
- ✅ Screen sharing
- ✅ Call recording
- ✅ SFU architecture
- ✅ WebSocket signaling

### Security

- ✅ File malware scanning
- ✅ RBAC with granular permissions
- ✅ API key authentication
- ✅ Passkey authentication
- ✅ Audit logging

### Payments

- ✅ M-Pesa integration
- ✅ Airtel Money support
- ✅ Stripe payment processing
- ✅ Subscription billing
- ✅ Payment webhooks

## 🤝 Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🔗 Related Packages

- [@kaa/models](../models/) - Data models and types
- [@kaa/utils](../utils/) - Utility functions
- [@kaa/config](../config/) - Configuration management
- [@kaa/email](../email/) - Email templates
- [@kaa/schemas](../schemas/) - Validation schemas

## 📧 Support

For support, please open an issue in the main repository or contact the development team.

---

Built with ❤️ for the KAA Platform
