# File V2 API - Quick Start Guide

Get up and running with the File V2 API in 5 minutes.

## Prerequisites

- Node.js 18+ with Bun
- MongoDB running
- AWS S3 bucket
- Docker (for ClamAV)

## Step 1: Start ClamAV (Optional but Recommended)

```bash
# Start ClamAV in Docker
docker run -d --name clamav -p 3310:3310 clamav/clamav:latest

# Wait for it to be ready (2-5 minutes on first run)
docker logs -f clamav
# Look for: "clamd is ready"
```

## Step 2: Configure Environment

Add to your `.env` file:

```env
# AWS S3 (Required)
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# CloudFront CDN (Optional)
CLOUDFRONT_DOMAIN=cdn.yourdomain.com

# ClamAV (Optional)
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

## Step 3: Test the API

### Health Check

```bash
curl http://localhost:3000/api/v1/files/v2/health
```

Expected response:
```json
{
  "status": "success",
  "service": "files-v2",
  "features": {
    "upload": true,
    "watermarking": true,
    "malwareScanning": true,
    ...
  }
}
```

### Upload a File

```bash
# Get your auth token first
TOKEN="your-auth-token"

# Upload a simple image
curl -X POST http://localhost:3000/api/v1/files/v2/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "category=property_photos"
```

### Upload with Watermark

```bash
curl -X POST http://localhost:3000/api/v1/files/v2/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "category=property_photos" \
  -F "addWatermark=true" \
  -F "watermarkText=© 2025 My Company" \
  -F "watermarkPosition=bottom-right"
```

## Step 4: Common Operations

### Search Files

```bash
curl "http://localhost:3000/api/v1/files/v2/search?type=image&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Download URL

```bash
# Replace FILE_ID with actual file ID from upload response
curl "http://localhost:3000/api/v1/files/v2/FILE_ID/download" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Usage Stats

```bash
curl "http://localhost:3000/api/v1/files/v2/stats/usage" \
  -H "Authorization: Bearer $TOKEN"
```

## Step 5: Frontend Integration

### JavaScript/TypeScript Example

```typescript
// Upload file with watermark
async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'property_photos');
  formData.append('addWatermark', 'true');
  formData.append('watermarkText', '© 2025 Company');
  formData.append('watermarkPosition', 'bottom-right');

  const response = await fetch('/api/v1/files/v2/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
}

// Search files
async function searchFiles(query: string) {
  const params = new URLSearchParams({
    search: query,
    type: 'image',
    page: '1',
    limit: '20'
  });

  const response = await fetch(`/api/v1/files/v2/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
}
```

### React Example

```tsx
import { useState } from 'react';

function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'property_photos');
    formData.append('addWatermark', 'true');
    formData.append('watermarkText', '© 2025 Company');

    try {
      const response = await fetch('/api/v1/files/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept="image/*"
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {result && (
        <div>
          <p>File uploaded successfully!</p>
          <img src={result.file.cdnUrl || result.file.url} alt="Uploaded" />
        </div>
      )}
    </div>
  );
}
```

## Common Use Cases

### 1. Property Photo Upload

```bash
curl -X POST http://localhost:3000/api/v1/files/v2/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@property-exterior.jpg" \
  -F "category=property_photos" \
  -F "addWatermark=true" \
  -F "watermarkText=© Real Estate Co." \
  -F "county=Nairobi" \
  -F "latitude=-1.286389" \
  -F "longitude=36.817223"
```

### 2. Document Upload (No Watermark)

```bash
curl -X POST http://localhost:3000/api/v1/files/v2/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@contract.pdf" \
  -F "category=contract_docs" \
  -F "accessLevel=private"
```

### 3. Batch Upload

```bash
curl -X POST http://localhost:3000/api/v1/files/v2/batch-upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "files=@photo3.jpg" \
  -F "category=property_photos"
```

### 4. Process Existing File

```bash
curl -X POST http://localhost:3000/api/v1/files/v2/FILE_ID/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "operation": "resize",
        "parameters": { "width": 1200, "height": 800 }
      },
      {
        "operation": "watermark",
        "parameters": {
          "type": "text",
          "text": "© 2025",
          "position": "bottom-right"
        }
      }
    ]
  }'
```

## Troubleshooting

### Upload Fails with "Malware Detected"

This is working correctly! The file contains suspicious content. If you believe it's a false positive:

1. Check the file content
2. Review the warnings in the response
3. Contact support if needed

### ClamAV Connection Error

If ClamAV is not available, the system falls back to heuristic scanning. To fix:

```bash
# Check if ClamAV is running
docker ps | grep clamav

# If not running, start it
docker start clamav

# Check logs
docker logs clamav
```

### AWS S3 Upload Fails

Check your credentials and bucket permissions:

```bash
# Test AWS credentials
aws s3 ls s3://your-bucket-name

# If fails, reconfigure
aws configure
```

### File Not Found After Upload

The file might still be processing. Check the status:

```bash
curl "http://localhost:3000/api/v1/files/v2/FILE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Look for `"status": "processing"` or `"status": "ready"`.

## Next Steps

1. **Read Full Documentation:** See `FILE_V2_API.md` for complete API reference
2. **Setup ClamAV:** See `packages/services/CLAMAV_SETUP.md` for production setup
3. **Configure CDN:** Setup CloudFront for faster delivery
4. **Monitor Usage:** Use `/stats/usage` endpoint to track storage
5. **Implement Webhooks:** Get notified when files are processed

## Support

- **API Docs:** `FILE_V2_API.md`
- **Implementation Guide:** `FILE_V2_IMPLEMENTATION.md`
- **Service Docs:** `packages/services/WATERMARK_AND_SCAN_USAGE.md`
- **Health Check:** `GET /api/v1/files/v2/health`

## Quick Reference

### File Categories
- `property_photos` - Property images
- `property_documents` - Property docs
- `user_avatar` - Profile pictures
- `user_documents` - User docs
- `contract_docs` - Contracts
- `verification_docs` - Verification

### Watermark Positions
- `top-left`, `top-right`
- `bottom-left`, `bottom-right`
- `center`

### Access Levels
- `public` - Anyone can access
- `private` - Owner only
- `protected` - Authorized users
- `organization` - Org members

### Image Operations
- `resize` - Resize image
- `watermark` - Add watermark
- `optimize` - Optimize for web
- `convert` - Convert format
- `thumbnail` - Generate thumbnail

---

**Ready to go!** 🚀

Start uploading files with automatic malware scanning and watermarking.
