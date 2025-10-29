# Message Controller

Complete REST API implementation for the messaging system.

## Overview

The message controller provides comprehensive REST API endpoints for:
- **Conversations**: Create, read, update, delete, and manage conversations
- **Messages**: Send, read, edit, delete, and search messages
- **Participants**: Add and remove participants from conversations
- **Bulk Operations**: Send messages to multiple conversations
- **Analytics**: Track conversation and message metrics

## Files

### Core Files
- `message.controller.ts` - Main controller with all REST endpoints
- `message.schema.ts` - Elysia validation schemas for all endpoints
- `MESSAGE_API.md` - Complete API documentation
- `message.examples.ts` - Usage examples and code samples
- `README.md` - This file

## Quick Start

### 1. Import the Controller

```typescript
import { messageController } from "./features/comms/messages/message.controller";
```

### 2. Use in Your Elysia App

```typescript
import { Elysia } from "elysia";
import { messageController } from "./features/comms/messages/message.controller";

const app = new Elysia()
  .use(messageController)
  .listen(3000);
```

### 3. Make API Calls

```typescript
// Create a conversation
const response = await fetch("http://localhost:3000/messages/conversations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-token"
  },
  body: JSON.stringify({
    type: "property_thread",
    title: "Property Inquiry",
    participantIds: ["user1", "user2"],
    propertyId: "prop-123"
  })
});

const conversation = await response.json();
```

## API Endpoints

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messages/conversations` | Create new conversation |
| GET | `/messages/conversations` | List user conversations |
| GET | `/messages/conversations/:id` | Get conversation details |
| PATCH | `/messages/conversations/:id` | Update conversation |
| POST | `/messages/conversations/:id/participants` | Add participant |
| DELETE | `/messages/conversations/:id/participants/:userId` | Remove participant |
| GET | `/messages/conversations/:id/analytics` | Get conversation analytics |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messages` | Send a message |
| GET | `/messages/:conversationId` | Get conversation messages |
| PUT | `/messages/:messageId/read` | Mark message as read |
| PATCH | `/messages/:messageId` | Edit message |
| DELETE | `/messages/:messageId` | Delete message |

### Bulk Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messages/bulk` | Send bulk messages |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/messages/analytics` | Get overall analytics |

## Features

### ✅ Comprehensive Validation
- All endpoints use Elysia validation schemas
- Kenya-specific validations (phone numbers, business hours)
- File size and type validations
- Spam detection

### ✅ Authentication & Authorization
- All endpoints require authentication via `authPlugin`
- Role-based permissions for participants
- Permission checks for sensitive operations

### ✅ Pagination & Filtering
- Configurable page size and limits
- Multiple filter options per endpoint
- Search functionality across conversations and messages

### ✅ Kenya-Specific Features
- Business hours validation (8 AM - 6 PM EAT)
- M-Pesa transaction detection
- Swahili language support
- Nairobi timezone handling

### ✅ Real-time Integration
- Works seamlessly with WebSocket service
- Automatic real-time notifications
- Typing indicators and presence tracking

### ✅ Analytics & Insights
- Message count tracking
- Response time metrics
- Engagement metrics
- Conversation analytics

## Message Types

The system supports various message types:

- `text` - Plain text messages
- `system` - System-generated messages
- `attachment` - Messages with files
- `property_inquiry` - Property-related inquiries
- `application_discussion` - Application discussions
- `payment_notification` - Payment notifications
- `maintenance_request` - Maintenance requests
- `renewal_discussion` - Lease renewals
- `complaint` - Tenant complaints
- `announcement` - General announcements

## Conversation Types

- `direct` - One-on-one conversations
- `group` - Group conversations
- `support` - Support conversations
- `property_thread` - Property-specific threads
- `application_thread` - Application-specific threads
- `system` - System conversations

## Usage Examples

See `message.examples.ts` for comprehensive examples including:

1. Creating conversations
2. Listing with filters
3. Sending messages
4. M-Pesa messages
5. Swahili messages
6. Replying to messages
7. Searching messages
8. Marking as read
9. Editing messages
10. Deleting messages
11. Bulk operations
12. Analytics
13. Error handling
14. Complete workflows

## Integration with WebSocket

The REST API works seamlessly with the WebSocket service:

```typescript
// Send message via REST
const message = await fetch("http://localhost:3000/messages", {
  method: "POST",
  body: JSON.stringify({
    conversationId: "conv-123",
    content: "Hello!"
  })
});

// Other participants receive real-time notification via WebSocket
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === "message_sent") {
    // Handle new message
  }
};
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {}
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid request data
- `CONVERSATION_NOT_FOUND` - Conversation doesn't exist
- `MESSAGE_NOT_FOUND` - Message doesn't exist
- `INSUFFICIENT_PERMISSIONS` - User lacks permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `MAX_PARTICIPANTS_EXCEEDED` - Too many participants
- `INTERNAL_ERROR` - Server error

## Performance Considerations

### Pagination
Always use pagination for listing operations:
```typescript
// Good
?page=1&limit=50

// Bad - loading everything at once
?limit=10000
```

### Caching
Cache conversation data to reduce API calls:
```typescript
// Use HTTP caching headers
Cache-Control: max-age=60
ETag: "conversation-version"
```

### Bulk Operations
Use bulk endpoints when possible:
```typescript
// Good - single request
POST /messages/bulk

// Bad - multiple requests
POST /messages (x100)
```

## Testing

### Unit Tests
```bash
bun test message.controller.test.ts
```

### Integration Tests
```bash
bun test message.integration.test.ts
```

### Load Tests
```bash
bun run load-test messages
```

## Monitoring

The API includes built-in monitoring:
- Request/response times
- Error rates
- Active conversations
- Message throughput

Access metrics at `/messages/analytics`

## Security

### Authentication
All endpoints require valid JWT token:
```
Authorization: Bearer <jwt-token>
```

### Rate Limiting
- 100 messages/minute per user
- 10 bulk operations/minute per user
- 1000 API calls/hour per user

### Data Validation
- All inputs are validated using Elysia schemas
- XSS protection
- SQL injection prevention
- File upload restrictions

## Troubleshooting

### Common Issues

**Issue**: "CONVERSATION_NOT_FOUND"
- Verify conversationId is correct
- Check user has access to conversation

**Issue**: "INSUFFICIENT_PERMISSIONS"
- Verify user role and permissions
- Check participant status (isActive)

**Issue**: "RATE_LIMIT_EXCEEDED"
- Implement backoff strategy
- Use bulk operations where possible

**Issue**: Business hours validation
- Check conversation settings
- Verify timezone configuration

## Documentation

- Full API docs: `MESSAGE_API.md`
- Code examples: `message.examples.ts`
- Schema definitions: `message.schema.ts`
- WebSocket docs: `../websocket.controller.ts`

## Support

For questions or issues:
1. Check the documentation
2. Review code examples
3. Check error responses
4. Contact development team

## License

MIT

