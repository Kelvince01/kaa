# ClamAV Setup Guide

## Quick Start (Docker - Recommended)

The easiest way to get ClamAV running:

```bash
# Pull and run ClamAV container
docker run -d \
  --name clamav \
  -p 3310:3310 \
  -e CLAMAV_NO_FRESHCLAM=false \
  clamav/clamav:latest

# Check if it's running
docker logs -f clamav

# Wait for "clamd is ready" message (may take 2-5 minutes on first run)
```

## Environment Configuration

Add to your `.env` file:

```env
# ClamAV Configuration
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

## Installation Methods

### Option 1: Docker (Recommended)

**Advantages:**
- Easy setup
- Isolated environment
- Automatic updates
- Cross-platform

```bash
# Basic setup
docker run -d --name clamav -p 3310:3310 clamav/clamav:latest

# With volume for virus definitions (faster restarts)
docker run -d \
  --name clamav \
  -p 3310:3310 \
  -v clamav-data:/var/lib/clamav \
  clamav/clamav:latest

# With custom configuration
docker run -d \
  --name clamav \
  -p 3310:3310 \
  -v ./clamav.conf:/etc/clamav/clamd.conf \
  clamav/clamav:latest
```

### Option 2: Ubuntu/Debian

```bash
# Install ClamAV
sudo apt-get update
sudo apt-get install -y clamav clamav-daemon

# Update virus definitions
sudo freshclam

# Start the daemon
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon

# Check status
sudo systemctl status clamav-daemon
```

### Option 3: macOS

```bash
# Install via Homebrew
brew install clamav

# Update virus definitions
freshclam

# Start the daemon
brew services start clamav
```

### Option 4: Windows

1. Download from: https://www.clamav.net/downloads
2. Install ClamAV
3. Update definitions: Run `freshclam.exe`
4. Start daemon: Run `clamd.exe`

## Configuration

### Basic Configuration File

Create `/etc/clamav/clamd.conf` (or equivalent):

```conf
# Basic settings
LocalSocket /var/run/clamav/clamd.ctl
TCPSocket 3310
TCPAddr 0.0.0.0

# Logging
LogFile /var/log/clamav/clamav.log
LogTime yes
LogFileMaxSize 10M

# Scanning
MaxThreads 12
MaxDirectoryRecursion 15
MaxFileSize 100M
MaxScanSize 100M

# Performance
StreamMaxLength 100M
```

### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  clamav:
    image: clamav/clamav:latest
    container_name: clamav
    ports:
      - "3310:3310"
    volumes:
      - clamav-data:/var/lib/clamav
    environment:
      - CLAMAV_NO_FRESHCLAM=false
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "clamdscan", "--ping", "1"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  clamav-data:
```

Start with:
```bash
docker-compose up -d
```

## Updating Virus Definitions

### Automatic Updates (Recommended)

ClamAV updates automatically via `freshclam` daemon.

**Docker:**
```bash
# Updates happen automatically inside container
docker exec clamav freshclam
```

**System Installation:**
```bash
# Manual update
sudo freshclam

# Enable automatic updates
sudo systemctl enable clamav-freshclam
sudo systemctl start clamav-freshclam
```

### Update Schedule

Configure in `/etc/clamav/freshclam.conf`:

```conf
# Update every 2 hours
Checks 12

# Database mirror
DatabaseMirror database.clamav.net
```

## Testing ClamAV

### Test Connection

```bash
# Test if ClamAV is listening
telnet localhost 3310

# Or use netcat
nc -zv localhost 3310
```

### Test Scanning

```bash
# Download EICAR test file (safe test virus)
curl -o eicar.txt https://secure.eicar.org/eicar.com.txt

# Scan with clamdscan
clamdscan eicar.txt

# Should output: "eicar.txt: Eicar-Test-Signature FOUND"
```

### Test with Node.js

```javascript
const NodeClam = require('clamscan');

async function testClamAV() {
  try {
    const clam = await new NodeClam().init({
      clamdscan: {
        host: 'localhost',
        port: 3310,
      }
    });
    
    console.log('✓ ClamAV connected successfully');
    
    // Test scan
    const { isInfected } = await clam.scanFile('./eicar.txt');
    console.log('✓ Scanning works:', isInfected ? 'Detected threat' : 'Clean');
    
  } catch (error) {
    console.error('✗ ClamAV test failed:', error);
  }
}

testClamAV();
```

## Troubleshooting

### ClamAV Not Starting

**Check logs:**
```bash
# Docker
docker logs clamav

# System
sudo tail -f /var/log/clamav/clamav.log
```

**Common issues:**
1. **Port already in use**: Change port in config
2. **Insufficient memory**: ClamAV needs ~1GB RAM
3. **Virus definitions not updated**: Run `freshclam`

### Connection Refused

```bash
# Check if daemon is running
ps aux | grep clamd

# Check port
netstat -an | grep 3310

# Restart daemon
sudo systemctl restart clamav-daemon
# or
docker restart clamav
```

### Slow Scanning

**Optimize performance:**

1. **Increase MaxThreads** in config
2. **Use SSD** for virus definitions
3. **Limit MaxFileSize** for large files
4. **Enable caching**

```conf
# In clamd.conf
MaxThreads 12
MaxFileSize 50M
```

### Out of Memory

```bash
# Increase Docker memory limit
docker run -d \
  --name clamav \
  -p 3310:3310 \
  --memory="2g" \
  clamav/clamav:latest
```

## Production Deployment

### High Availability Setup

Use multiple ClamAV instances with load balancing:

```yaml
# docker-compose.yml
version: '3.8'

services:
  clamav-1:
    image: clamav/clamav:latest
    ports:
      - "3310:3310"
    
  clamav-2:
    image: clamav/clamav:latest
    ports:
      - "3311:3310"
    
  clamav-3:
    image: clamav/clamav:latest
    ports:
      - "3312:3310"
```

### Monitoring

```bash
# Check ClamAV status
clamdscan --ping

# Monitor logs
tail -f /var/log/clamav/clamav.log

# Check virus definition version
sigtool --info /var/lib/clamav/main.cvd
```

### Security Best Practices

1. **Run as non-root user**
2. **Limit network access** (firewall rules)
3. **Regular updates** (automated freshclam)
4. **Monitor scan failures**
5. **Set resource limits**

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clamav
spec:
  replicas: 3
  selector:
    matchLabels:
      app: clamav
  template:
    metadata:
      labels:
        app: clamav
    spec:
      containers:
      - name: clamav
        image: clamav/clamav:latest
        ports:
        - containerPort: 3310
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: clamav
spec:
  selector:
    app: clamav
  ports:
  - port: 3310
    targetPort: 3310
```

## Performance Benchmarks

| File Size | Scan Time | Memory Usage |
|-----------|-----------|--------------|
| 1 MB      | ~100ms    | ~500MB       |
| 10 MB     | ~500ms    | ~600MB       |
| 50 MB     | ~2s       | ~800MB       |
| 100 MB    | ~5s       | ~1GB         |

## Alternative Solutions

If ClamAV doesn't meet your needs:

1. **VirusTotal API** - Cloud-based, multiple engines
2. **AWS S3 Malware Scanning** - Integrated with S3
3. **Cloud One File Storage Security** - Enterprise solution
4. **MetaDefender** - Multi-scanning platform

## Resources

- Official Docs: https://docs.clamav.net/
- Docker Hub: https://hub.docker.com/r/clamav/clamav
- NodeClam: https://github.com/kylefarris/clamscan
- EICAR Test: https://www.eicar.org/

## Support

For issues:
1. Check ClamAV logs
2. Verify network connectivity
3. Ensure virus definitions are updated
4. Test with EICAR file
5. Review NodeClam documentation
