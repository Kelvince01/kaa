# Recording Quick Start Guide

## Setup

### 1. Enable Recording

```typescript
const mediaServer = new WebRTCMediaServerEngine({
  recordingEnabled: true,
  // ... other config
});
```

### 2. Configure Storage

```typescript
const recordingEngine = new WebRTCRecordingEngine({
  outputDir: './recordings',
  format: 'webm',
  videoCodec: 'vp8',
  audioCodec: 'opus',
  storage: {
    type: 'local',
    path: './recordings'
  }
});
```

## Basic Usage

### Start Recording

```typescript
// API Call
POST /video-calls/:callId/recording/start

// Response
{
  "success": true,
  "data": {
    "recordingId": "rec_room123_1234567890",
    "status": "recording"
  }
}
```

### Stop Recording

```typescript
// API Call
POST /video-calls/:callId/recording/stop

// Response
{
  "success": true,
  "message": "Recording stopped successfully"
}
```

### Check Status

```typescript
// API Call
GET /video-calls/:callId/recording/:recordingId

// Response
{
  "success": true,
  "data": {
    "status": "completed",
    "outputPath": "/recordings/rec_room123_1234567890.webm",
    "duration": 1800000,
    "size": 52428800
  }
}
```

### Delete Recording

```typescript
// API Call
DELETE /video-calls/:callId/recording/:recordingId

// Response
{
  "success": true,
  "message": "Recording deleted successfully"
}
```

## Client Integration

### React Example

```typescript
import { useState } from 'react';

function RecordingControls({ callId }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const response = await fetch(`/video-calls/${callId}/recording/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const { data } = await response.json();
      setRecording(data);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await fetch(`/video-calls/${callId}/recording/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return (
    <div>
      {!isRecording ? (
        <button onClick={startRecording}>
          Start Recording
        </button>
      ) : (
        <button onClick={stopRecording}>
          Stop Recording
        </button>
      )}
      
      {recording && (
        <div>Recording ID: {recording.recordingId}</div>
      )}
    </div>
  );
}
```

### React Native Example

```typescript
import { useState } from 'react';
import { View, Button, Text } from 'react-native';

function RecordingControls({ callId, token }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const response = await fetch(
        `https://api.example.com/video-calls/${callId}/recording/start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const { data } = await response.json();
      setRecording(data);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await fetch(
        `https://api.example.com/video-calls/${callId}/recording/stop`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return (
    <View>
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? stopRecording : startRecording}
      />
      
      {recording && (
        <Text>Recording ID: {recording.recordingId}</Text>
      )}
    </View>
  );
}
```

## Event Handling

### Listen for Recording Events

```typescript
// Server-side
webrtcServer.on('recordingstarted', ({ roomId, recordingId }) => {
  // Notify all participants
  io.to(roomId).emit('recording:started', { recordingId });
});

webrtcServer.on('recordingstopped', ({ roomId, recordingId }) => {
  // Notify all participants
  io.to(roomId).emit('recording:stopped', { recordingId });
});

webrtcServer.on('recordingcompleted', ({ recordingId, outputPath }) => {
  // Send notification to host
  notifyHost(recordingId, outputPath);
});
```

### Client-side Event Handling

```typescript
// React
useEffect(() => {
  socket.on('recording:started', ({ recordingId }) => {
    setRecordingStatus('Recording in progress...');
  });

  socket.on('recording:stopped', ({ recordingId }) => {
    setRecordingStatus('Processing recording...');
  });

  return () => {
    socket.off('recording:started');
    socket.off('recording:stopped');
  };
}, []);
```

## Common Patterns

### Auto-stop on Call End

```typescript
async function endCall(callId: string) {
  // Check if recording is active
  const call = await VideoCall.findById(callId);
  
  if (call.recordingStatus === 'recording') {
    await stopRecording(callId);
  }
  
  // End the call
  await videoCallingService.endCall(callId);
}
```

### Recording with Notifications

```typescript
async function startRecordingWithNotification(callId: string) {
  // Start recording
  const recording = await startRecording(callId);
  
  // Notify all participants
  const call = await VideoCall.findById(callId);
  for (const participant of call.participants) {
    await sendNotification(participant.userId, {
      title: 'Recording Started',
      body: 'This call is now being recorded'
    });
  }
  
  return recording;
}
```

### Automatic Cleanup

```typescript
// Clean up old recordings
async function cleanupOldRecordings(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const oldRecordings = await CallRecording.find({
    createdAt: { $lt: cutoffDate }
  });
  
  for (const recording of oldRecordings) {
    await deleteRecording(recording.callId, recording.id);
  }
}
```

## Configuration Examples

### High Quality Recording

```typescript
const config = {
  format: 'mp4',
  videoCodec: 'h264',
  audioCodec: 'aac',
  videoBitrate: 2_500_000, // 2.5 Mbps
  audioBitrate: 128_000,   // 128 kbps
};
```

### Low Bandwidth Recording

```typescript
const config = {
  format: 'webm',
  videoCodec: 'vp8',
  audioCodec: 'opus',
  videoBitrate: 500_000,  // 500 kbps
  audioBitrate: 64_000,   // 64 kbps
};
```

### Cloud Storage

```typescript
const config = {
  storage: {
    type: 'cloud',
    cloud: {
      provider: 's3',
      bucket: 'my-recordings',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    }
  }
};
```

## Troubleshooting

### Recording doesn't start
- Verify `recordingEnabled: true` in config
- Check user has host permissions
- Review server logs

### Poor quality
- Increase bitrate settings
- Check network bandwidth
- Verify codec support

### Large files
- Reduce bitrate
- Use more efficient codecs
- Enable compression

## Next Steps

- Read [RECORDING_COMPLETE.md](./RECORDING_COMPLETE.md) for detailed documentation
- Review [RECORDING_IMPLEMENTATION.md](./RECORDING_IMPLEMENTATION.md) for technical details
- Check [CLIENT_EXAMPLE.tsx](./CLIENT_EXAMPLE.tsx) for client integration examples
