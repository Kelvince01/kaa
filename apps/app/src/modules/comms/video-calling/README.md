# Video Calling Module

Industry-standard WebRTC-based video calling implementation for the client application.

## Features

- ✅ WebRTC peer-to-peer video calling
- ✅ Multi-participant support
- ✅ Audio/Video controls (mute, camera on/off)
- ✅ Screen sharing
- ✅ Device selection (camera, microphone, speakers)
- ✅ Call recording
- ✅ Network quality monitoring
- ✅ Property tour integration
- ✅ Real-time participant management
- ✅ Connection state tracking
- ✅ Bandwidth adaptation

## Architecture

### Services
- `video-calling.service.ts` - API communication layer
- Handles all HTTP requests to the backend

### Queries
- `video-calling.queries.ts` - React Query hooks
- Manages data fetching, caching, and mutations

### Store
- `video-calling.store.ts` - Zustand state management
- Persists local media settings
- Manages call state

### Hooks

#### `useCallManager`
High-level hook for call lifecycle management.

```typescript
const { createCall, joinCall, leaveCall, endCall } = useCallManager();

// Create a new call
const call = await createCall({
  type: CallType.PROPERTY_TOUR,
  title: "Property Tour",
  propertyId: "123",
});

// Join existing call
await joinCall({
  callId: "call-id",
  displayName: "John Doe",
});
```

#### `useWebRTCConnection`
Manages WebRTC peer connections and signaling.

```typescript
const {
  isConnected,
  localStream,
  remoteStreams,
  toggleAudio,
  toggleVideo,
  startScreenShare,
} = useWebRTCConnection({
  callId,
  token,
  onParticipantJoined: (participant) => console.log("Joined:", participant),
});
```

#### `useMediaDevices`
Manages media device enumeration and selection.

```typescript
const { devices, testAudioInput, testVideoInput } = useMediaDevices();

// List available devices
console.log(devices.audioInputs);
console.log(devices.videoInputs);
console.log(devices.audioOutputs);
```

#### `useCallStats`
Monitors call quality and network statistics.

```typescript
const stats = useCallStats({
  callId,
  participantId,
  peerConnection,
});

console.log(stats.bandwidth);
console.log(stats.latency);
console.log(stats.packetLoss);
```

## Components

### `VideoCallRoom`
Main call interface with participant grid and controls.

```tsx
<VideoCallRoom
  callId="call-id"
  onLeave={() => router.push("/dashboard")}
/>
```

### `CallPreview`
Pre-call setup screen for device testing.

```tsx
<CallPreview
  onJoin={handleJoin}
  onCancel={handleCancel}
  isJoining={isJoining}
/>
```

### `ParticipantGrid`
Responsive grid layout for video participants.

```tsx
<ParticipantGrid
  localStream={localStream}
  remoteStreams={remoteStreams}
  localParticipant={localParticipant}
  participants={participants}
/>
```

### `CallControls`
Audio, video, screen share, and leave controls.

```tsx
<CallControls
  audioEnabled={audioEnabled}
  videoEnabled={videoEnabled}
  screenShareEnabled={screenShareEnabled}
  onToggleAudio={handleToggleAudio}
  onToggleVideo={handleToggleVideo}
  onToggleScreenShare={handleToggleScreenShare}
  onLeave={handleLeave}
/>
```

### `DeviceSettings`
Device selection dropdowns.

```tsx
<DeviceSettings />
```

## Usage Examples

### Basic Video Call

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CallPreview, VideoCallRoom, useCallManager } from "@/modules/comms/video-calling";

export default function CallPage({ params }: { params: { callId: string } }) {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(true);
  const { joinCall, isJoining } = useCallManager();

  const handleJoin = async () => {
    await joinCall({
      callId: params.callId,
      displayName: "John Doe",
    });
    setShowPreview(false);
  };

  if (showPreview) {
    return (
      <CallPreview
        onJoin={handleJoin}
        onCancel={() => router.back()}
        isJoining={isJoining}
      />
    );
  }

  return (
    <VideoCallRoom
      callId={params.callId}
      onLeave={() => router.push("/dashboard")}
    />
  );
}
```

### Creating a Call

```tsx
"use client";

import { useCallManager, CallType } from "@/modules/comms/video-calling";
import { Button } from "@/components/ui/button";

export function CreateCallButton() {
  const { createCall, isCreating } = useCallManager();

  const handleCreate = async () => {
    const call = await createCall({
      type: CallType.PROPERTY_TOUR,
      title: "Property Tour - 123 Main St",
      propertyId: "prop-123",
      maxParticipants: 10,
      isRecorded: true,
      settings: {
        allowScreenShare: true,
        allowRecording: true,
        muteOnJoin: false,
        videoOnJoin: true,
      },
    });

    // Navigate to call
    window.location.href = `/calls/${call.id}`;
  };

  return (
    <Button onClick={handleCreate} disabled={isCreating}>
      {isCreating ? "Creating..." : "Start Property Tour"}
    </Button>
  );
}
```

### Property Tour Integration

```tsx
"use client";

import {
  usePropertyTour,
  useNavigateToStop,
  useAddTourQuestion,
} from "@/modules/comms/video-calling";

export function PropertyTourControls({ callId }: { callId: string }) {
  const { data: tour } = usePropertyTour(callId);
  const navigateToStop = useNavigateToStop();
  const addQuestion = useAddTourQuestion();

  const handleNextStop = () => {
    if (tour) {
      navigateToStop.mutate({
        callId,
        stopIndex: tour.currentStop + 1,
      });
    }
  };

  const handleAskQuestion = () => {
    addQuestion.mutate({
      callId,
      question: "What's the square footage?",
      category: "property",
    });
  };

  return (
    <div>
      <h3>Current Stop: {tour?.tourPlan[tour.currentStop]?.name}</h3>
      <Button onClick={handleNextStop}>Next Stop</Button>
      <Button onClick={handleAskQuestion}>Ask Question</Button>
    </div>
  );
}
```

### Recording Management

```tsx
"use client";

import {
  useStartRecording,
  useStopRecording,
  useCallRecordings,
} from "@/modules/comms/video-calling";

export function RecordingControls({ callId }: { callId: string }) {
  const startRecording = useStartRecording();
  const stopRecording = useStopRecording();
  const { data: recordings } = useCallRecordings(callId);

  return (
    <div>
      <Button onClick={() => startRecording.mutate(callId)}>
        Start Recording
      </Button>
      <Button onClick={() => stopRecording.mutate(callId)}>
        Stop Recording
      </Button>

      <h3>Recordings</h3>
      {recordings?.recordings.map((recording) => (
        <div key={recording.id}>
          <a href={recording.downloadUrl}>Download</a>
        </div>
      ))}
    </div>
  );
}
```

## Environment Variables

```env
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Browser Support

- Chrome 74+
- Firefox 66+
- Safari 12.1+
- Edge 79+

## Performance Considerations

1. **Bandwidth Adaptation**: Automatically adjusts video quality based on network conditions
2. **Connection Pooling**: Reuses WebSocket connections
3. **Lazy Loading**: Components are code-split for optimal loading
4. **State Persistence**: Media settings are persisted to localStorage
5. **Query Caching**: React Query caches API responses

## Security

- All WebRTC connections use DTLS-SRTP encryption
- Signaling messages are sent over secure WebSocket (WSS)
- TURN servers support authentication
- Call passcodes for private calls

## Testing

```bash
# Run tests
bun test src/modules/comms/video-calling

# Test with specific device
# Open DevTools > More Tools > Sensors
# Select different devices to test responsive grid
```

## Troubleshooting

### Camera/Microphone Not Working
1. Check browser permissions
2. Ensure HTTPS (required for getUserMedia)
3. Check device selection in settings

### Connection Issues
1. Verify STUN/TURN server configuration
2. Check firewall settings
3. Ensure WebSocket connection is established

### Poor Quality
1. Check network bandwidth
2. Reduce video resolution in settings
3. Enable audio-only mode for low bandwidth

## API Reference

See the [API documentation](../../../../api/src/features/comms/video-calling/README.md) for backend endpoints.

## Contributing

Follow the project's coding standards:
- Use TypeScript strict mode
- Follow Biome linting rules
- Write accessible components
- Add JSDoc comments for public APIs
