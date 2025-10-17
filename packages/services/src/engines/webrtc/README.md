# WebRTC Engine

A complete native WebRTC implementation for video calling, recording, and real-time communication.

## 🎯 Overview

This WebRTC engine provides a full-featured video calling solution with:

- **Native WebRTC** - No external dependencies (except STUN/TURN servers)
- **Elysia WebSocket Integration** - Seamless integration with Elysia framework
- **Recording System** - Multi-participant recording with cloud storage
- **SFU Architecture** - Selective Forwarding Unit for scalable multi-party calls
- **Real-time Signaling** - WebSocket-based signaling server

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  WebRTC Client (Browser/React Native)                 │     │
│  │  - Media capture (audio/video)                        │     │
│  │  - Peer connection management                          │     │
│  │  - Signaling via WebSocket                             │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Elysia WebSocket Controller                          │     │
│  │  - Authentication (JWT)                               │     │
│  │  - Message routing                                    │     │
│  │  - Connection management                              │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  VideoCallingWebRTCService                             │     │
│  │  - Business logic                                       │     │
│  │  - Database integration                                 │     │
│  │  - User management                                     │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Engine Layer                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  VideoCallingWebRTCEngine                              │     │
│  │  - Call management                                     │     │
│  │  - Participant tracking                                │     │
│  │  - Recording coordination                              │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Media Server Layer                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  WebRTCMediaServerEngine                               │     │
│  │  - Room management                                     │     │
│  │  - SFU orchestration                                   │     │
│  │  - Recording orchestration                             │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Core WebRTC Layer                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  WebRTCSignalingEngine  │  WebRTCSFUEngine           │     │
│  │  - WebSocket signaling  │  - Multi-peer management   │     │
│  │  - Room management      │  - Track routing           │     │
│  │  - Message routing      │  - Quality monitoring      │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  WebRTCPeerEngine      │  WebRTCRecordingEngine      │     │
│  │  - Individual peers    │  - Media capture            │     │
│  │  - ICE handling        │  - Chunk processing         │     │
│  │  - Track management    │  - Cloud storage            │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Initialize the Service

```typescript
import { videoCallingService } from './video-calling-webrtc.service';

// Initialize the service
videoCallingService.initialize();
```

### 2. WebSocket Connection

```typescript
// Elysia WebSocket route
.ws("/video-calls/ws", {
  open(ws) {
    const user = ws.data.user;
    videoCallingService.handleWebSocketConnection(ws, user.id);
  },
  
  message(ws, message) {
    videoCallingService.handleWebSocketMessage(ws, message);
  },
  
  close(ws) {
    videoCallingService.handleWebSocketClose(ws);
  }
})
```

### 3. Client Connection

```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/video-calls/ws', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Join a call
ws.send(JSON.stringify({
  type: 'join',
  roomId: 'call_123',
  userId: 'user_456'
}));
```

## 📡 Signaling Messages

### Join Room

```json
{
  "type": "join",
  "roomId": "call_123",
  "userId": "user_456",
  "data": {
    "metadata": "optional data"
  }
}
```

### WebRTC Offer

```json
{
  "type": "offer",
  "roomId": "call_123",
  "userId": "user_456",
  "targetUserId": "user_789",
  "data": {
    "sdp": "offer_sdp_string"
  }
}
```

### WebRTC Answer

```json
{
  "type": "answer",
  "roomId": "call_123",
  "userId": "user_456",
  "targetUserId": "user_789",
  "data": {
    "sdp": "answer_sdp_string"
  }
}
```

### ICE Candidate

```json
{
  "type": "ice-candidate",
  "roomId": "call_123",
  "userId": "user_456",
  "targetUserId": "user_789",
  "data": {
    "candidate": "ice_candidate_string"
  }
}
```

### Media Controls

```json
{
  "type": "mute",
  "roomId": "call_123",
  "userId": "user_456"
}
```

## 🎥 Recording System

### Start Recording

```typescript
// Start recording a call
const recordingId = await videoCallingService.startRecording('call_123');
```

### Stop Recording

```typescript
// Stop recording
await videoCallingService.stopRecording('call_123');
```

### Get Recording Status

```typescript
// Get recording status
const status = await videoCallingService.getRecordingStatus(recordingId);
```

### Delete Recording

```typescript
// Delete recording
await videoCallingService.deleteRecording(recordingId);
```

## 🔧 Configuration

### WebRTC Configuration

```typescript
const webrtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  encodingOptions: {
    audio: {
      bitrate: 128000,
      codec: 'opus'
    },
    video: {
      bitrate: { min: 500000, max: 2000000 },
      codec: 'vp8',
      framerate: 30,
      resolution: { width: 1280, height: 720 }
    }
  }
};
```

### Recording Configuration

```typescript
const recordingConfig = {
  outputDir: './recordings',
  format: 'webm',
  videoCodec: 'vp8',
  audioCodec: 'opus',
  videoBitrate: 2000000,
  audioBitrate: 128000,
  framerate: 30,
  resolution: { width: 1280, height: 720 },
  storage: {
    provider: 's3', // 'local' | 's3' | 'gcs' | 'vercel-blob'
    s3: {
      bucket: 'your-bucket',
      region: 'us-east-1',
      accessKeyId: 'your-key',
      secretAccessKey: 'your-secret'
    }
  }
};
```

## 🌐 Environment Variables

```bash
# WebRTC Configuration
WEBRTC_ICE_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
WEBRTC_TURN_SERVER_URL=turn:your-turn-server.com:3478
WEBRTC_TURN_USERNAME=username
WEBRTC_TURN_PASSWORD=password

# Recording Configuration
RECORDING_STORAGE_PROVIDER=local # local | s3 | gcs | vercel-blob
RECORDING_OUTPUT_DIR=./recordings
RECORDING_S3_BUCKET=your-bucket
RECORDING_S3_REGION=us-east-1
RECORDING_S3_ACCESS_KEY_ID=your-key
RECORDING_S3_SECRET_ACCESS_KEY=your-secret

# Cloud Storage (S3)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1

# Cloud Storage (GCS)
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
```

## 📊 API Endpoints

### Video Call Management

- `POST /video-calls` - Create a new call
- `GET /video-calls/:id` - Get call details
- `PUT /video-calls/:id` - Update call
- `DELETE /video-calls/:id` - End call

### Recording Management

- `POST /video-calls/:callId/recording/start` - Start recording
- `POST /video-calls/:callId/recording/stop` - Stop recording
- `GET /video-calls/:callId/recording/:recordingId` - Get recording status
- `DELETE /video-calls/:callId/recording/:recordingId` - Delete recording

### WebSocket Endpoint

- `WS /video-calls/ws` - WebRTC signaling

## 🧪 Testing

### Test WebSocket Connection

```bash
# Connect to WebSocket
wscat -c "ws://localhost:3000/video-calls/ws" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send join message
> {"type":"join","roomId":"call_123","userId":"user_456"}

# Send offer
> {"type":"offer","roomId":"call_123","userId":"user_456","targetUserId":"user_789","data":{"sdp":"offer_sdp"}}
```

### Test Recording

```bash
# Start recording
curl -X POST "http://localhost:3000/video-calls/call_123/recording/start" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Stop recording
curl -X POST "http://localhost:3000/video-calls/call_123/recording/stop" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔒 Security

### Authentication

- JWT-based authentication via Elysia middleware
- Automatic user validation on WebSocket connection
- Role-based access control

### WebRTC Security

- Secure WebSocket connections (WSS)
- TURN server support for NAT traversal
- ICE candidate validation
- Media encryption (DTLS/SRTP)

## 📈 Monitoring

### Server Statistics

```typescript
const stats = videoCallingService.getServerStats();
console.log({
  rooms: stats.rooms,
  participants: stats.participants,
  recordings: stats.recordings
});
```

### Room Statistics

```typescript
const roomStats = await videoCallingService.getRoomStats('call_123');
console.log({
  participantCount: roomStats.participantCount,
  participants: roomStats.participants,
  recording: roomStats.recording
});
```

## 🚀 Deployment

### Production Checklist

- [ ] Configure TURN servers for NAT traversal
- [ ] Set up cloud storage for recordings
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up backup systems

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Common Issues

#### WebSocket Connection Failed

- Check authentication token
- Verify WebSocket URL
- Check CORS settings

#### WebRTC Connection Failed

- Check ICE servers configuration
- Verify TURN server credentials
- Check firewall settings

#### Recording Issues

- Check storage permissions
- Verify cloud storage credentials
- Check disk space

### Debug Mode

```typescript
// Enable debug logging
process.env.DEBUG = 'webrtc:*';
```

## 📚 Examples

### Complete Client Implementation

```typescript
class WebRTCClient {
  private ws: WebSocket;
  private pc: RTCPeerConnection;
  
  constructor(token: string) {
    this.ws = new WebSocket('ws://localhost:3000/video-calls/ws', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    this.setupWebSocket();
    this.setupPeerConnection();
  }
  
  private setupWebSocket() {
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        type: 'join',
        roomId: 'call_123',
        userId: 'user_456'
      }));
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleSignalingMessage(message);
    };
  }
  
  private setupPeerConnection() {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws.send(JSON.stringify({
          type: 'ice-candidate',
          roomId: 'call_123',
          userId: 'user_456',
          targetUserId: 'user_789',
          data: { candidate: event.candidate }
        }));
      }
    };
  }
  
  private async handleSignalingMessage(message: any) {
    switch (message.type) {
      case 'offer':
        await this.pc.setRemoteDescription(message.data.sdp);
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.ws.send(JSON.stringify({
          type: 'answer',
          roomId: 'call_123',
          userId: 'user_456',
          targetUserId: message.userId,
          data: { sdp: answer }
        }));
        break;
        
      case 'answer':
        await this.pc.setRemoteDescription(message.data.sdp);
        break;
        
      case 'ice-candidate':
        await this.pc.addIceCandidate(message.data.candidate);
        break;
    }
  }
}
```

## 📄 License

This WebRTC engine is part of the KAA project and follows the same licensing terms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the examples and documentation
