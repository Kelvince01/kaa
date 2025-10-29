# Message API Documentation

Complete REST API documentation for the messaging system.

## Base URL

All endpoints are prefixed with `/messages`

## Authentication

All endpoints require authentication via the `authPlugin`. Include your authentication token in the request headers.

```
Authorization: Bearer <your-token>
```

## API Endpoints

### Conversations

#### 1. Create Conversation

Create a new conversation with participants.

**Endpoint:** `POST /messages/conversations`

**Request Body:**
```json
{
  "type": "property_thread",
  "title": "Property Inquiry - 2BR Apartment",
  "description": "Discussion about the property listing",
  "participantIds": ["user-123", "user-456"],
  "propertyId": "prop-789",
  "applicationId": "app-101",
  "settings": {
    "allowFileSharing": true,
    "autoTranslate": false,
    "businessHoursOnly": false
  },
  "metadata": {
    "county": "Nairobi",
    "city": "Westlands"
  }
}
```

**Response:**
```json
{
  "conversation": {
    "_id": "conv-123",
    "type": "property_thread",
    "title": "Property Inquiry - 2BR Apartment",
    "status": "active",
    "participants": [...],
    "createdBy": "user-789",
    "messageCount": 0,
    "lastActivity": "2025-10-27T10:00:00.000Z"
  },
  "participants": [...],
  "unreadCount": 0,
  "canWrite": true,
  "canAddParticipants": true
}
```

---

#### 2. List Conversations

Get paginated list of conversations for the current user.

**Endpoint:** `GET /messages/conversations`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `type` (string, optional): Filter by conversation type
- `status` (string, optional): Filter by status (active, archived, etc.)
- `hasUnread` (boolean, optional): Filter by unread status
- `propertyId` (string, optional): Filter by property
- `applicationId` (string, optional): Filter by application
- `search` (string, optional): Search in title and description
- `isArchived` (boolean, optional): Filter archived conversations
- `createdAfter` (date, optional): Filter by creation date
- `lastActivityAfter` (date, optional): Filter by last activity
- `sortBy` (string, optional): Sort field (default: lastActivity)
- `sortOrder` (string, optional): Sort order (asc/desc, default: desc)

**Example Request:**
```
GET /messages/conversations?page=1&limit=20&status=active&hasUnread=true
```

**Response:**
```json
{
  "conversations": [
    {
      "conversation": {...},
      "participants": [...],
      "lastMessage": {...},
      "unreadCount": 5,
      "canWrite": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "filters": {...}
}
```

---

#### 3. Get Conversation

Get details of a specific conversation.

**Endpoint:** `GET /messages/conversations/:conversationId`

**Response:**
```json
{
  "conversation": {
    "_id": "conv-123",
    "type": "property_thread",
    "title": "Property Inquiry",
    "status": "active",
    "participants": [...],
    "messageCount": 15,
    "lastActivity": "2025-10-27T10:00:00.000Z"
  },
  "participants": [
    {
      "user": {
        "_id": "user-123",
        "firstName": "John",
        "lastName": "Doe"
      },
      "role": "tenant",
      "isOnline": true
    }
  ],
  "lastMessage": {...},
  "unreadCount": 3,
  "canWrite": true,
  "canAddParticipants": false
}
```

---

#### 4. Update Conversation

Update conversation details.

**Endpoint:** `PATCH /messages/conversations/:conversationId`

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "active",
  "settings": {
    "allowFileSharing": false
  },
  "metadata": {
    "additionalInfo": "value"
  }
}
```

**Response:**
```json
{
  "conversation": {...},
  "participants": [...],
  "unreadCount": 0
}
```

---

#### 5. Add Participant

Add a new participant to a conversation.

**Endpoint:** `POST /messages/conversations/:conversationId/participants`

**Request Body:**
```json
{
  "userId": "user-999",
  "role": "tenant",
  "permissions": {
    "canRead": true,
    "canWrite": true,
    "canAddParticipants": false,
    "canRemoveParticipants": false,
    "canDeleteMessages": false,
    "canPinMessages": false
  }
}
```

**Response:**
```json
{
  "conversation": {...},
  "participants": [...]
}
```

---

#### 6. Remove Participant

Remove a participant from a conversation.

**Endpoint:** `DELETE /messages/conversations/:conversationId/participants/:participantId`

**Response:**
```json
{
  "conversation": {...},
  "participants": [...]
}
```

---

#### 7. Get Conversation Analytics

Get analytics for a specific conversation.

**Endpoint:** `GET /messages/conversations/:conversationId/analytics`

**Query Parameters:**
- `startDate` (date, optional): Start date for analytics
- `endDate` (date, optional): End date for analytics

**Response:**
```json
{
  "totalConversations": 1,
  "activeConversations": 1,
  "conversationsByType": {
    "property_thread": 1
  },
  "averageParticipants": 3,
  "averageMessageCount": 25,
  "responseTimeMetrics": {
    "average": 1200,
    "p50": 900,
    "p90": 2400,
    "p99": 4800
  },
  "engagementMetrics": {
    "dailyActiveUsers": 5,
    "messagesPerUser": 8.5,
    "conversationsPerUser": 2.3
  }
}
```

---

### Messages

#### 8. Send Message

Send a new message to a conversation.

**Endpoint:** `POST /messages`

**Request Body:**
```json
{
  "conversationId": "conv-123",
  "content": "Hello! I'm interested in this property.",
  "type": "text",
  "priority": "normal",
  "replyToMessageId": "msg-456",
  "attachments": [
    {
      "type": "document",
      "file": {...}
    }
  ],
  "autoTranslate": false,
  "metadata": {
    "source": "web"
  }
}
```

**Response:**
```json
{
  "message": {
    "_id": "msg-789",
    "conversationId": "conv-123",
    "senderId": "user-123",
    "type": "text",
    "content": "Hello! I'm interested in this property.",
    "status": "sent",
    "priority": "normal",
    "sentAt": "2025-10-27T10:00:00.000Z",
    "deliveries": [...]
  },
  "sender": {
    "_id": "user-123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "tenant"
  },
  "conversation": {
    "_id": "conv-123",
    "title": "Property Inquiry",
    "type": "property_thread"
  },
  "isDelivered": true,
  "isRead": false,
  "canEdit": true,
  "canDelete": true
}
```

---

#### 9. Get Messages

Get paginated list of messages for a conversation.

**Endpoint:** `GET /messages/:conversationId`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 100)
- `senderId` (string, optional): Filter by sender
- `type` (string, optional): Filter by message type
- `status` (string, optional): Filter by status
- `priority` (string, optional): Filter by priority
- `hasAttachments` (boolean, optional): Filter messages with attachments
- `search` (string, optional): Full-text search
- `dateFrom` (date, optional): Filter from date
- `dateTo` (date, optional): Filter to date
- `isDeleted` (boolean, optional): Include deleted messages (default: false)

**Example Request:**
```
GET /messages/conv-123?page=1&limit=50&type=text&hasAttachments=false
```

**Response:**
```json
{
  "messages": [
    {
      "message": {...},
      "sender": {...},
      "conversation": {...},
      "isDelivered": true,
      "isRead": true,
      "canEdit": true,
      "canDelete": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3
  },
  "conversation": {
    "_id": "conv-123",
    "title": "Property Inquiry",
    "type": "property_thread",
    "participants": 3
  },
  "filters": {...}
}
```

---

#### 10. Mark Message as Read

Mark a message as read by the current user.

**Endpoint:** `PUT /messages/:messageId/read`

**Response:**
```json
{
  "success": true,
  "messageId": "msg-789"
}
```

---

#### 11. Edit Message

Edit message content (within 24 hours of sending).

**Endpoint:** `PATCH /messages/:messageId`

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response:**
```json
{
  "message": {
    "_id": "msg-789",
    "content": "Updated message content",
    "isEdited": true,
    "editedAt": "2025-10-27T11:00:00.000Z",
    ...
  },
  "sender": {...},
  "conversation": {...}
}
```

---

#### 12. Delete Message

Soft delete a message.

**Endpoint:** `DELETE /messages/:messageId`

**Response:**
```json
{
  "success": true,
  "messageId": "msg-789"
}
```

---

### Bulk Operations

#### 13. Send Bulk Messages

Send the same message to multiple conversations.

**Endpoint:** `POST /messages/bulk`

**Request Body:**
```json
{
  "conversationIds": ["conv-123", "conv-456", "conv-789"],
  "content": "Important announcement for all tenants",
  "type": "announcement",
  "priority": "high",
  "scheduledFor": "2025-10-27T15:00:00.000Z",
  "metadata": {
    "campaign": "rent-reminder"
  }
}
```

**Response:**
```json
{
  "success": 3,
  "failed": 0,
  "errors": []
}
```

---

### Analytics

#### 14. Get Overall Analytics

Get analytics for all conversations.

**Endpoint:** `GET /messages/analytics`

**Query Parameters:**
- `startDate` (date, optional): Start date for analytics
- `endDate` (date, optional): End date for analytics

**Response:**
```json
{
  "totalConversations": 150,
  "activeConversations": 85,
  "conversationsByType": {
    "property_thread": 60,
    "direct": 45,
    "support": 30,
    "group": 15
  },
  "averageParticipants": 2.8,
  "averageMessageCount": 42.5,
  "responseTimeMetrics": {
    "average": 1800,
    "p50": 1200,
    "p90": 3600,
    "p99": 7200
  },
  "engagementMetrics": {
    "dailyActiveUsers": 250,
    "messagesPerUser": 12.3,
    "conversationsPerUser": 3.2
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request parameters",
  "details": {...}
}
```

### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "CONVERSATION_NOT_FOUND",
  "message": "Conversation not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Messages can only be sent during business hours"
}
```

### 500 Internal Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

---

## Message Types

- `text` - Plain text message
- `system` - System-generated message
- `attachment` - Message with attachments
- `property_inquiry` - Property-related inquiry
- `application_discussion` - Application discussion
- `payment_notification` - Payment-related notification
- `maintenance_request` - Maintenance request
- `renewal_discussion` - Lease renewal discussion
- `complaint` - Tenant complaint
- `announcement` - General announcement

## Conversation Types

- `direct` - One-on-one conversation
- `group` - Group conversation
- `support` - Support conversation
- `property_thread` - Property-specific thread
- `application_thread` - Application-specific thread
- `system` - System conversation

## Participant Roles

- `tenant` - Tenant user
- `landlord` - Property landlord
- `agent` - Property agent
- `admin` - System administrator
- `support` - Support staff
- `system` - System user

## Message Priority

- `low` - Low priority
- `normal` - Normal priority (default)
- `high` - High priority
- `urgent` - Urgent priority

## Conversation Status

- `active` - Active conversation
- `archived` - Archived conversation
- `muted` - Muted conversation
- `blocked` - Blocked conversation
- `closed` - Closed conversation

---

## Kenya-Specific Features

### Business Hours

Messages sent with `businessHoursOnly: true` will only be delivered during Kenyan business hours (8 AM - 6 PM EAT, Monday - Friday).

### M-Pesa Detection

The system automatically detects M-Pesa related messages and tracks them in analytics.

### Swahili Support

The system supports Swahili content and can auto-translate messages when `autoTranslate: true` is set.

### Timezone

All timestamps are in UTC but respect the `Africa/Nairobi` timezone for business hours validation.

---

## Rate Limits

- Message sending: 100 messages per minute per user
- Bulk messages: 10 requests per minute per user
- API calls: 1000 requests per hour per user

---

## Webhook Events

The following webhook events are triggered:

- `conversation.created` - New conversation created
- `conversation.updated` - Conversation updated
- `conversation.deleted` - Conversation deleted
- `message.sent` - New message sent
- `message.delivered` - Message delivered
- `message.read` - Message read
- `message.edited` - Message edited
- `message.deleted` - Message deleted
- `participant.added` - Participant added to conversation
- `participant.removed` - Participant removed from conversation

---

## Best Practices

1. **Pagination**: Always use pagination for listing conversations and messages
2. **Real-time Updates**: Use WebSocket for real-time updates instead of polling
3. **Error Handling**: Implement proper error handling for all API calls
4. **Retry Logic**: Implement exponential backoff for failed requests
5. **Caching**: Cache conversation data to reduce API calls
6. **Message Batching**: Use bulk operations when sending to multiple conversations
7. **Read Receipts**: Always mark messages as read to improve user experience
8. **File Uploads**: Validate file sizes and types before uploading
9. **Search**: Use full-text search for better message discovery
10. **Analytics**: Regularly check analytics to monitor conversation health

---

## SDKs and Libraries

- **JavaScript/TypeScript**: Native Elysia client
- **React**: Use with React Query or SWR for data fetching
- **React Native**: Compatible with mobile apps
- **WebSocket**: Use native WebSocket or Socket.IO client

---

## Support

For API support or questions, contact the development team or refer to the main documentation.

