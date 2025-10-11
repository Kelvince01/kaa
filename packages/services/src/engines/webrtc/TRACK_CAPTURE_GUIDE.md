# Track Capture Implementation Guide

## Overview

This guide explains how to implement real track capture for the recording system. Currently, the system uses mock chunk capture. This guide will help you replace it with actual media capture.

## Challenge: Node.js Environment

The main challenge is that `MediaRecorder` is a browser API and not available in Node.js. We need alternative approaches for server-side recording.

## Solution Options

### Option 1: Client-Side Recording (Recommended for MVP)

Let clients capture and upload chunks to the server.

#### Advantages
- Uses native MediaRecorder API
- No server-side media processing
- Lower server CPU usage
- Works with existing WebRTC setup

#### Implementation

**Client Side (React/React Native):**

```typescript
class ClientRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordingId: string | null = null;
  private uploadInterval: NodeJS.Timeout | null = null;
  private chunks: Blob[] = [];

  async startRecording(stream: MediaStream, recordingId: string) {
    this.recordingId = recordingId;
    
    // Create MediaRecorder
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 1000000,
      audioBitsPerSecond: 128000
    });

    // Handle data available
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Upload chunks every 5 seconds
    this.uploadInterval = setInterval(() => {
      this.uploadChunks();
    }, 5000);

    // Start recording (capture every second)
    this.mediaRecorder.start(1000);
  }

  async uploadChunks() {
    if (this.chunks.length === 0) return;

    const chunksToUpload = [...this.chunks];
    this.chunks = [];

    const formData = new FormData();
    formData.append('recordingId', this.recordingId!);
    formData.append('participantId', this.participantId);
    
    for (let i = 0; i < chunksToUpload.length; i++) {
      formData.append(`chunk_${i}`, chunksToUpload[i]);
    }

    try {
      await fetch('/api/recording/upload-chunks', {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      console.error('Failed to upload chunks:', error);
      // Re-add chunks for retry
      this.chunks.unshift(...chunksToUpload);
    }
  }

  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
    }

    // Upload remaining chunks
    this.uploadChunks();
  }
}
```

**Server Side:**

```typescript
// Add endpoint to receive chunks
app.post('/api/recording/upload-chunks', async (req, res) => {
  const { recordingId, participantId } = req.body;
  const files = req.files; // Using multer or similar

  for (const file of files) {
    const chunk = await fs.readFile(file.path);
    
    await recordingEngine.addChunk(
      recordingId,
      participantId,
      chunk,
      'video' // or determine from file
    );
  }

  res.json({ success: true });
});
```

### Option 2: Server-Side with node-webrtc

Use `wrtc` package for server-side WebRTC.

#### Installation

```bash
bun add wrtc
```

#### Implementation

```typescript
import { RTCPeerConnection, RTCSessionDescription } from 'wrtc';

class ServerSideRecorder {
  private peerConnection: RTCPeerConnection;
  private recordingStreams: Map<string, MediaStream> = new Map();

  constructor() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    this.setupTrackHandlers();
  }

  private setupTrackHandlers() {
    this.peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      const track = event.track;

      // Store stream
      this.recordingStreams.set(stream.id, stream);

      // Capture track data
      this.captureTrack(track, stream.id);
    };
  }

  private captureTrack(track: MediaStreamTrack, streamId: string) {
    // Use node-canvas or similar to capture frames
    // This is complex and requires additional libraries
    
    // For audio, you can use node-speaker or similar
    // For video, you need to decode frames
  }
}
```

**Note:** This approach is complex and has performance implications.

### Option 3: FFmpeg with RTMP (Production Recommended)

Use FFmpeg to capture RTMP streams from clients.

#### Architecture

```
Client → RTMP Stream → FFmpeg → Recording File
```

#### Implementation

**Client Side:**

```typescript
// Use a library like rtmp-publisher
import RTMPPublisher from 'rtmp-publisher';

const publisher = new RTMPPublisher();
await publisher.connect('rtmp://server/live/stream-key');
await publisher.publish(mediaStream);
```

**Server Side:**

```typescript
import { spawn } from 'child_process';

class FFmpegRecorder {
  private ffmpegProcess: any;

  startRecording(streamKey: string, outputPath: string) {
    this.ffmpegProcess = spawn('ffmpeg', [
      '-i', `rtmp://localhost/live/${streamKey}`,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-f', 'mp4',
      outputPath
    ]);

    this.ffmpegProcess.stderr.on('data', (data: Buffer) => {
      console.log('FFmpeg:', data.toString());
    });
  }

  stopRecording() {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGINT');
    }
  }
}
```

### Option 4: GStreamer Pipeline

Use GStreamer for advanced media processing.

```bash
# Install GStreamer
apt-get install gstreamer1.0-tools gstreamer1.0-plugins-good
```

```typescript
import { spawn } from 'child_process';

class GStreamerRecorder {
  startRecording(rtpPort: number, outputPath: string) {
    const pipeline = spawn('gst-launch-1.0', [
      'udpsrc', `port=${rtpPort}`,
      '!', 'application/x-rtp',
      '!', 'rtpvp8depay',
      '!', 'vp8dec',
      '!', 'videoconvert',
      '!', 'x264enc',
      '!', 'mp4mux',
      '!', 'filesink', `location=${outputPath}`
    ]);
  }
}
```

## Recommended Approach

For your use case, I recommend a **hybrid approach**:

### Phase 1: Client-Side Recording (MVP)
- Quick to implement
- Works with existing setup
- Good for testing

### Phase 2: Server-Side with FFmpeg (Production)
- Better control
- Consistent quality
- Easier to manage

## Implementation Steps

### Step 1: Update Media Server

```typescript
// webrtc-media-server.engine.ts

private captureTrack(
  recordingId: string,
  participantId: string,
  track: MediaStreamTrack
): void {
  // Option 1: Client-side (no server capture needed)
  // Just track that recording is active
  
  // Option 2: Server-side with wrtc
  const recorder = new MediaRecorder(track);
  recorder.ondataavailable = (event) => {
    this.recordingEngine.addChunk(
      recordingId,
      participantId,
      event.data,
      track.kind as 'audio' | 'video'
    );
  };
  recorder.start(1000);
  
  // Store recorder for cleanup
  const recording = this.recordings.get(recordingId);
  if (recording) {
    recording.chunks.push(recorder);
  }
}
```

### Step 2: Add Chunk Upload Endpoint

```typescript
// video-calling.controller.ts

.post(
  '/recording/upload-chunk',
  async ({ body, set }) => {
    try {
      const { recordingId, participantId, chunk, type } = body;
      
      await videoCallingService.uploadRecordingChunk(
        recordingId,
        participantId,
        Buffer.from(chunk, 'base64'),
        type
      );

      return { success: true };
    } catch (error) {
      set.status = 500;
      return { success: false, error: error.message };
    }
  }
)
```

### Step 3: Update Client

```typescript
// CLIENT_EXAMPLE.tsx

const startRecording = async () => {
  // Start server recording
  const { recordingId } = await fetch('/recording/start').then(r => r.json());
  
  // Start client capture
  const recorder = new MediaRecorder(localStream);
  recorder.ondataavailable = async (event) => {
    if (event.data.size > 0) {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        
        // Upload to server
        await fetch('/recording/upload-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordingId,
            participantId: userId,
            chunk: base64,
            type: 'video'
          })
        });
      };
      reader.readAsDataURL(event.data);
    }
  };
  
  recorder.start(1000);
};
```

## Testing

### Test Client-Side Recording

```typescript
// Test in browser console
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

const recorder = new MediaRecorder(stream);
const chunks = [];

recorder.ondataavailable = (e) => {
  chunks.push(e.data);
  console.log('Chunk captured:', e.data.size, 'bytes');
};

recorder.start(1000);

// Stop after 10 seconds
setTimeout(() => {
  recorder.stop();
  const blob = new Blob(chunks, { type: 'video/webm' });
  console.log('Total size:', blob.size, 'bytes');
  
  // Download to verify
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test-recording.webm';
  a.click();
}, 10000);
```

## Performance Considerations

### Client-Side
- **Pros:** No server CPU usage, native browser support
- **Cons:** Network bandwidth for uploads, client-side failures

### Server-Side
- **Pros:** Centralized control, consistent quality
- **Cons:** High CPU usage, complex implementation

### Recommendations
- Start with client-side for MVP
- Move to server-side for production
- Use CDN for chunk uploads
- Implement retry logic
- Monitor upload failures

## Next Steps

1. Choose your approach (client-side recommended for MVP)
2. Implement chunk upload endpoint
3. Update client to capture and upload
4. Test with real media streams
5. Monitor performance and adjust

## Resources

- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [node-webrtc](https://github.com/node-webrtc/node-webrtc)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [GStreamer Documentation](https://gstreamer.freedesktop.org/documentation/)
