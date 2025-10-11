# WebRTC Implementation Guide

A complete, production-ready WebRTC implementation with SFU architecture, perfect negotiation pattern, and industry-standard practices.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebRTC Media Server                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Signaling   │  │     SFU      │  │  Recording   │          │
│  │    Engine    │  │   Manager    │  │    Engine    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Room Sessions                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Room 1     │  │   Room 2     │  │   Room 3     │          │
│  │  (5 peers)   │  │  (3 peers)   │  │  (8 peers)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Peer Connections                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Peer A ←→ B │  │  Peer B ←→ C │  │  Peer A ←→ C │          │
│  │   (WebRTC)   │  │   (WebRTC)   │  │   (WebRTC)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### ✅ Production-Ready Features

1. **Perfect Negotiation Pattern** - Handles race conditions and glare
2. **SFU Architecture** - Scalable multi-party calls
3. **ICE Restart** - Automatic connection recovery
4. **Quality Monitoring** - Real-time stats and adaptation
5. **Data Channels** - Low-latency messaging
6. **Recording Support** - Cloud recording capabilities
7. **Bandwidth Management** - Adaptive bitrate control
8. **Connection Recovery** - Automatic reconnection
9. **Room Management** - Multi-room support
10. **Signaling Server** - WebSocket-based signaling

### 🔒 Security Features

- Secure WebSocket connections (WSS)
- TURN server support for NAT traversal
- Token-based authentication
- Room access control
- Participant limits

### 📊 Monitoring & Analytics

- Real-time connection statistics
- Packet loss detection
- Jitter monitoring
- Latency tracking
- Bandwidth usage
- Quality warnings

## Components

### 1. WebRTCPeerEngine

Manages individual peer-to-peer connections.

**Features:**
- Perfect negotiation pattern
- ICE candidate handling
- Track management
- Data channel support
- Statistics collection

**Usage:**
```typescript
import { WebRTCPeerEngine } from '@kaa/services/engines/webrtc';

const peer = new WebRTCPeerEngine('peer-123', rtcConfig, false);
await peer.initialize();

// Add local stream
await peer.addStream(localStream);

// Handle offer
const answer = await peer.handleOffer(offer);

// Handle answer
await peer.handleAnswer(answer);

// Add ICE candidate
await peer.addIceCandidate(candidate);

// Get statistics
const stats = await peer.getDetailedStats();
```

### 2. WebRTCSFUEngine

Manages multiple peer connections in SFU topology.

**Features:**
- Multi-peer management
- Mesh/SFU topology
- Quality monitoring
- Bandwidth adaptation
- Track replacement

**Usage:**
```typescript
import { WebRTCSFUEngine } from '@kaa/services/engines/webrtc';

const sfu = new WebRTCSFUEngine('room-123', 'user-456', rtcConfig);

// Set local stream
await sfu.setLocalStream(localStream);

// Create peer connection
const peer = await sfu.createPeer('peer-789');

// Handle signaling
const answer = await sfu.handleOffer('peer-789', offer);
await sfu.handleAnswer('peer-789', answer);
await sfu.handleIceCandidate('peer-789', candidate);

// Media controls
sfu.setAudioEnabled(false); // Mute
sfu.setVideoEnabled(false); // Disable video

// Quality monitoring
sfu.startQualityMonitoring(5000);

// Get statistics
const stats = await sfu.getAllStats();
```

### 3. WebRTCSignalingEngine

Handles WebSocket-based signaling.

**Features:**
- Room management
- User presence
- Message routing
- Error handling
- Statistics

**Usage:**
```typescript
import { WebRTCSignalingEngine } from '@kaa/services/engines/webrtc';

const signaling = new WebRTCSignalingEngine();

// Handle WebSocket connection
signaling.handleConnection(ws, userId);

// Listen to events
signaling.on('userjoined', ({ roomId, userId }) => {
    console.log(`User ${userId} joined room ${roomId}`);
});

signaling.on('offer', ({ roomId, fromUserId, toUserId, data }) => {
    // Forward offer to target user
});

// Get room info
const room = signaling.getRoom(roomId);

// Kick user
signaling.kickUser(roomId, userId, 'Violation');

// Close room
signaling.closeRoom(roomId, 'Maintenance');
```

### 4. WebRTCMediaServerEngine

Complete media server with SFU and signaling.

**Features:**
- Integrated signaling
- SFU management
- Recording support
- Quality monitoring
- Room lifecycle

**Usage:**
```typescript
import { WebRTCMediaServerEngine } from '@kaa/services/engines/webrtc';

const mediaServer = new WebRTCMediaServerEngine({
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:turn.example.com:3478',
            username: 'user',
            credential: 'pass'
        }
    ],
    maxParticipantsPerRoom: 50,
    recordingEnabled: true,
    qualityMonitoringInterval: 5000
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    const userId = getUserIdFromRequest(req);
    mediaServer.handleConnection(ws, userId);
});

// Listen to events
mediaServer.on('userjoined', ({ roomId, userId }) => {
    console.log(`User ${userId} joined room ${roomId}`);
});

mediaServer.on('qualitywarning', ({ roomId, userId, type, value, severity }) => {
    console.warn(`Quality warning in room ${roomId}: ${type} = ${value}`);
});

// Start recording
const recordingId = await mediaServer.startRecording(roomId);

// Stop recording
await mediaServer.stopRecording(roomId);

// Get statistics
const roomStats = await mediaServer.getRoomStats(roomId);
const serverStats = mediaServer.getServerStats();
```

## Server Integration

### Express/Elysia Integration

```typescript
import { WebSocketServer } from 'ws';
import { WebRTCMediaServerEngine } from '@kaa/services/engines/webrtc';

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Create media server
const mediaServer = new WebRTCMediaServerEngine({
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: process.env.TURN_SERVER_URL!,
            username: process.env.TURN_USERNAME!,
            credential: process.env.TURN_CREDENTIAL!
        }
    ],
    maxParticipantsPerRoom: 50,
    recordingEnabled: true
});

// Handle upgrade
server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws/webrtc') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});

// Handle connections
wss.on('connection', (ws, request) => {
    // Authenticate user
    const token = new URL(request.url!, `http://${request.headers.host}`).searchParams.get('token');
    const userId = verifyToken(token);

    if (!userId) {
        ws.close(1008, 'Unauthorized');
        return;
    }

    // Handle connection
    mediaServer.handleConnection(ws, userId);
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
    await mediaServer.destroy();
    wss.close();
});
```

## Client Integration

### React/React Native Example

```typescript
import { useEffect, useRef, useState } from 'react';

function VideoCall({ roomId, userId, token }) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const ws = useRef<WebSocket | null>(null);
    const peers = useRef<Map<string, RTCPeerConnection>>(new Map());

    useEffect(() => {
        // Connect to signaling server
        ws.current = new WebSocket(`wss://your-server.com/ws/webrtc?token=${token}`);

        ws.current.onopen = async () => {
            // Get local media
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: 1280, height: 720 }
            });
            setLocalStream(stream);

            // Join room
            ws.current?.send(JSON.stringify({
                type: 'join',
                roomId,
                userId,
                timestamp: Date.now()
            }));
        };

        ws.current.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'joined':
                    // Create peer connections for existing participants
                    for (const participantId of message.participants) {
                        await createPeerConnection(participantId, true);
                    }
                    break;

                case 'user-joined':
                    // New user joined, create peer connection
                    await createPeerConnection(message.userId, false);
                    break;

                case 'user-left':
                    // User left, close peer connection
                    closePeerConnection(message.userId);
                    break;

                case 'offer':
                    await handleOffer(message.userId, message.data);
                    break;

                case 'answer':
                    await handleAnswer(message.userId, message.data);
                    break;

                case 'ice-candidate':
                    await handleIceCandidate(message.userId, message.data);
                    break;
            }
        };

        return () => {
            // Cleanup
            localStream?.getTracks().forEach(track => track.stop());
            peers.current.forEach(pc => pc.close());
            ws.current?.close();
        };
    }, [roomId, userId, token]);

    async function createPeerConnection(peerId: string, polite: boolean) {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        // Add local tracks
        localStream?.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                ws.current?.send(JSON.stringify({
                    type: 'ice-candidate',
                    roomId,
                    userId,
                    targetUserId: peerId,
                    data: event.candidate,
                    timestamp: Date.now()
                }));
            }
        };

        // Handle remote tracks
        pc.ontrack = (event) => {
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(peerId, event.streams[0]);
                return newMap;
            });
        };

        // Handle negotiation
        pc.onnegotiationneeded = async () => {
            try {
                await pc.setLocalDescription();
                ws.current?.send(JSON.stringify({
                    type: 'offer',
                    roomId,
                    userId,
                    targetUserId: peerId,
                    data: pc.localDescription,
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.error('Negotiation error:', error);
            }
        };

        peers.current.set(peerId, pc);

        // Create offer if not polite
        if (!polite) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.current?.send(JSON.stringify({
                type: 'offer',
                roomId,
                userId,
                targetUserId: peerId,
                data: offer,
                timestamp: Date.now()
            }));
        }
    }

    async function handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
        let pc = peers.current.get(peerId);
        if (!pc) {
            await createPeerConnection(peerId, true);
            pc = peers.current.get(peerId)!;
        }

        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        ws.current?.send(JSON.stringify({
            type: 'answer',
            roomId,
            userId,
            targetUserId: peerId,
            data: answer,
            timestamp: Date.now()
        }));
    }

    async function handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
        const pc = peers.current.get(peerId);
        if (pc) {
            await pc.setRemoteDescription(answer);
        }
    }

    async function handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
        const pc = peers.current.get(peerId);
        if (pc) {
            await pc.addIceCandidate(candidate);
        }
    }

    function closePeerConnection(peerId: string) {
        const pc = peers.current.get(peerId);
        if (pc) {
            pc.close();
            peers.current.delete(peerId);
        }

        setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(peerId);
            return newMap;
        });
    }

    return (
        <div>
            {/* Local video */}
            <video
                ref={ref => {
                    if (ref && localStream) {
                        ref.srcObject = localStream;
                    }
                }}
                autoPlay
                muted
                playsInline
            />

            {/* Remote videos */}
            {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                <video
                    key={peerId}
                    ref={ref => {
                        if (ref) {
                            ref.srcObject = stream;
                        }
                    }}
                    autoPlay
                    playsInline
                />
            ))}
        </div>
    );
}
```

## Performance Optimization

### 1. Bandwidth Management

```typescript
// Limit video bitrate for mobile
if (isMobile) {
    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
        const parameters = sender.getParameters();
        if (!parameters.encodings) {
            parameters.encodings = [{}];
        }
        parameters.encodings[0].maxBitrate = 500000; // 500kbps
        await sender.setParameters(parameters);
    }
}
```

### 2. Simulcast (for SFU)

```typescript
const sender = pc.addTrack(videoTrack, stream);
const parameters = sender.getParameters();
parameters.encodings = [
    { rid: 'h', maxBitrate: 2000000 }, // High quality
    { rid: 'm', maxBitrate: 500000, scaleResolutionDownBy: 2 }, // Medium
    { rid: 'l', maxBitrate: 150000, scaleResolutionDownBy: 4 }  // Low
];
await sender.setParameters(parameters);
```

### 3. Adaptive Bitrate

```typescript
mediaServer.on('qualitywarning', async ({ roomId, userId, type, value }) => {
    if (type === 'packet_loss' && value > 0.1) {
        // Reduce bitrate
        await reduceBitrate(roomId, userId);
    }
});
```

## Production Checklist

- [ ] Configure TURN servers for NAT traversal
- [ ] Set up SSL/TLS for secure WebSocket (WSS)
- [ ] Implement token-based authentication
- [ ] Add rate limiting for signaling
- [ ] Set up monitoring and alerting
- [ ] Configure recording storage (S3/GCS)
- [ ] Implement bandwidth limits
- [ ] Add connection timeout handling
- [ ] Set up load balancing for multiple servers
- [ ] Implement room persistence (Redis)
- [ ] Add analytics and logging
- [ ] Test on various networks (WiFi, 4G, 5G)
- [ ] Optimize for mobile devices
- [ ] Add error recovery mechanisms
- [ ] Implement graceful shutdown

## Troubleshooting

### Common Issues

**1. ICE Connection Failed**
- Check TURN server configuration
- Verify firewall rules
- Test STUN/TURN connectivity

**2. High Packet Loss**
- Reduce video bitrate
- Enable simulcast
- Check network bandwidth

**3. Audio Echo**
- Enable echo cancellation
- Use headphones
- Adjust audio settings

**4. Video Freezing**
- Monitor jitter and latency
- Implement adaptive bitrate
- Check CPU usage

## License

MIT

## Support

For issues or questions, refer to the main documentation or contact the development team.
