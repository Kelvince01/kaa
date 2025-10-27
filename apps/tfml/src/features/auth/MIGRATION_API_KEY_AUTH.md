# API Key Authentication Migration

## Summary

Successfully migrated `@apps/tfml` from JWT-based session authentication to **API key-only authentication**. This change makes the service more suitable for machine-to-machine communication and programmatic access.

---

## Changes Made

### 1. **Created API Key Plugin** (`src/features/auth/api-key.plugin.ts`)

A new Elysia plugin that:
- ✅ Extracts API keys from `X-API-Key` or `Authorization: Bearer` headers
- ✅ Validates keys using the existing `@kaa/services` API key service
- ✅ Implements Redis-based rate limiting per API key
- ✅ Attaches user context (id, memberId, permissions) to requests
- ✅ Returns rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, etc.)
- ✅ Provides `requirePermissions()` helper for permission-based access control

**Key Features:**
```typescript
export type ApiKeyUser = {
  id: string;           // User ID
  memberId: string;     // Member ID
  permissions: string[]; // API key permissions
  apiKeyId: string;     // API key ID for tracking
};
```

---

### 2. **Migrated Auth Controller** (`src/features/auth/auth.controller.ts`)

Completely replaced JWT/session-based authentication with API key management:

#### **Removed:**
- ❌ `/login` endpoint (email/password authentication)
- ❌ `/logout` endpoint
- ❌ JWT token generation
- ❌ Session management
- ❌ Refresh tokens
- ❌ MFA integration
- ❌ Cookie-based authentication

#### **Added:**
- ✅ `GET /auth/me` - Get current user info from API key
- ✅ `POST /auth/api-keys` - Create new API key
- ✅ `GET /auth/api-keys` - List all API keys for user
- ✅ `GET /auth/api-keys/:id/usage` - Get usage statistics
- ✅ `PATCH /auth/api-keys/:id` - Update API key settings
- ✅ `DELETE /auth/api-keys/:id` - Revoke API key

All endpoints require API key authentication.

---

### 3. **Updated AI Controller** (`src/features/ai/ai.controller.ts`)

Replaced authentication mechanisms:

#### **Changed:**
- Replaced `authPlugin` with `apiKeyPlugin`
- Replaced `rolesPlugin(["admin"])` with `requirePermissions(["ai:admin", "ai:train"])`
- Now uses permission-based access control instead of role-based

---

## How to Use

### **1. Creating an API Key**

First, you need an existing API key to create new ones. For bootstrapping:

```bash
# Create initial API key directly in MongoDB or via admin script
# The key will be in format: kaa_<64-hex-characters>
```

Then use the API to create additional keys:

```bash
curl -X POST http://localhost:5001/api/v1/auth/api-keys \
  -H "X-API-Key: kaa_your_existing_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production AI Key",
    "permissions": ["ai:predict", "ai:train", "ai:admin"],
    "rateLimit": {
      "requests": 5000,
      "window": 3600
    },
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Production AI Key",
    "key": "kaa_abc123...xyz789",  // ⚠️ Save this! Won't be shown again
    "permissions": ["ai:predict", "ai:train", "ai:admin"],
    "rateLimit": { "requests": 5000, "window": 3600 },
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-10-27T10:30:00.000Z"
  },
  "message": "API key created successfully. Save this key - it won't be shown again!"
}
```

---

### **2. Authenticating Requests**

Use API keys in one of two ways:

**Option A: X-API-Key header** (Recommended)
```bash
curl http://localhost:5001/api/v1/auth/me \
  -H "X-API-Key: kaa_your_api_key_here"
```

**Option B: Authorization Bearer token**
```bash
curl http://localhost:5001/api/v1/auth/me \
  -H "Authorization: Bearer kaa_your_api_key_here"
```

---

### **3. Managing API Keys**

**List all keys:**
```bash
curl http://localhost:5001/api/v1/auth/api-keys \
  -H "X-API-Key: kaa_your_api_key"
```

**Get usage statistics:**
```bash
curl http://localhost:5001/api/v1/auth/api-keys/{id}/usage \
  -H "X-API-Key: kaa_your_api_key"
```

**Update key:**
```bash
curl -X PATCH http://localhost:5001/api/v1/auth/api-keys/{id} \
  -H "X-API-Key: kaa_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Key Name",
    "permissions": ["ai:predict"]
  }'
```

**Revoke key:**
```bash
curl -X DELETE http://localhost:5001/api/v1/auth/api-keys/{id} \
  -H "X-API-Key: kaa_your_api_key"
```

---

### **4. Using AI Endpoints**

All AI endpoints now require API keys:

```bash
# Make prediction
curl -X POST http://localhost:5001/api/v1/ai/models/{id}/predict \
  -H "X-API-Key: kaa_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "feature1": 123,
      "feature2": "value"
    }
  }'
```

---

## Rate Limiting

Each API key has configurable rate limits:

- **Default:** 1000 requests per hour
- **Custom:** Set via `rateLimit` parameter when creating keys
- **Headers returned:**
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets
  - `Retry-After`: Seconds to wait if rate limited (429 response)

**Example 429 Response:**
```json
{
  "error": "Rate limit exceeded. Retry after 1800 seconds."
}
```

---

## Permissions System

API keys support granular permissions:

| Permission | Description |
|-----------|-------------|
| `*` | Wildcard - all permissions |
| `ai:predict` | Make predictions |
| `ai:train` | Train models |
| `ai:admin` | Full model management (create, delete, deploy) |
| `api-keys:create` | Create new API keys |
| `api-keys:manage` | Manage existing API keys |

**Setting permissions:**
```bash
# During creation
-d '{"permissions": ["ai:predict", "ai:train"]}'

# Update existing key
curl -X PATCH .../api-keys/{id} -d '{"permissions": ["ai:predict"]}'
```

---

## Security Features

### ✅ **API Key Storage**
- Keys are **hashed** (SHA-256) before storage
- Only returned **once** during creation
- Never exposed in list/get operations

### ✅ **Rate Limiting**
- Redis-based per-key rate limiting
- Configurable limits per key
- Automatic cleanup after window expiry

### ✅ **Expiration**
- Optional expiration dates
- Automatic validation on each request
- Can be updated after creation

### ✅ **Usage Tracking**
- Total request count
- Last used timestamp
- Last request timestamp
- Queryable via API

### ✅ **Revocation**
- Instant revocation via DELETE endpoint
- Sets `isActive: false` in database
- All future requests immediately rejected

---

## Migration Checklist

- [x] Create `api-key.plugin.ts` with authentication logic
- [x] Update `auth.controller.ts` to manage API keys
- [x] Replace `authPlugin` with `apiKeyPlugin` in AI controller
- [x] Remove JWT/session dependencies
- [x] Add rate limiting per API key
- [x] Add permission-based access control
- [x] Format and lint all changed files

---

## Breaking Changes

⚠️ **This is a breaking change for existing clients:**

1. **No JWT tokens** - All JWT-based authentication removed
2. **No login endpoint** - `/login` no longer exists
3. **No session cookies** - All cookie-based auth removed
4. **API keys required** - All endpoints now require API keys

### **Migration Path for Existing Clients:**

1. Create initial API keys (via admin script or direct DB insert)
2. Update client applications to use API keys instead of JWT tokens
3. Replace `Authorization: Bearer <jwt>` with `X-API-Key: kaa_<key>`
4. Remove any session/cookie management code

---

## Environment Variables

No new environment variables required. Uses existing:

- `REDIS_URL` - For rate limiting (already configured)
- Existing MongoDB connection for API key storage

---

## Testing

Test the migration:

```bash
# 1. Get API key from existing user
KEY="kaa_your_test_key"

# 2. Test /me endpoint
curl http://localhost:5001/api/v1/auth/me -H "X-API-Key: $KEY"

# 3. Test rate limiting (make multiple requests)
for i in {1..10}; do
  curl http://localhost:5001/api/v1/auth/me -H "X-API-Key: $KEY"
done

# 4. Test AI prediction
curl -X POST http://localhost:5001/api/v1/ai/models/{id}/predict \
  -H "X-API-Key: $KEY" \
  -d '{"input": {"test": 123}}'
```

---

## Next Steps

1. **Create bootstrap script** - For initial API key creation
2. **Add API key analytics** - Dashboard for usage tracking
3. **Implement key rotation** - Scheduled or manual key rotation
4. **Add IP whitelisting** - Restrict keys to specific IPs
5. **Webhook notifications** - Alert on suspicious usage patterns

---

## Support

For questions or issues:
- Check logs: `apps/tfml/logs/`
- Review API documentation: `http://localhost:5001/docs`
- Contact: support@tfml.kaapro.dev
