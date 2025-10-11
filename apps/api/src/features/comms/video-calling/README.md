# Video Calling API

REST API endpoints for video calling and property tours with Agora integration.

## Base URL

```
/api/video-calls
```

## Authentication

All endpoints require authentication via headers:

- `x-user-id`: Current user ID
- `x-org-id`: Organization ID (optional)

## Endpoints

### Create Video Call

Create a new video call or property tour.

```http
POST /api/video-calls
Content-Type: application/json

{
  "type": "property_tour",
  "title": "Virtual Tour - 2BR Apartment",
  "description": "Modern apartment in Westlands",
  "propertyId": "prop-123",
  "maxParticipants": 5,
  "isRecorded": true,
  "settings": {
    "allowScreenShare": true,
    "allowRecording": true,
    "muteOnJoin": false,
    "videoOnJoin": true,
    "waitingRoom": false
  },
  "kenyaSpecific": {
    "county": "Nairobi",
    "language": "en",
    "dataUsageWarning": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "call-123",
    "type": "property_tour",
    "status": "scheduled",
    "title": "Virtual Tour - 2BR Apartment",
    "host": "user-123",
    "participants": [],
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "message": "Video call created successfully"
}
```

### Generate Agora Token

Generate an Agora RTC token for joining a call.

```http
POST /api/video-calls/:callId/token
Content-Type: application/json

{
  "role": "publisher"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "006abc123...",
    "channelName": "call-123",
    "uid": "user-123",
    "expiresAt": "2024-01-15T11:00:00Z"
  },
  "message": "Token generated successfully"
}
```

### Join Call

Join a video call and get Agora credentials.

```http
POST /api/video-calls/:callId/join
Content-Type: application/json

{
  "displayName": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "audio": true,
  "video": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "participant": {
      "id": "participant-123",
      "userId": "user-123",
      "displayName": "John Doe",
      "role": "guest"
    },
    "token": "006abc123...",
    "channelName": "call-123",
    "expiresAt": "2024-01-15T11:00:00Z"
  },
  "message": "Joined call successfully"
}
```

### Leave Call

Leave a video call.

```http
POST /api/video-calls/:callId/leave
```

**Response:**

```json
{
  "success": true,
  "message": "Left call successfully"
}
```

### End Call

End a video call (host only).

```http
POST /api/video-calls/:callId/end
```

**Response:**

```json
{
  "success": true,
  "message": "Call ended successfully"
}
```

### Get Call Details

Get details of a specific video call.

```http
GET /api/video-calls/:callId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "call-123",
    "type": "property_tour",
    "status": "connected",
    "title": "Virtual Tour - 2BR Apartment",
    "host": "user-123",
    "participants": [
      {
        "id": "participant-123",
        "userId": "user-123",
        "displayName": "John Doe",
        "role": "host",
        "connectionState": "connected"
      }
    ],
    "analytics": {
      "participantCount": 1,
      "totalDuration": 300000,
      "averageQuality": "good"
    }
  },
  "message": "Call retrieved successfully"
}
```

### List Calls

List video calls for the current user.

```http
GET /api/video-calls?status=connected&type=property_tour&page=1&limit=20
```

**Query Parameters:**

- `status`: Filter by call status
- `type`: Filter by call type
- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**

```json
{
  "success": true,
  "data": {
    "calls": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  },
  "message": "Calls retrieved successfully"
}
```

## Property Tour Endpoints

### Create Property Tour

Create a property tour for a video call.

```http
POST /api/video-calls/:callId/tour
Content-Type: application/json

{
  "propertyId": "prop-123",
  "tourPlan": [
    {
      "id": "stop-1",
      "name": "Living Room",
      "description": "Spacious living area",
      "duration": 120,
      "highlights": ["Large windows", "Hardwood floors"],
      "interactionPoints": []
    },
    {
      "id": "stop-2",
      "name": "Master Bedroom",
      "description": "Comfortable bedroom",
      "duration": 90,
      "highlights": ["Walk-in closet", "City view"],
      "interactionPoints": []
    }
  ]
}
```

### Navigate Tour

Navigate to a specific stop in the property tour.

```http
POST /api/video-calls/:callId/tour/navigate
Content-Type: application/json

{
  "stopIndex": 1
}
```

### Add Tour Question

Add a question during the property tour.

```http
POST /api/video-calls/:callId/tour/question
Content-Type: application/json

{
  "question": "What is the monthly rent?",
  "category": "pricing"
}
```

## Recording Endpoints

### Start Recording

Start recording the video call (host only).

```http
POST /api/video-calls/:callId/recording/start
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "recording-123",
    "callId": "call-123",
    "status": "recording",
    "filename": "call_123_1234567890"
  },
  "message": "Recording started successfully"
}
```

### Stop Recording

Stop recording the video call (host only).

```http
POST /api/video-calls/:callId/recording/stop
```

## Media Control Endpoints

### Toggle Audio

Enable or disable audio in the call.

```http
POST /api/video-calls/:callId/audio
Content-Type: application/json

{
  "enabled": false
}
```

### Toggle Video

Enable or disable video in the call.

```http
POST /api/video-calls/:callId/video
Content-Type: application/json

{
  "enabled": false
}
```

### Start Screen Sharing

Start sharing screen in the call.

```http
POST /api/video-calls/:callId/screen-share/start
```

### Stop Screen Sharing

Stop sharing screen in the call.

```http
POST /api/video-calls/:callId/screen-share/stop
```

## Analytics Endpoints

### Update Network Quality

Update network quality metrics for the call.

```http
POST /api/video-calls/:callId/network-quality
Content-Type: application/json

{
  "bandwidth": {
    "upload": 1000000,
    "download": 2000000
  },
  "latency": 50,
  "jitter": 10,
  "packetLoss": 0.5,
  "connectionType": "wifi",
  "signalStrength": 85
}
```

### Get Call Analytics

Get analytics for a video call.

```http
GET /api/video-calls/:callId/analytics
```

**Response:**

```json
{
  "success": true,
  "data": {
    "participantCount": 3,
    "totalDuration": 1800000,
    "averageQuality": "good",
    "dropoutRate": 0.05,
    "reconnections": 2,
    "bandwidthUsage": {
      "total": 500000000,
      "average": 166666666,
      "peak": 200000000
    },
    "qualityMetrics": {
      "jitter": 15,
      "latency": 45,
      "packetLoss": 0.8
    },
    "deviceInfo": {
      "mobile": 2,
      "desktop": 1,
      "tablet": 0
    },
    "engagement": {
      "averageParticipationTime": 600000,
      "screenShareDuration": 300000,
      "chatMessages": 15
    }
  },
  "message": "Analytics retrieved successfully"
}
```

### Get Call Statistics

Get real-time statistics for a video call.

```http
GET /api/video-calls/:callId/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "local": {
      "audioSendBitrate": 32000,
      "videoSendBitrate": 800000
    },
    "remote": {
      "audioReceiveBitrate": 32000,
      "videoReceiveBitrate": 800000
    },
    "rtc": {
      "SendBitrate": 832000,
      "RecvBitrate": 832000,
      "RTT": 45
    }
  },
  "message": "Statistics retrieved successfully"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error code",
  "message": "Human-readable error message"
}
```

### Common Error Codes

- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Resource not found
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server error

## Call Types

- `property_tour` - Virtual property tour
- `tenant_interview` - Tenant screening interview
- `maintenance_call` - Maintenance support call
- `support_call` - Customer support call
- `consultation` - General consultation

## Call Statuses

- `scheduled` - Call is scheduled for future
- `initiating` - Call is being initiated
- `ringing` - Participants are being notified
- `connected` - Call is active
- `on_hold` - Call is on hold
- `ended` - Call has ended
- `failed` - Call failed to connect
- `cancelled` - Call was cancelled
- `missed` - Call was missed

## WebSocket Events

The video calling system also supports WebSocket connections for real-time updates. Connect to:

```
ws://your-domain/ws/video-calls
```

### Events

- `call:created` - New call created
- `participant:joined` - Participant joined
- `participant:left` - Participant left
- `call:ended` - Call ended
- `tour:navigated` - Tour navigated to new stop
- `question:added` - Question added to tour
- `recording:started` - Recording started
- `recording:stopped` - Recording stopped
- `network:quality` - Network quality update

## Rate Limits

- 100 requests per minute per user
- 10 concurrent calls per organization
- 50 participants maximum per call

## Best Practices

1. **Token Management**: Generate new tokens before expiry (1 hour)
2. **Error Handling**: Always handle network errors gracefully
3. **Quality Monitoring**: Monitor network quality and adapt
4. **Recording**: Only record when necessary to save costs
5. **Cleanup**: Always leave/end calls properly

## Example Client Integration

```typescript
// Create call
const response = await fetch('/api/video-calls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId
  },
  body: JSON.stringify({
    type: 'property_tour',
    title: 'Virtual Tour',
    kenyaSpecific: {
      county: 'Nairobi',
      language: 'en'
    }
  })
});

const { data: call } = await response.json();

// Join call
const joinResponse = await fetch(`/api/video-calls/${call._id}/join`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId
  },
  body: JSON.stringify({
    displayName: 'John Doe',
    audio: true,
    video: true
  })
});

const { data: joinData } = await joinResponse.json();

// Use Agora SDK with token
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
await client.join(appId, joinData.channelName, joinData.token, userId);
```

## Support

For issues or questions, contact the development team or refer to the main documentation.
