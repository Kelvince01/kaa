# File V2 API Documentation

Complete API documentation for the File V2 service with watermarking, malware scanning, and Kenya-specific features.

## Base URL

```
/api/v1/files/v2
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your-token>
```

---

## Endpoints

### 1. Upload File

Upload a file with optional watermarking and automatic malware scanning.

**Endpoint:** `POST /upload`

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | The file to upload (max 100MB) |
| category | String | Yes | File category (e.g., "property_photos", "user_documents") |
| organizationId | String | No | Organization ID |
| accessLevel | String | No | Access level: "public", "private", "protected", "organization" |
| relatedEntityId | String | No | Related entity ID (property, user, etc.) |
| relatedEntityType | String | No | Related entity type |
| tags | String | No | Comma-separated tags |
| addWatermark | Boolean | No | Enable watermarking |
| watermarkType | String | No | "text" or "image" |
| watermarkText | String | No | Text for watermark (default: "© Confidential") |
| watermarkPath | String | No | Path to watermark image |
| watermarkPosition | String | No | Position: "top-left", "top-right", "bottom-left", "bottom-right", "center" |
| watermarkOpacity | String | No | Opacity (0.0-1.0, default: 0.6) |
| watermarkFontSize | String | No | Font size in pixels (default: 24) |
| watermarkColor | String | No | Text color (default: "white") |
| watermarkScale | String | No | Image scale (0.0-1.0, default: 0.2) |
| county | String | No | Kenya county name |
| latitude | String | No | GPS latitude |
| longitude | String | No | GPS longitude |
| gpsAccuracy | String | No | GPS accuracy in meters |

**Example Request:**

```bash
curl -X POST https://api.example.com/api/v1/files/v2/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@property-photo.jpg" \
  -F "category=property_photos" \
  -F "addWatermark=true" \
  -F "watermarkText=© 2025 Real Estate Co." \
  -F "watermarkPosition=bottom-right" \
  -F "county=Nairobi"
```

**Success Response (201):**

```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "file": {
    "id": "507f1f77bcf86cd799439011",
    "url": "https://bucket.s3.amazonaws.com/...",
    "cdnUrl": "https://cdn.example.com/...",
    "fileName": "org-123_1234567890_uuid.jpg",
    "originalName": "property-photo.jpg",
    "size": 2048576,
    "mimeType": "image/jpeg",
    "type": "image",
    "category": "property_photos",
    "status": "uploading"
  }
}
```

**Error Response (400 - Malware Detected):**

```json
{
  "status": "error",
  "message": "File validation failed: File failed security scan",
  "code": "MALWARE_DETECTED"
}
```

---

### 2. Process File

Apply image processing operations (resize, watermark, convert, etc.).

**Endpoint:** `POST /:id/process`

**Request Body:**

```json
{
  "operations": [
    {
      "operation": "watermark",
      "parameters": {
        "type": "text",
        "text": "CONFIDENTIAL",
        "position": "center",
        "opacity": 0.5
      },
      "priority": "high"
    },
    {
      "operation": "resize",
      "parameters": {
        "width": 800,
        "height": 600,
        "fit": "cover"
      }
    }
  ]
}
```

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Processed 2 variant(s)",
  "files": [
    {
      "id": "507f1f77bcf86cd799439012",
      "url": "https://...",
      "fileName": "..._watermarked.jpg",
      "size": 1024000,
      "status": "ready"
    }
  ]
}
```

---

### 3. Get File

Retrieve file details by ID.

**Endpoint:** `GET /:id`

**Success Response (200):**

```json
{
  "status": "success",
  "file": {
    "id": "507f1f77bcf86cd799439011",
    "originalName": "property-photo.jpg",
    "fileName": "org-123_1234567890_uuid.jpg",
    "mimeType": "image/jpeg",
    "type": "image",
    "category": "property_photos",
    "size": 2048576,
    "url": "https://...",
    "cdnUrl": "https://...",
    "status": "ready",
    "downloadCount": 5,
    "viewCount": 23,
    "tags": ["property", "exterior"],
    "kenyaMetadata": {
      "county": "Nairobi",
      "gpsCoordinates": {
        "latitude": -1.286389,
        "longitude": 36.817223
      }
    },
    "createdAt": "2025-10-11T10:30:00Z",
    "updatedAt": "2025-10-11T10:30:00Z"
  }
}
```

---

### 4. Get Download URL

Generate a presigned download URL.

**Endpoint:** `GET /:id/download`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| expiresIn | Number | No | URL expiration in seconds (default: 3600) |

**Success Response (200):**

```json
{
  "status": "success",
  "downloadUrl": "https://bucket.s3.amazonaws.com/...?signature=...",
  "expiresIn": 3600
}
```

---

### 5. Search Files

Advanced file search with filters.

**Endpoint:** `GET /search`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| search | String | Text search in filename |
| type | String | Comma-separated file types: "image", "document", "video", "audio" |
| category | String | Comma-separated categories |
| status | String | Comma-separated statuses: "ready", "processing", "failed" |
| organizationId | String | Filter by organization |
| tags | String | Comma-separated tags |
| dateFrom | String | ISO date string |
| dateTo | String | ISO date string |
| sizeMin | Number | Minimum file size in bytes |
| sizeMax | Number | Maximum file size in bytes |
| county | String | Kenya county filter |
| hasGps | Boolean | Filter files with GPS data |
| sortBy | String | Sort field: "createdAt", "size", "downloadCount", "fileName" |
| sortOrder | String | "asc" or "desc" |
| page | Number | Page number (default: 1) |
| limit | Number | Items per page (default: 20) |

**Example Request:**

```bash
curl "https://api.example.com/api/v1/files/v2/search?type=image&county=Nairobi&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Success Response (200):**

```json
{
  "status": "success",
  "files": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "filters": {
    "type": ["image"],
    "county": "Nairobi"
  }
}
```

---

### 6. Get Files by Entity

Get all files related to a specific entity.

**Endpoint:** `GET /entity/:entityType/:entityId`

**Example:** `GET /entity/property/507f1f77bcf86cd799439011`

**Success Response (200):**

```json
{
  "status": "success",
  "count": 12,
  "files": [...]
}
```

---

### 7. Update File

Update file metadata.

**Endpoint:** `PATCH /:id`

**Request Body:**

```json
{
  "originalName": "updated-name.jpg",
  "tags": ["property", "interior", "bedroom"],
  "accessLevel": "public",
  "kenyaMetadata": {
    "county": "Mombasa",
    "gpsCoordinates": {
      "latitude": -4.043477,
      "longitude": 39.668206,
      "accuracy": 10
    }
  }
}
```

**Success Response (200):**

```json
{
  "status": "success",
  "message": "File updated successfully",
  "file": {...}
}
```

---

### 8. Delete File (Soft Delete)

Soft delete a file (can be recovered).

**Endpoint:** `DELETE /:id`

**Requires Permission:** `files:delete`

**Success Response (200):**

```json
{
  "status": "success",
  "message": "File deleted successfully"
}
```

---

### 9. Permanently Delete File

Permanently delete file from storage (cannot be recovered).

**Endpoint:** `DELETE /:id/permanent`

**Requires Permission:** `files:delete`

**Success Response (200):**

```json
{
  "status": "success",
  "message": "File permanently deleted"
}
```

---

### 10. Get Usage Statistics

Get file usage statistics for organization.

**Endpoint:** `GET /stats/usage`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| organizationId | String | Organization ID (optional) |
| dateFrom | String | ISO date string |
| dateTo | String | ISO date string |

**Success Response (200):**

```json
{
  "status": "success",
  "stats": {
    "totalFiles": 1250,
    "totalSize": 5368709120,
    "totalDownloads": 3420,
    "totalViews": 12500,
    "averageSize": 4294967,
    "typeDistribution": ["image", "document", "video"],
    "categoryDistribution": ["property_photos", "user_documents"]
  }
}
```

---

### 11. Batch Upload

Upload multiple files at once.

**Endpoint:** `POST /batch-upload`

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| files | File[] | Yes | Array of files to upload |
| category | String | Yes | File category |
| organizationId | String | No | Organization ID |
| accessLevel | String | No | Access level |
| tags | String | No | Comma-separated tags |

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Uploaded 8 of 10 files",
  "successful": 8,
  "failed": 2,
  "files": [...],
  "errors": [
    "File failed security scan",
    "File size exceeds maximum"
  ]
}
```

---

### 12. Get Watermark Presets

Get predefined watermark configurations.

**Endpoint:** `GET /watermark/presets`

**Success Response (200):**

```json
{
  "status": "success",
  "presets": {
    "confidential": {
      "type": "text",
      "text": "CONFIDENTIAL",
      "position": "center",
      "opacity": 0.3,
      "fontSize": 48,
      "color": "red"
    },
    "draft": {
      "type": "text",
      "text": "DRAFT",
      "position": "center",
      "opacity": 0.4,
      "fontSize": 64,
      "color": "gray"
    },
    "copyright": {
      "type": "text",
      "text": "© 2025 All Rights Reserved",
      "position": "bottom-right",
      "opacity": 0.6,
      "fontSize": 16,
      "color": "white"
    },
    "premium": {
      "type": "text",
      "text": "PREMIUM",
      "position": "top-right",
      "opacity": 0.8,
      "fontSize": 32,
      "color": "gold"
    }
  }
}
```

---

### 13. Health Check

Check service health and available features.

**Endpoint:** `GET /health`

**Success Response (200):**

```json
{
  "status": "success",
  "service": "files-v2",
  "features": {
    "upload": true,
    "watermarking": true,
    "malwareScanning": true,
    "imageProcessing": true,
    "kenyaMetadata": true,
    "s3Storage": true,
    "cdnDelivery": true
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| MALWARE_DETECTED | File failed security scan |
| UPLOAD_FAILED | File upload failed |
| FILE_NOT_FOUND | File not found |
| ACCESS_DENIED | User doesn't have access to file |
| PROCESSING_FAILED | File processing failed |
| INVALID_FILE_TYPE | File type not allowed |
| FILE_TOO_LARGE | File exceeds size limit |

---

## File Categories

Available file categories:

- `property_photos` - Property listing photos
- `property_documents` - Property documents
- `user_avatar` - User profile pictures
- `user_documents` - User documents
- `verification_docs` - Verification documents
- `contract_docs` - Contract documents
- `payment_receipts` - Payment receipts
- `inspection_reports` - Inspection reports
- `marketing_materials` - Marketing materials
- `system_assets` - System assets
- `temp_uploads` - Temporary uploads

---

## File Types

- `image` - Images (JPEG, PNG, GIF, WebP, etc.)
- `document` - Documents (PDF, DOC, TXT, etc.)
- `video` - Videos (MP4, AVI, MOV, etc.)
- `audio` - Audio files (MP3, WAV, etc.)
- `archive` - Archives (ZIP, RAR, etc.)
- `other` - Other file types

---

## Access Levels

- `public` - Publicly accessible
- `private` - Only owner can access
- `protected` - Owner and authorized users
- `organization` - All organization members
- `internal` - Internal system use only

---

## Image Operations

Available image processing operations:

- `resize` - Resize image
- `crop` - Crop image
- `rotate` - Rotate image
- `watermark` - Add watermark
- `compress` - Compress image
- `convert` - Convert format
- `optimize` - Optimize for web
- `thumbnail` - Generate thumbnail

---

## Kenya-Specific Features

### Counties

All 47 Kenya counties are supported for metadata tagging.

### GPS Coordinates

Files can include GPS coordinates for location-based filtering and mapping.

### Mobile Optimization

Images are automatically optimized for Kenya's mobile network conditions.

---

## Rate Limits

- Upload: 100 requests per hour per user
- Search: 1000 requests per hour per user
- Download: 500 requests per hour per user

---

## Best Practices

1. **Always use watermarks** for sensitive property photos
2. **Tag files appropriately** for easier searching
3. **Include GPS data** for property-related files
4. **Use batch upload** for multiple files
5. **Monitor usage statistics** to track storage
6. **Set appropriate access levels** for security
7. **Use CDN URLs** for faster delivery
8. **Implement retry logic** for failed uploads

---

## Examples

### Upload Property Photo with Watermark

```javascript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('category', 'property_photos');
formData.append('addWatermark', 'true');
formData.append('watermarkText', '© 2025 Real Estate Co.');
formData.append('watermarkPosition', 'bottom-right');
formData.append('county', 'Nairobi');
formData.append('latitude', '-1.286389');
formData.append('longitude', '36.817223');

const response = await fetch('/api/v1/files/v2/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

### Search Property Photos in Nairobi

```javascript
const params = new URLSearchParams({
  type: 'image',
  category: 'property_photos',
  county: 'Nairobi',
  hasGps: 'true',
  page: '1',
  limit: '20'
});

const response = await fetch(`/api/v1/files/v2/search?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
```

### Process Image with Multiple Operations

```javascript
const response = await fetch(`/api/v1/files/v2/${fileId}/process`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operations: [
      {
        operation: 'resize',
        parameters: { width: 1200, height: 800, fit: 'cover' }
      },
      {
        operation: 'watermark',
        parameters: {
          type: 'text',
          text: '© 2025',
          position: 'bottom-right',
          opacity: 0.6
        }
      },
      {
        operation: 'optimize',
        parameters: { quality: 85 }
      }
    ]
  })
});

const result = await response.json();
```

---

## Support

For issues or questions:
- API Documentation: `/api/v1/docs`
- Health Check: `/api/v1/files/v2/health`
- Support Email: support@example.com
