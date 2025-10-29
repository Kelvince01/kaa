# Webhooks Module

This module provides a complete frontend implementation for managing webhooks in the application. It corresponds to the webhooks feature in `apps/api/src/features/misc/webhooks`.

## Features

- 📝 Create, update, and delete webhooks
- 🔄 Activate/deactivate webhooks
- 🧪 Test webhook endpoints
- 📊 View webhook analytics and delivery history
- 🔐 Regenerate webhook secrets
- 🔁 Redeliver failed webhooks
- 📈 Real-time delivery tracking

## Structure

```
webhooks/
├── components/
│   ├── webhook-analytics.tsx      # Analytics visualization
│   ├── webhook-card.tsx           # Webhook info card
│   ├── webhook-create-dialog.tsx  # Create webhook dialog
│   ├── webhook-deliveries.tsx     # Delivery history table
│   ├── webhook-edit-dialog.tsx    # Edit webhook dialog
│   ├── webhook-form.tsx           # Webhook configuration form
│   ├── webhook-list.tsx           # List of webhooks
│   └── webhook-test-dialog.tsx    # Test webhook dialog
├── webhook.queries.ts             # React Query hooks
├── webhook.service.ts             # API service functions
├── webhook.type.ts                # TypeScript types
├── index.ts                       # Module exports
└── README.md                      # This file
```

## Usage

### Basic Implementation

```tsx
import { WebhookList, useUserWebhooks, WebhookCreateDialog } from "@/modules/misc/webhooks";
import { useState } from "react";

function WebhooksPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: webhooksData, isLoading } = useUserWebhooks();

  return (
    <div>
      <WebhookList
        webhooks={webhooksData?.data}
        isLoading={isLoading}
        onCreateNew={() => setShowCreate(true)}
      />
      
      <WebhookCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  );
}
```

### Create a Webhook

```tsx
import { useCreateWebhook, WebhookEventType } from "@/modules/misc/webhooks";

function CreateWebhook() {
  const createWebhook = useCreateWebhook();

  const handleCreate = async () => {
    await createWebhook.mutateAsync({
      name: "Payment Notifications",
      url: "https://example.com/webhooks/payments",
      events: [
        WebhookEventType.PAYMENT_COMPLETED,
        WebhookEventType.PAYMENT_FAILED,
      ],
      environment: WebhookEnvironment.PRODUCTION,
      priority: WebhookPriority.HIGH,
    });
  };

  return <button onClick={handleCreate}>Create Webhook</button>;
}
```

### View Webhook Analytics

```tsx
import { WebhookAnalyticsComponent, useWebhookAnalytics } from "@/modules/misc/webhooks";

function WebhookAnalytics({ webhookId }: { webhookId: string }) {
  const { data: analytics } = useWebhookAnalytics(webhookId);

  return <WebhookAnalyticsComponent analytics={analytics?.data} />;
}
```

### Test a Webhook

```tsx
import { useTestWebhook, WebhookTestDialog } from "@/modules/misc/webhooks";
import { useState } from "react";

function TestWebhook({ webhookId, webhookName }: { webhookId: string; webhookName: string }) {
  const [showTest, setShowTest] = useState(false);
  const testWebhook = useTestWebhook();

  const handleTest = async (id: string) => {
    const result = await testWebhook.mutateAsync(id);
    return result.data;
  };

  return (
    <>
      <button onClick={() => setShowTest(true)}>Test Webhook</button>
      <WebhookTestDialog
        open={showTest}
        onOpenChange={setShowTest}
        webhookId={webhookId}
        webhookName={webhookName}
        onTest={handleTest}
      />
    </>
  );
}
```

## Available Hooks

### Queries

- `useSupportedEvents()` - Get list of available webhook events
- `useUserWebhooks(params?)` - Get user's webhooks with optional filters
- `useWebhook(webhookId)` - Get single webhook details
- `useWebhookDeliveries(webhookId, params?)` - Get delivery history
- `useWebhookDelivery(deliveryId)` - Get single delivery details
- `useWebhookEvents(webhookId)` - Get webhook events
- `useWebhookAnalytics(webhookId)` - Get webhook analytics

### Mutations

- `useCreateWebhook()` - Create a new webhook
- `useUpdateWebhook()` - Update webhook configuration
- `useDeleteWebhook()` - Delete a webhook
- `useTestWebhook()` - Test webhook endpoint
- `useActivateWebhook()` - Activate a webhook
- `useDeactivateWebhook()` - Deactivate a webhook
- `useRegenerateWebhookSecret()` - Regenerate webhook secret
- `useRedeliverWebhook()` - Retry failed delivery

## Components

### WebhookList

Displays a list of webhooks with management actions.

```tsx
<WebhookList
  webhooks={webhooks}
  isLoading={isLoading}
  onCreateNew={() => {}}
  onEdit={(webhook) => {}}
  onDelete={(id) => {}}
  onTest={(id) => {}}
  onActivate={(id) => {}}
  onDeactivate={(id) => {}}
  onViewDeliveries={(id) => {}}
  onViewAnalytics={(id) => {}}
  onRegenerateSecret={(id) => {}}
/>
```

### WebhookForm

Form for creating or editing webhooks.

```tsx
<WebhookForm
  defaultValues={webhook}
  onSubmit={handleSubmit}
  isLoading={isLoading}
  submitLabel="Create Webhook"
  supportedEvents={events}
/>
```

### WebhookDeliveries

Table showing webhook delivery history.

```tsx
<WebhookDeliveries
  deliveries={deliveries}
  isLoading={isLoading}
  onRedeliver={(id) => {}}
  onViewDetails={(delivery) => {}}
/>
```

### WebhookAnalyticsComponent

Display webhook performance metrics.

```tsx
<WebhookAnalyticsComponent
  analytics={analytics}
  isLoading={isLoading}
/>
```

## Types

### WebhookEventType

Available webhook events:

- User Events: `USER_CREATED`, `USER_UPDATED`, etc.
- Property Events: `PROPERTY_CREATED`, `PROPERTY_UPDATED`, etc.
- Payment Events: `PAYMENT_COMPLETED`, `PAYMENT_FAILED`, etc.
- Booking Events: `BOOKING_CREATED`, `BOOKING_CONFIRMED`, etc.
- And many more...

### WebhookStatus

Delivery status types:

- `PENDING` - Waiting to be delivered
- `PROCESSING` - Currently being delivered
- `DELIVERED` - Successfully delivered
- `FAILED` - Delivery failed
- `RETRYING` - Retry in progress
- `CANCELLED` - Delivery cancelled
- `EXPIRED` - Delivery expired

### WebhookMethod

HTTP methods:

- `GET`, `POST`, `PUT`, `PATCH`, `DELETE`

### WebhookEnvironment

Environment types:

- `PRODUCTION`, `STAGING`, `DEVELOPMENT`, `TEST`

### WebhookPriority

Priority levels:

- `LOW`, `MEDIUM`, `HIGH`, `URGENT`

## Integration with API

This module integrates with the webhooks API endpoints:

- `GET /webhooks/events` - Get supported events
- `GET /webhooks/user/webhooks` - Get user webhooks
- `POST /webhooks` - Create webhook
- `GET /webhooks/:id` - Get webhook
- `PUT /webhooks/:id` - Update webhook
- `DELETE /webhooks/:id` - Delete webhook
- `POST /webhooks/:id/test` - Test webhook
- `POST /webhooks/:id/activate` - Activate webhook
- `POST /webhooks/:id/deactivate` - Deactivate webhook
- `POST /webhooks/:id/regenerate-secret` - Regenerate secret
- `GET /webhooks/:id/deliveries` - Get deliveries
- `POST /webhooks/deliveries/:id/redeliver` - Redeliver webhook
- `GET /webhooks/:id/analytics` - Get analytics

## Best Practices

1. **Always test webhooks** before activating them in production
2. **Use appropriate priorities** based on event criticality
3. **Set reasonable timeouts** to prevent hanging requests
4. **Monitor delivery analytics** to identify issues early
5. **Handle failed deliveries** by investigating and redelivering
6. **Use appropriate environments** for testing vs production
7. **Regenerate secrets periodically** for security

## Example: Complete Webhook Management Page

```tsx
import {
  WebhookList,
  WebhookCreateDialog,
  WebhookEditDialog,
  WebhookTestDialog,
  useUserWebhooks,
  useDeleteWebhook,
  useActivateWebhook,
  useDeactivateWebhook,
  useRegenerateWebhookSecret,
} from "@/modules/misc/webhooks";
import { useState } from "react";
import { toast } from "sonner";

export function WebhooksManagementPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);

  const { data: webhooksData, isLoading } = useUserWebhooks();
  const deleteWebhook = useDeleteWebhook();
  const activateWebhook = useActivateWebhook();
  const deactivateWebhook = useDeactivateWebhook();
  const regenerateSecret = useRegenerateWebhookSecret();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      await deleteWebhook.mutateAsync(id);
      toast.success("Webhook deleted successfully");
    }
  };

  const handleActivate = async (id: string) => {
    await activateWebhook.mutateAsync(id);
    toast.success("Webhook activated");
  };

  const handleDeactivate = async (id: string) => {
    await deactivateWebhook.mutateAsync(id);
    toast.success("Webhook deactivated");
  };

  const handleRegenerateSecret = async (id: string) => {
    if (confirm("Are you sure you want to regenerate the webhook secret?")) {
      const result = await regenerateSecret.mutateAsync(id);
      toast.success(`New secret: ${result.secret}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <button onClick={() => setShowCreate(true)}>Create Webhook</button>
      </div>

      <WebhookList
        webhooks={webhooksData?.data}
        isLoading={isLoading}
        onCreateNew={() => setShowCreate(true)}
        onEdit={(webhook) => {
          setSelectedWebhook(webhook);
          setShowEdit(true);
        }}
        onDelete={handleDelete}
        onTest={(id) => {
          const webhook = webhooksData?.data.find((w) => w._id === id);
          setSelectedWebhook(webhook);
          setShowTest(true);
        }}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onRegenerateSecret={handleRegenerateSecret}
      />

      <WebhookCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={() => toast.success("Webhook created!")}
      />

      <WebhookEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        webhook={selectedWebhook}
        onSuccess={() => toast.success("Webhook updated!")}
      />

      <WebhookTestDialog
        open={showTest}
        onOpenChange={setShowTest}
        webhookId={selectedWebhook?._id}
        webhookName={selectedWebhook?.name}
        onTest={async (id) => {
          // Test implementation
          return { success: true };
        }}
      />
    </div>
  );
}
```

## Notes

- All components are fully typed with TypeScript
- React Query handles caching and invalidation automatically
- Components follow the project's design system
- All API calls include proper error handling
- Forms include validation using Zod schemas

