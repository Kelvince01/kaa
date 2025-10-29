# Communications Services

Real-time messaging and WebSocket services for the Kenya rental platform.

## Overview

This package provides comprehensive messaging and real-time communication services:

- **MessageService**: Handles conversations, messages, and analytics
- **SocketService**: Manages WebSocket connections, real-time events, and presence tracking

## Installation

The services are already included in the `@kaa/services` package:

```typescript
import { 
  messageService, 
  messageServiceWithSocket,
  socketService 
} from "@kaa/services/comms";
```

## Socket Service

The `SocketService` manages WebSocket connections and real-time communication.

### Features

- Multi-device support (multiple connections per user)
- Conversation rooms
- Typing indicators
- User presence tracking
- Automatic cleanup of stale connections
- Connection statistics

### Basic Usage

```typescript
import { socketService } from "@kaa/services";
import { SocketEvent } from "@kaa/models/types";

// Add a connection
socketService.addConnection(ws, userId, userName);

// Join a conversation
socketService.joinConversation(userId, conversationId);

// Emit to specific users
socketService.emitToUsers(
  [userId1, userId2],
  SocketEvent.MESSAGE_SENT,
  { message: "Hello!" }
);

// Emit to conversation
await socketService.emitToConversation(
  conversationId,
  SocketEvent.MESSAGE_SENT,
  { message: "Hello!" }
);

// Handle typing indicators
await socketService.handleTypingIndicator(
  conversationId,
  userId,
  userName,
  true // isTyping
);

// Check user presence
const presence = socketService.getUserPresence(userId);
// Returns: { isOnline: boolean, lastActivity?: Date, connectionCount: number }

// Get statistics
const stats = socketService.getStatistics();
// Returns: { totalConnections, uniqueUsers, activeConversations, typingUsers }
```

## Message Service

The `MessageService` handles all messaging operations with optional socket integration.

### Features

- Conversation management
- Message sending and receiving
- Read receipts
- Message editing and deletion
- Bulk operations
- Analytics
- Kenya-specific features (M-Pesa detection, Swahili support, business hours)

### Basic Usage

```typescript
import { messageServiceWithSocket } from "@kaa/services/comms";

// Create a conversation
const conversation = await messageServiceWithSocket.createConversation(
  {
    type: ConversationType.PROPERTY_THREAD,
    title: "Property Inquiry",
    participantIds: [landlordId, tenantId],
    propertyId: "property-123",
  },
  createdBy
);

// Send a message
const message = await messageServiceWithSocket.sendMessage(
  {
    conversationId,
    content: "Hello, I'm interested in this property",
    type: MessageType.TEXT,
  },
  senderId
);

// Get messages
const messages = await messageServiceWithSocket.getMessages(
  conversationId,
  {
    page: 1,
    limit: 50,
    search: "rent",
  },
  userId
);

// Mark as read
await messageServiceWithSocket.markMessageAsRead(messageId, userId);

// Edit message
await messageServiceWithSocket.editMessage(
  messageId,
  "Updated content",
  userId
);

// Delete message
await messageServiceWithSocket.deleteMessage(messageId, userId);
```

## WebSocket Controller

The Elysia WebSocket controller is available in `apps/api/src/features/comms/websocket.controller.ts`.

### Integration Example

```typescript
import { Elysia } from "elysia";
import { websocketController } from "./features/comms/websocket.controller";

const app = new Elysia()
  .use(websocketController)
  .listen(3000);
```

### Client Connection

```typescript
// Connect to WebSocket
const ws = new WebSocket(
  `ws://localhost:3000/ws/chat?userId=${userId}&userName=${userName}`
);

// Listen for events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.event) {
    case "message_sent":
      console.log("New message:", data.payload);
      break;
      
    case "typing_start":
      console.log("User is typing:", data.payload.userName);
      break;
      
    case "user_online":
      console.log("User came online:", data.payload.userId);
      break;
  }
};

// Send events
ws.send(JSON.stringify({
  event: "join_conversation",
  payload: { conversationId: "conv-123" }
}));

ws.send(JSON.stringify({
  event: "typing_start",
  payload: { conversationId: "conv-123" }
}));

ws.send(JSON.stringify({
  event: "send_message",
  payload: {
    conversationId: "conv-123",
    content: "Hello!"
  }
}));
```

## Socket Events

Available socket events (from `SocketEvent` enum):

### Connection Events
- `CONNECT` - Connection established
- `DISCONNECT` - Connection closed

### Conversation Events
- `JOIN_CONVERSATION` - User joined a conversation
- `LEAVE_CONVERSATION` - User left a conversation
- `CONVERSATION_CREATED` - New conversation created
- `CONVERSATION_UPDATED` - Conversation updated
- `CONVERSATION_DELETED` - Conversation deleted

### Message Events
- `MESSAGE_SENT` - New message sent
- `MESSAGE_DELIVERED` - Message delivered
- `MESSAGE_READ` - Message read
- `MESSAGE_EDITED` - Message edited
- `MESSAGE_DELETED` - Message deleted

### Typing Events
- `TYPING_START` - User started typing
- `TYPING_STOP` - User stopped typing

### Presence Events
- `USER_ONLINE` - User came online
- `USER_OFFLINE` - User went offline

### Error Events
- `ERROR` - Error occurred

## Client Events

Events that clients can send to the server:

- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_read` - Mark message as read
- `send_message` - Send a message
- `ping` - Keep connection alive
- `request_presence` - Request user presence information
- `update_status` - Update user status

## Kenya-Specific Features

The message service includes Kenya-specific functionality:

### Business Hours
- Validates messages sent during business hours (8 AM - 6 PM EAT)
- Timezone: Africa/Nairobi

### M-Pesa Detection
- Automatically detects M-Pesa related messages
- Tracks M-Pesa conversations in analytics

### Swahili Support
- Detects Swahili content
- Auto-translation support (when enabled)
- Tracks Swahili message metrics

### Common Swahili Phrases
- hujambo (hello)
- asante (thank you)
- karibu (welcome)
- sawa (okay)
- tafadhali (please)
- habari (news/how are you)
- sasa (now)

## Error Handling

Both services use the `MessageError` class for consistent error handling:

```typescript
try {
  await messageService.sendMessage(request, userId);
} catch (error) {
  if (error instanceof MessageError) {
    // Handle specific message errors
    console.error(`[${error.code}] ${error.message}`);
  }
}
```

## Performance Considerations

### Socket Service
- Supports multiple connections per user (multi-device)
- Automatic cleanup of stale typing indicators (every 30 seconds)
- Efficient conversation broadcasting using participant maps

### Message Service
- Background processing for notifications and analytics
- Pagination support for message lists
- Optimized database queries with indexing

## Testing

See `websocket.example.ts` for client implementation examples.

## License

MIT

