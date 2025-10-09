# Video Calling Engine with Agora Integration

A complete video calling solution for real estate property tours with Agora WebRTC integration.

## Features

✅ **Full Video Calling** - Audio, video, and screen sharing via Agora  
✅ **Property Tours** - Guided virtual tours with stops and interaction points  
✅ **Cloud Recording** - Automatic recording to cloud storage  
✅ **Quality Adaptation** - Automatic bitrate adjustment for Kenya networks  
✅ **Analytics** - Detailed call metrics and participant tracking  
✅ **Kenya-Optimized** - Low bandwidth mode, Swahili support, M-Pesa integration  

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Video Calling Engine                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Call       │  │   Property   │  │  Recording   │      │
│  │ Management   │  │     Tour     │  │  Management  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Agora Media Engine                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   WebRTC     │  │    Screen    │  │    Cloud     │      │
│  │   Streams    │  │    Share     │  │  Recording   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Agora Cloud                             │
│         (STUN/TURN, SFU, Recording, CDN)                    │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Install Dependencies

```bash
bun add agora-rtc-sdk-ng agora-access-token
```

### 2. Get Agora Credentials

1. Sign up at [Agora.io](https://www.agora.io/)
2. Create a new project
3. Get your App ID and App Certificate
4. Enable Cloud Recording in the console

### 3. Configure Environment Variables

```bash
# .env
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
```

### 4. Initialize the Engine

```typescript
import { WebSocketServer } from 'ws';
import { VideoCallingEngine, createDefaultWebRTCConfig, createVideoConfig } from './engines/video-calling.engine';

const wsServer = new WebSocketServer({ port: 8080 });

const engine = new VideoCallingEngine(
    wsServer,
    createDefaultWebRTCConfig(),
    createVideoConfig(),
    {
        appId: process.env.AGORA_APP_ID!,
        appCertificate: process.env.AGORA_APP_CERTIFICATE!
    }
);
```

## Usage

### Create a Property Tour Call

```typescript
const call = await engine.createCall(
    'landlord-123',
    CallType.PROPERTY_TOUR,
    {
        title: 'Virtual Tour - 2BR Apartment in Westlands',
        propertyId: 'prop-456',
        maxParticipants: 5,
        isRecorded: true,
        kenyaSpecific: {
            county: 'Nairobi',
            language: 'en'
        }
    }
);
```

### Join a Call

```typescript
// 1. Generate Agora token
const token = await engine.generateAgoraToken(callId, userId);

// 2. Join the call in database
await engine.joinCall(callId, userId, {
    displayName: 'John Doe',
    avatar: 'https://example.com/avatar.jpg'
});

// 3. Join Agora channel with media
await engine.joinAgoraChannel(callId, userId, {
    audio: true,
    video: true
});
```

### Create Property Tour

```typescript
const tour = await engine.createPropertyTour(
    callId,
    propertyId,
    tourGuideId,
    [
        {
            id: 'stop-1',
            name: 'Living Room',
            description: 'Spacious living area',
            duration: 120,
            highlights: ['Large windows', 'Hardwood floors'],
            interactionPoints: []
        },
        {
            id: 'stop-2',
            name: 'Master Bedroom',
            description: 'Comfortable bedroom',
            duration: 90,
            highlights: ['Walk-in closet', 'City view'],
            interactionPoints: []
        }
    ]
);
```

### Navigate Tour

```typescript
// Move to first stop
await engine.navigateToStop(callId, 0);

// Move to next stop
await engine.navigateToStop(callId, 1);
```

### Start Recording

```typescript
const recording = await engine.startRecording(callId);
console.log('Recording ID:', recording._id);
```

### Screen Sharing

```typescript
// Start screen share
await engine.startAgoraScreenShare(callId);

// Stop screen share
await engine.stopAgoraScreenShare(callId);
```

### Toggle Audio/Video

```typescript
// Mute audio
await engine.toggleAudio(callId, false);

// Unmute audio
await engine.toggleAudio(callId, true);

// Disable video
await engine.toggleVideo(callId, false);

// Enable video
await engine.toggleVideo(callId, true);
```

### End Call

```typescript
// Stop recording
await engine.stopRecording(callId);

// Leave Agora channel
await engine.leaveAgoraChannel(callId);

// End call
await engine.endCall(callId);
```

## Events

Listen to engine events for real-time updates:

```typescript
// Call events
engine.on('callCreated', ({ call }) => {
    console.log('Call created:', call._id);
});

engine.on('participantJoined', ({ call, participant }) => {
    console.log(`${participant.displayName} joined`);
});

engine.on('participantLeft', ({ call, participant }) => {
    console.log(`${participant.displayName} left`);
});

// Agora events
engine.on('agoraUserJoined', ({ callId, userId }) => {
    console.log(`User ${userId} joined Agora channel`);
});

engine.on('networkQuality', ({ callId, uplinkQuality, downlinkQuality }) => {
    console.log(`Network quality: up=${uplinkQuality}, down=${downlinkQuality}`);
});

// Recording events
engine.on('recordingStarted', ({ call, recording }) => {
    console.log('Recording started');
});

// Tour events
engine.on('tourNavigated', ({ tour, stop }) => {
    console.log(`Navigated to: ${stop.name}`);
});

engine.on('tourQuestionAdded', ({ tour, question }) => {
    console.log(`Question: ${question.question}`);
});
```

## Client-Side Integration

### React/React Native Example

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';

async function joinCall(callId: string, userId: string, token: string) {
    // Create Agora client
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    // Join channel
    await client.join(appId, callId, token, userId);

    // Create local tracks
    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    const videoTrack = await AgoraRTC.createCameraVideoTrack();

    // Publish tracks
    await client.publish([audioTrack, videoTrack]);

    // Play video in DOM
    videoTrack.play('local-video-container');

    // Listen for remote users
    client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
            user.videoTrack?.play(`remote-video-${user.uid}`);
        }
        if (mediaType === 'audio') {
            user.audioTrack?.play();
        }
    });
}
```

## Kenya-Specific Features

### Low Bandwidth Mode

Automatically enabled for cellular networks:

```typescript
await engine.optimizeForNetwork('cellular');
// Reduces video to 640x480 @ 500kbps
```

### Data Usage Warnings

```typescript
engine.on('dataWarning', ({ participantId, usage }) => {
    console.log(`Warning: ${usage}MB used`);
    // Send notification to user
});
```

### Swahili Support

```typescript
const call = await engine.createCall(hostId, CallType.PROPERTY_TOUR, {
    kenyaSpecific: {
        language: 'sw', // Swahili
        county: 'Nairobi'
    }
});
```

## Pricing Considerations

### Agora Pricing (as of 2024)

- **Video HD (720p)**: ~$0.99 per 1000 minutes
- **Video SD (480p)**: ~$0.49 per 1000 minutes
- **Audio only**: ~$0.99 per 1000 minutes
- **Cloud Recording**: ~$1.49 per 1000 minutes

### Cost Optimization Tips

1. **Use audio-only for initial consultations**
2. **Enable low bandwidth mode for cellular users**
3. **Limit recording to important calls only**
4. **Set auto-end timers to prevent forgotten calls**

## Troubleshooting

### Common Issues

**1. "Token expired" error**
- Tokens expire after 1 hour by default
- Generate a new token before expiry
- Check server time synchronization

**2. Poor video quality**
- Check network bandwidth
- Enable low bandwidth mode
- Reduce video resolution

**3. Echo/feedback**
- Ensure AEC (Acoustic Echo Cancellation) is enabled
- Check microphone settings
- Use headphones

**4. Recording not starting**
- Verify cloud recording is enabled in Agora console
- Check AWS/GCP credentials
- Ensure sufficient storage space

### Debug Mode

Enable detailed logging:

```typescript
// Set Agora log level
AgoraRTC.setLogLevel(0); // 0 = DEBUG, 4 = NONE

// Listen to all events
engine.onAny((event, data) => {
    console.log('Event:', event, data);
});
```

## Production Checklist

- [ ] Set up Agora project in production mode
- [ ] Configure cloud recording storage (AWS S3/GCP)
- [ ] Set up TURN servers for NAT traversal
- [ ] Implement token refresh mechanism
- [ ] Add call quality monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for recordings
- [ ] Test on various Kenya networks (Safaricom, Airtel, Telkom)
- [ ] Implement call analytics dashboard
- [ ] Set up billing/usage tracking

## Support

For issues or questions:
- Agora Documentation: https://docs.agora.io/
- Agora Support: https://www.agora.io/en/support/

## License

MIT
