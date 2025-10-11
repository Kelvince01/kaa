# Track Capture Quick Reference

## 🎯 Implementation Status

✅ **COMPLETE** - Track capture is fully implemented with 3 strategies

## 🚀 Quick Start

```typescript
// 1. Start recording
const recordingId = await mediaServer.startRecording('room-123');

// 2. Tracks are captured automatically
// (No additional code needed)

// 3. Stop recording
await mediaServer.stopRecording('room-123');
```

## 📋 Capture Methods

### Browser (MediaRecorder)
```typescript
✅ Production Ready
📦 No dependencies
🎯 Best for: Client-side recording
```

### Node.js (Polling)
```typescript
⚠️ Testing only (needs RTP capture for production)
📦 No dependencies
🎯 Best for: Development/testing
```

### Advanced (Insertable Streams)
```typescript
✅ Production Ready (if supported)
📦 No dependencies
🎯 Best for: Direct frame access
```

## 🔧 Production Setup

### Browser Apps
```typescript
// Already production-ready!
const mediaServer = new WebRTCMediaServerEngine({
    recordingEnabled: true,
    bandwidthLimits: {
        video: 2000000,  // 2 Mbps
        audio: 128000    // 128 kbps
    }
});
```

### Server Apps (Choose One)

#### Option 1: mediasoup (Recommended)
```bash
npm install mediasoup
```

#### Option 2: node-webrtc
```bash
npm install wrtc
```

#### Option 3: External Server
- Janus Gateway
- Kurento Media Server

## 📊 Events

```typescript
// Capture events
mediaServer.on('captureprogress', ({ recordingId, participantId, trackKind }) => {
    console.log(`Capturing ${trackKind} from ${participantId}`);
});

mediaServer.on('captureerror', ({ recordingId, participantId, error }) => {
    console.error(`Capture error:`, error);
});

// Recording events
mediaServer.on('recordingstarted', ({ roomId, recordingId }) => {});
mediaServer.on('recordingstopped', ({ roomId, recordingId, duration }) => {});
mediaServer.on('recordingcompleted', ({ recordingId, outputPath, fileSize }) => {});
mediaServer.on('recordingfailed', ({ recordingId, error }) => {});
```

## 🎪 Architecture

```
Track → captureTrack() → [Browser/Node/Advanced] → addChunk() → Recording Engine → FFmpeg → Output
```

## 📝 Key Files

- `webrtc-media-server.engine.ts` - Main implementation
- `webrtc-recording.engine.ts` - Recording processing
- `TRACK_CAPTURE_GUIDE.md` - Detailed guide
- `CAPTURE_IMPLEMENTATION_SUMMARY.md` - Full summary

## ⚡ Performance

| Method | CPU | Memory | Quality |
|--------|-----|--------|---------|
| Browser | Low | Low | High |
| Node.js | Medium | Medium | Medium |
| Advanced | Low | Low | Highest |

## 🐛 Troubleshooting

### No chunks captured?
```typescript
// Check track state
participant.sfu.on('track', ({ track }) => {
    console.log(`Track: ${track.kind}, State: ${track.readyState}`);
});
```

### MediaRecorder not available?
```bash
# You're in Node.js - install dependencies
npm install wrtc
# or
npm install mediasoup
```

### Poor quality?
```typescript
// Increase bitrates
const mediaServer = new WebRTCMediaServerEngine({
    bandwidthLimits: {
        video: 4000000,  // 4 Mbps
        audio: 256000    // 256 kbps
    }
});
```

## ✨ What's Implemented

✅ Automatic environment detection  
✅ MediaRecorder capture (browser)  
✅ Polling capture (Node.js)  
✅ Insertable Streams capture (advanced)  
✅ Proper cleanup on stop  
✅ Error handling  
✅ Progress tracking  
✅ Multiple track support  
✅ Audio + Video capture  

## 🎯 Ready to Use!

The implementation is **complete and ready** for:
- ✅ Browser-based recording (production)
- ✅ Testing and development (all environments)
- ⚠️ Server production (needs mediasoup/wrtc)

Choose your deployment environment and start recording! 🎬
