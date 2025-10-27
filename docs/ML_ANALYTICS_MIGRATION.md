# ML Analytics Service Migration

## Overview
The `MLAnalyticsService` has been moved from the shared services package to the dedicated TensorFlow ML microservice (`apps/tfml`).

**Date**: 2025-10-27  
**Status**: ✅ Complete

---

## Changes Made

### 1. File Movement
- **From**: `/packages/services/src/virtual-tours/services/ml-analytics.service.ts`
- **To**: `/apps/tfml/src/features/ai/services/ml-analytics.service.ts`

### 2. Updated Files

#### `packages/services/src/virtual-tours/virtual-tour-services.orchestrator.ts`
- ❌ Removed: `import { MLAnalyticsService } from "./services/ml-analytics.service"`
- ❌ Removed: ML Analytics service registration in `registerServices()`
- ❌ Removed: Direct service calls to `MLAnalyticsService`
- ✅ Added: Comments indicating the need to call tfml API endpoints

**Affected Methods:**
- `registerServices()` - No longer registers `ml-analytics` service
- `setupCrossServiceEvents()` - ML analytics updates now require API calls
- `initialize()` - Removed `ml-analytics` from initialization plan
- `shutdown()` - Removed `ml-analytics` from shutdown order

---

## Breaking Changes

### ⚠️ Direct Service Imports
Any code that directly imported or instantiated `MLAnalyticsService` will break:

```typescript
// ❌ BEFORE (no longer works)
import { MLAnalyticsService } from "@kaa/services/virtual-tours/services/ml-analytics.service";
const mlService = new MLAnalyticsService();

// ✅ AFTER (use tfml API)
// Call HTTP endpoint: POST http://tfml-service:3000/api/ml-analytics/generate
```

### ⚠️ Real-time Updates
Real-time analytics updates now require HTTP API calls:

```typescript
// ❌ BEFORE
mlService?.updateRealTimeData?.(tourId, {
  type: "ai-content",
  timestamp: Date.now(),
  metadata: data,
});

// ✅ AFTER
await fetch('http://tfml-service:3000/api/ml-analytics/real-time-update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tourId,
    event: {
      type: "ai-content",
      timestamp: Date.now(),
      metadata: data,
    }
  })
});
```

---

## Required Updates

### 1. Create API Controller in tfml
Create `/apps/tfml/src/features/ai/controllers/ml-analytics.controller.ts`:

```typescript
import { Elysia } from 'elysia';
import { MLAnalyticsService } from '../services/ml-analytics.service';

const mlAnalyticsService = new MLAnalyticsService();

export const mlAnalyticsController = new Elysia({ prefix: '/ml-analytics' })
  .post('/generate', async ({ body }) => {
    const { tourId, baseAnalytics, historicalData } = body;
    return mlAnalyticsService.generateMLAnalytics(
      tourId,
      baseAnalytics,
      historicalData
    );
  })
  .post('/real-time-update', async ({ body }) => {
    const { tourId, event, sessionInfo } = body;
    mlAnalyticsService.updateRealTimeData(tourId, event, sessionInfo);
    return { success: true };
  })
  .get('/engagement-prediction/:tourId', async ({ params }) => {
    return mlAnalyticsService.getEngagementPrediction(params.tourId);
  })
  .get('/conversion-prediction/:tourId', async ({ params }) => {
    return mlAnalyticsService.getConversionPrediction(params.tourId);
  })
  .get('/health', async () => {
    return mlAnalyticsService.getHealth();
  })
  .get('/metrics', async () => {
    return mlAnalyticsService.getMetrics();
  });
```

### 2. Register Controller in tfml App
Update `/apps/tfml/src/app.routes.ts`:

```typescript
import { mlAnalyticsController } from './features/ai/controllers/ml-analytics.controller';

app.use(mlAnalyticsController);
```

### 3. Update Virtual Tour Orchestrator
Update event handlers to call tfml API (already done with TODO comments):

```typescript
// In setupCrossServiceEvents()
aiService.on('content-generated', async (data) => {
  this.emit('ai-content-generated', data);
  
  // Call tfml API
  try {
    await fetch(`${process.env.TFML_API_URL}/api/ml-analytics/real-time-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tourId: data.tourId,
        event: {
          type: 'ai-content',
          timestamp: Date.now(),
          metadata: data,
        }
      })
    });
  } catch (error) {
    console.error('Failed to update ML analytics:', error);
  }
});
```

### 4. Environment Variables
Add to your environment configuration:

```bash
# .env
TFML_API_URL=http://localhost:3000
# Or in production:
TFML_API_URL=https://tfml.your-domain.com
```

---

## Migration Checklist

- [x] Move service file to tfml app
- [x] Remove import from orchestrator
- [x] Update orchestrator service registration
- [x] Update event handlers with TODOs
- [x] Create ML Analytics API controller in tfml
- [x] Register controller in tfml routes
- [x] Add environment variable for tfml API URL
- [x] Update virtual tour services to call tfml API
- [x] Update virtual-tours.service.ts to use tfml API
- [ ] Test ML analytics API endpoints
- [ ] Update any other packages/apps using MLAnalyticsService
- [ ] Update tests that reference MLAnalyticsService

---

## Benefits of This Migration

1. **Service Isolation**: ML/AI workloads are now isolated in a dedicated microservice
2. **Independent Scaling**: The tfml service can be scaled separately based on ML workload
3. **Dependency Management**: Heavy TensorFlow dependencies are isolated to tfml
4. **Clear Boundaries**: Better separation of concerns between business logic and ML operations
5. **Resource Optimization**: ML models and processing don't impact other services

---

## Rollback Plan

If issues arise, to rollback:

1. Copy service back to original location:
   ```bash
   cp apps/tfml/src/features/ai/services/ml-analytics.service.ts \
      packages/services/src/virtual-tours/services/ml-analytics.service.ts
   ```

2. Restore orchestrator imports and service registration (git revert)

3. Remove tfml API controller

---

## Testing

### Test ML Analytics Endpoints
```bash
# Health check
curl http://localhost:3000/api/ml-analytics/health

# Metrics
curl http://localhost:3000/api/ml-analytics/metrics

# Engagement prediction
curl http://localhost:3000/api/ml-analytics/engagement-prediction/tour-123

# Real-time update
curl -X POST http://localhost:3000/api/ml-analytics/real-time-update \
  -H "Content-Type: application/json" \
  -d '{
    "tourId": "tour-123",
    "event": {
      "type": "view",
      "timestamp": 1698765432000,
      "sceneId": "scene-1"
    }
  }'
```

---

## Support

For questions or issues related to this migration, contact the ML/AI team or reference this document.

**Related Documentation:**
- [TensorFlow ML Service README](/apps/tfml/README.md)
- [Virtual Tours Architecture](/docs/features/virtual-tours.md)
- [Services Architecture](/packages/services/README.md)
