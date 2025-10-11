# Recording System Deployment Checklist

## ✅ Implementation Status: COMPLETE

All code is implemented and has **zero TypeScript errors**. Ready for deployment!

---

## 🚀 Pre-Deployment Steps

### 1. Install System Dependencies

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
ffmpeg -version  # Verify installation
```

#### macOS
```bash
brew install ffmpeg
ffmpeg -version  # Verify installation
```

#### Docker
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache ffmpeg
```

### 2. Install Node.js Dependencies

```bash
# Core dependencies (already in package.json)
bun install

# Optional: For advanced server-side capture
bun add wrtc
# OR
bun add mediasoup
```

### 3. Configure Environment Variables

Create `.env` file or set in your deployment platform:

```bash
# Recording Storage
RECORDING_OUTPUT_DIR=./recordings
RECORDING_STORAGE_PROVIDER=aws  # or 'gcp' or 'local'

# AWS S3 Configuration (if using AWS)
RECORDING_STORAGE_BUCKET=your-bucket-name
RECORDING_STORAGE_REGION=us-east-1
RECORDING_STORAGE_CREDENTIALS='{"accessKeyId":"AKIAXXXXX","secretAccessKey":"xxxxx"}'

# Google Cloud Storage (if using GCP)
RECORDING_STORAGE_BUCKET=your-bucket-name
RECORDING_STORAGE_CREDENTIALS='{"type":"service_account","project_id":"xxx",...}'

# Bandwidth Limits
VIDEO_BITRATE=2000000  # 2 Mbps
AUDIO_BITRATE=128000   # 128 kbps
```

### 4. Create Storage Bucket

#### AWS S3
```bash
aws s3 mb s3://your-recordings-bucket
aws s3api put-bucket-cors --bucket your-recordings-bucket --cors-configuration file://cors.json
```

#### Google Cloud Storage
```bash
gsutil mb gs://your-recordings-bucket
gsutil cors set cors.json gs://your-recordings-bucket
```

### 5. Set Up Directories

```bash
# Create recordings directory
mkdir -p recordings/thumbnails

# Set permissions
chmod 755 recordings
```

---

## 🧪 Testing Steps

### 1. Test FFmpeg Installation
```bash
ffmpeg -version
ffmpeg -formats | grep webm
ffmpeg -codecs | grep vp8
```

### 2. Test Recording Locally

```typescript
// test-recording.ts
import { WebRTCMediaServerEngine } from '@kaa/services/engines';

const server = new WebRTCMediaServerEngine({
  recordingEnabled: true,
  bandwidthLimits: {
    video: 2000000,
    audio: 128000
  }
});

// Test recording
const recordingId = await server.startRecording('test-room');
console.log('Recording started:', recordingId);

// Wait 10 seconds
await new Promise(resolve => setTimeout(resolve, 10000));

await server.stopRecording('test-room');
console.log('Recording stopped');
```

### 3. Test API Endpoints

```bash
# Start recording
curl -X POST http://localhost:3000/api/video-calls/CALL_ID/recording/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: USER_ID"

# Check status
curl http://localhost:3000/api/video-calls/CALL_ID/recording/RECORDING_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: USER_ID"

# Stop recording
curl -X POST http://localhost:3000/api/video-calls/CALL_ID/recording/stop \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: USER_ID"
```

---

## 📊 Monitoring Setup

### 1. Add Logging

```typescript
// In your app initialization
mediaServer.on('recordingstarted', ({ roomId, recordingId }) => {
  logger.info('Recording started', { roomId, recordingId });
});

mediaServer.on('recordingcompleted', ({ recordingId, outputPath, fileSize }) => {
  logger.info('Recording completed', { recordingId, outputPath, fileSize });
});

mediaServer.on('recordingfailed', ({ recordingId, error }) => {
  logger.error('Recording failed', { recordingId, error });
});
```

### 2. Set Up Alerts

Monitor these metrics:
- Recording success rate
- FFmpeg processing time
- Storage usage
- Failed recordings
- Disk space

### 3. Health Check Endpoint

```typescript
app.get('/health/recording', async (req, res) => {
  const stats = mediaServer.getServerStats();
  const recordingStats = recordingEngine.getStats();
  
  res.json({
    status: 'healthy',
    activeRecordings: stats.recordings,
    totalRecordings: recordingStats.total,
    storageUsed: recordingStats.totalSize
  });
});
```

---

## 🔧 Production Configuration

### 1. Optimize FFmpeg Settings

```typescript
// In webrtc-recording.engine.ts
// Adjust these based on your server specs:
videoBitrate: 2000000,  // 2 Mbps (adjust for quality vs size)
audioBitrate: 128000,   // 128 kbps
framerate: 30,          // 30 fps (or 24 for lower bandwidth)
resolution: { width: 1280, height: 720 }  // 720p (or 1080p)
```

### 2. Set Up Automatic Cleanup

```typescript
// Run daily cleanup
setInterval(async () => {
  const deleted = await mediaServer.cleanupOldRecordings(
    30 * 24 * 60 * 60 * 1000  // 30 days
  );
  logger.info(`Cleaned up ${deleted} old recordings`);
}, 24 * 60 * 60 * 1000);  // Every 24 hours
```

### 3. Configure Resource Limits

```typescript
// Limit concurrent recordings
const MAX_CONCURRENT_RECORDINGS = 10;

// Check before starting
const stats = mediaServer.getServerStats();
if (stats.recordings >= MAX_CONCURRENT_RECORDINGS) {
  throw new Error('Maximum concurrent recordings reached');
}
```

---

## 🚀 Deployment

### Option 1: Traditional Server

```bash
# Build
bun run build

# Start with PM2
pm2 start dist/index.js --name "video-api" -i max

# Monitor
pm2 logs video-api
pm2 monit
```

### Option 2: Docker

```dockerfile
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Copy app
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production

COPY . .
RUN bun run build

# Create recordings directory
RUN mkdir -p /app/recordings

# Start
CMD ["bun", "run", "start"]
```

```bash
# Build and run
docker build -t video-api .
docker run -d \
  -p 3000:3000 \
  -v /data/recordings:/app/recordings \
  -e RECORDING_STORAGE_PROVIDER=aws \
  -e RECORDING_STORAGE_BUCKET=my-bucket \
  --name video-api \
  video-api
```

### Option 3: Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: video-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: video-api
        image: your-registry/video-api:latest
        env:
        - name: RECORDING_STORAGE_PROVIDER
          value: "aws"
        - name: RECORDING_STORAGE_BUCKET
          valueFrom:
            secretKeyRef:
              name: recording-secrets
              key: bucket
        volumeMounts:
        - name: recordings
          mountPath: /app/recordings
      volumes:
      - name: recordings
        persistentVolumeClaim:
          claimName: recordings-pvc
```

---

## 📋 Post-Deployment Verification

### 1. Smoke Tests

- [ ] Create a test call
- [ ] Start recording
- [ ] Verify recording status
- [ ] Stop recording
- [ ] Check output file exists
- [ ] Verify cloud upload (if configured)
- [ ] Check thumbnails generated
- [ ] Test recording deletion

### 2. Load Testing

```bash
# Use k6 or similar
k6 run load-test.js
```

### 3. Monitor for 24 Hours

- [ ] Check error logs
- [ ] Monitor CPU/memory usage
- [ ] Verify storage growth
- [ ] Check recording success rate
- [ ] Monitor FFmpeg processing time

---

## 🐛 Troubleshooting

### Issue: FFmpeg not found
```bash
# Check FFmpeg installation
which ffmpeg
ffmpeg -version

# Install if missing
sudo apt-get install ffmpeg
```

### Issue: Recording fails to start
```bash
# Check permissions
ls -la recordings/
chmod 755 recordings/

# Check disk space
df -h
```

### Issue: Cloud upload fails
```bash
# Test AWS credentials
aws s3 ls s3://your-bucket/

# Test GCP credentials
gsutil ls gs://your-bucket/
```

### Issue: High CPU usage
```bash
# Check FFmpeg processes
ps aux | grep ffmpeg

# Reduce concurrent recordings
# Adjust video bitrate/resolution
```

---

## ✅ Final Checklist

Before going live:

- [ ] FFmpeg installed and tested
- [ ] Environment variables configured
- [ ] Cloud storage bucket created
- [ ] Directories created with proper permissions
- [ ] Dependencies installed
- [ ] API endpoints tested
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Automatic cleanup scheduled
- [ ] Load testing completed
- [ ] Documentation reviewed
- [ ] Team trained on monitoring

---

## 🎉 You're Ready!

The recording system is **fully implemented** and ready for production use. Follow this checklist to deploy successfully.

**Need Help?**
- Check `RECORDING_IMPLEMENTATION_REPORT.md` for detailed analysis
- Review `TRACK_CAPTURE_GUIDE.md` for capture details
- See `CAPTURE_QUICK_REF.md` for quick reference

**Good luck with your deployment! 🚀**
