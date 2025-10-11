# WebRTC Recording Implementation Guide

## Overview

The `WebRTCRecordingEngine` provides complete recording functionality for WebRTC calls, including:
- Media capture from multiple participants
- Chunk-based recording
- FFmpeg-based processing
- Cloud storage upload (AWS S3, Google Cloud Storage)
- Thumbnail generation
- Automatic cleanup

## Architecture

```
Participants → Media Tracks → Recording Engine → Processing → Storage
                                    ↓
                              Chunks Buffer
                                    ↓
                              FFmpeg/WebM Muxer
                                    ↓
                              Final Video File
                                    ↓
                              Cloud Upload + Thumbnails
```

## Integration with Media Server

### 1. Add Recording Engine to Media Server

```typescript
import { WebRTCRecordingEngine } from './webrtc-recording.engine';

export class WebRTCMediaServerEngine extends EventEmitter {
    private recordingEngine: WebRTCRecordingEngine;

    constructor(config: MediaServerConfig = {}) {
        super();
        
        // Initialize recording engine
        this.recordingEngine = new WebRTCRecordingEngine({
            outputDir: './recordings',
            format: 'webm',
            videoCodec: 'vp8',
            audioCodec: 'opus',
            videoBitrate: 2000000,
            audioBitrate: 128000,
            storage: {
                provider: 'aws',
                bucket: 'my-recordings-bucket',
                region: 'us-east-1'
            }
        });

        this.setupRecordingHandlers();
    }

    private setupRecordingHandlers(): void {
        this.recordingEngine.on('recordingCompleted', ({ recordingId, outputPath, fileSize }) => {
            console.log(`Recording ${recordingId} completed: ${outputPath} (${fileSize} bytes)`);
        });

        this.recordingEngine.on('recordingFailed', ({ recordingId, error }) => {
            console.error(`Recording ${recordingId} failed:`, error);
        });
    }
}
```

### 2. Capture Media Tracks

```typescript
async startRecording(roomId: string): Promise<string> {
    // Start recording
    const recordingId = await this.recordingEngine.startRecording(roomId);

    // Setup track capture for all participants
    const roomSession = this.rooms.get(roomId);
    if (roomSession) {
        for (const [userId, participant] of roomSession.participants) {
            this.captureParticipantTracks(recordingId, userId, participant);
        }
    }

    return recordingId;
}

private captureParticipantTracks(
    recordingId: string,
    userId: string,
    participant: ParticipantSession
): void {
    // Listen for new tracks
    participant.sfu.on('track', ({ track }) => {
        this.recordTrack(recordingId, userId, track);
    });
}

private recordTrack(
    recordingId: string,
    participantId: string,
    track: MediaStreamTrack
): void {
    const stream = new MediaStream([track]);
    const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2000000,
        audioBitsPerSecond: 128000
    });

    recorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
            const buffer = Buffer.from(await event.data.arrayBuffer());
            this.recordingEngine.addChunk(
                recordingId,
                participantId,
                buffer,
                track.kind as 'audio' | 'video'
            );
        }
    };

    recorder.start(1000); // Capture every second

    // Store recorder to stop later
    this.activeRecorders.set(`${recordingId}-${participantId}`, recorder);
}
```

### 3. Stop Recording

```typescript
async stopRecording(roomId: string): Promise<void> {
    const roomSession = this.rooms.get(roomId);
    if (!roomSession?.recording) {
        throw new Error('No active recording');
    }

    const recordingId = roomSession.recording.id;

    // Stop all media recorders
    for (const [key, recorder] of this.activeRecorders) {
        if (key.startsWith(recordingId)) {
            recorder.stop();
            this.activeRecorders.delete(key);
        }
    }

    // Stop recording (triggers processing)
    await this.recordingEngine.stopRecording(recordingId);
}
```

## Processing Pipeline

### 1. Chunk Collection

Chunks are collected in memory during recording:

```typescript
{
    data: Buffer,           // Media data
    timestamp: number,      // When captured
    type: 'audio' | 'video', // Media type
    participantId: string   // Who it's from
}
```

### 2. Sorting and Separation

```typescript
// Sort by timestamp
chunks.sort((a, b) => a.timestamp - b.timestamp);

// Separate by type
const audioChunks = chunks.filter(c => c.type === 'audio');
const videoChunks = chunks.filter(c => c.type === 'video');
```

### 3. Combining with FFmpeg

```typescript
// Write temporary files
await writeChunksToFile(audioChunks, 'temp_audio.webm');
await writeChunksToFile(videoChunks, 'temp_video.webm');

// Combine with FFmpeg
ffmpeg -i temp_video.webm -i temp_audio.webm \
    -c:v libvpx -c:a libopus \
    -b:v 2M -b:a 128k \
    -r 30 -s 1280x720 \
    output.webm
```

### 4. Cloud Upload

```typescript
// AWS S3
const s3 = new S3Client({ region: 'us-east-1' });
await s3.send(new PutObjectCommand({
    Bucket: 'recordings',
    Key: `recordings/${recordingId}.webm`,
    Body: fileContent
}));

// Google Cloud Storage
const storage = new Storage();
await storage.bucket('recordings').upload(filePath);
```

### 5. Thumbnail Generation

```typescript
// Generate thumbnails at key positions
ffmpeg -i recording.webm -ss 0% -vframes 1 -vf scale=320:-1 thumb_0.jpg
ffmpeg -i recording.webm -ss 25% -vframes 1 -vf scale=320:-1 thumb_1.jpg
ffmpeg -i recording.webm -ss 50% -vframes 1 -vf scale=320:-1 thumb_2.jpg
ffmpeg -i recording.webm -ss 75% -vframes 1 -vf scale=320:-1 thumb_3.jpg
ffmpeg -i recording.webm -ss 100% -vframes 1 -vf scale=320:-1 thumb_4.jpg
```

## Environment Variables

```bash
# Recording configuration
RECORDING_OUTPUT_DIR=./recordings
RECORDING_FORMAT=webm
RECORDING_VIDEO_CODEC=vp8
RECORDING_AUDIO_CODEC=opus

# Storage configuration
RECORDING_STORAGE_PROVIDER=aws  # or 'gcp' or 'local'
RECORDING_STORAGE_BUCKET=my-recordings-bucket
RECORDING_STORAGE_REGION=us-east-1

# AWS credentials (if using S3)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# GCP credentials (if using GCS)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

## Dependencies

### Required

```bash
bun add @aws-sdk/client-s3 @google-cloud/storage
```

### System Requirements

```bash
# Install FFmpeg
sudo apt-get install ffmpeg  # Ubuntu/Debian
brew install ffmpeg          # macOS
```

## Usage Example

```typescript
// Start recording
const recordingId = await mediaServer.startRecording('room-123');

// Recording happens automatically...

// Stop recording
await mediaServer.stopRecording('room-123');

// Get recording info
const recording = mediaServer.getRecordingInfo(recordingId);
console.log(recording.outputPath);
console.log(recording.fileSize);
console.log(recording.duration);

// Delete recording
await mediaServer.deleteRecording(recordingId);

// Cleanup old recordings (older than 30 days)
const deleted = await mediaServer.cleanupOldRecordings(30 * 24 * 60 * 60 * 1000);
console.log(`Deleted ${deleted} old recordings`);
```

## Events

```typescript
recordingEngine.on('recordingStarted', ({ recordingId, roomId }) => {
    console.log('Recording started');
});

recordingEngine.on('recordingProgress', ({ recordingId, chunks, participants }) => {
    console.log(`Progress: ${chunks} chunks from ${participants} participants`);
});

recordingEngine.on('recordingProcessing', ({ recordingId }) => {
    console.log('Processing recording...');
});

recordingEngine.on('recordingCompleted', ({ recordingId, outputPath, fileSize, duration }) => {
    console.log(`Recording completed: ${outputPath}`);
});

recordingEngine.on('recordingFailed', ({ recordingId, error }) => {
    console.error('Recording failed:', error);
});

recordingEngine.on('thumbnailsGenerated', ({ recordingId, count }) => {
    console.log(`Generated ${count} thumbnails`);
});

recordingEngine.on('recordingUploaded', ({ recordingId, provider, bucket }) => {
    console.log(`Uploaded to ${provider}:${bucket}`);
});
```

## Performance Considerations

### Memory Management

- Chunks are stored in memory during recording
- For long recordings, consider streaming to disk
- Implement chunk size limits

```typescript
const MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CHUNKS_IN_MEMORY = 1000;

if (recording.chunks.length > MAX_CHUNKS_IN_MEMORY) {
    // Flush to disk
    await flushChunksToDisk(recording);
}
```

### Processing Queue

- Only one recording processes at a time
- Others wait in queue
- Prevents CPU/memory overload

```typescript
private processingQueue: string[] = [];
private isProcessing = false;

async stopRecording(recordingId: string) {
    this.processingQueue.push(recordingId);
    this.processNextRecording();
}
```

### Storage Optimization

- Use compression
- Set expiration policies
- Implement tiered storage

```typescript
// S3 lifecycle policy
{
    "Rules": [{
        "Id": "DeleteOldRecordings",
        "Status": "Enabled",
        "ExpirationInDays": 30
    }]
}
```

## Troubleshooting

### Issue: FFmpeg not found

```bash
# Install FFmpeg
sudo apt-get update
sudo apt-get install ffmpeg

# Verify installation
ffmpeg -version
```

### Issue: Out of memory

```typescript
// Reduce chunk buffer size
const MAX_CHUNKS_IN_MEMORY = 500; // Reduce from 1000

// Or stream directly to disk
recorder.ondataavailable = async (event) => {
    await appendToFile(tempFile, event.data);
};
```

### Issue: Slow processing

```typescript
// Use hardware acceleration
ffmpeg -hwaccel cuda -i input.webm ...  // NVIDIA
ffmpeg -hwaccel videotoolbox -i input.webm ...  // macOS

// Or reduce quality
videoBitrate: 1000000,  // 1 Mbps instead of 2 Mbps
resolution: { width: 854, height: 480 }  // 480p instead of 720p
```

### Issue: Upload failures

```typescript
// Implement retry logic
async uploadWithRetry(file: string, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await this.uploadToS3(file);
            return;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(1000 * Math.pow(2, i)); // Exponential backoff
        }
    }
}
```

## Best Practices

1. **Always cleanup**: Delete recordings after upload
2. **Monitor disk space**: Set up alerts
3. **Use cloud storage**: Don't rely on local disk
4. **Implement retention**: Auto-delete old recordings
5. **Test thoroughly**: Different browsers, network conditions
6. **Handle errors**: Graceful degradation
7. **Log everything**: For debugging
8. **Monitor performance**: CPU, memory, disk I/O

## Production Checklist

- [ ] FFmpeg installed and tested
- [ ] Cloud storage configured
- [ ] Disk space monitoring
- [ ] Error handling implemented
- [ ] Cleanup job scheduled
- [ ] Performance tested (10+ participants)
- [ ] Backup strategy defined
- [ ] Access controls configured
- [ ] Encryption at rest enabled
- [ ] Logging and monitoring setup

## Cost Estimation

### Storage Costs (AWS S3)

- 1 hour recording @ 720p: ~500MB
- 100 recordings/month: 50GB
- S3 Standard: $0.023/GB = **$1.15/month**
- S3 Glacier: $0.004/GB = **$0.20/month**

### Processing Costs

- EC2 t3.medium: $0.0416/hour
- Average processing time: 5 minutes
- 100 recordings: **$0.35/month**

### Total: ~$1.50/month for 100 recordings

Compare to Agora Cloud Recording: ~$1.49/1000 minutes = **$149/month** for 100 hours

**Savings: 99%** 🎉
