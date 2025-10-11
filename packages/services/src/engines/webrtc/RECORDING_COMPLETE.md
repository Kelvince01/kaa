# WebRTC Recording System - Complete Implementation

## Overview

The WebRTC recording system provides comprehensive video call recording capabilities with support for multi-participant recording, real-time processing, and flexible storage options.

## Architecture

### Components

1. **WebRTCRecordingEngine** (`webrtc-recording.engine.ts`)
   - Core recording logic
   - Chunk management
   - Media processing
   - Storage handling

2. **WebRTCMediaServerEngine** (`webrtc-media-server.engine.ts`)
   - Recording orchestration
   - Track capture
   - Participant management
   - Event coordination

3. **VideoCallingWebRTCEngine** (`video-calling-webrtc.engine.ts`)
   - Business logic layer
   - Database integration
   - Permission management

4. **VideoCallingWebRTCService** (`video-calling-webrtc.service.ts`)
   - Service layer
   - API integration
   - User authentication

5. **VideoCallingController** (`video-calling.controller.ts`)
   - REST API endpoints
   - Request validation
   - Response formatting

## Data Flow

```
Client Request
    ↓
Controller (REST API)
    ↓
Service (Business Logic)
    ↓
Engine (Core Logic)
    ↓
Media Server (WebRTC)
    ↓
Recording Engine (Processing)
    ↓
Storage (File System/Cloud)
```

## API Endpoints

### Start Recording
```http
POST /video-calls/:callId/recording/start
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recordingId": "rec_room123_1234567890",
    "roomId": "room123",
    "startedAt": "2025-10-10T12:00:00Z",
    "status": "recording"
  },
  "message": "Recording started successfully"
}
```

### Stop Recording
```http
POST /video-calls/:callId/recording/stop
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Recording stopped successfully"
}
```

### Get Recording Status
```http
GET /video-calls/:callId/recording/:recordingId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rec_room123_1234567890",
    "roomId": "room123",
    "status": "completed",
    "startedAt": "2025-10-10T12:00:00Z",
    "stoppedAt": "2025-10-10T12:30:00Z",
    "duration": 1800000,
    "outputPath": "/recordings/rec_room123_1234567890.webm",
    "size": 52428800,
    "participants": [
      {
        "id": "user1",
        "audioChunks": 1800,
        "videoChunks": 1800
      }
    ]
  },
  "message": "Recording status retrieved successfully"
}
```

### Delete Recording
```http
DELETE /video-calls/:callId/recording/:recordingId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Recording deleted successfully"
}
```

## Recording Process

### 1. Start Recording

```typescript
// Client initiates recording
const response = await fetch('/video-calls/room123/recording/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  }
});

const { data } = await response.json();
console.log('Recording ID:', data.recordingId);
```

**Server-side flow:**
1. Controller validates user is host
2. Service checks permissions
3. Engine creates recording session
4. Media server starts capturing tracks
5. Recording engine initializes storage

### 2. Capture Media

The media server automatically captures audio and video tracks from all participants:

```typescript
// Simplified capture flow
private captureTrack(
  recordingId: string,
  participantId: string,
  track: MediaStreamTrack
): void {
  // Create MediaRecorder for track
  const recorder = new MediaRecorder(track);
  
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      // Send chunk to recording engine
      this.recordingEngine.addChunk(
        recordingId,
        participantId,
        event.data,
        track.kind
      );
    }
  };
  
  recorder.start(1000); // Capture every second
}
```

### 3. Process Recording

When recording stops, the system processes all captured chunks:

```typescript
async processRecording(recordingId: string): Promise<RecordingResult> {
  const recording = this.recordings.get(recordingId);
  
  // 1. Combine chunks per participant
  const participantStreams = this.combineParticipantChunks(recording);
  
  // 2. Mix all streams into single output
  const outputPath = await this.mixStreams(
    recordingId,
    participantStreams
  );
  
  // 3. Generate metadata
  const metadata = this.generateMetadata(recording);
  
  // 4. Upload to storage (if configured)
  if (this.config.storage.type === 'cloud') {
    await this.uploadToCloud(outputPath);
  }
  
  return {
    recordingId,
    outputPath,
    duration: recording.stoppedAt - recording.startedAt,
    size: await this.getFileSize(outputPath)
  };
}
```

### 4. Storage

Recordings are stored based on configuration:

```typescript
const config = {
  storage: {
    type: 'local', // or 'cloud'
    path: './recordings',
    // Cloud storage options
    cloud: {
      provider: 's3',
      bucket: 'my-recordings',
      region: 'us-east-1'
    }
  }
};
```

## Configuration

### Recording Engine Config

```typescript
interface RecordingConfig {
  outputDir: string;           // Where to save recordings
  format: 'webm' | 'mp4';     // Output format
  videoCodec: string;          // e.g., 'vp8', 'h264'
  audioCodec: string;          // e.g., 'opus', 'aac'
  videoBitrate: number;        // bits per second
  audioBitrate: number;        // bits per second
  storage: {
    type: 'local' | 'cloud';
    path: string;
    cloud?: {
      provider: 's3' | 'gcs' | 'azure';
      bucket: string;
      region: string;
      credentials?: any;
    };
  };
}
```

### Media Server Config

```typescript
interface MediaServerConfig {
  iceServers: RTCIceServer[];
  maxParticipantsPerRoom: number;
  recordingEnabled: boolean;
  qualityMonitoringInterval: number;
  bandwidthLimits: {
    audio: number;
    video: number;
  };
}
```

## Events

The recording system emits various events for monitoring:

```typescript
// Recording started
webrtcServer.on('recordingstarted', ({ roomId, recordingId }) => {
  console.log(`Recording ${recordingId} started for room ${roomId}`);
});

// Recording stopped
webrtcServer.on('recordingstopped', ({ roomId, recordingId, duration }) => {
  console.log(`Recording ${recordingId} stopped after ${duration}ms`);
});

// Recording completed
webrtcServer.on('recordingcompleted', ({ recordingId, outputPath, size }) => {
  console.log(`Recording ${recordingId} completed: ${outputPath} (${size} bytes)`);
});

// Recording failed
webrtcServer.on('recordingfailed', ({ recordingId, error }) => {
  console.error(`Recording ${recordingId} failed:`, error);
});
```

## Error Handling

### Common Errors

1. **Recording not enabled**
```json
{
  "success": false,
  "error": "Recording is not enabled",
  "message": "Recording is not enabled"
}
```

2. **Permission denied**
```json
{
  "success": false,
  "error": "Only the host can start recording",
  "message": "Only the host can start recording"
}
```

3. **Recording already in progress**
```json
{
  "success": false,
  "error": "Recording already in progress",
  "message": "Recording already in progress"
}
```

4. **Recording not found**
```json
{
  "success": false,
  "error": "Recording not found",
  "message": "Recording not found"
}
```

## Performance Considerations

### Memory Management

- Chunks are buffered in memory during recording
- Large recordings may require significant RAM
- Consider streaming directly to disk for long recordings

### CPU Usage

- Video encoding is CPU-intensive
- Use hardware acceleration when available
- Consider offloading to dedicated encoding servers

### Storage

- Recordings can be large (1-2 GB per hour)
- Implement automatic cleanup policies
- Use compression to reduce storage costs

## Security

### Access Control

- Only call host can start/stop recordings
- All participants must be notified when recording starts
- Recordings are associated with the call owner

### Data Protection

- Recordings contain sensitive audio/video data
- Implement encryption at rest
- Use secure transfer protocols (HTTPS, TLS)
- Follow data retention policies

## Testing

### Unit Tests

```typescript
describe('WebRTCRecordingEngine', () => {
  it('should start recording', async () => {
    const recordingId = await engine.startRecording('room123');
    expect(recordingId).toMatch(/^rec_/);
  });
  
  it('should capture chunks', async () => {
    await engine.addChunk(recordingId, 'user1', chunk, 'video');
    const status = await engine.getRecordingStatus(recordingId);
    expect(status.participants[0].videoChunks).toBe(1);
  });
  
  it('should process recording', async () => {
    await engine.stopRecording(recordingId);
    const result = await engine.processRecording(recordingId);
    expect(result.outputPath).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Recording API', () => {
  it('should start and stop recording', async () => {
    // Start recording
    const startRes = await request(app)
      .post('/video-calls/room123/recording/start')
      .set('Authorization', 'Bearer <token>');
    
    expect(startRes.status).toBe(200);
    const { recordingId } = startRes.body.data;
    
    // Stop recording
    const stopRes = await request(app)
      .post('/video-calls/room123/recording/stop')
      .set('Authorization', 'Bearer <token>');
    
    expect(stopRes.status).toBe(200);
    
    // Check status
    const statusRes = await request(app)
      .get(`/video-calls/room123/recording/${recordingId}`)
      .set('Authorization', 'Bearer <token>');
    
    expect(statusRes.body.data.status).toBe('completed');
  });
});
```

## Future Enhancements

1. **Live Streaming**
   - Stream recordings to CDN in real-time
   - Support for HLS/DASH protocols

2. **Transcription**
   - Automatic speech-to-text
   - Multi-language support

3. **Highlights**
   - AI-powered highlight detection
   - Automatic clip generation

4. **Analytics**
   - Speaker time tracking
   - Engagement metrics
   - Quality analytics

5. **Collaboration**
   - Shared annotations
   - Timestamped comments
   - Collaborative editing

## Troubleshooting

### Recording doesn't start

1. Check if recording is enabled in config
2. Verify user has host permissions
3. Check WebRTC connection status
4. Review server logs for errors

### Poor recording quality

1. Check network bandwidth
2. Adjust bitrate settings
3. Verify codec support
4. Monitor CPU usage

### Large file sizes

1. Adjust video bitrate
2. Use more efficient codecs
3. Implement compression
4. Consider lower resolution

### Processing failures

1. Check disk space
2. Verify FFmpeg installation
3. Review encoding settings
4. Check file permissions

## Support

For issues or questions:
- Check the logs in `./logs/recording.log`
- Review the WebRTC connection status
- Contact support with recording ID and error details
