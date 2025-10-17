# Watermarking and Malware Scanning Usage Guide

## Overview

The FilesService now includes industry-standard implementations for:
1. **Image Watermarking** (text and image-based)
2. **Malware Scanning** (ClamAV integration with heuristic fallback)

## 1. Watermarking

### Text Watermark

Add text watermarks to images with customizable position, opacity, color, and size.

```typescript
// Example: Add text watermark
const processedFile = await filesService.processFile(fileId, [
  {
    operation: ImageOperation.WATERMARK,
    parameters: {
      type: 'text',
      text: 'Confidential',
      position: 'bottom-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
      opacity: 0.5, // 0.0 to 1.0
      fontSize: 24,
      color: 'white' // Any CSS color
    }
  }
]);
```

### Image Watermark

Add logo or image watermarks with automatic scaling and positioning.

```typescript
// Example: Add image watermark (logo)
const processedFile = await filesService.processFile(fileId, [
  {
    operation: ImageOperation.WATERMARK,
    parameters: {
      type: 'image',
      watermarkPath: '/path/to/logo.png', // Path to watermark image
      position: 'bottom-right',
      opacity: 0.7,
      scale: 0.2 // 20% of original image width
    }
  }
]);
```

### Watermark Positions

Available positions:
- `top-left` - Top left corner with 20px padding
- `top-right` - Top right corner with 20px padding
- `bottom-left` - Bottom left corner with 20px padding
- `bottom-right` - Bottom right corner with 20px padding (default)
- `center` - Center of the image

### Advanced Example: Multiple Watermarks

```typescript
// Add both text and logo watermark
const processedFiles = await filesService.processFile(fileId, [
  {
    operation: ImageOperation.WATERMARK,
    parameters: {
      type: 'text',
      text: '© 2025 Company Name',
      position: 'bottom-left',
      opacity: 0.6,
      fontSize: 18,
      color: 'white'
    }
  },
  {
    operation: ImageOperation.WATERMARK,
    parameters: {
      type: 'image',
      watermarkPath: './assets/logo.png',
      position: 'bottom-right',
      opacity: 0.8,
      scale: 0.15
    }
  }
]);
```

## 2. Malware Scanning

### ClamAV Integration

The service automatically uses ClamAV when available, with intelligent fallback to heuristic scanning.

#### Setup ClamAV

**Option 1: Docker (Recommended)**
```bash
# Run ClamAV daemon in Docker
docker run -d \
  --name clamav \
  -p 3310:3310 \
  clamav/clamav:latest
```

**Option 2: System Installation**
```bash
# Ubuntu/Debian
sudo apt-get install clamav clamav-daemon

# macOS
brew install clamav

# Start the daemon
sudo systemctl start clamav-daemon
```

#### Environment Variables

```env
# .env file
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

### Scanning Features

The malware scanner performs:

1. **ClamAV Scan** (if available)
   - Full antivirus scanning with updated virus definitions
   - Detects known malware, trojans, viruses

2. **Heuristic Scanning** (always runs)
   - File signature analysis
   - Script injection detection
   - Entropy analysis (obfuscation detection)
   - Size anomaly detection
   - Null byte detection

### Scan Results

```typescript
interface ScanResult {
  clean: boolean;           // True if file is safe
  warnings: string[];       // List of warnings/issues found
  threats?: string[];       // Specific threats detected by ClamAV
}
```

### Example: Manual Scan

```typescript
// The scan happens automatically during upload
const file = await filesService.uploadFile(buffer, filename, {
  ownerId: userId,
  organizationId: orgId,
  // ... other options
});

// If scan fails, upload will throw error:
// "File validation failed: File failed security scan"
```

### Detected Threats

The scanner detects:

**File Signatures:**
- PE Executables (.exe)
- ELF Executables (Linux binaries)
- Java Class Files
- Mach-O Binaries (macOS)
- Suspicious archives

**Content Analysis:**
- Script tags (`<script>`)
- JavaScript protocols
- Event handlers (XSS attempts)
- Eval functions
- Document.write calls
- Iframe injections

**Obfuscation:**
- High entropy content (encrypted/packed files)
- Null bytes in text files
- Unusually large files (>100MB)

## 3. Configuration

### Watermark Defaults

You can set default watermark parameters in your environment:

```env
# Default watermark settings
WATERMARK_TEXT="Confidential"
WATERMARK_POSITION="bottom-right"
WATERMARK_OPACITY=0.5
WATERMARK_FONT_SIZE=24
WATERMARK_COLOR="white"
```

### Security Settings

```env
# Malware scanning
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
CLAMAV_TIMEOUT=60000

# File validation
MAX_FILE_SIZE=104857600  # 100MB
MIN_FILE_SIZE=1          # 1 byte
```

## 4. Error Handling

### Watermark Errors

```typescript
try {
  const result = await filesService.processFile(fileId, [{
    operation: ImageOperation.WATERMARK,
    parameters: { /* ... */ }
  }]);
} catch (error) {
  if (error.message.includes('watermark')) {
    // Handle watermark-specific errors
    console.error('Watermarking failed:', error);
  }
}
```

### Scan Errors

```typescript
try {
  await filesService.uploadFile(buffer, filename, options);
} catch (error) {
  if (error.message.includes('security scan')) {
    // File failed malware scan
    console.error('Malicious file detected');
  }
}
```

## 5. Best Practices

### Watermarking

1. **Use appropriate opacity**: 0.3-0.7 for visibility without obscuring content
2. **Choose contrasting colors**: White on dark images, black on light images
3. **Scale logos appropriately**: 10-20% of image width
4. **Position strategically**: Bottom corners are standard, center for high security

### Malware Scanning

1. **Always enable ClamAV in production**: Heuristic scanning is a fallback only
2. **Update virus definitions regularly**: 
   ```bash
   freshclam  # Update ClamAV definitions
   ```
3. **Monitor scan failures**: Log and alert on scan errors
4. **Quarantine suspicious files**: Don't auto-delete, review manually
5. **Set appropriate timeouts**: Large files may take longer to scan

## 6. Performance Considerations

### Watermarking
- Text watermarks: ~50-200ms per image
- Image watermarks: ~100-500ms per image
- Batch processing recommended for multiple operations

### Malware Scanning
- Heuristic scan: ~10-50ms
- ClamAV scan: ~100-2000ms (depends on file size)
- Consider async processing for large files

## 7. Testing

### Test Watermarking

```typescript
// Test text watermark
const testBuffer = await fs.readFile('./test-image.jpg');
const result = await filesService.uploadFile(testBuffer, 'test.jpg', {
  ownerId: 'test-user',
  processingOptions: {
    operation: ImageOperation.WATERMARK,
    parameters: {
      type: 'text',
      text: 'TEST WATERMARK'
    }
  }
});
```

### Test Malware Scanning

```bash
# Download EICAR test file (safe test virus)
curl -o eicar.txt https://secure.eicar.org/eicar.com.txt

# Try uploading - should be rejected
```

## 8. Troubleshooting

### ClamAV Not Connecting

```bash
# Check if ClamAV is running
sudo systemctl status clamav-daemon

# Check port
netstat -an | grep 3310

# Test connection
telnet localhost 3310
```

### Watermark Not Visible

- Check opacity (should be > 0.1)
- Verify color contrasts with image
- Ensure position is within image bounds
- Check if image format supports transparency

### False Positives

If legitimate files are flagged:
1. Review the warnings array
2. Adjust heuristic thresholds if needed
3. Whitelist specific file patterns
4. Update ClamAV definitions

## 9. API Examples

### Upload with Watermark

```typescript
POST /api/files/upload

{
  "file": <binary>,
  "processingOptions": {
    "operation": "watermark",
    "parameters": {
      "type": "text",
      "text": "© 2025 Company",
      "position": "bottom-right",
      "opacity": 0.6
    }
  }
}
```

### Check Scan Results

```typescript
GET /api/files/:fileId

Response:
{
  "id": "file-123",
  "status": "ready",
  "scanResult": {
    "clean": true,
    "warnings": [],
    "scannedAt": "2025-10-11T10:30:00Z"
  }
}
```

## Support

For issues or questions:
- Check logs: `logger.error` and `logger.warn` messages
- Review ClamAV logs: `/var/log/clamav/`
- Test with EICAR file for malware detection
- Verify Sharp installation for watermarking
