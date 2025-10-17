# Service Usage Examples

Comprehensive examples demonstrating how to use various services in the KAA platform.

## 📚 Available Examples

### 🎨 Canvas & Graphics

#### [Canvas Examples](./canvas-examples.ts)

Complete examples for using canvas-based image generation in legal documents:

- **Custom Watermarks** - Generate transparent watermarks with rotation
- **Official Seals** - Create circular official seals and stamps
- **Signature Placeholders** - Visual signature boxes with labels
- **Document Headers** - Branded headers with gradients
- **Verification Badges** - Security badges with QR codes
- **Charts & Graphs** - Bar charts for data visualization
- **Complete PDF** - Full example combining all canvas features

**Key Features:**

- Server-side canvas rendering
- Custom fonts support
- PNG/DataURL output
- PDFKit integration
- High-quality graphics generation

**Quick Start:**

```typescript
import { legalDocumentService } from '@kaa/services';

// Create an official seal
const seal = legalDocumentService.createOfficialSeal({
  text: 'KAA RENTALS',
  subtext: 'OFFICIAL DOCUMENT',
  size: 250,
  color: '#1e40af'
});

// Use in PDF
doc.image(seal, x, y, { width: 100 });

// Create a bar chart
const chart = legalDocumentService.createSimpleBarChart([
  { label: 'Jan', value: 50000 },
  { label: 'Feb', value: 52000 }
], {
  title: 'Monthly Rent (KES)'
});
```

---

### 📄 File Management & Processing

#### [File Watermark Examples](./file-watermark-examples.ts)

Complete examples for file upload, watermarking, and malware scanning:

- **Text Watermarks** - Add text overlays to images
- **Logo Watermarks** - Brand images with company logos
- **Multiple Watermarks** - Apply multiple watermarks to a single image
- **Conditional Watermarks** - Dynamic watermarking based on conditions
- **Batch Processing** - Upload and process multiple files
- **API Integration** - Controller endpoint examples

**Key Features:**

- Image watermarking (text and logo)
- Automatic malware scanning
- S3/CDN upload
- Position customization (top-left, center, etc.)
- Opacity and styling options

**Quick Start:**

```typescript
import { FilesService } from '@kaa/services/files';
import { ImageOperation } from '@kaa/models/file.type';

const filesService = new FilesService();

// Upload with text watermark
const file = await filesService.uploadFile(buffer, 'photo.jpg', {
  ownerId: userId,
  organizationId: orgId,
  category: 'property_image',
  processingOptions: {
    operation: ImageOperation.WATERMARK,
    parameters: {
      type: 'text',
      text: '© 2025 Company',
      position: 'bottom-right',
      opacity: 0.6,
    },
  },
});
```

---

### 🎥 WebRTC Video Calling

#### [WebRTC Client Example](./webrtc-client-example.tsx)

Complete React client implementation for WebRTC video calling:

- **Media Management** - Audio/video capture and controls
- **Peer Connections** - Multi-participant support
- **Screen Sharing** - Desktop/window sharing
- **WebSocket Signaling** - Real-time signaling
- **ICE Candidate Handling** - Connection establishment
- **Recording Controls** - Start/stop recording

**Key Features:**

- Native WebRTC implementation
- SFU architecture support
- Real-time communication
- Audio/video controls
- Screen sharing
- Connection status tracking

**Quick Start:**

```typescript
import { VideoCall } from '@kaa/services/examples';

<VideoCall
  callId="call-123"
  userId="user-456"
  displayName="John Doe"
  apiUrl="https://api.example.com"
/>
```

**WebSocket Messages:**

```typescript
// Join call
ws.send(JSON.stringify({
  type: 'join',
  callId: 'call-123',
  userId: 'user-456',
  displayName: 'John Doe',
}));

// Send offer
ws.send(JSON.stringify({
  type: 'offer',
  targetUserId: 'user-789',
  offer: peerConnection.localDescription,
}));
```

---

## 🚀 Running Examples

### TypeScript/Node.js

```bash
# Install dependencies
bun install

# Run example
bun run examples/file-watermark-examples.ts
```

### React/Next.js

```typescript
// Import and use in your React components
import { VideoCall } from '@kaa/services/examples';

export default function CallPage() {
  return (
    <VideoCall
      callId={callId}
      userId={userId}
      displayName={userName}
      apiUrl={process.env.NEXT_PUBLIC_API_URL}
    />
  );
}
```

## 📖 Documentation References

### File Services

- [File Service Documentation](../../docs/legal/WATERMARK_AND_SCAN_USAGE.md)
- [Legal Documents Guide](../../docs/legal/LEGAL_DOCUMENT_QUICK_START.md)

### WebRTC

- [WebRTC Engine README](../engines/webrtc/README.md)
- [WebRTC Migration Guide](../../docs/webrtc/WEBRTC_ELYSIA_WEBSOCKET_MIGRATION.md)

### General

- [Services Package README](../../README.md)
- [Documentation Index](../../docs/README.md)

## 🛠️ Common Patterns

### Error Handling

```typescript
try {
  const result = await service.performOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

### Async/Await with Multiple Operations

```typescript
// Parallel operations
const [users, properties, reviews] = await Promise.all([
  userService.getUsers(),
  propertyService.getProperties(),
  reviewService.getReviews(),
]);

// Sequential operations with dependencies
const user = await userService.getUser(userId);
const properties = await propertyService.getPropertiesByOwner(user.id);
const reviews = await reviewService.getReviewsForProperties(properties.map(p => p.id));
```

### Service Initialization

```typescript
import { 
  FilesService,
  EmailService,
  NotificationService 
} from '@kaa/services';

// Initialize services
const filesService = new FilesService();
const emailService = new EmailService();
const notificationService = new NotificationService();

// Use in your application
async function handleFileUpload(file: File, userId: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadedFile = await filesService.uploadFile(buffer, file.name, {
    ownerId: userId,
    category: 'document',
  });

  await notificationService.sendNotification({
    userId,
    type: 'file_uploaded',
    title: 'File Uploaded Successfully',
    body: `Your file "${file.name}" has been uploaded.`,
  });

  return uploadedFile;
}
```

## 🎯 Best Practices

1. **Always handle errors** - Use try/catch blocks
2. **Validate inputs** - Check parameters before processing
3. **Clean up resources** - Close connections, clear timeouts
4. **Use TypeScript** - Leverage type safety
5. **Follow async patterns** - Use async/await consistently
6. **Log important events** - Help with debugging
7. **Test thoroughly** - Unit and integration tests

## 💡 Tips

- Check service documentation before implementing
- Use examples as starting points, not production code
- Consider performance implications for batch operations
- Handle edge cases (network failures, timeouts, etc.)
- Keep secrets and API keys in environment variables
- Follow security best practices

## 🤝 Contributing Examples

To add a new example:

1. Create a new `.ts` or `.tsx` file in this directory
2. Add comprehensive comments and documentation
3. Include error handling and edge cases
4. Update this README with a link and description
5. Add to the main package documentation

### Example Template

```typescript
/**
 * [Service Name] Example
 * 
 * Description of what this example demonstrates
 * 
 * Key Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 */

import { ServiceClass } from '../path/to/service';

// Example 1: Basic Usage
async function basicExample() {
  // Implementation
}

// Example 2: Advanced Usage
async function advancedExample() {
  // Implementation
}

// Export examples
export {
  basicExample,
  advancedExample,
};
```

## 📧 Support

For questions or issues:

- Check the [main documentation](../../docs/README.md)
- Review service-specific docs
- Open an issue in the repository
- Contact the development team

---

**Last Updated**: October 2025
